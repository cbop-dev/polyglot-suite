"""Josephus Pipeline - SQLite Database Builder.

Compiles josephus.sqlite3 containing:
- corpora metadata
- canonical_works metadata (Antiquities, War, Life, Apion)
- text_units (Greek critical text + Whiston English translation)
- lexicon_entries (LSJ dictionary entries)
- lemma_stats (precomputed frequencies across the corpus)
- concordance_refs (inverted index for instant concordance search)
- attested_forms (surface forms mapped to lemma and morphology)
"""

from __future__ import annotations
import json
import re
import sqlite3
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Any, Optional
import shutil

from .config import (
    BUILD_DIR,
    SOURCE_DATA_DIR,
    STATIC_DB_DIR,
    STATIC_SQLITE_DIR,
    CANONICAL_WORKS,
    WORK_BY_CODE,
    JosephusWork,
)


def strip_greek_accents(text: str) -> str:
    """Strip all diacritics and convert Greek to lowercase normalized form."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", text.lower())
    stripped = "".join(c for c in normalized if not unicodedata.combining(c))
    return stripped.replace("ς", "σ").strip()


def clean_word_surface(raw_word: str) -> str:
    """Clean a surface word of outer punctuation and bracket symbols."""
    return re.sub(r'^[«»"\'\(\)\[\]†\*—·.,;:]+|[«»"\'\(\)\[\]†\*—·.,;:]+$', '', raw_word).strip()


def build_database(output_path: Optional[Path] = None) -> Path:
    db_path = output_path or (BUILD_DIR / "josephus.sqlite3")
    if db_path.exists():
        db_path.unlink()

    print(f"\nBuilding SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # SQLite VFS Configuration
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
        abbrev TEXT NOT NULL,
        title_english TEXT NOT NULL,
        title_greek TEXT NOT NULL,
        title_latin TEXT NOT NULL,
        total_books INTEGER NOT NULL,
        default_book INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE text_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corpus_id TEXT NOT NULL REFERENCES corpora(id),
        work_code TEXT NOT NULL REFERENCES canonical_works(code),
        book INTEGER NOT NULL,
        section_num INTEGER NOT NULL,
        niese_section TEXT NOT NULL,
        display_citation TEXT NOT NULL,
        text_content TEXT NOT NULL,
        tokens_json TEXT
    );

    CREATE INDEX idx_text_units_coords ON text_units(work_code, book, section_num, corpus_id);
    CREATE INDEX idx_text_units_niese ON text_units(work_code, book, niese_section);

    CREATE TABLE lexicon_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dictionary TEXT NOT NULL,
        strongs_id TEXT,
        lemma TEXT NOT NULL,
        normalized_lemma TEXT NOT NULL,
        pos TEXT,
        gloss TEXT NOT NULL,
        definition TEXT NOT NULL
    );

    CREATE INDEX idx_lexicon_lemma ON lexicon_entries(dictionary, normalized_lemma);
    CREATE INDEX idx_lexicon_lemma_exact ON lexicon_entries(lemma);

    CREATE TABLE lemma_stats (
        corpus_id TEXT NOT NULL,
        lemma TEXT NOT NULL,
        normalized_lemma TEXT NOT NULL,
        total_count INTEGER NOT NULL,
        work_counts_json TEXT NOT NULL,
        PRIMARY KEY (corpus_id, lemma)
    );

    CREATE INDEX idx_lemma_stats_norm ON lemma_stats(normalized_lemma);

    CREATE TABLE concordance_refs (
        corpus_id TEXT NOT NULL,
        lemma TEXT NOT NULL,
        form TEXT NOT NULL,
        display_citation TEXT NOT NULL,
        work_unit_id INTEGER NOT NULL REFERENCES text_units(id),
        PRIMARY KEY (corpus_id, lemma, work_unit_id, form)
    ) WITHOUT ROWID;

    CREATE INDEX idx_concordance_lookup ON concordance_refs(lemma, corpus_id);

    CREATE TABLE attested_forms (
        lemma TEXT NOT NULL,
        form TEXT NOT NULL,
        pos TEXT,
        parse_code TEXT,
        description TEXT
    );

    CREATE INDEX idx_attested_forms_lemma ON attested_forms(lemma);
    CREATE INDEX idx_attested_forms_form ON attested_forms(form);
    """)

    # 1. Insert Corpora Metadata
    corpora_data = [
        (
            "josephus_grc",
            "Flavii Iosephi Opera (Benedikt Niese Critical Edition, 1885–1895)",
            "grc",
            "ltr",
            1,
            "Public Domain / CC BY-SA 4.0",
            "Benedikt Niese / Perseus Digital Library",
        ),
        (
            "josephus_eng",
            "The Works of Flavius Josephus (William Whiston Translation, 1856)",
            "eng",
            "ltr",
            0,
            "Public Domain",
            "William Whiston / Perseus Digital Library",
        ),
    ]
    cur.executemany("INSERT INTO corpora VALUES (?, ?, ?, ?, ?, ?, ?)", corpora_data)

    # 2. Insert Canonical Works
    works_data = [
        (
            w.code,
            w.order_index,
            w.category,
            w.abbrev,
            w.title_english,
            w.title_greek,
            w.title_latin,
            w.total_books,
            w.default_book,
        )
        for w in CANONICAL_WORKS
    ]
    cur.executemany("INSERT INTO canonical_works VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", works_data)

    # 3. Load Morphology Map
    morph_map_file = SOURCE_DATA_DIR / "morph_map.json"
    morph_map: Dict[str, Any] = {}
    if morph_map_file.exists():
        print("Loading morph_map.json...")
        with open(morph_map_file, "r", encoding="utf-8") as f:
            morph_map = json.load(f)
        print(f"Loaded {len(morph_map):,} morphological entries.")

    # 4. Insert Attested Forms from morph_map
    print("Populating attested_forms...")
    attested_rows = []
    for form, entry in morph_map.items():
        lemma = entry.get("lemma") or ""
        pos = entry.get("pos") or ""
        parse = entry.get("parse") or ""
        desc = entry.get("desc") or ""
        if lemma and form:
            attested_rows.append((lemma, form, pos, parse, desc))

    cur.executemany(
        "INSERT INTO attested_forms (lemma, form, pos, parse_code, description) VALUES (?, ?, ?, ?, ?)",
        attested_rows
    )
    print(f"Inserted {len(attested_rows):,} attested form rows.")

    # 5. Insert Lexicon Entries
    dict_file = SOURCE_DATA_DIR / "dictionary.json"
    if dict_file.exists():
        print("Loading dictionary.json...")
        with open(dict_file, "r", encoding="utf-8") as f:
            dict_data: Dict[str, Any] = json.load(f)
        print(f"Loaded {len(dict_data):,} lexicon entries.")

        lex_rows = []
        for norm_key, entry in dict_data.items():
            lemma = entry.get("lemma") or norm_key
            norm_lemma = strip_greek_accents(lemma)
            pos = entry.get("pos") or ""
            gloss = entry.get("gloss") or ""
            definition = entry.get("def") or ""
            lex_rows.append(("lsj", None, lemma, norm_lemma, pos, gloss, definition))

        cur.executemany(
            """INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, pos, gloss, definition)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            lex_rows
        )
        print(f"Inserted {len(lex_rows):,} lexicon rows.")

    # 6. Parse and Insert Text Units across all 4 works
    print("Ingesting text units...")
    lemma_counts = defaultdict(int)
    lemma_work_counts = defaultdict(lambda: defaultdict(int))
    concordance_rows = []

    total_greek_units = 0
    total_english_units = 0

    for work in CANONICAL_WORKS:
        print(f"  Ingesting work: {work.title_english} ({work.code}, {work.total_books} books)...")
        for b in range(1, work.total_books + 1):
            book_file = SOURCE_DATA_DIR / work.code / f"book-{b}.json"
            if not book_file.exists():
                print(f"    Warning: Missing book file {book_file}")
                continue

            with open(book_file, "r", encoding="utf-8") as f:
                book_data = json.load(f)

            sections = book_data.get("sections") or []
            for sec_idx, sec in enumerate(sections):
                sec_num = sec.get("section_num") or (sec_idx + 1)
                niese_sec = str(sec.get("niese") or sec_num)
                grc_text = (sec.get("grc") or "").strip()
                eng_text = (sec.get("eng") or "").strip()

                citation_label = f"{work.abbrev} {b}.{niese_sec}"

                # A. Greek Unit
                if grc_text:
                    words = grc_text.split()
                    tokens = []
                    for raw_w in words:
                        clean_w = clean_word_surface(raw_w)
                        clean_lower = clean_w.lower()
                        morph_entry = morph_map.get(clean_w) or morph_map.get(clean_lower)

                        if morph_entry:
                            lemma = morph_entry.get("lemma") or clean_w
                            parse = morph_entry.get("parse") or ""
                            pos = morph_entry.get("pos") or ""
                        else:
                            lemma = clean_w
                            parse = ""
                            pos = ""

                        tokens.append({
                            "w": raw_w,
                            "l": lemma,
                            "m": parse,
                            "p": pos,
                            "lang": "grc"
                        })

                    tokens_json = json.dumps(tokens, ensure_ascii=False)

                    cur.execute(
                        """INSERT INTO text_units
                           (corpus_id, work_code, book, section_num, niese_section, display_citation, text_content, tokens_json)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        ("josephus_grc", work.code, b, sec_num, niese_sec, citation_label, grc_text, tokens_json)
                    )
                    grc_unit_id = cur.lastrowid
                    total_greek_units += 1

                    # Collect concordance and stats for tokens
                    seen_in_sec = set()
                    for tok in tokens:
                        l = tok["l"]
                        w = clean_word_surface(tok["w"])
                        if l and l not in seen_in_sec:
                            seen_in_sec.add(l)
                            lemma_counts[l] += 1
                            lemma_work_counts[l][work.code] += 1
                            concordance_rows.append(("josephus_grc", l, w, citation_label, grc_unit_id))

                # B. English Unit
                if eng_text:
                    cur.execute(
                        """INSERT INTO text_units
                           (corpus_id, work_code, book, section_num, niese_section, display_citation, text_content, tokens_json)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                        ("josephus_eng", work.code, b, sec_num, niese_sec, citation_label, eng_text, None)
                    )
                    total_english_units += 1

    print(f"Inserted {total_greek_units:,} Greek and {total_english_units:,} English text units.")

    # 7. Insert Concordance Refs
    print(f"Inserting {len(concordance_rows):,} concordance references...")
    # Deduplicate by primary key
    unique_concordance = {}
    for row in concordance_rows:
        key = (row[0], row[1], row[4], row[2])
        unique_concordance[key] = row

    cur.executemany(
        "INSERT OR IGNORE INTO concordance_refs (corpus_id, lemma, form, display_citation, work_unit_id) VALUES (?, ?, ?, ?, ?)",
        list(unique_concordance.values())
    )
    print(f"Inserted {len(unique_concordance):,} unique concordance refs.")

    # 8. Insert Lemma Stats
    print("Computing and inserting lemma stats...")
    stats_rows = []
    for lemma, count in lemma_counts.items():
        norm_l = strip_greek_accents(lemma)
        w_counts = dict(lemma_work_counts[lemma])
        stats_rows.append(("josephus_grc", lemma, norm_l, count, json.dumps(w_counts, ensure_ascii=False)))

    cur.executemany(
        "INSERT INTO lemma_stats (corpus_id, lemma, normalized_lemma, total_count, work_counts_json) VALUES (?, ?, ?, ?, ?)",
        stats_rows
    )
    print(f"Inserted {len(stats_rows):,} lemma stats.")

    # 9. Optimize and Finalize
    print("Running ANALYZE and VACUUM...")
    cur.execute("ANALYZE")
    conn.commit()
    cur.execute("VACUUM")
    conn.close()

    db_size_mb = db_path.stat().st_size / (1024 * 1024)
    print(f"Successfully built {db_path} ({db_size_mb:.2f} MB)")

    # Copy to static/db and static/sqlite for app serving
    for target_dir in [STATIC_DB_DIR, STATIC_SQLITE_DIR]:
        target_dir.mkdir(parents=True, exist_ok=True)
        target_file = target_dir / "josephus.sqlite3"
        shutil.copy2(db_path, target_file)
        print(f"Copied to {target_file}")

    return db_path


if __name__ == "__main__":
    build_database()
