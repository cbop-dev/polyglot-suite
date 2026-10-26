"""Offline benchmark tool to evaluate Swete pipeline predictions against OpenScriptorium oracle.

Usage:
  python -m pipeline.benchmark_oracle --books Ruth,Jonah,Gen
  python -m pipeline.benchmark_oracle --books all
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
import os
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from pipeline.swete_morphology.lexical_canon import are_lexically_equivalent

REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = REPO_ROOT / "pipeline" / "build"
RESOLVED_TOKENS_FILE = BUILD_DIR / "swete_resolved_tokens.json"
ORACLE_DIR = Path(os.environ.get("LXX_ORACLE_DIR", "/home/cbrannan/.gemini/antigravity/brain/b3241914-adc5-4494-b0ca-0ff130a25a70/scratch/lxx-morph/db/seeds/lxx_morph"))

BOOK_TO_ORACLE_FILE = {
    "Gen": "genesis.json",
    "Exod": "exodus.json",
    "Lev": "leviticus.json",
    "Num": "numbers.json",
    "Deut": "deuteronomy.json",
    "Josh": "joshua-vaticanus-b.json",
    "Judg": "judges.json",
    "Ruth": "ruth.json",
    "1Kgdms": "1-samuel.json",
    "2Kgdms": "2-samuel.json",
    "3Kgdms": "1-kings.json",
    "4Kgdms": "2-kings.json",
    "1Chr": "1-chronicles.json",
    "2Chr": "2-chronicles.json",
    "1Esdr": "1-esdras.json",
    "2Esdr": "2-esdras.json",
    "Esth": "esther-greek.json",
    "Jdt": "judith.json",
    "TobBA": "tobit.json",
    "TobS": "tobit-sinaiticus.json",
    "1Mac": "1-maccabees.json",
    "2Mac": "2-maccabees.json",
    "3Mac": "3-maccabees.json",
    "4Mac": "4-maccabees.json",
    "Ps": "psalms-lxx.json",
    "Od": "odes.json",
    "Prov": "proverbs.json",
    "Qoh": "ecclesiastes.json",
    "Cant": "song-of-solomon.json",
    "Job": "job-lxx.json",
    "Wis": "wisdom.json",
    "Sir": "sirach.json",
    "PsSol": "psalms-of-solomon.json",
    "Hos": "hosea.json",
    "Mic": "micah.json",
    "Amos": "amos.json",
    "Joel": "joel.json",
    "Jonah": "jonah.json",
    "Obad": "obadiah.json",
    "Nah": "nahum.json",
    "Hab": "habakkuk.json",
    "Zeph": "zephaniah.json",
    "Hag": "haggai.json",
    "Zech": "zechariah.json",
    "Mal": "malachi.json",
    "Isa": "isaiah.json",
    "Jer": "jeremiah-lxx.json",
    "Bar": "baruch.json",
    "EpJer": "letter-of-jeremiah.json",
    "Lam": "lamentations.json",
    "Ezek": "ezekiel.json",
    "Bel": "bel-and-the-dragon.json",
    "BelTh": "bel-and-the-dragon-theodotion.json",
    "Dan": "daniel.json",
    "DanTh": "daniel-theodotion.json",
    "Sus": "susanna.json",
    "SusTh": "susanna-theodotion.json",
}

# Book abbrev alias mapping
BOOK_ALIAS_MAP = {
    "1Sam": "1Kgdms",
    "2Sam": "2Kgdms",
    "1Kgs": "3Kgdms",
    "2Kgs": "4Kgdms",
    "Ezra": "2Esdr",
    "Neh": "2Esdr",
}


def strip_accents(s: str) -> str:
    if not s:
        return ""
    norm = unicodedata.normalize("NFKD", s)
    clean = "".join(c for c in norm if not unicodedata.combining(c) and c != "ͅ" and c != "\u0345")
    return unicodedata.normalize("NFC", clean).lower().replace("ς", "σ")


def load_oracle_book(book_abbrev: str) -> dict[str, list[dict]]:
    canon_abbrev = BOOK_ALIAS_MAP.get(book_abbrev, book_abbrev)
    fname = BOOK_TO_ORACLE_FILE.get(canon_abbrev)
    if not fname:
        return {}
    fpath = ORACLE_DIR / fname
    if not fpath.exists():
        return {}

    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)

    verses = {}
    for v_obj in data:
        ref = v_obj.get("ref", "")
        # Normalize ref to canonical book name: e.g. "1 Sam 1:1" -> "1Kgdms 1:1"
        parts = ref.split()
        if len(parts) >= 2:
            b = parts[0]
            if len(parts) == 3 and parts[0].isdigit():
                b = f"{parts[0]}{parts[1]}"
                cv = parts[2]
            else:
                cv = parts[-1]
            b_norm = BOOK_ALIAS_MAP.get(b, b)
            norm_ref = f"{b_norm} {cv}"
        else:
            norm_ref = ref

        verses[norm_ref] = v_obj.get("words", [])
    return verses


def benchmark(books: list[str], top_n: int = 25):
    if not RESOLVED_TOKENS_FILE.exists():
        print(f"Error: {RESOLVED_TOKENS_FILE} not found. Run stages 1-5 first.")
        sys.exit(1)

    print(f"Loading resolved Swete tokens from {RESOLVED_TOKENS_FILE}...")
    with open(RESOLVED_TOKENS_FILE, "r", encoding="utf-8") as f:
        swete_tokens = json.load(f)

    # Group Swete tokens by book and ref
    swete_by_book = defaultdict(lambda: defaultdict(list))
    for t in swete_tokens:
        b = t["book"]
        canon_b = BOOK_ALIAS_MAP.get(b, b)
        c = str(t["chapter"])
        v = str(t["verse"])
        ref = f"{canon_b} {c}:{v}"
        swete_by_book[canon_b][ref].append(t)

    target_books = list(BOOK_TO_ORACLE_FILE.keys()) if "all" in [b.lower() for b in books] else books


    overall_swete_tokens = 0
    overall_aligned_tokens = 0
    overall_exact_lemma = 0
    overall_plain_lemma = 0
    overall_equiv_lemma = 0
    overall_discrepancies = Counter()
    category_counter = Counter()

    print(f"\nEvaluating {len(target_books)} book(s)...")
    print("-" * 95)
    print(f"{'Book':<8} | {'Swete':<7} | {'Aligned':<7} | {'Exact Lemma (T1)':<17} | {'Plain Lemma (T2)':<17} | {'Equivalent (T3)':<17}")
    print("-" * 95)

    for b in target_books:
        canon_b = BOOK_ALIAS_MAP.get(b, b)
        s_verses = swete_by_book.get(canon_b)
        if not s_verses:
            continue

        o_verses = load_oracle_book(canon_b)
        if not o_verses:
            continue

        b_swete_count = sum(len(toks) for toks in s_verses.values())
        b_aligned = 0
        b_exact_lemma = 0
        b_plain_lemma = 0
        b_equiv_lemma = 0

        for ref, s_toks in s_verses.items():
            if ref not in o_verses:
                continue
            o_toks = o_verses[ref]

            s_surfs = [strip_accents(t["surface"]) for t in s_toks]
            o_surfs = [strip_accents(t.get("surface", "")) for t in o_toks]

            sm = SequenceMatcher(None, s_surfs, o_surfs)
            for tag, i1, i2, j1, j2 in sm.get_opcodes():
                if tag == "equal":
                    for k in range(i2 - i1):
                        st = s_toks[i1 + k]
                        ot = o_toks[j1 + k]
                        b_aligned += 1

                        s_lem = st["lemma"]
                        o_lem = ot.get("lemma", "")
                        s_norm = strip_accents(s_lem)
                        o_norm = strip_accents(o_lem)

                        is_exact = (s_lem == o_lem)
                        is_plain = (s_norm == o_norm)
                        is_equiv = is_plain or are_lexically_equivalent(s_lem, o_lem)

                        if is_exact:
                            b_exact_lemma += 1
                        if is_plain:
                            b_plain_lemma += 1
                        if is_equiv:
                            b_equiv_lemma += 1
                        else:
                            pair = (st["surface"], s_lem, o_lem)
                            overall_discrepancies[pair] += 1

                            # Categorize discrepancy
                            if s_lem and s_lem[0].isupper() and o_lem and not o_lem[0].isupper():
                                category_counter["swete_capitalized_proper_noun_false_pos"] += 1
                            elif (s_lem.endswith("ω") and o_lem.endswith("ομαι")) or (s_lem.endswith("ομαι") and o_lem.endswith("ω")):
                                category_counter["deponent_verb_active_middle_diff"] += 1
                            elif s_lem in ("ὁ", "ὅς", "οὗτος", "αὐτός", "τίς", "τις") or o_lem in ("ὁ", "ὅς", "οὗτος", "αὐτός", "τίς", "τις"):
                                category_counter["pronoun_article_distinction"] += 1
                            else:
                                category_counter["lexical_or_morphological_error"] += 1

        overall_swete_tokens += b_swete_count
        overall_aligned_tokens += b_aligned
        overall_exact_lemma += b_exact_lemma
        overall_plain_lemma += b_plain_lemma
        overall_equiv_lemma += b_equiv_lemma

        exact_pct = (b_exact_lemma / b_aligned * 100) if b_aligned else 0
        plain_pct = (b_plain_lemma / b_aligned * 100) if b_aligned else 0
        equiv_pct = (b_equiv_lemma / b_aligned * 100) if b_aligned else 0
        align_pct = (b_aligned / b_swete_count * 100) if b_swete_count else 0

        print(f"{canon_b:<8} | {b_swete_count:<7} | {b_aligned:<7} ({align_pct:.1f}%) | {b_exact_lemma:<5} ({exact_pct:.2f}%) | {b_plain_lemma:<5} ({plain_pct:.2f}%) | {b_equiv_lemma:<5} ({equiv_pct:.2f}%)")

    print("-" * 95)
    tot_exact_pct = (overall_exact_lemma / overall_aligned_tokens * 100) if overall_aligned_tokens else 0
    tot_plain_pct = (overall_plain_lemma / overall_aligned_tokens * 100) if overall_aligned_tokens else 0
    tot_equiv_pct = (overall_equiv_lemma / overall_aligned_tokens * 100) if overall_aligned_tokens else 0
    tot_align_pct = (overall_aligned_tokens / overall_swete_tokens * 100) if overall_swete_tokens else 0
    print(f"{'TOTAL':<8} | {overall_swete_tokens:<7} | {overall_aligned_tokens:<7} ({tot_align_pct:.1f}%) | {overall_exact_lemma:<5} ({tot_exact_pct:.2f}%) | {overall_plain_lemma:<5} ({tot_plain_pct:.2f}%) | {overall_equiv_lemma:<5} ({tot_equiv_pct:.2f}%)")

    print("\nRemaining Discrepancy Breakdown:")
    total_disc = sum(category_counter.values())
    for cat, count in category_counter.most_common():
        print(f"  {cat:<45}: {count:6d} ({count / total_disc * 100:.1f}%)")

    print(f"\nTop {top_n} Discrepancy Patterns (Surface | Swete Lemma | Oracle Lemma | Frequency):")
    print("-" * 95)
    for (surf, s_lem, o_lem), count in overall_discrepancies.most_common(top_n):
        print(f"  {surf:<18} | {s_lem:<18} | {o_lem:<18} | {count:4d}")



def main():
    parser = argparse.ArgumentParser(description="Benchmark Swete pipeline against OpenScriptorium oracle.")
    parser.add_argument("--books", type=str, default="Ruth,Jonah,Gen", help="Comma-separated books or 'all'")
    parser.add_argument("--top-errors", type=int, default=25, help="Number of top error patterns to print")
    args = parser.parse_args()

    book_list = [b.strip() for b in args.books.split(",")]
    benchmark(book_list, top_n=args.top_errors)


if __name__ == "__main__":
    main()
