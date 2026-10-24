"""Polyglot Bible Reader - Unabridged BDB Hebrew Lexicon Adapter.

Parses public DictBDB.json, extracting 8,090 authentic BDB records
keyed from H1 to H9009 with pointed Hebrew headwords, consonant roots,
and complete definitions.
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Iterator, Optional, Dict, Any
from .base import BaseAdapter
from ..config import CACHE_DIR, PIPELINE_DIR
from ..corrections import load_hebrew_errata, apply_lexeme_errata

HEBREW_DIAC_REGEX = re.compile(r"[\u0591-\u05C7]")
PUNCT_REGEX = re.compile(r"[\(\)\[\]⟦⟧⟨⟩\.,;׃׀־\s]+")
BDB_POS_REGEX = re.compile(
    r"<b>(?:noun|verb|adjective|proper name|adverb|preposition|pronoun|conjunction|particle|interjection)[^<]*</b>",
    re.IGNORECASE,
)


def strip_hebrew(s: str) -> str:
    """Removes Hebrew vowels (niqqud) and cantillation marks to yield consonant key."""
    if not s:
        return ""
    import unicodedata
    norm = unicodedata.normalize("NFKC", s)
    cleaned = HEBREW_DIAC_REGEX.sub("", norm)
    cleaned = PUNCT_REGEX.sub("", cleaned).strip()
    return cleaned


def fix_pe_dagesh(s: str) -> str:
    """Restores Hebrew letter Pe with Dagesh (פּ) that was transcoded as Mem with Dagesh (מּ)."""
    if not s:
        return ""
    # Case 1: Mem followed immediately by Dagesh: מּ -> פּ
    s = s.replace("\u05DE\u05BC", "\u05E4\u05BC")
    # Case 2: Mem followed by vowels/accents then Dagesh: e.g. מֵּ -> פֵּ
    s = re.sub(
        r"\u05DE([\u0591-\u05BD\u05BF-\u05C7]+)\u05BC",
        lambda m: "\u05E4" + m.group(1) + "\u05BC",
        s
    )
    return s


BDB_KNOWN_CORRUPTED_STRONGS = {
    "H1054", "H3597", "H3940", "H4553", "H4554", "H4555", "H4556", "H4557", "H4558",
    "H4710", "H6462", "H6753", "H6826", "H6833", "H6834", "H7091", "H7163", "H8598", "H8599"
}

BDB_CROSS_REF_REPLACEMENTS = {
    "מִסְמּוֺא": "מִסְפּוֺא",
    "מִסְמֵּד": "מִסְפֵּד",
    "מִסְמָּחוֺת": "מִסְפָּחוֹת",
    "מִסְמַּ֫חַת": "מִסְפַּ֫חַת",
    "מִסְמָּר": "מִסְפָּר",
    "מִסְמֶּ֫רֶת": "מִסְפֶּ֫רֶת",
    "תַּמּוּחַ": "תַּפּוּחַ",
}


def extract_headword_and_key(defn: str) -> tuple[Optional[str], str]:
    """
    Extracts the pointed Hebrew headword and unpointed consonant key from definition HTML.
    1. Looks for <ref0 ... entry="..."> tag (99.6% of entries)
    2. Falls back to <font class='c3'> Hebrew content
    """
    headword = None
    m_ref = re.search(r'<ref0[^>]*entry=[\"\']([^\"\']+)[\"\']', defn)
    if m_ref:
        raw = m_ref.group(1).strip()
        parts = [p.strip() for p in raw.split(",") if p.strip()]
        if parts:
            first_part = parts[0].split()[0].strip()
            headword = first_part.strip("[]⟦⟧()")

    if not headword:
        m_font = re.search(r"<font class=[\"\']c3[\"\']>([^<]+)</font>", defn)
        if m_font:
            headword = m_font.group(1).strip().strip("[]⟦⟧()")

    key = strip_hebrew(headword) if headword else ""
    return headword, key


def extract_bdb_gloss(defn: str) -> str:
    """Extracts lead bold gloss following part-of-speech tag in BDB definition HTML."""
    m_pos = BDB_POS_REGEX.search(defn)
    if m_pos:
        after_pos = defn[m_pos.end():]
        m_bold = re.search(r"<b>([^<]+)</b>", after_pos[:200])
        if m_bold:
            cand = m_bold.group(1).strip()
            if cand and not cand.isdigit() and len(cand) > 1:
                return cand
    return ""


class BDBAdapter(BaseAdapter):
    corpus_id = "bdb"
    title = "Brown-Driver-Briggs Hebrew Lexicon (Unabridged)"
    language = "hbo"
    direction = "rtl"
    category = "lexicon"

    def __init__(self, json_path: Optional[Path] = None, lexemes_path: Optional[Path] = None):
        self.json_path = json_path or (CACHE_DIR / "DictBDB.json")
        self.lexemes_path = lexemes_path or (PIPELINE_DIR / "data" / "bhs" / "lexemes.json")
        self.strongs_to_gloss: Dict[str, str] = {}
        self.strongs_to_lemma: Dict[str, str] = {}
        self._load_bhs_glosses()

    def _load_bhs_glosses(self):
        if not self.lexemes_path.exists():
            archive = PIPELINE_DIR / "data" / "bhs.tar.gz"
            if archive.exists():
                import tarfile
                with tarfile.open(archive, "r:gz") as tar:
                    tar.extractall(path=PIPELINE_DIR / "data")

        if self.lexemes_path.exists():
            try:
                with open(self.lexemes_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                errata = load_hebrew_errata()
                patched = apply_lexeme_errata(data, errata)
                if patched:
                    print(f"BDBAdapter: Applied {patched} lexeme errata patches to gloss source.")
                for item in data.values():
                    s = item.get("strongs")
                    g = item.get("gloss")
                    l = item.get("lemma")
                    if s:
                        s_norm = s.strip().upper()
                        if not s_norm.startswith("H") and s_norm.isdigit():
                            s_norm = f"H{s_norm}"
                        if g and s_norm not in self.strongs_to_gloss:
                            self.strongs_to_gloss[s_norm] = g.strip()
                        if l and s_norm not in self.strongs_to_lemma:
                            self.strongs_to_lemma[s_norm] = l.strip()
            except Exception as e:
                print(f"BDBAdapter: Warning reading lexemes.json: {e}")

    def iter_entries(self) -> Iterator[Dict[str, Any]]:
        if not self.json_path.exists():
            raise FileNotFoundError(f"BDB JSON not found at {self.json_path}")

        print(f"Reading BDB lexicon from: {self.json_path}")
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        total = 0
        restored_pe_count = 0
        for entry in data:
            raw_top = entry.get("top", "").strip()
            defn = entry.get("def", "")

            # DictInfo is introductory metadata, not a lexicon entry
            if raw_top.lower() == "dictinfo" or not raw_top:
                continue

            # raw_top is like 'H7225' or 'H2' or '7225'
            s_digits = ""
            if raw_top.upper().startswith("H"):
                s_digits = raw_top[1:].strip()
                if s_digits.isdigit():
                    strongs_id = f"H{int(s_digits)}"
                else:
                    strongs_id = raw_top.upper()
            elif raw_top.isdigit():
                s_digits = raw_top
                strongs_id = f"H{int(raw_top)}"
            else:
                strongs_id = raw_top.upper()
                continue

            headword, key = extract_headword_and_key(defn)

            # Manual corrections for prefixes
            if strongs_id == "H9003" and not headword:
                headword, key = "בְּ", "ב"
            elif strongs_id == "H9000" and not headword:
                headword, key = "וְ", "ו"

            # Detect and restore Pe-with-dagesh font transcoding corruption
            m_title = re.search(r"<b>H\d+\.?\s*([A-Za-z]+)", defn)
            trans_title = m_title.group(1).lower() if m_title else ""
            s_num = int(s_digits) if s_digits.isdigit() else 0

            lex_lemma = self.strongs_to_lemma.get(strongs_id, "")
            has_pe_in_lex = ("\u05E4" in lex_lemma or "\u05E3" in lex_lemma)
            has_mem_dagesh = bool(
                headword and (
                    "\u05DE\u05BC" in headword
                    or re.search(r"\u05DE[\u0591-\u05BD\u05BF-\u05C7]+\u05BC", headword)
                )
            )

            is_corrupt = False
            if has_mem_dagesh:
                if 6284 <= s_num <= 6626:
                    is_corrupt = True
                elif strongs_id in BDB_KNOWN_CORRUPTED_STRONGS:
                    is_corrupt = True
                elif has_pe_in_lex and "\u05DE" not in lex_lemma:
                    is_corrupt = True
                elif ("p" in trans_title or "ph" in trans_title) and "m" not in trans_title:
                    is_corrupt = True

            if is_corrupt and headword:
                headword = fix_pe_dagesh(headword)
                key = strip_hebrew(headword)
                defn = re.sub(
                    r'(<ref0[^>]*entry=[\"\'])([^\"\']+)([\"\'])',
                    lambda m: m.group(1) + fix_pe_dagesh(m.group(2)) + m.group(3),
                    defn,
                    count=1
                )
                defn = re.sub(
                    r"(<font class=[\"\']c3[\"\']>)([^<]+)(</font>)",
                    lambda m: m.group(1) + fix_pe_dagesh(m.group(2)) + m.group(3),
                    defn,
                    count=1
                )
                restored_pe_count += 1

            # Apply cross-reference repairs in definition text
            for bad_str, good_str in BDB_CROSS_REF_REPLACEMENTS.items():
                if bad_str in defn:
                    defn = defn.replace(bad_str, good_str)

            # Determine gloss
            gloss = self.strongs_to_gloss.get(strongs_id, "")
            if not gloss:
                gloss = extract_bdb_gloss(defn)

            yield {
                "strongs_id": strongs_id,
                "headword": headword or key or strongs_id,
                "consonant_key": key,
                "gloss": gloss,
                "definition": defn,
                "dictionary": "bdb"
            }
            total += 1

        print(f"BDBAdapter: Finished reading {total:,} authentic BDB entries ({restored_pe_count} restored Pe-dagesh headwords).")


if __name__ == "__main__":
    from ..fetcher import fetch_source
    fetch_source("bdb")
    adapter = BDBAdapter()
    h7225 = None
    for entry in adapter.iter_entries():
        if entry["strongs_id"] == "H7225":
            h7225 = entry
            break

    print("\n--- BDB Adapter Validation ---")
    if h7225:
        print(f"H7225 headword: {h7225['headword']}, key: {h7225['consonant_key']}")
        print(f"Sample definition: {h7225['definition'][:60]}...")
        assert h7225["consonant_key"] == "ראשׁית" or "ראשית" in h7225["consonant_key"]
        print("SUCCESS: BDB H7225 (reshit) parsed and verified!")
