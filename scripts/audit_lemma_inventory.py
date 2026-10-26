#!/usr/bin/env python3
"""Phase 4.2.1 Audit Script: Lemma & Corpus Inventory Comparison.

Audits and compares distinct lemmas, Strong's mappings, occurrence counts,
and Unicode normalization between Polyglot Bible Reader (PBV) and Biblical
Lexeme Explorer (BLE), as well as secondary corpora (Philo, Apostolic Fathers).
"""

from __future__ import annotations
import json
import re
import sqlite3
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent

PBV_DB_PATH = REPO_ROOT / "apps/polyglot-bible-reader/pipeline/build/polyglot-working.sqlite3"
PHILO_DB_PATH = REPO_ROOT / "apps/philo-reader/pipeline/build/philo.sqlite3"
AF_DB_PATH = REPO_ROOT / "apps/apostolic-fathers-reader/pipeline/build/apostolic-fathers.sqlite3"

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
    """Converts Greek polytonic Oxia to modern Tonos."""
    return unicodedata.normalize("NFC", s.translate(OXIA_TO_TONOS))

def strip_greek_accents(text: str) -> str:
    """Strips all Greek accents, breathing marks, and normalizes sigmas."""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0300-\u036f\u1fbd\u1fbf\u1fc0]", "", text)
    text = text.replace("ς", "σ").lower()
    return unicodedata.normalize("NFC", text).strip()

def strip_hebrew_niqqud(text: str) -> str:
    """Strips Hebrew vowel points (niqqud) and cantillation marks."""
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7]", "", text)
    return unicodedata.normalize("NFC", text).strip()

def run_audit() -> Dict[str, Any]:
    report: Dict[str, Any] = {}

    print("Connecting to PBV database...")
    pbv_conn = sqlite3.connect(PBV_DB_PATH)
    pbv_cur = pbv_conn.cursor()

    # 1. PBV Corpora Overview
    pbv_cur.execute("SELECT corpus_id, COUNT(*) FROM text_units GROUP BY corpus_id")
    pbv_tu_counts = dict(pbv_cur.fetchall())
    pbv_cur.execute("SELECT corpus_id, COUNT(*) FROM lemma_stats GROUP BY corpus_id")
    pbv_ls_counts = dict(pbv_cur.fetchall())

    report["pbv_corpora"] = {
        "text_units": pbv_tu_counts,
        "lemma_stats_rows": pbv_ls_counts,
    }

    # 2. BLE Corpora Overview
    ble_corpora_stats = {}
    for corpus in ["lxx", "sblgnt", "bhs"]:
        p = BLE_DATA_DIR / corpus / "lexemes.json"
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            total_tokens = sum(v.get("total", 0) for v in data.values())
            with_strongs = sum(1 for v in data.values() if v.get("strongs") and str(v["strongs"]).strip())
            ble_corpora_stats[corpus] = {
                "entry_count": len(data),
                "total_tokens": total_tokens,
                "with_strongs": with_strongs,
                "without_strongs": len(data) - with_strongs,
                "strongs_coverage_pct": round((with_strongs / len(data)) * 100, 2),
            }
    report["ble_corpora"] = ble_corpora_stats

    # 3. LXX Deep Comparison (BLE lxx vs PBV swete_lxx)
    print("Auditing LXX...")
    with open(BLE_DATA_DIR / "lxx/lexemes.json", "r", encoding="utf-8") as f:
        ble_lxx = json.load(f)

    pbv_cur.execute(
        "SELECT lemma_key, display_lemma, total_count FROM lemma_stats WHERE corpus_id = 'swete_lxx'"
    )
    pbv_lxx_rows = pbv_cur.fetchall()
    pbv_lxx_total_tokens = sum(r[2] for r in pbv_lxx_rows)
    pbv_lxx_strongs_count = sum(1 for r in pbv_lxx_rows if r[0].startswith("G"))

    # Analyze PBV unaccented lemmas
    pbv_unaccented_count = sum(1 for r in pbv_lxx_rows if not r[0].startswith("G"))

    # Accent analysis
    ble_lemmas_raw = set(v["lemma"] for v in ble_lxx.values())
    ble_lemmas_nfc = set(unicodedata.normalize("NFC", v["lemma"]) for v in ble_lxx.values())
    ble_lemmas_tonos = set(to_tonos(v["lemma"]) for v in ble_lxx.values())
    ble_lemmas_stripped = {strip_greek_accents(v["lemma"]): v for v in ble_lxx.values()}

    pbv_lemmas_raw = set(r[1] for r in pbv_lxx_rows)
    pbv_lemmas_nfc = set(unicodedata.normalize("NFC", r[1]) for r in pbv_lxx_rows)
    pbv_lemmas_tonos = set(to_tonos(r[1]) for r in pbv_lxx_rows)
    pbv_lemmas_stripped = {strip_greek_accents(r[1]): r for r in pbv_lxx_rows}

    # Strong's coverage in LXX
    ble_lxx_strongs = {
        ("G" + str(v["strongs"]).lstrip("Gg")).strip(): v
        for v in ble_lxx.values()
        if v.get("strongs") and str(v["strongs"]).strip()
    }
    pbv_lxx_strongs = {r[0]: r for r in pbv_lxx_rows if r[0].startswith("G")}
    lxx_strongs_overlap = set(ble_lxx_strongs.keys()) & set(pbv_lxx_strongs.keys())

    report["lxx_comparison"] = {
        "ble_entries": len(ble_lxx),
        "pbv_lemma_stats_rows": len(pbv_lxx_rows),
        "ble_total_tokens": sum(v.get("total", 0) for v in ble_lxx.values()),
        "pbv_total_tokens": pbv_lxx_total_tokens,
        "token_count_diff": abs(sum(v.get("total", 0) for v in ble_lxx.values()) - pbv_lxx_total_tokens),
        "token_count_diff_pct": round(
            abs(sum(v.get("total", 0) for v in ble_lxx.values()) - pbv_lxx_total_tokens)
            / sum(v.get("total", 0) for v in ble_lxx.values())
            * 100,
            2
        ),
        "strongs": {
            "ble_with_strongs": len(ble_lxx_strongs),
            "pbv_with_strongs": len(pbv_lxx_strongs),
            "strongs_id_overlap": len(lxx_strongs_overlap),
            "ble_without_strongs": len(ble_lxx) - len(ble_lxx_strongs),
            "pbv_without_strongs": pbv_unaccented_count,
        },
        "unicode_matches": {
            "raw_exact_match": len(ble_lemmas_raw & pbv_lemmas_raw),
            "nfc_exact_match": len(ble_lemmas_nfc & pbv_lemmas_nfc),
            "tonos_normalized_match": len(ble_lemmas_tonos & pbv_lemmas_tonos),
            "stripped_match": len(set(ble_lemmas_stripped.keys()) & set(pbv_lemmas_stripped.keys())),
            "in_pbv_not_ble_stripped": len(set(pbv_lemmas_stripped.keys()) - set(ble_lemmas_stripped.keys())),
            "in_ble_not_pbv_stripped": len(set(ble_lemmas_stripped.keys()) - set(pbv_lemmas_stripped.keys())),
        },
    }

    # 4. GNT Deep Comparison (BLE sblgnt vs PBV ognt)
    print("Auditing Greek NT...")
    with open(BLE_DATA_DIR / "sblgnt/lexemes.json", "r", encoding="utf-8") as f:
        ble_nt = json.load(f)

    pbv_cur.execute(
        "SELECT lemma_key, display_lemma, total_count FROM lemma_stats WHERE corpus_id = 'ognt'"
    )
    pbv_nt_rows = pbv_cur.fetchall()

    ble_nt_strongs = {
        ("G" + str(v["strongs"]).lstrip("Gg")).strip(): v
        for v in ble_nt.values()
        if v.get("strongs") and str(v["strongs"]).strip()
    }
    pbv_nt_strongs = {r[0]: r for r in pbv_nt_rows if r[0].startswith("G")}
    nt_strongs_overlap = set(ble_nt_strongs.keys()) & set(pbv_nt_strongs.keys())

    ble_nt_stripped = {strip_greek_accents(v["lemma"]): v for v in ble_nt.values()}
    pbv_nt_stripped = {strip_greek_accents(r[1]): r for r in pbv_nt_rows}

    report["gnt_comparison"] = {
        "ble_entries": len(ble_nt),
        "pbv_lemma_stats_rows": len(pbv_nt_rows),
        "ble_total_tokens": sum(v.get("total", 0) for v in ble_nt.values()),
        "pbv_total_tokens": sum(r[2] for r in pbv_nt_rows),
        "strongs": {
            "ble_with_strongs": len(ble_nt_strongs),
            "pbv_with_strongs": len(pbv_nt_strongs),
            "strongs_id_overlap": len(nt_strongs_overlap),
            "strongs_match_pct": round(len(nt_strongs_overlap) / len(ble_nt_strongs) * 100, 2),
        },
        "stripped_lemma_overlap": len(set(ble_nt_stripped.keys()) & set(pbv_nt_stripped.keys())),
    }

    # 5. Hebrew OT Deep Comparison (BLE bhs vs PBV wlc)
    print("Auditing Hebrew OT...")
    with open(BLE_DATA_DIR / "bhs/lexemes.json", "r", encoding="utf-8") as f:
        ble_bhs = json.load(f)

    pbv_cur.execute(
        "SELECT lemma_key, display_lemma, total_count FROM lemma_stats WHERE corpus_id = 'wlc'"
    )
    pbv_he_rows = pbv_cur.fetchall()

    ble_bhs_strongs_counts = Counter(
        v["strongs"].strip() for v in ble_bhs.values() if v.get("strongs") and v["strongs"].strip()
    )
    shared_strongs_count = sum(1 for c in ble_bhs_strongs_counts.values() if c > 1)
    extra_entries_from_shared_strongs = sum(c - 1 for c in ble_bhs_strongs_counts.values() if c > 1)

    ble_bhs_strongs = {
        v["strongs"].strip(): v for v in ble_bhs.values() if v.get("strongs") and v["strongs"].strip()
    }
    pbv_he_strongs = {r[0]: r for r in pbv_he_rows if r[0].startswith("H")}
    he_strongs_overlap = set(ble_bhs_strongs.keys()) & set(pbv_he_strongs.keys())

    ble_bhs_stripped = {strip_hebrew_niqqud(v["lemma"]): v for v in ble_bhs.values()}
    pbv_he_stripped = {strip_hebrew_niqqud(r[1]): r for r in pbv_he_rows}

    ble_bhs_exact = {unicodedata.normalize("NFC", v["lemma"]): v for v in ble_bhs.values()}
    pbv_he_exact = {unicodedata.normalize("NFC", r[1]): r for r in pbv_he_rows}

    report["hebrew_comparison"] = {
        "ble_entries": len(ble_bhs),
        "pbv_lemma_stats_rows": len(pbv_he_rows),
        "ble_total_tokens": sum(v.get("total", 0) for v in ble_bhs.values()),
        "pbv_total_tokens": sum(r[2] for r in pbv_he_rows),
        "strongs_conflation": {
            "distinct_strongs_shared_by_multiple_lemmas": shared_strongs_count,
            "lost_distinct_entries_in_pbv": extra_entries_from_shared_strongs,
            "explanation": (
                "PBV keyed lemma_stats on PRIMARY KEY(corpus_id, lemma_key) where lemma_key=strongs_id. "
                "Because 606 Strong's numbers in BHS map to multiple distinct Hebrew lemmas, PBV collapsed "
                "797 distinct lemmas into a single row each. Exactly 7,294 (PBV) + 797 (collapsed) = 8,091 (BLE)."
            ),
        },
        "strongs": {
            "ble_with_strongs": len(ble_bhs_strongs),
            "pbv_with_strongs": len(pbv_he_strongs),
            "strongs_id_overlap": len(he_strongs_overlap),
            "ble_without_strongs": len(ble_bhs) - sum(ble_bhs_strongs_counts.values()),
            "pbv_without_strongs": sum(1 for r in pbv_he_rows if not r[0].startswith("H")),
        },
        "lemma_matching": {
            "exact_pointed_overlap": len(set(ble_bhs_exact.keys()) & set(pbv_he_exact.keys())),
            "consonantal_stripped_overlap": len(set(ble_bhs_stripped.keys()) & set(pbv_he_stripped.keys())),
        },
    }

    # 6. Secondary Greek Corpora (Philo & Apostolic Fathers)
    print("Auditing Philo and Apostolic Fathers...")
    secondary_stats: Dict[str, Any] = {}
    if PHILO_DB_PATH.exists():
        p_conn = sqlite3.connect(PHILO_DB_PATH)
        p_cur = p_conn.cursor()
        p_cur.execute("SELECT COUNT(*), SUM(total_count) FROM lemma_stats WHERE corpus_id = 'grc'")
        p_row = p_cur.fetchone()
        secondary_stats["philo"] = {
            "corpus_id": "grc",
            "unique_lemmas": p_row[0],
            "total_tokens": p_row[1],
        }
    if AF_DB_PATH.exists():
        af_conn = sqlite3.connect(AF_DB_PATH)
        af_cur = af_conn.cursor()
        af_cur.execute("SELECT COUNT(*), SUM(total_count) FROM lemma_stats WHERE corpus_id = 'lake_grc'")
        af_row = af_cur.fetchone()
        secondary_stats["apostolic_fathers"] = {
            "corpus_id": "lake_grc",
            "unique_lemmas": af_row[0],
            "total_tokens": af_row[1],
        }
    report["secondary_corpora"] = secondary_stats

    # 7. Cross-Corpus Greek Overlap (LXX, NT, Philo, AF)
    print("Computing Cross-Corpus Greek Overlap...")
    # Using stripped Greek lemmas to bridge diacritic differences
    lxx_set = set(ble_lemmas_stripped.keys())
    nt_set = set(ble_nt_stripped.keys())
    
    # Load Philo stripped lemmas
    philo_set: Set[str] = set()
    if PHILO_DB_PATH.exists():
        p_conn = sqlite3.connect(PHILO_DB_PATH)
        p_cur = p_conn.cursor()
        p_cur.execute("SELECT normalized_lemma FROM lemma_stats WHERE corpus_id = 'grc'")
        philo_set = set(strip_greek_accents(r[0]) for r in p_cur.fetchall())

    af_set: Set[str] = set()
    if AF_DB_PATH.exists():
        af_conn = sqlite3.connect(AF_DB_PATH)
        af_cur = af_conn.cursor()
        af_cur.execute("SELECT normalized_lemma FROM lemma_stats WHERE corpus_id = 'lake_grc'")
        af_set = set(strip_greek_accents(r[0]) for r in af_cur.fetchall())

    all_greek_lemmas = lxx_set | nt_set | philo_set | af_set
    in_both_lxx_and_nt = lxx_set & nt_set
    in_all_four = lxx_set & nt_set & philo_set & af_set

    report["cross_corpus_greek"] = {
        "total_distinct_greek_lemmas_across_suite": len(all_greek_lemmas),
        "lxx_lemmas": len(lxx_set),
        "nt_lemmas": len(nt_set),
        "philo_lemmas": len(philo_set),
        "af_lemmas": len(af_set),
        "in_both_lxx_and_nt": len(in_both_lxx_and_nt),
        "pct_of_nt_appearing_in_lxx": round(len(in_both_lxx_and_nt) / len(nt_set) * 100, 2),
        "in_all_four_corpora": len(in_all_four),
    }

    return report

if __name__ == "__main__":
    rep = run_audit()
    out_file = REPO_ROOT / "docs/reports/lemma_inventory_audit.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(rep, f, indent=2, ensure_ascii=False)
    print(f"\nAudit complete! Written to {out_file}")
