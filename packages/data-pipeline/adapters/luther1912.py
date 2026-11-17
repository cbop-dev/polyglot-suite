"""Polyglot Bible Reader - Lutherbibel 1912 (mit Apokryphen) Hybrid Adapter.

Combines:
  1. 66 Canonical Books from eBible USFM distribution (with 365,353 Strong's tags).
  2. 10 Apocryphal / Deuterocanonical Books from historical 1912 OSIS XML distribution
     (Jdt, Wis, Tob, Sir, Bar [with LJE], 1Macc, 2Macc, AddEsth, AddDan [SUS, BEL, S3Y], PrMan).
Pre-aligns verses using TVTMS German tradition + Masoretic fallback + custom overrides.
"""

from __future__ import annotations
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterator, Optional, List

from .base import BaseAdapter, VerseUnit, WordToken
from .usfm import parse_usfm_file
from ..config import PIPELINE_DIR, CACHE_DIR, BOOK_ALIASES, resolve_canonical_book
from ..tvtms import TVTMSResolver, load_tvtms


# Mapping from OSIS Apocrypha book IDs to PBR canonical codes
APOCRYPHA_OSIS_MAP = {
    "Jdt": "JDT",
    "Wis": "WIS",
    "Tob": "TOB",
    "Sir": "SIR",
    "Bar": "BAR",
    "1Macc": "1MA",
    "2Macc": "2MA",
    "AddEsth": "ESG",
    "AddDan": "DAN", # Split into SUS (ch 1), BEL (ch 2), S3Y (ch 3)
    "PrMan": "MAN",
}


def _extract_clean_xml_verse(v_elem) -> str:
    """Extracts verse text from an OSIS <verse> tag, stripping inline <note> elements."""
    parts = []
    if v_elem.text:
        parts.append(v_elem.text)
    for child in v_elem:
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag == "note":
            # Omit note text, preserve trailing tail text
            if child.tail:
                parts.append(child.tail)
        else:
            parts.append("".join(child.itertext()))
            if child.tail:
                parts.append(child.tail)

    joined = "".join(parts)
    clean = " ".join(joined.split()).strip()
    # Normalize punctuation spacing like "word , text" -> "word, text"
    clean = re.sub(r"\s+([,.;:!?])", r"\1", clean)
    return clean


class Luther1912Adapter(BaseAdapter):
    corpus_id = "luther1912"
    version = "Luther1912"
    short_title = "Luther 1912"
    title = "Lutherbibel 1912 (mit den Apokryphen)"
    language = "deu"
    direction = "ltr"
    category = "bible"
    default_scheme = "German"

    def __init__(
        self,
        usfm_dir: Optional[Path] = None,
        xml_path: Optional[Path] = None,
        tvtms: Optional[TVTMSResolver] = None
    ):
        if usfm_dir is None:
            usfm_target = CACHE_DIR / "sources" / "deu1912_usfm"
            zip_target = CACHE_DIR / "deu1912_usfm.zip"

            if not usfm_target.exists() and zip_target.exists():
                print(f"Unpacking {zip_target.name} into {usfm_target}...")
                usfm_target.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(zip_target, "r") as zf:
                    for member in zf.infolist():
                        fname = Path(member.filename).name
                        if fname.endswith(".usfm"):
                            with zf.open(member) as src, open(usfm_target / fname, "wb") as dst:
                                dst.write(src.read())

            usfm_dir = usfm_target

        self.usfm_dir = usfm_dir
        self.xml_path = xml_path or (CACHE_DIR / "luth1912ap.xml")
        self.tvtms = tvtms or load_tvtms()

    def iter_verses(self) -> Iterator[VerseUnit]:
        seen_books = set()

        # --- PART 1: 66 Canonical Books from USFM (with Strong's numbers) ---
        if self.usfm_dir.exists():
            usfm_files = sorted(self.usfm_dir.glob("*.usfm"))
            print(f"Reading Luther 1912 canonical books from USFM ({len(usfm_files)} books): {self.usfm_dir}")

            for u_path in usfm_files:
                records = parse_usfm_file(u_path, include_tokens=True)
                if not records:
                    continue

                for raw_book_code, ch_num, v_num, subverse, nat_cit, clean_text, tokens in records:
                    book_code = resolve_canonical_book(raw_book_code)
                    if not book_code:
                        continue

                    seen_books.add(book_code)

                    # Align German coordinates to Standard Hub
                    ref = self.tvtms.resolve_to_standard("GERMAN", book_code, ch_num, v_num, subverse)

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

        # --- PART 2: 10 Apocryphal / Deuterocanonical Books from OSIS XML ---
        if not self.xml_path.exists():
            print(f"Notice: Luther 1912 Apocrypha XML not found at {self.xml_path}, skipping Apocrypha.")
            return

        print(f"Reading Luther 1912 Apocrypha from OSIS XML: {self.xml_path}")
        tree = ET.parse(self.xml_path)
        root = tree.getroot()
        ns = {"osis": "http://www.bibletechnologies.net/2003/OSIS/namespace"}

        book_divs = root.findall('.//osis:div[@type="book"]', ns)
        apocrypha_count = 0

        for b_elem in book_divs:
            osis_id = b_elem.attrib.get("osisID", "")
            if osis_id not in APOCRYPHA_OSIS_MAP:
                continue

            for ch_elem in b_elem.findall("./osis:chapter", ns):
                raw_ch_id = ch_elem.attrib.get("osisID", "")
                # e.g. "Bar.6" -> 6
                try:
                    ch_num = int(raw_ch_id.split(".")[-1])
                except (ValueError, IndexError):
                    ch_num = 1

                for v_elem in ch_elem.findall("./osis:verse", ns):
                    raw_v_id = v_elem.attrib.get("osisID", "")
                    # e.g. "Bar.6.1" -> 1
                    try:
                        v_num = int(raw_v_id.split(".")[-1])
                    except (ValueError, IndexError):
                        v_num = 1

                    text = _extract_clean_xml_verse(v_elem)
                    if not text:
                        continue

                    # Book-specific canonical mapping and splitting
                    if osis_id == "Bar" and ch_num == 6:
                        # Letter of Jeremiah in Luther is Baruch ch 6 (73 verses)
                        target_book = "LJE"
                        target_ch = 1
                        target_v = v_num
                        native_cit = f"Bar 6:{v_num}"
                    elif osis_id == "AddDan":
                        # Daniel additions split into SUS, BEL, S3Y
                        if ch_num == 1:
                            target_book = "SUS"
                            target_ch = 1
                            target_v = v_num
                            native_cit = f"AddDan 1:{v_num}"
                        elif ch_num == 2:
                            target_book = "BEL"
                            target_ch = 1
                            target_v = v_num
                            native_cit = f"AddDan 2:{v_num}"
                        else:
                            target_book = "S3Y"
                            target_ch = 1
                            target_v = v_num
                            native_cit = f"AddDan 3:{v_num}"
                    elif osis_id == "AddEsth":
                        target_book = "ESG"
                        target_ch = ch_num
                        target_v = v_num
                        native_cit = f"AddEsth {ch_num}:{v_num}"
                    elif osis_id == "PrMan":
                        target_book = "MAN"
                        target_ch = 1
                        target_v = v_num
                        native_cit = f"PrMan 1:{v_num}"
                    else:
                        target_book = APOCRYPHA_OSIS_MAP[osis_id]
                        target_ch = ch_num
                        target_v = v_num
                        native_cit = f"{target_book} {ch_num}:{v_num}"

                    # Align German Apocrypha coordinates via TVTMS + overrides
                    ref = self.tvtms.resolve_to_standard("GERMAN", target_book, target_ch, target_v)

                    yield VerseUnit(
                        corpus_id=self.corpus_id,
                        std_book=ref.book,
                        std_chapter=ref.chapter,
                        std_verse=ref.verse,
                        std_subverse=ref.subverse,
                        native_book=target_book,
                        native_chapter=target_ch,
                        native_verse=target_v,
                        native_subverse="",
                        native_citation=native_cit,
                        text=text,
                        tokens=None,
                    )
                    apocrypha_count += 1

        print(f"Yielded {apocrypha_count} Apocrypha verses for Luther 1912.")
