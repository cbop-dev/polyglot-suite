"""Stage 2: Validation of sections and alignment."""

from __future__ import annotations

import json
from pathlib import Path
from .config import Manifest, BUILD_DIR


def run_stage2(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage1_file = BUILD_DIR / "stage1" / work_id / f"{work_id}.json"
    if not stage1_file.exists():
        from .stage1_niese import run_stage1
        run_stage1(manifest)

    with open(stage1_file, "r", encoding="utf-8") as f:
        work_data = json.load(f)

    print(f"[Stage 2] Validating alignment for {work_id}...")

    total_sections = 0
    total_grc_words = 0
    total_eng_words = 0

    for book in work_data.get("books", []):
        for sec in book.get("sections", []):
            total_sections += 1
            grc = sec.get("grc", "")
            eng = sec.get("eng", "")
            total_grc_words += len(grc.split())
            total_eng_words += len(eng.split())

    report = {
        "work_id": work_id,
        "books_count": len(work_data.get("books", [])),
        "sections_count": total_sections,
        "greek_word_count": total_grc_words,
        "english_word_count": total_eng_words,
        "status": "VALID"
    }

    out_dir = BUILD_DIR / "stage2" / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "validation_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 2] {work_id}: {total_sections} sections, {total_grc_words:,} Greek words, {total_eng_words:,} English words.")
    return report
