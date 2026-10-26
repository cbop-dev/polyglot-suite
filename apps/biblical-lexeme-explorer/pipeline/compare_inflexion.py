"""Compare Swete pipeline lemmatization against James Tauber's greek-inflexion.

Tests on three chapters: Genesis 18, Psalm 17 (LXX), Isaiah 49.

Data source:
  pipeline/build/swete_resolved_tokens.json  (Swete 1930, resolved by Stanza + rules)

greek-inflexion source:
  GREEK_INFLEXION_DIR env var, or ~/greek-inflexion, or /tmp/greek-inflexion
  Uses lxx_lexicon.yaml merged with morphgnt_lexicon.yaml (lxx takes priority).

Usage:
  python3.13 -m pipeline.compare_inflexion
  python3.13 -m pipeline.compare_inflexion --possible-stems
  python3.13 -m pipeline.compare_inflexion --gi-dir /path/to/greek-inflexion
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = REPO_ROOT / "pipeline" / "build"
RESOLVED_TOKENS_FILE = BUILD_DIR / "swete_resolved_tokens.json"
REPORT_FILE = BUILD_DIR / "lemma_comparison_report.md"

# Test corpus: (book, chapter)
TEST_CHAPTERS = [
    ("Gen", 18),
    ("Ps", 17),
    ("Isa", 49),
]

# Sources that are rule-based closed-class assignments — skip in main comparison
SKIP_SOURCES = {
    "closed_class",
    "article_rule",
    "elided_closed_class",
    "relative_pronoun",
    "ean_override",
    "proi_override",
    "kyrios_override",   # keep as interesting, actually
    "theos_override",
}
# Actually keep kyrios/theos — they're theologically interesting cases
SKIP_SOURCES = {
    "closed_class",
    "article_rule",
    "elided_closed_class",
    "relative_pronoun",
    "ean_override",
    "proi_override",
}

# ---------------------------------------------------------------------------
# Greek normalization
# ---------------------------------------------------------------------------
OXIA_TO_TONOS = {
    0x1F71: 0x03AC, 0x1F73: 0x03AD, 0x1F75: 0x03AE, 0x1F77: 0x03AF,
    0x1F79: 0x03CC, 0x1F7B: 0x03CD, 0x1F7D: 0x03CE, 0x1FBB: 0x03AC,
    0x1FC9: 0x03AD, 0x1FCB: 0x03AE, 0x1FDB: 0x03AF, 0x1FEB: 0x03CD,
    0x1FF9: 0x03CC, 0x1FFB: 0x03CE,
}


def norm(s: str) -> str:
    """NFC normalize and convert oxia accents to tonos."""
    if not s:
        return ""
    return unicodedata.normalize("NFC", s).translate(OXIA_TO_TONOS).strip()


def strip_accents(s: str) -> str:
    """Lowercase unaccented form for loose matching."""
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFKD", s)
    plain = "".join(c for c in nfkd if not unicodedata.combining(c))
    return plain.lower().replace("ς", "σ")


def clean_surface(s: str) -> str:
    """Strip punctuation from a surface form before passing to GI."""
    s = norm(s)
    # Remove leading/trailing punctuation (period, comma, semicolon, raised dot, etc.)
    s = re.sub(r"^[\s\·\.\,\;\:\!\?\·\·]+|[\s\·\.\,\;\:\!\?\·\·]+$", "", s)
    return s


# ---------------------------------------------------------------------------
# Load greek-inflexion
# ---------------------------------------------------------------------------

def find_gi_dir() -> Optional[Path]:
    """Find the greek-inflexion repository directory."""
    candidates = [
        os.environ.get("GREEK_INFLEXION_DIR", ""),
        os.path.expanduser("~/greek-inflexion"),
        "/tmp/greek-inflexion",
    ]
    for c in candidates:
        p = Path(c)
        if p.exists() and (p / "greek_inflexion.py").exists():
            return p
    return None


def load_gi(gi_dir: Path, show_stems: bool = False):
    """Load GreekInflexion with a merged lxx+morphgnt lexicon."""
    import yaml

    sys.path.insert(0, str(gi_dir))
    from greek_inflexion import GreekInflexion  # type: ignore

    stemming_yaml = gi_dir / "stemming.yaml"
    lxx_yaml = gi_dir / "STEM_DATA" / "lxx_lexicon.yaml"
    mgnt_yaml = gi_dir / "STEM_DATA" / "morphgnt_lexicon.yaml"

    with open(lxx_yaml, encoding="utf-8") as f:
        lxx_data = yaml.safe_load(f) or {}
    with open(mgnt_yaml, encoding="utf-8") as f:
        mgnt_data = yaml.safe_load(f) or {}

    # Merge: lxx_lexicon takes priority over morphgnt_lexicon
    combined = {**mgnt_data, **lxx_data}

    # Write combined to temp file (GreekInflexion takes a file path)
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".yaml", delete=False, encoding="utf-8"
    )
    yaml.dump(combined, tmp, allow_unicode=True, default_flow_style=False)
    tmp.close()

    gi = GreekInflexion(str(stemming_yaml), tmp.name)
    os.unlink(tmp.name)

    lxx_count = len(lxx_data)
    mgnt_count = len(mgnt_data)
    merged_count = len(combined)
    print(
        f"Loaded GreekInflexion: lxx_lexicon={lxx_count} lemmas, "
        f"morphgnt_lexicon={mgnt_count} lemmas, merged={merged_count} lemmas "
        f"(lxx priority)"
    )
    return gi


# ---------------------------------------------------------------------------
# Comparison categories
# ---------------------------------------------------------------------------
SKIP = "SKIP"
EXACT = "EXACT"
CANDIDATE = "CANDIDATE"
NO_PARSE = "NO_PARSE"
DISAGREE = "DISAGREE"

CATEGORY_ORDER = [EXACT, CANDIDATE, DISAGREE, NO_PARSE, SKIP]

POS_NAMES = {
    0: "ADJ", 1: "CONJ", 2: "ADV", 3: "INTJ", 4: "NOUN",
    5: "PREP", 6: "ART", 7: "DEM", 8: "INTER", 9: "PRON",
    10: "RELA", 11: "VERB", 12: "PART", 13: "PROP", 14: "NUM",
    15: "UNK", 16: "PRON",
}


def categorize(token: dict, gi, include_possible: bool) -> tuple[str, list, list]:
    """
    Return (category, gi_lemmas, possible_stems_info).
    possible_stems_info is populated only when include_possible=True and category=NO_PARSE.
    """
    source = token.get("source", "")
    if source in SKIP_SOURCES:
        return SKIP, [], []

    surface = clean_surface(token.get("surface", ""))
    if not surface:
        return SKIP, [], []

    our_lemma_norm = norm(token.get("lemma", ""))
    our_lemma_plain = strip_accents(our_lemma_norm)

    result = gi.parse(norm(surface))
    gi_lemmas = sorted({r[0] for r in result})

    if not gi_lemmas:
        poss = []
        if include_possible:
            try:
                poss = list(gi.possible_stems(norm(surface)))[:6]
            except Exception:
                pass
        return NO_PARSE, [], poss

    gi_lemmas_norm = [norm(l) for l in gi_lemmas]
    gi_lemmas_plain = [strip_accents(l) for l in gi_lemmas_norm]

    # Exact match (normalized)
    if our_lemma_norm in gi_lemmas_norm:
        return EXACT, gi_lemmas, []

    # Plain match (accent-stripped)
    if our_lemma_plain in gi_lemmas_plain:
        return CANDIDATE, gi_lemmas, []

    # No match at all
    return DISAGREE, gi_lemmas, []


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def pct(n: int, total: int) -> str:
    if total == 0:
        return "—"
    return f"{n / total * 100:.1f}%"


def build_report(
    all_results: list[dict],
    chapter_labels: list[str],
) -> str:
    lines = []
    lines.append("# Greek Lemmatizer Comparison: Swete Pipeline vs. `greek-inflexion`")
    lines.append("")
    lines.append(
        "**System A** — Swete 1930 multi-stage pipeline: Stanza `grc_proiel` neural tagger "
        "with proper-name gazetteer, CenterBLC Text-Fabric fallbacks, and lexical override rules."
    )
    lines.append("")
    lines.append(
        "**System B** — James Tauber's `greek-inflexion`: rule-based inflection table parser "
        "with merged `lxx_lexicon.yaml` + `morphgnt_lexicon.yaml` (LXX takes priority)."
    )
    lines.append("")
    lines.append(
        "**Reference for comparison**: System A's resolved lemmas serve as the baseline. "
        "Categories measure agreement between the two systems."
    )
    lines.append("")
    lines.append("---")
    lines.append("")

    # ---- Per-chapter summaries ----
    lines.append("## Per-Chapter Summary")
    lines.append("")
    lines.append(
        "| Chapter | Tokens | Skipped¹ | Compared | EXACT | CANDIDATE² | DISAGREE | NO_PARSE |"
    )
    lines.append(
        "|---|---:|---:|---:|---:|---:|---:|---:|"
    )

    overall_cats: Counter = Counter()
    overall_total = 0
    overall_skip = 0

    for label, results in zip(chapter_labels, all_results):
        cats: Counter = Counter(r["category"] for r in results)
        total = len(results)
        skipped = cats[SKIP]
        compared = total - skipped
        overall_cats += cats
        overall_total += total
        overall_skip += skipped

        lines.append(
            f"| {label} | {total} | {skipped} | {compared} | "
            f"{cats[EXACT]} ({pct(cats[EXACT], compared)}) | "
            f"{cats[CANDIDATE]} ({pct(cats[CANDIDATE], compared)}) | "
            f"{cats[DISAGREE]} ({pct(cats[DISAGREE], compared)}) | "
            f"{cats[NO_PARSE]} ({pct(cats[NO_PARSE], compared)}) |"
        )

    overall_compared = overall_total - overall_skip
    lines.append(
        f"| **TOTAL** | **{overall_total}** | **{overall_skip}** | **{overall_compared}** | "
        f"**{overall_cats[EXACT]} ({pct(overall_cats[EXACT], overall_compared)})** | "
        f"**{overall_cats[CANDIDATE]} ({pct(overall_cats[CANDIDATE], overall_compared)})** | "
        f"**{overall_cats[DISAGREE]} ({pct(overall_cats[DISAGREE], overall_compared)})** | "
        f"**{overall_cats[NO_PARSE]} ({pct(overall_cats[NO_PARSE], overall_compared)})** |"
    )
    lines.append("")
    lines.append("¹ Skipped = closed-class rule tokens (prepositions, conjunctions, elided forms)")
    lines.append(
        "² CANDIDATE = `greek-inflexion` returned candidates but our lemma was not "
        "the top result; it appears somewhere in the candidate list (accent-stripped match)"
    )
    lines.append("")

    # ---- Source breakdown for non-EXACT tokens ----
    lines.append("## Source Breakdown for Non-Exact Tokens")
    lines.append("")
    lines.append(
        "Pipeline `source` tag distribution among DISAGREE and NO_PARSE tokens "
        "(shows which resolver stage produced the tokens that GI can't match):"
    )
    lines.append("")

    flat_results = [r for chapter in all_results for r in chapter]
    source_by_cat: dict[str, Counter] = defaultdict(Counter)
    for r in flat_results:
        if r["category"] in (DISAGREE, NO_PARSE):
            source_by_cat[r["category"]][r.get("source", "?")] += 1

    for cat in (DISAGREE, NO_PARSE):
        if not source_by_cat[cat]:
            continue
        lines.append(f"### {cat}")
        lines.append("")
        lines.append("| Source tag | Count |")
        lines.append("|---|---:|")
        for src, cnt in source_by_cat[cat].most_common():
            lines.append(f"| `{src}` | {cnt} |")
        lines.append("")

    # ---- POS breakdown ----
    lines.append("## POS Breakdown (Compared Tokens)")
    lines.append("")
    lines.append("| POS | EXACT | CANDIDATE | DISAGREE | NO_PARSE | Total compared |")
    lines.append("|---|---:|---:|---:|---:|---:|")

    pos_by_cat: dict[int, Counter] = defaultdict(Counter)
    for r in flat_results:
        if r["category"] != SKIP:
            pos_by_cat[r.get("pos", -1)][r["category"]] += 1

    for pos_id in sorted(pos_by_cat.keys()):
        cats = pos_by_cat[pos_id]
        total_pos = sum(cats.values())
        name = POS_NAMES.get(pos_id, f"POS{pos_id}")
        lines.append(
            f"| {name} | {cats[EXACT]} | {cats[CANDIDATE]} | "
            f"{cats[DISAGREE]} | {cats[NO_PARSE]} | {total_pos} |"
        )
    lines.append("")

    # ---- Proper noun analysis ----
    lines.append("## Proper Noun Analysis")
    lines.append("")
    proper = [r for r in flat_results if r.get("pos") == 13 and r["category"] != SKIP]
    common = [r for r in flat_results if r.get("pos") != 13 and r["category"] != SKIP]

    def mini_table(label: str, items: list) -> list[str]:
        cats = Counter(r["category"] for r in items)
        total = len(items)
        return [
            f"**{label}** ({total} tokens): "
            f"EXACT {cats[EXACT]} ({pct(cats[EXACT], total)}), "
            f"CANDIDATE {cats[CANDIDATE]} ({pct(cats[CANDIDATE], total)}), "
            f"DISAGREE {cats[DISAGREE]} ({pct(cats[DISAGREE], total)}), "
            f"NO_PARSE {cats[NO_PARSE]} ({pct(cats[NO_PARSE], total)})"
        ]

    lines.extend(mini_table("Proper nouns (POS=13)", proper))
    lines.append("")
    lines.extend(mini_table("Non-proper nouns", common))
    lines.append("")

    # ---- DISAGREE detail ----
    lines.append("## Disagreement Detail")
    lines.append("")
    lines.append(
        "Tokens where both systems produced an answer but disagreed. "
        "Sorted by our pipeline's lemma frequency (most common first)."
    )
    lines.append("")

    disagree_tokens = [r for r in flat_results if r["category"] == DISAGREE]
    # Group by (surface_norm, our_lemma, gi_lemmas_str)
    disagree_groups: Counter = Counter()
    disagree_examples: dict = {}
    for r in disagree_tokens:
        key = (norm(r["surface"]), norm(r["lemma"]), ", ".join(sorted(r["gi_lemmas"])))
        disagree_groups[key] += 1
        if key not in disagree_examples:
            disagree_examples[key] = r

    lines.append("| Surface | Our lemma (pipeline source) | GI candidates | Count | Ref |")
    lines.append("|---|---|---|---:|---|")
    for (surf, our_lem, gi_str), cnt in disagree_groups.most_common(50):
        ex = disagree_examples[(surf, our_lem, gi_str)]
        src = ex.get("source", "?")
        ref = ex.get("ref", "")
        lines.append(f"| {surf} | {our_lem} `[{src}]` | {gi_str or '—'} | {cnt} | {ref} |")
    lines.append("")

    # ---- NO_PARSE with possible_stems (if available) ----
    no_parse_tokens = [r for r in flat_results if r["category"] == NO_PARSE]
    if no_parse_tokens and any(r.get("possible_stems") for r in no_parse_tokens):
        lines.append("## No-Parse Detail (with Possible Stems)")
        lines.append("")
        lines.append(
            "Tokens where `greek-inflexion` returned no parse. "
            "`possible_stems` shows conjectured stem candidates (unverified)."
        )
        lines.append("")
        lines.append("| Surface | Our lemma | Our source | Possible stems (conjecture) | Ref |")
        lines.append("|---|---|---|---|---|")
        seen: set = set()
        for r in sorted(no_parse_tokens, key=lambda x: (x.get("pos", 99), x.get("lemma", ""))):
            key = (norm(r["surface"]), norm(r["lemma"]))
            if key in seen:
                continue
            seen.add(key)
            poss = r.get("possible_stems", [])
            poss_str = "; ".join(f"{tag}:{stem}" for tag, stem in poss[:3]) if poss else "—"
            lines.append(
                f"| {norm(r['surface'])} | {norm(r['lemma'])} | "
                f"`{r.get('source','?')}` | {poss_str} | {r.get('ref','')} |"
            )
        lines.append("")

    # ---- εἶπεν / γίγνομαι / Koine convention note ----
    lines.append("## Notes on Systematic Conventions")
    lines.append("")
    lines.append(
        "> **Suppletive lemma conventions**: Several DISAGREE and CANDIDATE cases reflect "
        "legitimate lexicographic conventions rather than errors. For example, `εἶπεν` "
        "is parsed by `greek-inflexion` as `εἶπον` (the Homeric/classical aorist lemma) "
        "while our pipeline assigns `λέγω` (the standard LXX lexical headword). Similarly, "
        "`γίγνομαι` vs. `γίνομαι` is a classical/Koine spelling variant of the same lemma. "
        "These cases inflate the DISAGREE/CANDIDATE counts without representing true errors."
    )
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Compare Swete pipeline vs. greek-inflexion")
    parser.add_argument(
        "--gi-dir",
        type=str,
        default="",
        help="Path to greek-inflexion repo (overrides auto-detect)",
    )
    parser.add_argument(
        "--possible-stems",
        action="store_true",
        help="Call possible_stems() for NO_PARSE tokens (slower)",
    )
    args = parser.parse_args()

    # 1. Find greek-inflexion
    gi_dir = Path(args.gi_dir) if args.gi_dir else find_gi_dir()
    if not gi_dir:
        print(
            "ERROR: greek-inflexion not found. Clone https://github.com/jtauber/greek-inflexion "
            "and set GREEK_INFLEXION_DIR or pass --gi-dir.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"Using greek-inflexion at: {gi_dir}")

    # 2. Load GI
    gi = load_gi(gi_dir, show_stems=args.possible_stems)

    # 3. Load resolved tokens
    if not RESOLVED_TOKENS_FILE.exists():
        print(
            f"ERROR: {RESOLVED_TOKENS_FILE} not found. Run pipeline stages 1–5 first.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"Loading resolved tokens from {RESOLVED_TOKENS_FILE} …")
    with open(RESOLVED_TOKENS_FILE, encoding="utf-8") as f:
        all_tokens: list[dict] = json.load(f)
    print(f"  Loaded {len(all_tokens):,} tokens.")

    # 4. Filter to test chapters
    chapter_labels = []
    chapter_token_lists = []
    for book, chapter in TEST_CHAPTERS:
        ch_tokens = [
            t for t in all_tokens
            if t.get("book") == book and t.get("chapter") == chapter
        ]
        label = f"{book} {chapter}"
        chapter_labels.append(label)
        chapter_token_lists.append(ch_tokens)
        print(f"  {label}: {len(ch_tokens)} tokens")

    # 5. Run comparison
    all_results: list[list[dict]] = []
    for label, tokens in zip(chapter_labels, chapter_token_lists):
        print(f"\nComparing {label} ({len(tokens)} tokens) …")
        results = []
        for t in tokens:
            cat, gi_lemmas, poss = categorize(t, gi, include_possible=args.possible_stems)
            results.append({
                **t,
                "category": cat,
                "gi_lemmas": gi_lemmas,
                "possible_stems": poss,
            })

        cats = Counter(r["category"] for r in results)
        compared = len(results) - cats[SKIP]
        print(
            f"  {label}: compared={compared} | "
            f"EXACT={cats[EXACT]} ({pct(cats[EXACT], compared)}) | "
            f"CANDIDATE={cats[CANDIDATE]} ({pct(cats[CANDIDATE], compared)}) | "
            f"DISAGREE={cats[DISAGREE]} ({pct(cats[DISAGREE], compared)}) | "
            f"NO_PARSE={cats[NO_PARSE]} ({pct(cats[NO_PARSE], compared)}) | "
            f"SKIP={cats[SKIP]}"
        )
        all_results.append(results)

    # 6. Build and write report
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    report_md = build_report(all_results, chapter_labels)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"\nReport written to {REPORT_FILE}")


if __name__ == "__main__":
    main()
