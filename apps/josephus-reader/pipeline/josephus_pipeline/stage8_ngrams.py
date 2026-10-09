"""Stage 8: Build Corpus-wide N-grams and Lemmata Index."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from .config import BUILD_DIR, REPO_ROOT


def normalize_lemma_accents(text: str) -> str:
    if not text:
        return ""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0300", "\u0301"))


def sanitize_slug(slug: str) -> str:
    # Remove percent signs, slashes, and control chars that break URL decoding
    clean = re.sub(r'[%/\\]+', '', slug).strip()
    return clean if clean else "form"


def run_stage8():
    print("[Stage 8] Building corpus-wide lemmata index and phrase n-grams...")

    all_concordance = {}
    stage6_dir = BUILD_DIR / "stage6"

    if stage6_dir.exists():
        for work_dir in stage6_dir.iterdir():
            if work_dir.is_dir():
                conc_file = work_dir / "concordance.json"
                if conc_file.exists():
                    with open(conc_file, "r", encoding="utf-8") as f:
                        conc_data = json.load(f)

                    for raw_lemma, entry in conc_data.items():
                        clean_key = sanitize_slug(raw_lemma)
                        if clean_key not in all_concordance:
                            all_concordance[clean_key] = {
                                "lemma": normalize_lemma_accents(entry.get("lemma", clean_key)),
                                "occurrences": []
                            }
                        all_concordance[clean_key]["occurrences"].extend(entry.get("occurrences", []))

    targets = [
        REPO_ROOT / "app" / "public" / "data" / "lemmata",
        REPO_ROOT / "static" / "data" / "lemmata"
    ]

    for target in targets:
        target.mkdir(parents=True, exist_ok=True)
        index_file = target / "_index.json"

        summary_index = {}
        for k, v in all_concordance.items():
            summary_index[k] = {
                "lemma": normalize_lemma_accents(v["lemma"]),
                "count": len(v["occurrences"])
            }

        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(summary_index, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 8] Emitted sanitized lemmata index with {len(all_concordance):,} entries.")
