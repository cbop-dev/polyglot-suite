"""Philo Pipeline - Text & Morphology Parser.

Parses Celano's lemmatized Greek XML and First1KGreek's aligned English XML,
normalizes tokens via pipeline_core.morph_schema, and injects patcher supplements.
Extracts Cohn-Wendland biblical citations into structured tokens and indexes,
strips intrusive apparatus/citation clutter from Greek and English prose,
and filters out book title headings from section prose.
"""

from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass

from pipeline_core import parse_mate_morph, normalize_token_morph
from .config import (
    CANONICAL_WORKS,
    WORK_BY_TLG,
    PhiloWork,
    TEXTS_GRC_DIR,
    TEXTS_ENG_DIR,
)
from .patcher import get_supplement, is_supplement

TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}

# Canonical mapping of Septuagint / Old Testament books cited by Philo & Cohn-Wendland
BIBLE_BOOKS: Dict[str, Tuple[str, str, List[str]]] = {
    "GEN": ("Genesis", "Gen", ["gen", "genes", "gcn", "gcu", "gea", "geii", "geil", "geo", "geu", "gεn", "g2"]),
    "EXO": ("Exodus", "Exod", ["ex", "exod", "exo", "exocl", "exo7"]),
    "LEV": ("Leviticus", "Lev", ["lev", "leuit", "leuitic"]),
    "NUM": ("Numbers", "Num", ["num", "νum"]),
    "DEU": ("Deuteronomy", "Deut", ["deut", "dent", "deiit", "deuter"]),
    "JOS": ("Joshua", "Josh", ["jos", "ios"]),
    "JDG": ("Judges", "Judg", ["judg", "iudg", "lud"]),
    "RUT": ("Ruth", "Ruth", ["ruth"]),
    "1SA": ("1 Samuel", "1 Sam", ["1 reg", "1 regn", "i reg", "i regn", "i. reg", "ireg", "1 sam", "i sam"]),
    "2SA": ("2 Samuel", "2 Sam", ["2 reg", "2 regn", "ii reg", "ii regn", "ii. reg", "iireg", "2 sam", "ii sam"]),
    "1KI": ("1 Kings", "1 Kgs", ["3 reg", "3 regn", "iii reg", "iii regn", "iii. reg", "iiireg", "1 kgs", "1 kings"]),
    "2KI": ("2 Kings", "2 Kgs", ["4 reg", "4 regn", "iv reg", "iv regn", "iv. reg", "ivreg", "2 kgs", "2 kings"]),
    "1CH": ("1 Chronicles", "1 Chr", ["1 par", "i par", "1 chron"]),
    "2CH": ("2 Chronicles", "2 Chr", ["2 par", "ii par", "2 chron"]),
    "1ES": ("1 Esdras", "1 Esd", ["esd", "1 esd", "i esd"]),
    "NEH": ("Nehemiah", "Neh", ["neh"]),
    "PSA": ("Psalms", "Ps", ["ps", "psa", "psal", "psalm"]),
    "PRO": ("Proverbs", "Prov", ["prov", "pro", "piov"]),
    "JOB": ("Job", "Job", ["job", "iob", "lob"]),
    "SNG": ("Song of Songs", "Song", ["cant"]),
    "ECC": ("Ecclesiastes", "Eccl", ["eccl", "qoh"]),
    "ISA": ("Isaiah", "Isa", ["is", "isa", "esai", "ies"]),
    "JER": ("Jeremiah", "Jer", ["jer", "ier", "ler"]),
    "LAM": ("Lamentations", "Lam", ["lam", "thren"]),
    "EZK": ("Ezekiel", "Ezek", ["ezek", "ezech"]),
    "DAN": ("Daniel", "Dan", ["dan"]),
    "HOS": ("Hosea", "Hos", ["hos", "osee"]),
    "JOL": ("Joel", "Joel", ["joel"]),
    "AMO": ("Amos", "Amos", ["am", "amos"]),
    "OBA": ("Obadiah", "Obad", ["obad"]),
    "JON": ("Jonah", "Jon", ["jon", "jonas"]),
    "MIC": ("Micah", "Mic", ["mic", "mich"]),
    "NAM": ("Nahum", "Nah", ["nah"]),
    "HAB": ("Habakkuk", "Hab", ["hab"]),
    "ZEP": ("Zephaniah", "Zeph", ["zeph", "soph"]),
    "HAG": ("Haggai", "Hag", ["hagg", "agg"]),
    "ZEC": ("Zechariah", "Zech", ["zech", "zach"]),
    "MAL": ("Malachi", "Mal", ["mal"]),
    "SIR": ("Sirach", "Sir", ["sir", "ecclus"]),
    "WIS": ("Wisdom", "Wis", ["sap", "wis"]),
}

# Fast lookup for book aliases
BIBLE_ALIAS_LOOKUP: Dict[str, str] = {}
for code, (_, _, aliases) in BIBLE_BOOKS.items():
    for a in aliases:
        BIBLE_ALIAS_LOOKUP[a.lower()] = code

IBID_ALIASES = {"ib", "ibid", "ibitl", "idid"}
APPARATUS_KEYWORDS = {"turn", "mang", "mavult", "sic", "?", "v", "arj", "xuiv", "xai", "t6"}
EDITORIAL_QUOTES = {"„", "“", "”", '"', "«", "»"}

ROMAN_NUMERALS: Dict[str, int] = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
    "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15, "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20,
    "xxi": 21, "xxii": 22, "xxiii": 23, "xxiv": 24, "xxv": 25, "xxvi": 26, "xxvii": 27, "xxviii": 28, "xxix": 29, "xxx": 30,
    "xxxi": 31, "xxxii": 32, "xxxiii": 33, "xxxiv": 34, "xxxv": 35, "xxxvi": 36, "xxxvii": 37, "xxxviii": 38, "xxxix": 39, "xl": 40,
    "xli": 41, "xlii": 42, "xliii": 43, "xliv": 44, "xlv": 45, "xlvi": 46, "xlvii": 47, "xlviii": 48, "xlix": 49, "l": 50,
}

BIBLE_NAMES_PATTERN = (
    r"(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|"
    r"1\s+Samuel|2\s+Samuel|1\s+Kings|2\s+Kings|1\s+Chronicles|2\s+Chronicles|"
    r"Psalms?|Proverbs?|Job|Song|Ecclesiastes|Isaiah|Jeremiah|Lamentations|"
    r"Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|"
    r"Zephaniah|Haggai|Zechariah|Malachi|Gen|Exod|Lev|Num|Deut|Ps|Prov)"
)


def parse_citation(raw_text: str, prev_book_code: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Parses Cohn-Wendland parenthetical citation string into structured metadata."""
    clean = raw_text.strip().lstrip(".").strip()
    # Strip optional comparison prefix (e.g. 'cf . ')
    clean = re.sub(r"^(?:cf\s*[\.,]\s*)", "", clean, flags=re.I)

    matched_code = None
    rest = clean

    # Check known book aliases (longest match first)
    for alias, code in sorted(BIBLE_ALIAS_LOOKUP.items(), key=lambda x: -len(x[0])):
        pattern = r"^" + re.escape(alias).replace(r"\ ", r"\s+[\.]?\s*") + r"(?:[\s\.,]|$)"
        m = re.match(pattern, rest, re.I)
        if m:
            matched_code = code
            rest = rest[m.end():]
            break

    # Check ibid aliases
    if not matched_code and prev_book_code:
        for ib in IBID_ALIASES:
            pattern = r"^" + re.escape(ib) + r"(?:[\s\.,]|$)"
            m = re.match(pattern, rest, re.I)
            if m:
                matched_code = prev_book_code
                rest = rest[m.end():]
                break

    # Check chapter/verse shorthand without explicit book (e.g. '10 , 23')
    if not matched_code and prev_book_code:
        if re.match(r"^\d+\s*[,]\s*\d+", rest):
            matched_code = prev_book_code

    if not matched_code:
        return None

    nums = re.findall(r"\d+", rest)
    chapter = int(nums[0]) if len(nums) >= 1 else None
    verse = int(nums[1]) if len(nums) >= 2 else None

    book_info = BIBLE_BOOKS.get(matched_code)
    full_name = book_info[0] if book_info else matched_code
    sbl_abbrev = book_info[1] if book_info else matched_code

    display = sbl_abbrev
    if chapter is not None:
        display += f" {chapter}"
        if verse is not None:
            display += f":{verse}"

    return {
        "book_code": matched_code,
        "book_name": full_name,
        "bible_chapter": chapter,
        "bible_verse": verse,
        "display": display,
        "raw": raw_text,
    }


def clean_english_note_text(txt: str) -> str:
    """Formats English scripture references with brackets and drops commentary footnotes."""
    txt = txt.strip()
    m = re.match(rf"^({BIBLE_NAMES_PATTERN})\s+([ivxlcdm]+|\d+)[\.\s]+(\d+)", txt, re.I)
    if m:
        b = m.group(1).title()
        ch_raw = m.group(2).lower()
        ch = ROMAN_NUMERALS.get(ch_raw, ch_raw)
        v = m.group(3)
        return f" [{b} {ch}:{v}] "
    return ""


@dataclass
class ParsedSection:
    work: PhiloWork
    book: int
    section: int
    mangey_ref: Optional[str]
    greek_text: str
    english_text: str
    is_supplement: int
    tokens: List[Dict[str, Any]]


class PhiloParser:
    """Parses Greek tokens and facing English translation for Philo's treatises."""

    def __init__(self, grc_dir: Optional[Path] = None, eng_dir: Optional[Path] = None):
        self.grc_dir = grc_dir or TEXTS_GRC_DIR
        self.eng_dir = eng_dir or TEXTS_ENG_DIR

    def parse_work(self, work: PhiloWork) -> List[ParsedSection]:
        """Parses all sections of a single work."""
        grc_file = self.grc_dir / f"tlg0018.{work.tlg_id}.opp-grc1.xml"
        eng_file = self.eng_dir / f"tlg0018.{work.tlg_id}.1st1K-eng1.xml"

        if not grc_file.exists():
            raise FileNotFoundError(f"Missing Greek XML for {work.code}: {grc_file}")
        if not eng_file.exists():
            raise FileNotFoundError(f"Missing English XML for {work.code}: {eng_file}")

        # 1. Parse English text and Mangey milestones
        eng_sections, milestones = self._parse_english(work, eng_file)

        # 2. Parse Greek tokens and reconstruct sections
        grc_sections = self._parse_greek(work, grc_file)

        # 3. Align and construct final ParsedSection objects
        aligned_sections: List[ParsedSection] = []
        all_coords = sorted(list(grc_sections.keys()))

        for book, sec in all_coords:
            g_tokens, g_text = grc_sections[(book, sec)]
            coord = (book, sec)

            # Check if English text is in First1KGreek or in patcher supplement
            if coord in eng_sections:
                e_text = eng_sections[coord]
                is_supp = 0
            else:
                supp = get_supplement(work.tlg_id, book, sec)
                if supp:
                    e_text = supp
                    is_supp = 1
                else:
                    e_text = "[English translation missing]"
                    is_supp = 0

            m_ref = milestones.get(coord)

            aligned_sections.append(
                ParsedSection(
                    work=work,
                    book=book,
                    section=sec,
                    mangey_ref=m_ref,
                    greek_text=g_text,
                    english_text=e_text,
                    is_supplement=is_supp,
                    tokens=g_tokens,
                )
            )

        return aligned_sections

    def _parse_english(
        self, work: PhiloWork, filepath: Path
    ) -> Tuple[Dict[Tuple[int, int], str], Dict[Tuple[int, int], str]]:
        """Extracts English sections and Mangey page milestones."""
        tree = ET.parse(filepath)
        root = tree.getroot()

        sections: Dict[Tuple[int, int], str] = {}
        milestones: Dict[Tuple[int, int], str] = {}

        current_milestone: Optional[str] = None

        if work.total_books > 1:
            book_divs = root.findall('.//tei:div[@type="textpart"][@subtype="book"]', TEI_NS)
            if not book_divs:
                book_divs = root.findall('.//tei:div[@subtype="book"]', TEI_NS)

            for b_div in book_divs:
                b_num_str = b_div.attrib.get("n", "1")
                book = int(b_num_str) if b_num_str.isdigit() else 1

                for child in b_div.iter():
                    if child.tag.endswith("pb") or child.tag.endswith("milestone"):
                        n_val = child.attrib.get("n", "")
                        if "v." in n_val and "p." in n_val:
                            # Format e.g. 'v.1.p.12' -> 'M. 1.12'
                            m_clean = re.sub(r"v\.(\d+)\.p\.(\d+)", r"M. \1.\2", n_val)
                            current_milestone = m_clean

                sec_divs = b_div.findall('.//tei:div[@subtype="section"]', TEI_NS)
                for s_div in sec_divs:
                    s_num_str = s_div.attrib.get("n", "")
                    if not s_num_str.isdigit():
                        continue
                    sec = int(s_num_str)

                    # Check for milestone inside or immediately preceding section
                    s_pb = s_div.find(".//tei:pb", TEI_NS)
                    if s_pb is not None:
                        n_val = s_pb.attrib.get("n", "")
                        if "v." in n_val and "p." in n_val:
                            current_milestone = re.sub(r"v\.(\d+)\.p\.(\d+)", r"M. \1.\2", n_val)

                    text_content = self._clean_tei_text(s_div)
                    sections[(book, sec)] = text_content
                    if current_milestone:
                        milestones[(book, sec)] = current_milestone
        else:
            book = 1
            for child in root.iter():
                if child.tag.endswith("pb") or child.tag.endswith("milestone"):
                    n_val = child.attrib.get("n", "")
                    if "v." in n_val and "p." in n_val:
                        current_milestone = re.sub(r"v\.(\d+)\.p\.(\d+)", r"M. \1.\2", n_val)

            sec_divs = root.findall('.//tei:div[@subtype="section"]', TEI_NS)
            for s_div in sec_divs:
                s_num_str = s_div.attrib.get("n", "")
                if not s_num_str.isdigit():
                    continue
                sec = int(s_num_str)

                s_pb = s_div.find(".//tei:pb", TEI_NS)
                if s_pb is not None:
                    n_val = s_pb.attrib.get("n", "")
                    if "v." in n_val and "p." in n_val:
                        current_milestone = re.sub(r"v\.(\d+)\.p\.(\d+)", r"M. \1.\2", n_val)

                text_content = self._clean_tei_text(s_div)
                sections[(book, sec)] = text_content
                if current_milestone:
                    milestones[(book, sec)] = current_milestone

        return sections, milestones

    def _clean_tei_text(self, elem: ET.Element) -> str:
        """Extracts clean plain text from an EpiDoc TEI section element, stripping intrusive notes."""
        parts: List[str] = []

        def process_node(node: ET.Element):
            if node.text:
                parts.append(node.text)
            for child in node:
                tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                if tag == "note":
                    note_text = "".join(child.itertext()).strip()
                    cleaned_note = clean_english_note_text(note_text)
                    if cleaned_note:
                        parts.append(cleaned_note)
                else:
                    process_node(child)
                if child.tail:
                    parts.append(child.tail)

        process_node(elem)
        raw_text = "".join(parts)
        # Clean extra whitespace
        cleaned = re.sub(r"\s+", " ", raw_text).strip()
        # Remove stray chapter markers like "[1]" or "{1}"
        cleaned = re.sub(r"^\[\d+\]\s*", "", cleaned)
        return cleaned

    def _parse_greek(
        self, work: PhiloWork, filepath: Path
    ) -> Dict[Tuple[int, int], Tuple[List[Dict[str, Any]], str]]:
        """Parses Celano tokens into {(book, section): (tokens_list, surface_text)}."""
        tree = ET.parse(filepath)
        root = tree.getroot()

        raw_sections: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}

        for t_el in root.findall(".//t"):
            p_val = t_el.attrib.get("p", "")
            if not p_val:
                continue

            if "." in p_val:
                parts = p_val.split(".", 1)
                book = int(parts[0]) if parts[0].isdigit() else 1
                sec = int(parts[1]) if parts[1].isdigit() else 1
            else:
                if work.total_books > 1:
                    # In multi-book works (LEG, SPEC, MOS, SOMN), p="1", p="2", etc.
                    # are book title headings (e.g. 'ΝΟΜΩΝ ΙΕΡΩΝ ΑΛΛΗΓΟΡΙΑΣ...').
                    # Skip them so they do not pollute Section 1.
                    continue
                else:
                    book = 1
                    sec = int(p_val) if p_val.isdigit() else 1

            coord = (book, sec)
            if coord not in raw_sections:
                raw_sections[coord] = []

            # Extract word form, lemma, and morph code
            f_el = t_el.find("f")
            surface = f_el.text.strip() if f_el is not None and f_el.text else ""
            if not surface or surface in EDITORIAL_QUOTES:
                continue

            # Extract lemma
            l1_el = t_el.find(".//l1")
            l2_el = t_el.find(".//l2")
            lemma = None
            if l1_el is not None and l1_el.text:
                lemma = l1_el.text.strip()
            elif l2_el is not None and l2_el.text:
                lemma = l2_el.text.strip()

            raw_morph = t_el.attrib.get("o", "")
            token_obj = normalize_token_morph(surface=surface, raw_lemma=lemma, raw_morph=raw_morph)
            raw_sections[coord].append(token_obj)

        # Post-process sections: collapse parenthetical citations and apparatus notes
        result: Dict[Tuple[int, int], Tuple[List[Dict[str, Any]], str]] = {}
        prev_book_code: Optional[str] = None

        sorted_coords = sorted(list(raw_sections.keys()))
        for coord in sorted_coords:
            raw_tokens = raw_sections[coord]
            collapsed_tokens: List[Dict[str, Any]] = []

            i = 0
            n_tokens = len(raw_tokens)
            while i < n_tokens:
                curr = raw_tokens[i]
                w = curr["w"]

                # Detect start of parenthetical expression
                if w == "(":
                    # Find closing ')'
                    j = i + 1
                    while j < min(i + 25, n_tokens) and raw_tokens[j]["w"] != ")":
                        j += 1

                    if j < n_tokens and raw_tokens[j]["w"] == ")":
                        inside_words = [raw_tokens[k]["w"] for k in range(i + 1, j)]
                        inside_text = " ".join(inside_words)

                        # Check if next token after ')' is sentence punctuation: '.', ',', '·', ';'
                        next_punct = None
                        if j + 1 < n_tokens and raw_tokens[j + 1]["w"] in {".", ",", "·", ";"}:
                            next_punct = raw_tokens[j + 1]

                        # 1. Check if biblical citation
                        cit = parse_citation(inside_text, prev_book_code)
                        if cit:
                            if next_punct:
                                collapsed_tokens.append(next_punct)
                                i = j + 2
                            else:
                                i = j + 1

                            collapsed_tokens.append({
                                "w": f"({cit['display']})",
                                "type": "citation",
                                "book_code": cit["book_code"],
                                "book_name": cit["book_name"],
                                "bible_chapter": cit["bible_chapter"],
                                "bible_verse": cit["bible_verse"],
                                "display": cit["display"],
                                "raw": f"({inside_text})",
                            })
                            prev_book_code = cit["book_code"]
                            continue

                        # 2. Check if editorial apparatus note
                        is_apparatus = any(
                            app in inside_text.lower() for app in APPARATUS_KEYWORDS
                        )
                        if is_apparatus:
                            if next_punct:
                                collapsed_tokens.append(next_punct)
                                i = j + 2
                            else:
                                i = j + 1

                            collapsed_tokens.append({
                                "w": f"({inside_text})",
                                "type": "apparatus",
                                "raw": f"({inside_text})",
                            })
                            continue

                # Normal Greek token or legitimate Greek parentheses
                collapsed_tokens.append(curr)
                i += 1

            # Assemble clean Greek text (omitting citation & apparatus tokens)
            words: List[str] = []
            for tok in collapsed_tokens:
                if tok.get("type") in ("citation", "apparatus"):
                    continue
                tw = tok["w"]
                if tw in [".", ",", "·", ";", ":", ")", "]", "—"] and words:
                    words[-1] = words[-1] + tw
                elif words and words[-1] in ["(", "["]:
                    words[-1] = words[-1] + tw
                else:
                    words.append(tw)

            surface_text = " ".join(words)
            # Guarantee no stray whitespace before punctuation
            surface_text = re.sub(r"\s+([\.,·;:])", r"\1", surface_text)
            result[coord] = (collapsed_tokens, surface_text)

        return result
