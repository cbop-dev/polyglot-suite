"""Mine discrepancies between Swete pipeline predictions and reference oracle.

Differentiates between systematic citation conventions (handled by lexical_canon.py)
and true morphological misclassifications, ranking true errors by corpus frequency.

Usage:
  python -m pipeline.mine_discrepancies --books Ruth,Jonah,Gen,Exod,1Kgdms,Ps,Prov,Isa
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from pipeline.benchmark_oracle import BOOK_ALIAS_MAP, BOOK_TO_ORACLE_FILE, load_oracle_book, strip_accents
from pipeline.swete_morphology.lexical_canon import are_lexically_equivalent

REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = REPO_ROOT / "pipeline" / "build"
RESOLVED_TOKENS_FILE = BUILD_DIR / "swete_resolved_tokens.json"


def mine(books: list[str], min_count: int = 2):
    if not RESOLVED_TOKENS_FILE.exists():
        print(f"Error: {RESOLVED_TOKENS_FILE} not found. Run stages 1-5 first.")
        sys.exit(1)

    print(f"Loading resolved tokens from {RESOLVED_TOKENS_FILE}...")
    with open(RESOLVED_TOKENS_FILE, "r", encoding="utf-8") as f:
        tokens = json.load(f)

    swete_by_book = defaultdict(lambda: defaultdict(list))
    for t in tokens:
        b = t["book"]
        canon_b = BOOK_ALIAS_MAP.get(b, b)
        c = str(t["chapter"])
        v = str(t["verse"])
        ref = f"{canon_b} {c}:{v}"
        swete_by_book[canon_b][ref].append(t)

    target_books = list(BOOK_TO_ORACLE_FILE.keys()) if "all" in [b.lower() for b in books] else books

    true_errors = Counter()
    true_error_examples = defaultdict(list)
    lexical_variants = Counter()
    exact_count = 0
    plain_count = 0
    equiv_count = 0
    total_aligned = 0

    for b in target_books:
        canon_b = BOOK_ALIAS_MAP.get(b, b)
        s_verses = swete_by_book.get(canon_b, {})
        o_verses = load_oracle_book(canon_b)
        if not s_verses or not o_verses:
            continue

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
                        total_aligned += 1
                        st = s_toks[i1 + k]
                        ot = o_toks[j1 + k]

                        s_lem = st["lemma"]
                        o_lem = ot.get("lemma", "")

                        if s_lem == o_lem:
                            exact_count += 1
                            plain_count += 1
                            equiv_count += 1
                        elif strip_accents(s_lem) == strip_accents(o_lem):
                            plain_count += 1
                            equiv_count += 1
                        elif are_lexically_equivalent(s_lem, o_lem):
                            equiv_count += 1
                            lexical_variants[(st["surface"], s_lem, o_lem)] += 1
                        else:
                            pair = (st["surface"], s_lem, o_lem)
                            true_errors[pair] += 1
                            if len(true_error_examples[pair]) < 3:
                                true_error_examples[pair].append(ref)

    print(f"\nEvaluation Across {len(target_books)} Books:")
    print(f"Total Aligned Tokens: {total_aligned:,}")
    print(f"  Exact Lemma Match      : {exact_count:6,d} ({exact_count / total_aligned * 100:.2f}%)")
    print(f"  Plain Lemma Match      : {plain_count:6,d} ({plain_count / total_aligned * 100:.2f}%)")
    print(f"  Equivalent Match (Tier 3): {equiv_count:6,d} ({equiv_count / total_aligned * 100:.2f}%)")
    print(f"  Remaining True Discrepancies: {total_aligned - equiv_count:,} ({(total_aligned - equiv_count) / total_aligned * 100:.2f}%)")

    print(f"\nTop Lexicographical Variants (Resolved by lexical_canon):")
    print("-" * 75)
    for (surf, s_lem, o_lem), count in lexical_variants.most_common(15):
        print(f"  {surf:<15} | {s_lem:<15} | {o_lem:<15} | {count:4d}")

    print(f"\nTop True Errors to Target (Frequency >= {min_count}):")
    print("-" * 80)
    print(f"{'Surface':<15} | {'Swete Lemma':<15} | {'Oracle Target':<15} | {'Count':<5} | {'Sample Refs'}")
    print("-" * 80)
    for (surf, s_lem, o_lem), count in true_errors.most_common():
        if count < min_count:
            break
        refs = ", ".join(true_error_examples[(surf, s_lem, o_lem)])
        print(f"{surf:<15} | {s_lem:<15} | {o_lem:<15} | {count:<5} | {refs}")


def main():
    parser = argparse.ArgumentParser(description="Mine discrepancies between Swete pipeline and reference oracle.")
    parser.add_argument("--books", type=str, default="Ruth,Jonah,Gen,Exod,1Kgdms,Ps,Prov,Isa", help="Comma-separated books or 'all'")
    parser.add_argument("--min-count", type=int, default=3, help="Minimum error frequency to display")
    args = parser.parse_args()

    books = [b.strip() for b in args.books.split(",")]
    mine(books, min_count=args.min_count)


if __name__ == "__main__":
    main()
