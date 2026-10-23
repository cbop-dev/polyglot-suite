"""Philo Pipeline - SQLite Database Builder.

Compiles philo.sqlite3 containing:
- corpora metadata
- canonical_works metadata (all 31 treatises)
- text_units (Greek source text + facing Yonge/Open English translation)
- biblical_citations (structured Septuagint citation index cross-referenced to text_units)
- lexicon_entries (matched LSJ dictionary entries via pipeline_core)
- lemma_stats (precomputed frequencies across the corpus)
- concordance_refs (inverted index for instant concordance search)
- text_units_fts (FTS5 virtual table for Greek and English full-text search)
"""

from __future__ import annotations
import json
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Any, Optional

from pipeline_core import LSJAdapter, strip_greek_accents
from .config import (
    BUILD_DIR,
    LEXICON_DIR,
    CANONICAL_WORKS,
    PhiloWork,
)
from .parser import PhiloParser, ParsedSection


def build_database(output_path: Optional[Path] = None) -> Path:
    """Builds the complete philo.sqlite3 database."""
    db_path = output_path or (BUILD_DIR / "philo.sqlite3")
    if db_path.exists():
        db_path.unlink()

    print(f"\nBuilding SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.executescript("""
    PRAGMA page_size = 4096;
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;

    CREATE TABLE corpora (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'ltr',
        is_source BOOLEAN NOT NULL DEFAULT 0,
        license TEXT,
        attribution TEXT
    );

    CREATE TABLE canonical_works (
        code TEXT PRIMARY KEY,
        tlg_id TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        category TEXT NOT NULL,
        abbrev TEXT NOT NULL,
        title_english TEXT NOT NULL,
        title_greek TEXT NOT NULL,
        title_latin TEXT NOT NULL,
        total_books INTEGER NOT NULL,
        total_sections INTEGER NOT NULL
    );

    CREATE TABLE text_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corpus_id TEXT NOT NULL REFERENCES corpora(id),
        work_code TEXT NOT NULL REFERENCES canonical_works(code),
        chapter INTEGER NOT NULL,
        section INTEGER NOT NULL,
        display_citation TEXT NOT NULL,
        mangey_ref TEXT,
        is_supplement INTEGER NOT NULL DEFAULT 0,
        text_content TEXT NOT NULL,
        tokens_json TEXT
    );

    CREATE INDEX idx_text_units_coords ON text_units(work_code, chapter, section, corpus_id);
    CREATE INDEX idx_text_units_mangey ON text_units(mangey_ref);

    CREATE TABLE biblical_citations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_code TEXT NOT NULL REFERENCES canonical_works(code),
        chapter INTEGER NOT NULL,
        section INTEGER NOT NULL,
        work_unit_id INTEGER NOT NULL REFERENCES text_units(id),
        book_code TEXT NOT NULL,
        book_name TEXT NOT NULL,
        bible_chapter INTEGER,
        bible_verse INTEGER,
        display_citation TEXT NOT NULL,
        raw_citation TEXT NOT NULL
    );

    CREATE INDEX idx_biblical_citations_unit ON biblical_citations(work_unit_id);
    CREATE INDEX idx_biblical_citations_target ON biblical_citations(book_code, bible_chapter, bible_verse);
    CREATE INDEX idx_biblical_citations_coords ON biblical_citations(work_code, chapter, section);

    CREATE TABLE lexicon_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dictionary TEXT NOT NULL,
        strongs_id TEXT,
        lemma TEXT NOT NULL,
        normalized_lemma TEXT NOT NULL,
        transliteration TEXT,
        gloss TEXT NOT NULL,
        definition TEXT NOT NULL
    );

    CREATE INDEX idx_lexicon_lemma ON lexicon_entries(dictionary, normalized_lemma);

    CREATE TABLE lemma_stats (
        corpus_id TEXT NOT NULL,
        lemma TEXT NOT NULL,
        normalized_lemma TEXT NOT NULL,
        total_count INTEGER NOT NULL,
        work_counts_json TEXT NOT NULL,
        PRIMARY KEY (corpus_id, lemma)
    );

    CREATE TABLE concordance_refs (
        corpus_id TEXT NOT NULL,
        lemma TEXT NOT NULL,
        display_citation TEXT NOT NULL,
        work_unit_id INTEGER NOT NULL REFERENCES text_units(id),
        PRIMARY KEY (corpus_id, lemma, work_unit_id)
    ) WITHOUT ROWID;

    CREATE VIRTUAL TABLE text_units_fts USING fts5(
        work_code UNINDEXED,
        chapter UNINDEXED,
        section UNINDEXED,
        corpus_id UNINDEXED,
        display_citation UNINDEXED,
        text_content,
        tokenize = 'unicode61'
    );
    """)

    # 1. Insert Corpora Metadata
    cur.executemany(
        """INSERT INTO corpora (id, title, language, direction, is_source, license, attribution)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                "grc",
                "Ancient Greek",
                "grc",
                "ltr",
                1,
                "Public Domain",
                "Leopold Cohn & Paul Wendland (Cohn-Wendland edition, 1896-1915); lemmatized by Giuseppe Celano (Perseus/Leipzig).",
            ),
            (
                "eng",
                "English",
                "eng",
                "ltr",
                0,
                "Public Domain / CC-BY 4.0",
                "Charles Duke Yonge (1854-1855; rev. 1890); aligned by Gregory Crane (2023); supplemental lacunae translated for Polyglot Suite.",
            ),
        ],
    )

    # 2. Insert Canonical Works
    cur.executemany(
        """INSERT INTO canonical_works (code, tlg_id, order_index, category, abbrev, title_english, title_greek, title_latin, total_books, total_sections)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (
                w.code,
                w.tlg_id,
                w.order_index,
                w.category,
                w.abbrev,
                w.title_english,
                w.title_greek,
                w.title_latin,
                w.total_books,
                w.total_sections,
            )
            for w in CANONICAL_WORKS
        ],
    )

    # 3. Parse and Insert Text Units across all 31 Works
    parser = PhiloParser()
    corpus_lemmas: Set[str] = set()
    lemma_occurrences: Dict[str, Dict[str, List[tuple]]] = defaultdict(lambda: defaultdict(list))
    biblical_citations_rows: List[tuple] = []

    total_greek_units = 0
    total_english_units = 0

    print("\nIngesting text units for 31 Philo treatises...")
    for idx, work in enumerate(CANONICAL_WORKS, start=1):
        parsed_sections: List[ParsedSection] = parser.parse_work(work)
        print(f"  [{idx:02d}/31] {work.code:8s} ({work.abbrev}): {len(parsed_sections)} sections")

        for sec in parsed_sections:
            cit_book_part = f"{sec.book}." if work.total_books > 1 else ""
            cit_label = f"{work.abbrev} {cit_book_part}{sec.section}"
            if sec.mangey_ref:
                cit_label += f" [{sec.mangey_ref}]"

            # A. Greek Unit
            tokens_json = json.dumps(sec.tokens, ensure_ascii=False)
            cur.execute(
                """INSERT INTO text_units (corpus_id, work_code, chapter, section, display_citation, mangey_ref, is_supplement, text_content, tokens_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                ("grc", work.code, sec.book, sec.section, cit_label, sec.mangey_ref, 0, sec.greek_text, tokens_json),
            )
            grc_unit_id = cur.lastrowid
            total_greek_units += 1

            # Insert into FTS
            cur.execute(
                """INSERT INTO text_units_fts (work_code, chapter, section, corpus_id, display_citation, text_content)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (work.code, sec.book, sec.section, "grc", cit_label, sec.greek_text),
            )

            # Track biblical citations and Greek lemmas
            for tok in sec.tokens:
                tok_type = tok.get("type")
                if tok_type == "citation":
                    biblical_citations_rows.append((
                        work.code,
                        sec.book,
                        sec.section,
                        grc_unit_id,
                        tok["book_code"],
                        tok["book_name"],
                        tok.get("bible_chapter"),
                        tok.get("bible_verse"),
                        tok["display"],
                        tok.get("raw", tok["w"]),
                    ))
                elif tok_type == "apparatus":
                    continue
                else:
                    lemma = tok.get("l", "").strip()
                    if lemma:
                        corpus_lemmas.add(lemma)
                        lemma_occurrences["grc"][lemma].append((cit_label, grc_unit_id, work.code))

            # B. English Unit
            cur.execute(
                """INSERT INTO text_units (corpus_id, work_code, chapter, section, display_citation, mangey_ref, is_supplement, text_content, tokens_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                ("eng", work.code, sec.book, sec.section, cit_label, sec.mangey_ref, sec.is_supplement, sec.english_text, None),
            )
            eng_unit_id = cur.lastrowid
            total_english_units += 1

            # Insert into FTS
            cur.execute(
                """INSERT INTO text_units_fts (work_code, chapter, section, corpus_id, display_citation, text_content)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (work.code, sec.book, sec.section, "eng", cit_label, sec.english_text),
            )

    print(f"\n✓ Ingested {total_greek_units:,} Greek sections and {total_english_units:,} English sections.")
    print(f"✓ Found {len(corpus_lemmas):,} distinct Greek vocabulary headwords.")

    # 4. Insert Biblical Citations
    print(f"\nIndexing {len(biblical_citations_rows):,} biblical citations...")
    cur.executemany(
        """INSERT INTO biblical_citations (work_code, chapter, section, work_unit_id, book_code, book_name, bible_chapter, bible_verse, display_citation, raw_citation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        biblical_citations_rows,
    )
    print(f"✓ Inserted {len(biblical_citations_rows):,} indexed biblical citations.")

    # 5. Insert Lemma Stats & Concordance Index
    print("\nIndexing lemma statistics and concordance references...")
    stats_data = []
    concordance_data = []

    for corpus_id, lemmas_dict in lemma_occurrences.items():
        for lemma, occs in lemmas_dict.items():
            total_count = len(occs)
            work_counts = defaultdict(int)
            seen_units = set()

            for cit, unit_id, w_code in occs:
                work_counts[w_code] += 1
                if unit_id not in seen_units:
                    seen_units.add(unit_id)
                    concordance_data.append((corpus_id, lemma, cit, unit_id))

            normalized_lemma = strip_greek_accents(lemma)
            stats_data.append((
                corpus_id,
                lemma,
                normalized_lemma,
                total_count,
                json.dumps(work_counts, ensure_ascii=False),
            ))

    cur.executemany(
        """INSERT INTO lemma_stats (corpus_id, lemma, normalized_lemma, total_count, work_counts_json)
           VALUES (?, ?, ?, ?, ?)""",
        stats_data,
    )
    cur.executemany(
        """INSERT OR IGNORE INTO concordance_refs (corpus_id, lemma, display_citation, work_unit_id)
           VALUES (?, ?, ?, ?)""",
        concordance_data,
    )
    print(f"✓ Indexed {len(stats_data):,} lemma statistics and {len(concordance_data):,} concordance entries.")

    # 6. Ingest Matched LSJ Lexicon Definitions
    print("\nIngesting matching LSJ Lexicon definitions...")
    lsj_adapter = LSJAdapter(lexicon_dir=LEXICON_DIR)
    normalized_corpus_lemmas = {strip_greek_accents(l): l for l in corpus_lemmas}
    lex_data = []

    for entry in lsj_adapter.iter_entries():
        if entry["lemma"] in corpus_lemmas or entry["normalized_lemma"] in normalized_corpus_lemmas:
            lex_data.append((
                entry["dictionary"],
                entry["strongs_id"],
                entry["lemma"],
                entry["normalized_lemma"],
                entry["transliteration"],
                entry["gloss"],
                entry["definition"],
            ))

    cur.executemany(
        """INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, transliteration, gloss, definition)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        lex_data,
    )
    print(f"✓ Matched and inserted {len(lex_data):,} LSJ lexicon definitions.")

    # 7. Commit, Optimize, and Vacuum
    conn.commit()
    print("Optimizing SQLite database...")
    cur.execute("PRAGMA optimize;")
    cur.execute("VACUUM;")
    conn.commit()
    conn.close()

    db_size_mb = db_path.stat().st_size / (1024 * 1024)
    print(f"\n✓ Successfully compiled {db_path.name}: {db_size_mb:.2f} MB")
    return db_path


if __name__ == "__main__":
    build_database()
