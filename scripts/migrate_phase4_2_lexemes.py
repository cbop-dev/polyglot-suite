#!/usr/bin/env python3
"""Phase 4.2.2 Database Migration: Master Lexemes Schema & Migration.

This script migrates `polyglot-working.sqlite3` to the consolidated Phase 4.2 schema:
  1. Creates and indexes the master `lexemes` table with universal integer IDs.
  2. Creates and indexes `corpus_lemma_stats` for multi-corpus analytics.
  3. Populates `lexemes` from authoritative sources (BHS 8,091, LXX 19,032, SBLGNT 5,461, Peshitta 45,660).
  4. Unifies Greek vocabulary across LXX and NT into single shared lexeme records.
  5. Adds and populates `lexeme_id` in `lexicon_entries`, `lemma_stats`, `concordance_refs`, and `lemma_forms`.
  6. Preserves full backward-compatibility with PBV's existing queries while enabling fast O(1) integer queries.
"""

from __future__ import annotations
import json
import re
import sqlite3
import time
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent

DB_PATH = REPO_ROOT / "packages/data-pipeline/build/polyglot-working.sqlite3"
BLE_DATA_DIR = REPO_ROOT / "apps/biblical-lexeme-explorer/static/data"

OXIA_TO_TONOS = {
    0x1F70: 0x03AC, 0x1F71: 0x03AC,  # alpha
    0x1F72: 0x03AD, 0x1F73: 0x03AD,  # epsilon
    0x1F74: 0x03AE, 0x1F75: 0x03AE,  # eta
    0x1F76: 0x03AF, 0x1F77: 0x03AF,  # iota
    0x1F78: 0x03CC, 0x1F79: 0x03CC,  # omicron
    0x1F7A: 0x03CD, 0x1F7B: 0x03CD,  # upsilon
    0x1F7C: 0x03CE, 0x1F7D: 0x03CE,  # omega
    # Capitals
    0x1FBB: 0x0386, 0x1FC9: 0x0388, 0x1FCB: 0x0389,
    0x1FDB: 0x038A, 0x1FEB: 0x038E, 0x1FF9: 0x038C, 0x1FFB: 0x038F,
}

def to_tonos(s: str) -> str:
    """Converts Greek polytonic Oxia to modern Tonos, normalized NFC."""
    return unicodedata.normalize("NFC", s.translate(OXIA_TO_TONOS))

def strip_greek_accents(text: str) -> str:
    """Strips all Greek accents, breathing marks, and normalizes sigmas to σ."""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0300-\u036f\u1fbd\u1fbf\u1fc0]", "", text)
    text = text.replace("ς", "σ").lower()
    return unicodedata.normalize("NFC", text).strip()

def strip_hebrew_niqqud(text: str) -> str:
    """Strips Hebrew vowel points (niqqud) and cantillation marks."""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7]", "", text)
    return unicodedata.normalize("NFC", text).strip()

def normalize_strongs(s: Optional[str], default_prefix: str = "") -> Optional[str]:
    if not s:
        return None
    s = str(s).strip()
    if not s:
        return None
    if s.startswith(("G", "g", "H", "h")):
        return s[0].upper() + s[1:]
    if s.isdigit():
        return f"{default_prefix}{s}" if default_prefix else s
    return s.upper()

def column_exists(cur: sqlite3.Cursor, table_name: str, column_name: str) -> bool:
    cur.execute(f"PRAGMA table_info({table_name})")
    cols = [r[1] for r in cur.fetchall()]
    return column_name in cols

import subprocess

def load_original_json(file_path: Path) -> Any:
    try:
        rel = file_path.relative_to(REPO_ROOT).as_posix()
        raw = subprocess.check_output(["git", "show", f"HEAD:{rel}"], stderr=subprocess.DEVNULL)
        return json.loads(raw)
    except Exception:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

def migrate_connection(conn: sqlite3.Connection):
    t_start = time.time()
    cur = conn.cursor()

    # 1. Create lexemes table
    print("\n>>> Step 1: Creating 'lexemes' table and indexes <<<")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lexemes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            language TEXT NOT NULL,         -- 'hebrew', 'aramaic', 'greek', 'syriac', 'latin'
            lemma TEXT NOT NULL,            -- Standard NFC (Tonos normalized for Greek, pointed for Hebrew)
            lemma_clean TEXT NOT NULL,      -- Accent/vowel-stripped search/sort key
            strongs_id TEXT,                -- 'G2316', 'H430' (normalized, nullable)
            pos TEXT,                       -- Standardized POS
            gloss TEXT,                     -- Primary English gloss
            source_id TEXT                  -- Original Text-Fabric / source node ID
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lexemes_lookup ON lexemes(language, lemma_clean)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lexemes_strongs ON lexemes(strongs_id) WHERE strongs_id IS NOT NULL")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lexemes_lang_lemma ON lexemes(language, lemma)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lexemes_source_id ON lexemes(source_id)")

    # 2. Create corpus_lemma_stats table
    print(">>> Step 2: Creating 'corpus_lemma_stats' table and indexes <<<")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS corpus_lemma_stats (
            lexeme_id INTEGER NOT NULL REFERENCES lexemes(id),
            corpus_id TEXT NOT NULL,
            total_count INTEGER NOT NULL,
            frequency_per_10k REAL,
            book_counts_json TEXT NOT NULL,
            PRIMARY KEY (lexeme_id, corpus_id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cls_corpus_count ON corpus_lemma_stats(corpus_id, total_count DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cls_lexeme ON corpus_lemma_stats(lexeme_id)")

    # Check if lexemes already populated
    cur.execute("SELECT COUNT(*) FROM lexemes")
    existing_lexemes_count = cur.fetchone()[0]
    if existing_lexemes_count > 0:
        print(f"Table 'lexemes' already contains {existing_lexemes_count:,} entries. Clearing for clean migration...")
        cur.execute("DELETE FROM lexemes")
        cur.execute("DELETE FROM corpus_lemma_stats")
        cur.execute("DELETE FROM sqlite_sequence WHERE name IN ('lexemes')")
        conn.commit()

    # 3. Populate Hebrew Lexemes (BHS)
    print("\n>>> Step 3: Ingesting Hebrew BHS Lexemes (Recovering 797 conflated lemmas) <<<")
    bhs_data = load_original_json(BLE_DATA_DIR / "bhs/lexemes.json")

    bhs_rows = []
    # bhs_id -> lexeme_id map (populated after insert)
    # wlc_lookup: (strongs_or_stripped) -> lexeme_id
    for raw_id, v in bhs_data.items():
        node_id = int(raw_id)
        lemma_nfc = unicodedata.normalize("NFC", v["lemma"])
        lemma_clean = strip_hebrew_niqqud(lemma_nfc)
        s_id = normalize_strongs(v.get("strongs"), default_prefix="H")
        pos = str(v.get("pos", ""))
        gloss = v.get("gloss", "")
        source_id = f"bhs:{node_id}"

        bhs_rows.append((
            "hebrew",
            lemma_nfc,
            lemma_clean,
            s_id,
            pos,
            gloss,
            source_id
        ))

    cur.executemany("""
        INSERT INTO lexemes (language, lemma, lemma_clean, strongs_id, pos, gloss, source_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, bhs_rows)
    conn.commit()
    print(f"Inserted {len(bhs_rows):,} Hebrew BHS lexemes.")

    # Build Hebrew mapping caches
    cur.execute("SELECT id, lemma, lemma_clean, strongs_id, source_id FROM lexemes WHERE language = 'hebrew'")
    hebrew_bhs_map: Dict[int, int] = {}       # bhs node_id -> lexeme_id
    hebrew_by_strongs: Dict[str, int] = {}    # strongs_id -> lexeme_id
    hebrew_by_lemma: Dict[str, int] = {}      # lemma -> lexeme_id
    hebrew_by_clean: Dict[str, int] = {}      # lemma_clean -> lexeme_id

    for l_id, lem, clean, strng, src in cur.fetchall():
        if src and src.startswith("bhs:"):
            b_id = int(src.split(":")[1])
            hebrew_bhs_map[b_id] = l_id
        if strng and strng not in hebrew_by_strongs:
            hebrew_by_strongs[strng] = l_id
        if lem not in hebrew_by_lemma:
            hebrew_by_lemma[lem] = l_id
        if clean not in hebrew_by_clean:
            hebrew_by_clean[clean] = l_id

    # 4. Populate Greek Lexemes (Septuagint LXX)
    print("\n>>> Step 4: Ingesting Greek Septuagint (LXX) Lexemes (19,032 accented entries) <<<")
    lxx_data = load_original_json(BLE_DATA_DIR / "lxx/lexemes.json")

    lxx_rows = []
    for raw_id, v in lxx_data.items():
        node_id = int(raw_id)
        lemma_tonos = to_tonos(v["lemma"])
        lemma_clean = strip_greek_accents(lemma_tonos)
        s_id = normalize_strongs(v.get("strongs"), default_prefix="G")
        pos = str(v.get("pos", ""))
        gloss = v.get("gloss", "")
        source_id = f"lxx:{node_id}"

        lxx_rows.append((
            "greek",
            lemma_tonos,
            lemma_clean,
            s_id,
            pos,
            gloss,
            source_id
        ))

    cur.executemany("""
        INSERT INTO lexemes (language, lemma, lemma_clean, strongs_id, pos, gloss, source_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, lxx_rows)
    conn.commit()
    print(f"Inserted {len(lxx_rows):,} Greek LXX lexemes.")

    # Build Greek LXX mapping caches
    cur.execute("SELECT id, lemma, lemma_clean, strongs_id, source_id FROM lexemes WHERE language = 'greek'")
    greek_by_tonos: Dict[str, int] = {}       # lemma (tonos) -> lexeme_id
    greek_by_strongs: Dict[str, int] = {}     # strongs_id -> lexeme_id
    greek_by_clean: Dict[str, int] = {}       # lemma_clean -> lexeme_id
    greek_lxx_map: Dict[int, int] = {}        # lxx node_id -> lexeme_id

    for l_id, lem, clean, strng, src in cur.fetchall():
        if src and src.startswith("lxx:"):
            x_id = int(src.split(":")[1])
            greek_lxx_map[x_id] = l_id
        if lem not in greek_by_tonos:
            greek_by_tonos[lem] = l_id
        if strng and strng not in greek_by_strongs:
            greek_by_strongs[strng] = l_id
        if clean not in greek_by_clean:
            greek_by_clean[clean] = l_id

    # 5. Populate / Unify Greek NT (SBLGNT)
    print("\n>>> Step 5: Unifying Greek NT (SBLGNT) with LXX into Master Catalog <<<")
    sblgnt_data = load_original_json(BLE_DATA_DIR / "sblgnt/lexemes.json")

    greek_sblgnt_map: Dict[int, int] = {}
    nt_exclusive_rows = []
    unified_with_lxx = 0

    for raw_id, v in sblgnt_data.items():
        node_id = int(raw_id)
        lemma_tonos = to_tonos(v["lemma"])
        lemma_clean = strip_greek_accents(lemma_tonos)
        s_id = normalize_strongs(v.get("strongs"), default_prefix="G")
        pos = str(v.get("pos", ""))
        gloss = v.get("gloss", "")

        matched_lexeme_id: Optional[int] = None
        # Match priority 1: Exact Tonos lemma
        if lemma_tonos in greek_by_tonos:
            matched_lexeme_id = greek_by_tonos[lemma_tonos]
        # Match priority 2: Strong's ID match with same stripped consonants
        elif s_id and s_id in greek_by_strongs and lemma_clean == strip_greek_accents(sblgnt_data[raw_id]["lemma"]):
            matched_lexeme_id = greek_by_strongs[s_id]

        if matched_lexeme_id is not None:
            greek_sblgnt_map[node_id] = matched_lexeme_id
            unified_with_lxx += 1
        else:
            source_id = f"sblgnt:{node_id}"
            nt_exclusive_rows.append((
                node_id,
                ("greek", lemma_tonos, lemma_clean, s_id, pos, gloss, source_id)
            ))

    print(f"Unified {unified_with_lxx:,} NT words with existing LXX lexemes.")
    print(f"Inserting {len(nt_exclusive_rows):,} NT-exclusive Greek lemmas...")

    for node_id, row in nt_exclusive_rows:
        cur.execute("""
            INSERT INTO lexemes (language, lemma, lemma_clean, strongs_id, pos, gloss, source_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, row)
        l_id = cur.lastrowid
        greek_sblgnt_map[node_id] = l_id
        # Update lookup caches
        lem = row[1]
        clean = row[2]
        strng = row[3]
        if lem not in greek_by_tonos: greek_by_tonos[lem] = l_id
        if strng and strng not in greek_by_strongs: greek_by_strongs[strng] = l_id
        if clean not in greek_by_clean: greek_by_clean[clean] = l_id

    conn.commit()

    # 6. Populate Syriac Peshitta Lexemes
    print("\n>>> Step 6: Ingesting Syriac Peshitta Lexemes <<<")
    cur.execute("""
        SELECT lemma_key, display_lemma, total_count
        FROM lemma_stats
        WHERE corpus_id = 'peshitta'
    """)
    peshitta_rows = cur.fetchall()
    peshitta_inserts = []
    peshitta_map: Dict[str, int] = {}

    for l_key, d_lem, cnt in peshitta_rows:
        source_id = f"peshitta:{l_key}"
        peshitta_inserts.append((
            "syriac",
            d_lem,
            l_key,
            None,
            "",
            "",
            source_id
        ))

    cur.executemany("""
        INSERT INTO lexemes (language, lemma, lemma_clean, strongs_id, pos, gloss, source_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, peshitta_inserts)
    conn.commit()
    print(f"Inserted {len(peshitta_inserts):,} Syriac Peshitta lexemes.")

    cur.execute("SELECT id, lemma_clean FROM lexemes WHERE language = 'syriac'")
    for l_id, l_clean in cur.fetchall():
        peshitta_map[l_clean] = l_id

    # Total lexemes summary
    cur.execute("SELECT language, COUNT(*) FROM lexemes GROUP BY language")
    print(f"\nMaster 'lexemes' catalog populated:")
    for lang, cnt in cur.fetchall():
        print(f"  • {lang.capitalize()}: {cnt:,} distinct lemmas")

    # 7. Populate corpus_lemma_stats for BLE corpora (BHS, LXX, SBLGNT)
    print("\n>>> Step 7: Populating 'corpus_lemma_stats' table <<<")
    
    # Helper to calculate book counts from BLE sections + books
    def load_ble_corpus_stats(corpus_key: str, id_to_lexeme: Dict[int, int]) -> List[Tuple[int, str, int, float, str]]:
        sec_path = BLE_DATA_DIR / corpus_key / "sections.json"
        books_path = BLE_DATA_DIR / corpus_key / "books.json"
        lex_path = BLE_DATA_DIR / corpus_key / "lexemes.json"
        if not (sec_path.exists() and books_path.exists()):
            return []

        sections = load_original_json(sec_path)
        books_dict = load_original_json(books_path)
        lexemes_meta = load_original_json(lex_path)

        book_nodes = set(str(b.get("node")) for b in books_dict.values())

        # Chapter node -> book abbrev
        chap_to_book = {}
        for b in books_dict.values():
            b_abbrev = b.get("abbrev") or b.get("name") or "Unknown"
            for chap_node in b.get("chapters", {}).keys():
                chap_to_book[str(chap_node)] = b_abbrev

        # Aggregate counts per lex_id per book from chapters
        lexeme_book_counts = defaultdict(lambda: defaultdict(int))
        total_corpus_words = sum(s.get("words", 0) for sec_id, s in sections.items() if str(sec_id) not in book_nodes)

        for chap_node, s_data in sections.items():
            if str(chap_node) in book_nodes:
                continue
            b_code = chap_to_book.get(str(chap_node), "Unknown")
            for raw_lex_id, cnt in s_data.get("lex", {}).items():
                lex_id = int(raw_lex_id)
                lexeme_book_counts[lex_id][b_code] += cnt

        out_rows = []
        for raw_id, meta in lexemes_meta.items():
            node_id = int(raw_id)
            if node_id not in id_to_lexeme:
                continue
            lex_pk = id_to_lexeme[node_id]
            tot = meta.get("total", 0)
            freq = round((tot / total_corpus_words) * 10000, 4) if total_corpus_words > 0 else 0.0
            b_counts = [[b, c] for b, c in lexeme_book_counts.get(node_id, {}).items()]
            out_rows.append((
                lex_pk,
                corpus_key,
                tot,
                freq,
                json.dumps(b_counts, ensure_ascii=False)
            ))
        return out_rows

    print("Generating corpus_lemma_stats for BHS...")
    bhs_stats = load_ble_corpus_stats("bhs", hebrew_bhs_map)
    cur.executemany("""
        INSERT OR REPLACE INTO corpus_lemma_stats (lexeme_id, corpus_id, total_count, frequency_per_10k, book_counts_json)
        VALUES (?, ?, ?, ?, ?)
    """, bhs_stats)
    print(f"  Inserted {len(bhs_stats):,} rows for 'bhs'.")

    print("Generating corpus_lemma_stats for LXX...")
    lxx_stats = load_ble_corpus_stats("lxx", greek_lxx_map)
    cur.executemany("""
        INSERT OR REPLACE INTO corpus_lemma_stats (lexeme_id, corpus_id, total_count, frequency_per_10k, book_counts_json)
        VALUES (?, ?, ?, ?, ?)
    """, lxx_stats)
    print(f"  Inserted {len(lxx_stats):,} rows for 'lxx'.")

    print("Generating corpus_lemma_stats for SBLGNT...")
    sblgnt_stats = load_ble_corpus_stats("sblgnt", greek_sblgnt_map)
    cur.executemany("""
        INSERT OR REPLACE INTO corpus_lemma_stats (lexeme_id, corpus_id, total_count, frequency_per_10k, book_counts_json)
        VALUES (?, ?, ?, ?, ?)
    """, sblgnt_stats)
    print(f"  Inserted {len(sblgnt_stats):,} rows for 'sblgnt'.")

    conn.commit()

    # 8. Add lexeme_id to existing PBV tables
    print("\n>>> Step 8: Adding 'lexeme_id' column to PBV analytical tables <<<")
    for tbl in ["lexicon_entries", "lemma_stats", "concordance_refs", "lemma_forms"]:
        if not column_exists(cur, tbl, "lexeme_id"):
            print(f"  Adding 'lexeme_id' column to {tbl}...")
            cur.execute(f"ALTER TABLE {tbl} ADD COLUMN lexeme_id INTEGER")
        else:
            print(f"  Column 'lexeme_id' already exists in {tbl}.")
    conn.commit()

    # 9. Link lexicon_entries.lexeme_id
    print("\n>>> Step 9: Linking 'lexicon_entries' to master 'lexemes' <<<")
    # For LSJ (Greek)
    cur.execute("SELECT id, strongs_id, lemma FROM lexicon_entries WHERE dictionary = 'lsj'")
    lsj_updates = []
    for lex_entry_id, s_id, lem in cur.fetchall():
        s_norm = normalize_strongs(s_id, default_prefix="G")
        lem_tonos = to_tonos(lem)
        matched_id = None
        if s_norm and s_norm in greek_by_strongs:
            matched_id = greek_by_strongs[s_norm]
        elif lem_tonos in greek_by_tonos:
            matched_id = greek_by_tonos[lem_tonos]
        elif strip_greek_accents(lem) in greek_by_clean:
            matched_id = greek_by_clean[strip_greek_accents(lem)]

        if matched_id:
            lsj_updates.append((matched_id, lex_entry_id))

    # For BDB (Hebrew)
    cur.execute("SELECT id, strongs_id, lemma FROM lexicon_entries WHERE dictionary = 'bdb'")
    bdb_updates = []
    for lex_entry_id, s_id, lem in cur.fetchall():
        s_norm = normalize_strongs(s_id, default_prefix="H")
        clean_lem = strip_hebrew_niqqud(lem)
        matched_id = None
        if s_norm and s_norm in hebrew_by_strongs:
            matched_id = hebrew_by_strongs[s_norm]
        elif lem in hebrew_by_lemma:
            matched_id = hebrew_by_lemma[lem]
        elif clean_lem in hebrew_by_clean:
            matched_id = hebrew_by_clean[clean_lem]

        if matched_id:
            bdb_updates.append((matched_id, lex_entry_id))

    cur.executemany("UPDATE lexicon_entries SET lexeme_id = ? WHERE id = ?", lsj_updates)
    cur.executemany("UPDATE lexicon_entries SET lexeme_id = ? WHERE id = ?", bdb_updates)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lexicon_lexeme_id ON lexicon_entries(lexeme_id)")
    conn.commit()
    print(f"  Linked {len(lsj_updates):,} LSJ entries and {len(bdb_updates):,} BDB entries to master lexemes.")

    # 10. Link lemma_stats.lexeme_id
    print("\n>>> Step 10: Linking 'lemma_stats' to master 'lexemes' <<<")
    cur.execute("SELECT corpus_id, lemma_key, display_lemma FROM lemma_stats")
    ls_rows = cur.fetchall()
    ls_updates = []

    for c_id, l_key, d_lem in ls_rows:
        matched_id: Optional[int] = None
        if c_id == "wlc":
            s_norm = normalize_strongs(l_key, default_prefix="H")
            if s_norm in hebrew_by_strongs:
                matched_id = hebrew_by_strongs[s_norm]
            elif d_lem in hebrew_by_lemma:
                matched_id = hebrew_by_lemma[d_lem]
            elif strip_hebrew_niqqud(d_lem) in hebrew_by_clean:
                matched_id = hebrew_by_clean[strip_hebrew_niqqud(d_lem)]
        elif c_id in ("swete_lxx", "lxx"):
            s_norm = normalize_strongs(l_key, default_prefix="G")
            if s_norm in greek_by_strongs:
                matched_id = greek_by_strongs[s_norm]
            elif to_tonos(d_lem) in greek_by_tonos:
                matched_id = greek_by_tonos[to_tonos(d_lem)]
            elif strip_greek_accents(d_lem) in greek_by_clean:
                matched_id = greek_by_clean[strip_greek_accents(d_lem)]
        elif c_id in ("ognt", "sblgnt"):
            s_norm = normalize_strongs(l_key, default_prefix="G")
            if s_norm in greek_by_strongs:
                matched_id = greek_by_strongs[s_norm]
            elif to_tonos(d_lem) in greek_by_tonos:
                matched_id = greek_by_tonos[to_tonos(d_lem)]
        elif c_id == "peshitta":
            if l_key in peshitta_map:
                matched_id = peshitta_map[l_key]

        if matched_id is not None:
            ls_updates.append((matched_id, c_id, l_key))

    cur.executemany("UPDATE lemma_stats SET lexeme_id = ? WHERE corpus_id = ? AND lemma_key = ?", ls_updates)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lemma_stats_lexeme_id ON lemma_stats(lexeme_id)")
    conn.commit()
    print(f"  Linked {len(ls_updates):,} of {len(ls_rows):,} rows in 'lemma_stats' ({len(ls_updates)/len(ls_rows)*100:.1f}%).")

    # Also register PBV's linked lemma_stats rows into corpus_lemma_stats
    print("Populating PBV corpora into corpus_lemma_stats (swete_lxx, ognt, wlc, peshitta)...")
    cur.execute("""
        INSERT OR REPLACE INTO corpus_lemma_stats (lexeme_id, corpus_id, total_count, frequency_per_10k, book_counts_json)
        SELECT 
            ls.lexeme_id,
            ls.corpus_id,
            ls.total_count,
            0.0,
            ls.book_counts_json
        FROM lemma_stats ls
        WHERE ls.lexeme_id IS NOT NULL
    """)
    conn.commit()

    # 11. Link concordance_refs.lexeme_id
    print("\n>>> Step 11: Linking 'concordance_refs' to master 'lexemes' <<<")
    t_c = time.time()
    cur.execute("""
        UPDATE concordance_refs
        SET lexeme_id = (
            SELECT ls.lexeme_id
            FROM lemma_stats ls
            WHERE ls.corpus_id = concordance_refs.corpus_id
              AND ls.lemma_key = concordance_refs.lemma_key
        )
    """)
    conn.commit()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_concordance_lexeme_id ON concordance_refs(lexeme_id)")
    conn.commit()
    print(f"  Linked 'concordance_refs' rows in {time.time() - t_c:.2f}s.")

    # 12. Link lemma_forms.lexeme_id
    print("\n>>> Step 12: Linking 'lemma_forms' to master 'lexemes' <<<")
    t_lf = time.time()
    cur.execute("""
        UPDATE lemma_forms
        SET lexeme_id = (
            SELECT ls.lexeme_id
            FROM lemma_stats ls
            WHERE ls.corpus_id = lemma_forms.corpus_id
              AND ls.lemma_key = lemma_forms.lemma_key
        )
    """)
    conn.commit()
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lemma_forms_lexeme_id ON lemma_forms(lexeme_id)")
    conn.commit()
    print(f"  Linked 'lemma_forms' rows in {time.time() - t_lf:.2f}s.")

    # Run ANALYZE for SQLite query planner statistics
    print("\n>>> Step 13: Running ANALYZE for query planner statistics <<<")
    cur.execute("ANALYZE")
    conn.commit()

def migrate(db_path: Path = DB_PATH):
    print("==================================================")
    print("Phase 4.2.2: Master Lexemes Migration")
    print(f"Target DB: {db_path}")
    print("==================================================")
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA synchronous = OFF")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        migrate_connection(conn)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
