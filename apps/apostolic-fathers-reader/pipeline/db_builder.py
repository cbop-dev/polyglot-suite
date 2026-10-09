"""Apostolic Fathers Pipeline - Database Builder.

Compiles apostolic-fathers.sqlite3 containing:
- corpora metadata
- canonical_works metadata
- text_units (Greek/Latin source texts and facing Kirsopp Lake English)
- lexicon_entries (LSJ dictionary entries)
- lemma_stats (precomputed frequency & distribution per lemma)
- concordance_refs (inverted index for instant concordance lookups)
"""

from __future__ import annotations
import json
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Any
from .config import BUILD_DIR, CANONICAL_WORKS, AFWork
from .adapters.brannan_morph import BrannanMorphParser
from .adapters.perseus_english import PerseusEnglishParser
from .adapters.lsj_adapter import LSJAdapter, strip_greek_accents


def build_database(output_path: Optional[Path] = None) -> Path:
    db_path = output_path or (BUILD_DIR / "apostolic-fathers.sqlite3")
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
        order_index INTEGER NOT NULL,
        category TEXT NOT NULL,
        title_english TEXT NOT NULL,
        title_greek TEXT NOT NULL,
        title_latin TEXT,
        total_chapters INTEGER NOT NULL
    );

    CREATE TABLE text_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corpus_id TEXT NOT NULL REFERENCES corpora(id),
        work_code TEXT NOT NULL REFERENCES canonical_works(code),
        chapter INTEGER NOT NULL,
        section INTEGER NOT NULL,
        display_citation TEXT NOT NULL,
        text_content TEXT NOT NULL,
        tokens_json TEXT
    );

    CREATE INDEX idx_text_units_coords ON text_units(work_code, chapter, section, corpus_id);

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
    """)

    # 1. Insert Corpora
    corpora_data = [
        ("lake_grc", "Kirsopp Lake Greek Text (1912)", "grc", "ltr", 1, "CC BY-SA 4.0", "Open Apostolic Fathers (Tauber & Macdonald) / MorphGNT & Stanza (Brannan)"),
        ("lake_lat", "Ancient Latin Text (Lake Loeb Edition)", "lat", "ltr", 1, "Public Domain", "Kirsopp Lake Loeb Classical Library (1912-1913) / LatinCy (Brannan)"),
        ("lake_eng", "Kirsopp Lake English Translation (Loeb)", "eng", "ltr", 0, "Public Domain", "Kirsopp Lake, Loeb Classical Library (1912-1913) via Perseus Digital Library"),
    ]
    cur.executemany("INSERT INTO corpora VALUES (?, ?, ?, ?, ?, ?, ?)", corpora_data)

    # 2. Insert Canonical Works
    works_data = [
        (
            w.code,
            w.order_index,
            w.category,
            w.title_english,
            w.title_greek,
            w.title_latin,
            w.total_chapters,
        )
        for w in CANONICAL_WORKS
    ]
    cur.executemany("INSERT INTO canonical_works VALUES (?, ?, ?, ?, ?, ?, ?)", works_data)

    # 3. Parse and Insert Text Units
    morph_parser = BrannanMorphParser()
    eng_parser = PerseusEnglishParser()

    lemma_occurrences = defaultdict(lambda: defaultdict(list))
    # lemma_occurrences[corpus_id][lemma] = [(display_citation, unit_id, work_code), ...]

    corpus_lemmas: Set[str] = set()

    for work in CANONICAL_WORKS:
        print(f"Processing work: {work.title_english} ({work.code})...")
        morph_sections = morph_parser.parse_work(work)
        eng_sections = eng_parser.parse_work(work)

        # Merge coords
        all_coords = sorted(set(morph_sections.keys()) | set(eng_sections.keys()))

        for ch, sec in all_coords:
            citation_label = f"{work.title_english} {ch}:{sec}" if ch > 0 else f"{work.title_english} {sec}"

            # A. Ancient Source Section (Greek or Latin)
            if (ch, sec) in morph_sections:
                sec_data = morph_sections[(ch, sec)]
                dominant_lang = sec_data["lang"]
                corpus_id = "lake_lat" if dominant_lang == "lat" else "lake_grc"
                tokens = sec_data["tokens"]
                tokens_json = json.dumps(tokens, ensure_ascii=False)
                text = sec_data["text"]

                cur.execute(
                    """INSERT INTO text_units (corpus_id, work_code, chapter, section, display_citation, text_content, tokens_json)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (corpus_id, work.code, ch, sec, citation_label, text, tokens_json)
                )
                unit_id = cur.lastrowid

                # Track lemmas for concordance and stats
                for tok in tokens:
                    lemma = tok.get("l", "").strip()
                    if lemma:
                        corpus_lemmas.add(lemma)
                        lemma_occurrences[corpus_id][lemma].append((citation_label, unit_id, work.code))

            # B. English Translation Section
            if (ch, sec) in eng_sections:
                eng_text = eng_sections[(ch, sec)]
                cur.execute(
                    """INSERT INTO text_units (corpus_id, work_code, chapter, section, display_citation, text_content, tokens_json)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    ("lake_eng", work.code, ch, sec, citation_label, eng_text, None)
                )

    # 4. Insert Lemma Stats & Concordance Index
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
                json.dumps(work_counts, ensure_ascii=False)
            ))

    cur.executemany(
        "INSERT INTO lemma_stats (corpus_id, lemma, normalized_lemma, total_count, work_counts_json) VALUES (?, ?, ?, ?, ?)",
        stats_data
    )
    cur.executemany(
        "INSERT OR IGNORE INTO concordance_refs (corpus_id, lemma, display_citation, work_unit_id) VALUES (?, ?, ?, ?)",
        concordance_data
    )

    # 5. Insert LSJ Lexicon Entries for all lemmas in corpus
    print("\nIngesting matching LSJ Lexicon definitions...")
    lsj_adapter = LSJAdapter()
    normalized_corpus_lemmas = {strip_greek_accents(l): l for l in corpus_lemmas}
    lex_data = []

    for entry in lsj_adapter.iter_entries():
        # Match either exact lemma or normalized form
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
        lex_data
    )
    print(f"Matched and inserted {len(lex_data):,} LSJ lexicon entries.")

    conn.commit()

    # Optimize and vacuum
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
