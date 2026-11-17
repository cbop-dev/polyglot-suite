"""Polyglot Bible Reader - Modern Greek Neophytos Vamvas (1850) Adapter.

Ingests the Modern Greek translation by Neophytos Vamvas (1850, Katharevousa)
from upstream scrollmapper/bible_databases clean JSON format.
66 canonical books, accented Modern Greek typography, standard Protestant versification.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Iterator, Optional

from .base import BaseAdapter, VerseUnit
from ..config import PIPELINE_DIR, CACHE_DIR, BOOK_ALIASES, resolve_canonical_book
from ..tvtms import TVTMSResolver, load_tvtms


class VamvasAdapter(BaseAdapter):
    corpus_id = "vamvas"
    version = "Vamvas"
    short_title = "Vamvas Greek 1850"
    title = "Modern Greek Bible (Neophytos Vamvas 1850)"
    language = "ell"
    direction = "ltr"
    category = "bible"
    default_scheme = "ENG"

    def __init__(
        self,
        json_path: Optional[Path] = None,
        tvtms: Optional[TVTMSResolver] = None
    ):
        self.json_path = json_path or (CACHE_DIR / "GreVamvas.json")
        self.tvtms = tvtms or load_tvtms()

    def iter_verses(self) -> Iterator[VerseUnit]:
        if not self.json_path.exists():
            raise FileNotFoundError(f"Vamvas JSON source file not found at {self.json_path}")

        print(f"Reading Modern Greek Vamvas Bible from JSON: {self.json_path}")
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        books = data.get("books", [])
        print(f"Ingesting {len(books)} books from Vamvas Modern Greek...")

        for b_entry in books:
            raw_name = b_entry.get("name", "").strip()
            book_code = BOOK_ALIASES.get(raw_name.lower()) or resolve_canonical_book(raw_name) or raw_name.upper()

            for ch_entry in b_entry.get("chapters", []):
                ch_num = int(ch_entry.get("chapter", 0))

                for v_entry in ch_entry.get("verses", []):
                    v_num = int(v_entry.get("verse", 0))
                    text = v_entry.get("text", "").strip()
                    if not text:
                        continue

                    # Vamvas adheres 1:1 to the English/Protestant versification tradition
                    ref = self.tvtms.resolve_to_standard("ENG", book_code, ch_num, v_num)

                    yield VerseUnit(
                        corpus_id=self.corpus_id,
                        std_book=ref.book,
                        std_chapter=ref.chapter,
                        std_verse=ref.verse,
                        std_subverse=ref.subverse,
                        native_book=book_code,
                        native_chapter=ch_num,
                        native_verse=v_num,
                        native_subverse="",
                        native_citation=f"{book_code} {ch_num}:{v_num}",
                        text=text,
                        tokens=None,
                    )
