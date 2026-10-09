"""Stage 6: Pre-indexing text search and concordance mapping."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from .config import Manifest, BUILD_DIR


def strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text).lower().replace("ς", "σ")


def normalize_lemma_accents(text: str) -> str:
    if not text:
        return ""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0300", "\u0301"))


def run_stage6(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage1_file = BUILD_DIR / "stage1" / work_id / f"{work_id}.json"
    stage4_file = BUILD_DIR / "stage4" / work_id / "morph_map.json"

    if not stage1_file.exists():
        from .stage1_niese import run_stage1
        run_stage1(manifest)

    with open(stage1_file, "r", encoding="utf-8") as f:
        work_data = json.load(f)

    morph_map = {}
    if stage4_file.exists():
        with open(stage4_file, "r", encoding="utf-8") as f:
            morph_map = json.load(f)

    print(f"[Stage 6] Building search concordance index for {work_id}...")

    concordance = {}  # lemma_norm -> list of occurrences

    for book in work_data.get("books", []):
        b_num = book.get("book", 1)
        for sec in book.get("sections", []):
            sec_ref = sec.get("niese", "")
            grc_text = sec.get("grc", "")
            words = re.findall(r"[\w\u0370-\u03FF\u1F00-\u1FFF]+", grc_text)

            for w in words:
                info = morph_map.get(w, {})
                raw_lemma = info.get("lemma", w)
                lemma = normalize_lemma_accents(raw_lemma)
                lemma_norm = info.get("lemma_norm") or strip_accents(lemma)

                if lemma_norm not in concordance:
                    concordance[lemma_norm] = {
                        "lemma": lemma,
                        "occurrences": []
                    }

                concordance[lemma_norm]["occurrences"].append({
                    "work": work_id,
                    "book": b_num,
                    "sec": sec_ref,
                    "word": w
                })

    out_dir = BUILD_DIR / "stage6" / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "concordance.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(concordance, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 6] {work_id}: {len(concordance):,} lemmata indexed for search.")
    return concordance
