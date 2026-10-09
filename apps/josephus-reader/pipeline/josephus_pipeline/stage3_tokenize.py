"""Stage 3: Tokenization of Greek and English texts."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from .config import Manifest, BUILD_DIR

TOKEN_RE = re.compile(r"[\w\u0370-\u03FF\u1F00-\u1FFF]+")


def strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text).lower().replace("ς", "σ")


def run_stage3(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage1_file = BUILD_DIR / "stage1" / work_id / f"{work_id}.json"
    if not stage1_file.exists():
        from .stage1_niese import run_stage1
        run_stage1(manifest)

    with open(stage1_file, "r", encoding="utf-8") as f:
        work_data = json.load(f)

    print(f"[Stage 3] Tokenizing Greek text for {work_id}...")

    unique_tokens = set()
    token_occurrences = []

    for book in work_data.get("books", []):
        b_num = book.get("book", 1)
        for sec in book.get("sections", []):
            sec_ref = sec.get("niese", "")
            grc_text = sec.get("grc", "")
            words = TOKEN_RE.findall(grc_text)
            for pos, word in enumerate(words):
                unique_tokens.add(word)
                token_occurrences.append({
                    "word": word,
                    "norm": strip_accents(word),
                    "book": b_num,
                    "sec": sec_ref,
                    "pos": pos
                })

    out_dir = BUILD_DIR / "stage3" / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "tokens.json"

    token_data = {
        "work_id": work_id,
        "unique_word_count": len(unique_tokens),
        "total_token_count": len(token_occurrences),
        "tokens": list(unique_tokens)
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(token_data, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 3] {work_id}: {len(token_occurrences):,} tokens ({len(unique_tokens):,} unique).")
    return token_data
