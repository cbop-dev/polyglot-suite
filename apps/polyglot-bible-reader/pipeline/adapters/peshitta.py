"""Polyglot Bible Reader - Syriac Peshitta Adapter.

Parses pre-extracted Text-Fabric Peshitta caches:
  1. peshitta_ot_raw.jsonl (Leiden Critical Edition Old Testament)
  2. peshitta_nt_raw.jsonl (SEDRA 3 / BFBS New Testament)

Resolves coordinates to the Universal Standard Hub (std_book, std_chapter, std_verse)
via TVTMS, maps tokens to canonical WordToken instances, and emits VerseUnit streams.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Iterator, Optional, List, Dict, Any

from .base import BaseAdapter, VerseUnit, WordToken
from ..config import CACHE_DIR, CANONICAL_BOOKS, CANONICAL_BOOK_CODES
from ..tvtms import TVTMSResolver, load_tvtms


class PeshittaAdapter(BaseAdapter):
    """Adapter for the Syriac Peshitta Bible (Leiden OT + SEDRA NT)."""
    corpus_id = "peshitta"
    title = "The Syriac Peshitta (Leiden OT / SEDRA NT)"

    def __init__(self, tvtms: Optional[TVTMSResolver] = None, cache_dir: Optional[Path] = None):
        self.cache_dir = cache_dir or CACHE_DIR
        self.tvtms = tvtms or load_tvtms()

    def iter_verses(self) -> Iterator[VerseUnit]:
        ot_path = self.cache_dir / "peshitta_ot_raw.jsonl"
        nt_path = self.cache_dir / "peshitta_nt_raw.jsonl"

        if not ot_path.exists() or not nt_path.exists():
            # Try running the exporter automatically
            print(f"Peshitta caches missing in {self.cache_dir}. Running export_peshitta_tf...")
            from scripts.export_peshitta_tf import export_all
            export_all()

        total_ot = 0
        total_nt = 0

        # 1. Process Old Testament (Leiden)
        print(f"PeshittaAdapter: Reading Old Testament from {ot_path.name}...")
        with open(ot_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                rec = json.loads(line)
                yield from self._process_record(rec, tradition="MT")
                total_ot += 1

        # 2. Process New Testament (SEDRA)
        print(f"PeshittaAdapter: Reading New Testament from {nt_path.name}...")
        with open(nt_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                rec = json.loads(line)
                yield from self._process_record(rec, tradition="ENG")
                total_nt += 1

        print(f"PeshittaAdapter: Emitted {total_ot:,} OT verses and {total_nt:,} NT verses.")

    def _process_record(self, rec: Dict[str, Any], tradition: str) -> Iterator[VerseUnit]:
        book_code = rec["book"]
        if book_code not in CANONICAL_BOOK_CODES:
            return

        native_ch = rec["chapter"]
        native_v = rec["verse"]
        raw_text = rec["text"]
        raw_tokens = rec.get("tokens", [])

        # TVTMS Coordinate Mapping
        # OT Peshitta aligns with MT (Hebrew) versification traditions
        # NT Peshitta aligns with standard Western/ENG versification
        std_ref = self.tvtms.resolve_to_standard(tradition, book_code, native_ch, native_v)

        native_citation = f"{book_code} {native_ch}:{native_v}"

        # Build WordToken objects
        tokens: List[WordToken] = []
        for t in raw_tokens:
            word = t.get("word", "")
            lemma = t.get("lemma")
            morph = t.get("morph")
            trailer = t.get("trailer", " ")
            extra = {}

            if "sedra_id" in t and t["sedra_id"]:
                extra["sedra_id"] = t["sedra_id"]
            if "translit" in t and t["translit"]:
                extra["translit"] = t["translit"]

            tokens.append(
                WordToken(
                    word=word,
                    lemma=lemma,
                    morph=morph,
                    trailer=trailer,
                    extra=extra
                )
            )

        yield VerseUnit(
            corpus_id=self.corpus_id,
            std_book=std_ref.book,
            std_chapter=std_ref.chapter,
            std_verse=std_ref.verse,
            std_subverse=std_ref.subverse,
            native_book=rec["raw_book"],
            native_chapter=native_ch,
            native_verse=native_v,
            native_subverse="",
            native_citation=native_citation,
            text=raw_text,
            tokens=tokens
        )
