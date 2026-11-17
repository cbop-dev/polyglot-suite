"""Polyglot Bible Reader - Douay-Rheims Bible Adapter.

Ingests the English Douay-Rheims Bible (Challoner Revision, 1899 American Edition)
from upstream eBible USFM distribution (73 books, complete Catholic canon).
Pre-aligns all verses to the Universal Hub coordinates using TVTMS (Vulgate tradition).
"""

from __future__ import annotations
import zipfile
from pathlib import Path
from typing import Iterator, Optional, List

from .base import BaseAdapter, VerseUnit, WordToken
from .usfm import parse_usfm_file
from ..config import PIPELINE_DIR, CACHE_DIR, BOOK_ALIASES, resolve_canonical_book
from ..tvtms import TVTMSResolver, load_tvtms


class DouayAdapter(BaseAdapter):
    corpus_id = "douay"
    version = "Douay"
    short_title = "Douay-Rheims"
    title = "Douay-Rheims Bible (Challoner Revision with Apocrypha)"
    language = "eng"
    direction = "ltr"
    category = "bible"
    default_scheme = "Vulgate"

    def __init__(
        self,
        source_dir: Optional[Path] = None,
        tvtms: Optional[TVTMSResolver] = None
    ):
        if source_dir is None:
            usfm_target = CACHE_DIR / "sources" / "engDRA_usfm"
            zip_target = CACHE_DIR / "engDRA_usfm.zip"

            if not usfm_target.exists() and zip_target.exists():
                print(f"Unpacking {zip_target.name} into {usfm_target}...")
                usfm_target.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(zip_target, "r") as zf:
                    for member in zf.infolist():
                        fname = Path(member.filename).name
                        if fname.endswith(".usfm"):
                            with zf.open(member) as src, open(usfm_target / fname, "wb") as dst:
                                dst.write(src.read())

            source_dir = usfm_target

        self.source_dir = source_dir
        self.tvtms = tvtms or load_tvtms()

    def iter_verses(self) -> Iterator[VerseUnit]:
        if not self.source_dir.exists():
            raise FileNotFoundError(f"Douay USFM source directory not found at {self.source_dir}")

        usfm_files = sorted(self.source_dir.glob("*.usfm"))
        if not usfm_files:
            raise FileNotFoundError(f"No .usfm files found in {self.source_dir}")

        print(f"Reading Douay-Rheims text from USFM source ({len(usfm_files)} books): {self.source_dir}")

        for u_path in usfm_files:
            records = parse_usfm_file(u_path, include_tokens=True)
            if not records:
                continue

            for raw_book_code, ch_num, v_num, subverse, nat_cit, clean_text, tokens in records:
                book_code = resolve_canonical_book(raw_book_code)
                if not book_code:
                    continue

                # Align native Vulgate/Catholic citation to Universal Standard coordinates
                ref = self.tvtms.resolve_to_standard("VULGATE", book_code, ch_num, v_num, subverse)

                yield VerseUnit(
                    corpus_id=self.corpus_id,
                    std_book=ref.book,
                    std_chapter=ref.chapter,
                    std_verse=ref.verse,
                    std_subverse=ref.subverse,
                    native_book=book_code,
                    native_chapter=ch_num,
                    native_verse=v_num,
                    native_subverse=subverse,
                    native_citation=f"{book_code} {nat_cit}",
                    text=clean_text,
                    tokens=tokens,
                )
