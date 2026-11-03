"""ACR Pipeline - SQLite Database Builder.

Builds optimized Tier-2 SQLite databases for Ancient Corpora Reader:
- Lean text_units (tokens_json extracted)
- Independent text_unit_tokens table
- Self-contained covering concordance_refs table (WITHOUT ROWID) with precomputed KWIC snippets
"""

from __future__ import annotations
import json
import re
import sqlite3
import unicodedata
from pathlib import Path
from typing import Dict, List, Set, Any, Optional

from .config import BUILD_DIR, PHILO_SOURCE_DB, JOSEPHUS_SOURCE_DB, AF_SOURCE_DB
from .snippet_builder import make_kwic_snippet


def strip_accents(text: str) -> str:
    """Removes combining diacritical marks from Greek/Latin text."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def build_covering_concordance(
    src_conn: sqlite3.Connection,
    tgt_conn: sqlite3.Connection,
    corpus_type: str,
):
    """Populates the covering concordance_refs table with snippets and surface forms."""
    print(f"  → Building covering concordance_refs with precomputed KWIC snippets ({corpus_type})...")
    src_cur = src_conn.cursor()
    tgt_cur = tgt_conn.cursor()

    tgt_cur.execute("""
    CREATE TABLE concordance_refs (
        corpus_id TEXT NOT NULL,
        lemma TEXT NOT NULL,
        work_unit_id INTEGER NOT NULL,
        display_citation TEXT NOT NULL,
        work_code TEXT NOT NULL,
        book INTEGER DEFAULT 0,
        chapter INTEGER DEFAULT 0,
        section INTEGER NOT NULL,
        niese_section TEXT DEFAULT '',
        matched_form TEXT NOT NULL,
        kwic_snippet TEXT NOT NULL,
        PRIMARY KEY (corpus_id, lemma, work_unit_id, matched_form)
    ) WITHOUT ROWID;
    """)

    # Query text units with tokens from source DB
    if corpus_type == "josephus":
        src_cur.execute("""
            SELECT id, corpus_id, work_code, book, section_num, niese_section, display_citation, text_content, tokens_json
            FROM text_units
            WHERE tokens_json IS NOT NULL
        """)
    else:  # philo or af
        src_cur.execute("""
            SELECT id, corpus_id, work_code, chapter, section, display_citation, text_content, tokens_json
            FROM text_units
            WHERE tokens_json IS NOT NULL
        """)

    batch_rows = []
    seen_keys: Set[tuple] = set()
    total_units = 0

    while True:
        chunk = src_cur.fetchmany(500)
        if not chunk:
            break
        for row in chunk:
            total_units += 1
            if corpus_type == "josephus":
                u_id, c_id, w_code, b, sec_num, niese_sec, cit, text, raw_tokens = row
                ch = 0
                sec = sec_num
                niese = niese_sec or ""
            else:
                u_id, c_id, w_code, ch, sec, cit, text, raw_tokens = row
                b = ch
                niese = ""

            if not raw_tokens or not text:
                continue

            try:
                tokens = json.loads(raw_tokens)
            except Exception:
                continue

            # Map unique lemmas to surface forms in this section
            lemma_surface_map: Dict[str, Set[str]] = {}
            for tok in tokens:
                lemma = tok.get("l")
                word = tok.get("w")
                if not lemma or not word:
                    continue
                clean_lemma = lemma.strip().strip(".,;:·'’—")
                clean_word = word.strip().strip(".,;:·'’—")
                if not clean_lemma or not clean_word:
                    continue
                if clean_lemma not in lemma_surface_map:
                    lemma_surface_map[clean_lemma] = set()
                lemma_surface_map[clean_lemma].add(clean_word)

            # Generate snippet for each distinct lemma and surface form
            for lem, surfaces in lemma_surface_map.items():
                for surf in surfaces:
                    key = (c_id, lem, u_id, surf)
                    if key in seen_keys:
                        continue
                    seen_keys.add(key)
                    snippet = make_kwic_snippet(text, surf, radius=45)
                    batch_rows.append((
                        c_id,
                        lem,
                        u_id,
                        cit,
                        w_code,
                        b,
                        ch,
                        sec,
                        niese,
                        surf,
                        snippet,
                    ))

            if len(batch_rows) >= 5000:
                tgt_cur.executemany("""
                    INSERT OR IGNORE INTO concordance_refs (
                        corpus_id, lemma, work_unit_id, display_citation, work_code,
                        book, chapter, section, niese_section, matched_form, kwic_snippet
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch_rows)
                batch_rows.clear()

    if batch_rows:
        tgt_cur.executemany("""
            INSERT OR IGNORE INTO concordance_refs (
                corpus_id, lemma, work_unit_id, display_citation, work_code,
                book, chapter, section, niese_section, matched_form, kwic_snippet
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch_rows)
        batch_rows.clear()

    print(f"  ✓ Processed {total_units:,} text units into {len(seen_keys):,} covering concordance refs.")


def build_optimized_corpus_db(corpus_type: str, src_path: Path, tgt_path: Path):
    """Builds an optimized Tier-2 SQLite database for a single corpus."""
    print(f"\n==================================================")
    print(f"Compiling Tier-2 Database: {corpus_type.upper()}")
    print(f"Source: {src_path}")
    print(f"Target: {tgt_path}")
    print(f"==================================================")

    if not src_path.exists():
        raise FileNotFoundError(f"Source database not found: {src_path}")

    tgt_path.parent.mkdir(parents=True, exist_ok=True)
    if tgt_path.exists():
        tgt_path.unlink()

    src_conn = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
    tgt_conn = sqlite3.connect(tgt_path)

    tgt_cur = tgt_conn.cursor()
    tgt_cur.execute("PRAGMA page_size = 4096;")
    tgt_cur.execute("PRAGMA synchronous = OFF;")
    tgt_cur.execute("PRAGMA journal_mode = MEMORY;")

    # 1. Copy corpora metadata
    print("  → Copying corpora and metadata...")
    tgt_cur.execute("""
    CREATE TABLE corpora (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        direction TEXT NOT NULL DEFAULT 'ltr',
        is_source BOOLEAN NOT NULL DEFAULT 0,
        license TEXT,
        attribution TEXT
    );
    """)
    src_cur = src_conn.cursor()
    src_cur.execute("SELECT id, title, language, direction, is_source, license, attribution FROM corpora")
    tgt_cur.executemany("INSERT INTO corpora VALUES (?, ?, ?, ?, ?, ?, ?)", src_cur.fetchall())

    # 2. Copy canonical_works metadata into unified canonical schema
    print("  → Normalizing canonical_works...")
    tgt_cur.executescript("""
    CREATE TABLE canonical_works (
        code TEXT PRIMARY KEY,
        order_index INTEGER NOT NULL,
        category TEXT NOT NULL,
        abbrev TEXT,
        tlg_id TEXT,
        title_english TEXT NOT NULL,
        title_greek TEXT,
        title_latin TEXT,
        total_books INTEGER DEFAULT 0,
        total_chapters INTEGER DEFAULT 0,
        total_sections INTEGER DEFAULT 0,
        default_book INTEGER DEFAULT 1
    );
    """)
    src_cur.execute("PRAGMA table_info(canonical_works)")
    w_cols = [r[1] for r in src_cur.fetchall()]
    w_col_idx = {name: i for i, name in enumerate(w_cols)}

    src_cur.execute("SELECT * FROM canonical_works")
    norm_works = []
    for r in src_cur.fetchall():
        code = r[w_col_idx["code"]]
        order_idx = r[w_col_idx["order_index"]]
        category = r[w_col_idx["category"]]
        abbrev = r[w_col_idx["abbrev"]] if "abbrev" in w_col_idx else code
        tlg_id = r[w_col_idx["tlg_id"]] if "tlg_id" in w_col_idx else None
        title_eng = r[w_col_idx["title_english"]]
        title_grc = r[w_col_idx["title_greek"]] if "title_greek" in w_col_idx else None
        title_lat = r[w_col_idx["title_latin"]] if "title_latin" in w_col_idx else None
        tot_books = r[w_col_idx["total_books"]] if "total_books" in w_col_idx else 0
        tot_chaps = r[w_col_idx["total_chapters"]] if "total_chapters" in w_col_idx else 0
        tot_secs = r[w_col_idx["total_sections"]] if "total_sections" in w_col_idx else 0
        def_book = r[w_col_idx["default_book"]] if "default_book" in w_col_idx else 1
        norm_works.append((
            code, order_idx, category, abbrev, tlg_id, title_eng, title_grc, title_lat,
            tot_books or 0, tot_chaps or 0, tot_secs or 0, def_book or 1
        ))
    tgt_cur.executemany("""
        INSERT INTO canonical_works VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, norm_works)

    # 3. Create lean unified text_units (WITHOUT tokens_json) and text_unit_tokens
    print("  → Normalizing text_units into lean canonical schema + text_unit_tokens...")
    tgt_cur.executescript("""
    CREATE TABLE text_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corpus_id TEXT NOT NULL REFERENCES corpora(id),
        work_code TEXT NOT NULL REFERENCES canonical_works(code),
        book INTEGER DEFAULT 0,
        chapter INTEGER DEFAULT 0,
        section INTEGER NOT NULL,
        section_num INTEGER DEFAULT 0,
        niese_section TEXT DEFAULT '',
        mangey_ref TEXT,
        is_supplement INTEGER NOT NULL DEFAULT 0,
        display_citation TEXT NOT NULL,
        text_content TEXT NOT NULL
    );
    CREATE INDEX idx_text_units_coords ON text_units(work_code, book, chapter, section, corpus_id);
    """)

    if corpus_type == "josephus":
        src_cur.execute("""
            SELECT id, corpus_id, work_code, book, section_num, niese_section, display_citation, text_content
            FROM text_units
        """)
        norm_units = [
            (r[0], r[1], r[2], r[3], 0, r[4], r[4], r[5] or "", None, 0, r[6], r[7])
            for r in src_cur.fetchall()
        ]
    elif corpus_type == "philo":
        src_cur.execute("""
            SELECT id, corpus_id, work_code, chapter, section, mangey_ref, is_supplement, display_citation, text_content
            FROM text_units
        """)
        norm_units = [
            (r[0], r[1], r[2], r[3], r[3], r[4], r[4], "", r[5], r[6] or 0, r[7], r[8])
            for r in src_cur.fetchall()
        ]
    else:  # af
        src_cur.execute("""
            SELECT id, corpus_id, work_code, chapter, section, display_citation, text_content
            FROM text_units
        """)
        norm_units = [
            (r[0], r[1], r[2], r[3], r[3], r[4], r[4], "", None, 0, r[5], r[6])
            for r in src_cur.fetchall()
        ]

    tgt_cur.executemany("""
        INSERT INTO text_units (id, corpus_id, work_code, book, chapter, section, section_num, niese_section, mangey_ref, is_supplement, display_citation, text_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, norm_units)

    # Populate text_unit_tokens
    tgt_cur.execute("""
    CREATE TABLE text_unit_tokens (
        work_unit_id INTEGER PRIMARY KEY,
        tokens_json TEXT NOT NULL
    ) WITHOUT ROWID;
    """)
    src_cur.execute("SELECT id, tokens_json FROM text_units WHERE tokens_json IS NOT NULL")
    tgt_cur.executemany("INSERT INTO text_unit_tokens VALUES (?, ?)", src_cur.fetchall())

    # 4. Copy lexicon_entries into unified canonical schema
    print("  → Normalizing lexicon_entries into canonical schema...")
    tgt_cur.executescript("""
    CREATE TABLE lexicon_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dictionary TEXT NOT NULL,
        strongs_id TEXT,
        lemma TEXT NOT NULL,
        normalized_lemma TEXT NOT NULL,
        pos TEXT,
        transliteration TEXT,
        gloss TEXT NOT NULL,
        definition TEXT NOT NULL
    );
    CREATE INDEX idx_lexicon_lemma ON lexicon_entries(dictionary, normalized_lemma);
    CREATE INDEX idx_lexicon_exact ON lexicon_entries(dictionary, lemma);
    """)
    
    src_cur.execute("PRAGMA table_info(lexicon_entries)")
    lex_cols = [r[1] for r in src_cur.fetchall()]
    has_pos = "pos" in lex_cols
    has_translit = "transliteration" in lex_cols

    if has_pos and has_translit:
        src_cur.execute("""
            SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition
            FROM lexicon_entries
        """)
        norm_lex = src_cur.fetchall()
    elif has_pos and not has_translit:
        src_cur.execute("""
            SELECT dictionary, strongs_id, lemma, normalized_lemma, pos, gloss, definition
            FROM lexicon_entries
        """)
        norm_lex = [(r[0], r[1], r[2], r[3], r[4], None, r[5], r[6]) for r in src_cur.fetchall()]
    elif has_translit and not has_pos:
        src_cur.execute("""
            SELECT dictionary, strongs_id, lemma, normalized_lemma, transliteration, gloss, definition
            FROM lexicon_entries
        """)
        norm_lex = [(r[0], r[1], r[2], r[3], None, r[4], r[5], r[6]) for r in src_cur.fetchall()]
    else:
        src_cur.execute("""
            SELECT dictionary, strongs_id, lemma, normalized_lemma, gloss, definition
            FROM lexicon_entries
        """)
        norm_lex = [(r[0], r[1], r[2], r[3], None, None, r[4], r[5]) for r in src_cur.fetchall()]

    tgt_cur.executemany("""
        INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, norm_lex)

    # 5. Copy lemma_stats
    print("  → Copying lemma_stats...")
    src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='lemma_stats'")
    stat_ddl = src_cur.fetchone()[0]
    tgt_cur.execute(stat_ddl)
    
    src_cur.execute("PRAGMA table_info(lemma_stats)")
    stat_cols = [r[1] for r in src_cur.fetchall()]
    stat_cols_str = ", ".join(stat_cols)
    stat_placeholders = ", ".join(["?"] * len(stat_cols))
    src_cur.execute(f"SELECT {stat_cols_str} FROM lemma_stats")
    tgt_cur.executemany(f"INSERT INTO lemma_stats ({stat_cols_str}) VALUES ({stat_placeholders})", src_cur.fetchall())

    # 6. Copy corpus-specific optional tables
    if corpus_type == "philo":
        print("  → Copying biblical_citations and lemma_forms...")
        src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='biblical_citations'")
        bib_ddl = src_cur.fetchone()[0]
        tgt_cur.execute(bib_ddl)
        src_cur.execute("SELECT * FROM biblical_citations")
        tgt_cur.executemany("INSERT INTO biblical_citations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", src_cur.fetchall())

        src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='lemma_forms'")
        lf_ddl = src_cur.fetchone()[0]
        tgt_cur.execute(lf_ddl)
        src_cur.execute("SELECT * FROM lemma_forms")
        tgt_cur.executemany("INSERT INTO lemma_forms VALUES (?, ?, ?, ?, ?)", src_cur.fetchall())
        tgt_cur.execute("CREATE INDEX IF NOT EXISTS idx_lemma_forms_lookup ON lemma_forms(corpus_id, lemma_key);")

    elif corpus_type == "josephus":
        print("  → Copying attested_forms...")
        src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='attested_forms'")
        att_row = src_cur.fetchone()
        if att_row:
            tgt_cur.execute(att_row[0])
            src_cur.execute("SELECT * FROM attested_forms")
            tgt_cur.executemany("INSERT INTO attested_forms VALUES (?, ?, ?, ?, ?)", src_cur.fetchall())
            tgt_cur.execute("CREATE INDEX IF NOT EXISTS idx_attested_forms_lemma ON attested_forms(lemma);")

    # 7. Build Covering Concordance Table
    build_covering_concordance(src_conn, tgt_conn, corpus_type)

    # 8. Commit and Optimize
    tgt_conn.commit()
    print("  → Optimizing and vacuuming target database...")
    tgt_cur.execute("PRAGMA optimize;")
    tgt_cur.execute("VACUUM;")
    tgt_conn.commit()

    src_conn.close()
    tgt_conn.close()

    tgt_size_mb = tgt_path.stat().st_size / (1024 * 1024)
    print(f"✓ Compiled {tgt_path.name}: {tgt_size_mb:.2f} MB")
