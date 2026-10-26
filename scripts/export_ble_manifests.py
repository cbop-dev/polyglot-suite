#!/usr/bin/env python3
"""Phase 4.2.3: Build-Time Manifest Generator for Biblical Lexeme Explorer (BLE).

Exports optimized, lightweight JSON manifests directly from the master SQLite database:
  1. static/data/{lxx, bhs, sblgnt}/lexemes.json (keyed by universal integer lexeme_id)
  2. static/data/{lxx, bhs, sblgnt}/concordance.json (re-keyed to universal integer lexeme_id)
  3. static/data/{lxx, bhs, sblgnt}/sections.json (chapter histogram frequencies re-keyed to lexeme_id)
  4. src/lib/{lxx/lxxLexes6.json, bhs/bhsLexes3.1.json, sblgnt/sblGntLexes.json} (sorted columnar search index)

Eliminates all legacy Text-Fabric node IDs, unifying every component and URL across
PBV and BLE around the master `lexemes.id`.
"""

from __future__ import annotations
import json
import re
import sqlite3
import time
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent

DB_PATH = REPO_ROOT / "packages/data-pipeline/build/polyglot-working.sqlite3"
BLE_DIR = REPO_ROOT / "apps/biblical-lexeme-explorer"
BLE_STATIC_DATA = BLE_DIR / "static/data"
BLE_SRC_LIB = BLE_DIR / "src/lib"

OXIA_TO_TONOS = {
    0x1F70: 0x03AC, 0x1F71: 0x03AC, 0x1F72: 0x03AD, 0x1F73: 0x03AD,
    0x1F74: 0x03AE, 0x1F75: 0x03AE, 0x1F76: 0x03AF, 0x1F77: 0x03AF,
    0x1F78: 0x03CC, 0x1F79: 0x03CC, 0x1F7A: 0x03CD, 0x1F7B: 0x03CD,
    0x1F7C: 0x03CE, 0x1F7D: 0x03CE,
    0x1FBB: 0x0386, 0x1FC9: 0x0388, 0x1FCB: 0x0389,
    0x1FDB: 0x038A, 0x1FEB: 0x038E, 0x1FF9: 0x038C, 0x1FFB: 0x038F,
}

def to_tonos(s: str) -> str:
    return unicodedata.normalize("NFC", s.translate(OXIA_TO_TONOS))

def make_plain_greek(text: str) -> str:
    norm = unicodedata.normalize("NFD", text)
    norm = re.sub(r"[\u0300-\u036f\u0313\u0314\u0342\u0345\u0308']+", "", norm)
    norm = unicodedata.normalize("NFC", norm)
    return re.sub(r"[.,;·:!?᾽’”“«»\-—\(\)\[\]⟦⟧⟨⟩⟪⟫⸂⸃⸆⸇⸀⸁⸄⸅⸈⸉⸊⸋†‡*0-9\s]+", "", norm)

def make_plain_hebrew(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7]", "", text)
    return unicodedata.normalize("NFC", text).strip()

import subprocess

def load_original_json(file_path: Path) -> Any:
    try:
        rel = file_path.relative_to(REPO_ROOT).as_posix()
        raw = subprocess.check_output(["git", "show", f"HEAD:{rel}"], stderr=subprocess.DEVNULL)
        return json.loads(raw)
    except Exception:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

def build_node_to_lexeme_map(conn: sqlite3.Connection, corpus_key: str) -> Dict[int, int]:
    """Constructs a complete mapping from legacy dataset node ID to universal lexeme_id."""
    cur = conn.cursor()
    node_to_lid: Dict[int, int] = {}

    if corpus_key == "bhs":
        cur.execute("SELECT id, source_id FROM lexemes WHERE source_id LIKE 'bhs:%'")
        for lid, src in cur.fetchall():
            node_id = int(src.split(":")[1])
            node_to_lid[node_id] = lid
    elif corpus_key == "lxx":
        cur.execute("SELECT id, source_id FROM lexemes WHERE source_id LIKE 'lxx:%'")
        for lid, src in cur.fetchall():
            node_id = int(src.split(":")[1])
            node_to_lid[node_id] = lid
    elif corpus_key == "sblgnt":
        # SBLGNT has both direct source_ids and unified Greek entries
        cur.execute("SELECT id, lemma, lemma_clean, strongs_id, source_id FROM lexemes WHERE language = 'greek'")
        by_tonos = {}
        by_strongs = {}
        by_clean = {}
        by_src = {}
        for lid, lem, clean, strng, src in cur.fetchall():
            if lem not in by_tonos: by_tonos[lem] = lid
            if strng and strng not in by_strongs: by_strongs[strng] = lid
            if clean not in by_clean: by_clean[clean] = lid
            if src: by_src[src] = lid

        sblgnt_data = load_original_json(BLE_STATIC_DATA / "sblgnt/lexemes.json")

        for raw_id, v in sblgnt_data.items():
            nid = int(raw_id)
            lem_t = to_tonos(v["lemma"])
            lem_c = make_plain_greek(v["lemma"]).lower()
            s_raw = str(v.get("strongs", "")).strip()
            s_id = ("G" + s_raw.lstrip("Gg")) if s_raw else ""
            src_key = f"sblgnt:{nid}"

            lid = None
            if src_key in by_src:
                lid = by_src[src_key]
            elif lem_t in by_tonos:
                lid = by_tonos[lem_t]
            elif s_id and s_id in by_strongs:
                lid = by_strongs[s_id]
            elif lem_c in by_clean:
                lid = by_clean[lem_c]

            if lid is not None:
                node_to_lid[nid] = lid
            else:
                raise ValueError(f"Unmapped SBLGNT node ID {nid}: {v['lemma']}")

    return node_to_lid

def export_corpus_manifests(conn: sqlite3.Connection, corpus_key: str, lang_name: str, columnar_path: Path):
    print(f"\n--- Exporting Manifests for {corpus_key.upper()} ({lang_name}) ---")
    t0 = time.time()
    cur = conn.cursor()

    node_to_lid = build_node_to_lexeme_map(conn, corpus_key)
    print(f"  Mapped {len(node_to_lid):,} legacy node IDs to master lexeme_id.")

    # 1. Load existing lexemes.json to preserve beta and pos fields
    lex_file = BLE_STATIC_DATA / corpus_key / "lexemes.json"
    existing_lex = load_original_json(lex_file)

    # 2. Query master SQLite for fresh canonical metadata
    cur.execute("SELECT id, lemma, lemma_clean, strongs_id, pos, gloss FROM lexemes")
    master_info = {r[0]: {"lemma": r[1], "clean": r[2], "strongs": r[3], "pos": r[4], "gloss": r[5]} for r in cur.fetchall()}

    # Query corpus_lemma_stats for occurrence count
    cur.execute("SELECT lexeme_id, total_count FROM corpus_lemma_stats WHERE corpus_id = ?", (corpus_key,))
    corpus_counts = dict(cur.fetchall())

    new_lexemes_dict: Dict[str, Any] = {}
    search_entries: List[Tuple[str, str, int]] = []  # (plain, display, lid)

    for raw_old_id, old_v in existing_lex.items():
        old_id = int(raw_old_id)
        if old_id not in node_to_lid:
            continue
        lid = node_to_lid[old_id]
        m = master_info.get(lid, {})

        display_lemma = m.get("lemma") or old_v.get("lemma")
        # Preserve original BLE plain formatting (which keeps uppercase for proper nouns like 'Ααρων')
        if "plain" in old_v and old_v["plain"]:
            plain_lemma = old_v["plain"]
        elif lang_name == "greek":
            plain_lemma = make_plain_greek(display_lemma)
        else:
            plain_lemma = make_plain_hebrew(display_lemma)

        strongs_val = m.get("strongs") or old_v.get("strongs") or ""
        gloss_val = m.get("gloss") or old_v.get("gloss") or ""
        total_val = corpus_counts.get(lid, old_v.get("total", 0))
        pos_val = old_v.get("pos", 0)
        beta_val = old_v.get("beta", "")

        new_entry = {
            "id": lid,
            "lemma": display_lemma,
            "gloss": gloss_val,
            "pos": pos_val,
            "total": total_val,
            "beta": beta_val,
            "plain": plain_lemma,
            "strongs": strongs_val,
        }
        new_lexemes_dict[str(lid)] = new_entry
        search_entries.append((plain_lemma, display_lemma, lid))

    # Write new lexemes.json
    with open(lex_file, "w", encoding="utf-8") as f:
        json.dump(new_lexemes_dict, f, ensure_ascii=False)
    print(f"  ✓ Exported {len(new_lexemes_dict):,} entries to {lex_file.relative_to(REPO_ROOT)}")

    # 3. Re-key concordance.json
    conc_file = BLE_STATIC_DATA / corpus_key / "concordance.json"
    if conc_file.exists():
        old_conc = load_original_json(conc_file)

        new_conc: Dict[str, Any] = {}
        for raw_old_id, conc_val in old_conc.items():
            old_id = int(raw_old_id)
            if old_id in node_to_lid:
                new_lid = str(node_to_lid[old_id])
                # If multiple old IDs unified into one lexeme_id (e.g. SBLGNT variants):
                if new_lid in new_conc:
                    # Merge occurrences
                    existing = new_conc[new_lid]
                    existing["total"] += conc_val.get("total", 0)
                    existing["refs"] = list(dict.fromkeys(existing.get("refs", []) + conc_val.get("refs", [])))
                    existing["nodes"] = list(dict.fromkeys(existing.get("nodes", []) + conc_val.get("nodes", [])))
                else:
                    new_conc[new_lid] = conc_val

        with open(conc_file, "w", encoding="utf-8") as f:
            json.dump(new_conc, f, ensure_ascii=False)
        print(f"  ✓ Re-keyed {len(new_conc):,} concordance entries in {conc_file.relative_to(REPO_ROOT)}")

    # 4. Re-key sections.json
    sec_file = BLE_STATIC_DATA / corpus_key / "sections.json"
    if sec_file.exists():
        sections = load_original_json(sec_file)

        for sec_node, s_data in sections.items():
            if "lex" in s_data:
                new_lex = {}
                for raw_old_id, count in s_data["lex"].items():
                    old_id = int(raw_old_id)
                    if old_id in node_to_lid:
                        new_lid = str(node_to_lid[old_id])
                        new_lex[new_lid] = new_lex.get(new_lid, 0) + count
                s_data["lex"] = new_lex

        with open(sec_file, "w", encoding="utf-8") as f:
            json.dump(sections, f, ensure_ascii=False)
        print(f"  ✓ Re-keyed {len(sections):,} section histograms in {sec_file.relative_to(REPO_ROOT)}")

    # 5. Generate Columnar Search Index (e.g. lxxLexes6.json)
    # Sort entries by plain text for fast search
    search_entries.sort(key=lambda x: (x[0].lower(), x[1]))

    lang_field = "hebrew" if lang_name == "hebrew" else "greek"
    columnar_data = {
        lang_field: [e[1] for e in search_entries],
        "plain": [e[0] for e in search_entries],
        "id": [e[2] for e in search_entries],
    }

    columnar_path.parent.mkdir(parents=True, exist_ok=True)
    with open(columnar_path, "w", encoding="utf-8") as f:
        json.dump(columnar_data, f, ensure_ascii=False)
    print(f"  ✓ Generated columnar search index at {columnar_path.relative_to(REPO_ROOT)} ({len(search_entries):,} words)")
    print(f"Finished {corpus_key.upper()} in {time.time() - t0:.2f}s.")

def main():
    t_start = time.time()
    print("==================================================")
    print("Phase 4.2.3: Build-Time Manifest Generator")
    print(f"Master Database: {DB_PATH}")
    print("==================================================")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)

    # 1. BHS (Hebrew)
    export_corpus_manifests(
        conn=conn,
        corpus_key="bhs",
        lang_name="hebrew",
        columnar_path=BLE_SRC_LIB / "bhs/bhsLexes3.1.json"
    )

    # 2. LXX (Greek)
    export_corpus_manifests(
        conn=conn,
        corpus_key="lxx",
        lang_name="greek",
        columnar_path=BLE_SRC_LIB / "lxx/lxxLexes6.json"
    )

    # 3. SBLGNT (Greek)
    export_corpus_manifests(
        conn=conn,
        corpus_key="sblgnt",
        lang_name="greek",
        columnar_path=BLE_SRC_LIB / "sblgnt/sblGntLexes.json"
    )

    conn.close()
    elapsed = time.time() - t_start
    print("\n==================================================")
    print(f"All BLE manifests exported successfully in {elapsed:.2f}s!")
    print("==================================================")

if __name__ == "__main__":
    main()
