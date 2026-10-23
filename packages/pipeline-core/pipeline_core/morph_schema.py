"""Pipeline Core - Morphological Schema Normalization.

Parses Perseus / Mate tagger / Morpheus 9-character morphological analysis codes
into the structured JSON schema used by @polyglot/ancient-languages.
"""

from __future__ import annotations
import re
import unicodedata
from typing import Dict, Any, Optional

ACCENT_REGEX = re.compile(r"[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]")

POS_MAP = {
    "n": "noun",
    "v": "verb",
    "a": "adjective",
    "d": "adverb",
    "l": "article",
    "g": "particle",
    "c": "conjunction",
    "r": "preposition",
    "p": "pronoun",
    "m": "numeral",
    "i": "interjection",
    "u": "punctuation",
}

PERSON_MAP = {"1": "1st", "2": "2nd", "3": "3rd"}
NUMBER_MAP = {"s": "singular", "p": "plural", "d": "dual"}
TENSE_MAP = {
    "p": "present",
    "i": "imperfect",
    "r": "perfect",
    "l": "pluperfect",
    "t": "future-perfect",
    "f": "future",
    "a": "aorist",
}
MOOD_MAP = {
    "i": "indicative",
    "s": "subjunctive",
    "o": "optative",
    "n": "infinitive",
    "m": "imperative",
    "p": "participle",
}
VOICE_MAP = {
    "a": "active",
    "m": "middle",
    "p": "passive",
    "e": "middle/passive",
}
GENDER_MAP = {"m": "masculine", "f": "feminine", "n": "neuter"}
CASE_MAP = {
    "n": "nominative",
    "g": "genitive",
    "d": "dative",
    "a": "accusative",
    "v": "vocative",
}
DEGREE_MAP = {"c": "comparative", "s": "superlative"}


def strip_accents(s: str) -> str:
    """Strips diacritics and breathing marks."""
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s)
    cleaned = ACCENT_REGEX.sub("", nfd)
    return unicodedata.normalize("NFC", cleaned).lower().strip()


def parse_mate_morph(code: str) -> Dict[str, Any]:
    """Parses a Perseus/Mate 9-character code into a decoded attribute dictionary.
    
    Format:
      0: POS (n, v, a, d, l, g, c, r, p, m, i, u)
      1: Person (1, 2, 3, -)
      2: Number (s, p, d, -)
      3: Tense (p, i, r, l, t, f, a, -)
      4: Mood (i, s, o, n, m, p, -)
      5: Voice (a, m, p, e, -)
      6: Gender (m, f, n, -)
      7: Case (n, g, d, a, v, -)
      8: Degree (c, s, -)
    """
    if not code:
        return {}

    code_padded = code.ljust(9, "-")
    pos_char = code_padded[0].lower()
    person_char = code_padded[1].lower()
    number_char = code_padded[2].lower()
    tense_char = code_padded[3].lower()
    mood_char = code_padded[4].lower()
    voice_char = code_padded[5].lower()
    gender_char = code_padded[6].lower()
    case_char = code_padded[7].lower()
    degree_char = code_padded[8].lower()

    decoded: Dict[str, Any] = {
        "pos": POS_MAP.get(pos_char, pos_char if pos_char != "-" else None),
        "person": PERSON_MAP.get(person_char),
        "number": NUMBER_MAP.get(number_char),
        "tense": TENSE_MAP.get(tense_char),
        "mood": MOOD_MAP.get(mood_char),
        "voice": VOICE_MAP.get(voice_char),
        "gender": GENDER_MAP.get(gender_char),
        "case": CASE_MAP.get(case_char),
        "degree": DEGREE_MAP.get(degree_char),
    }

    # Filter out None values
    return {k: v for k, v in decoded.items() if v is not None}


# Common Ancient Greek elision forms
ELISION_MAP = {
    "ἀλλ": "ἀλλά",
    "ἀλλ’": "ἀλλά",
    "ἀλλ'": "ἀλλά",
    "δι": "διά",
    "δι’": "διά",
    "δι'": "διά",
    "ἐπ": "ἐπί",
    "ἐπ’": "ἐπί",
    "ἐφ": "ἐπί",
    "ἐφ’": "ἐπί",
    "μετ": "μετά",
    "μετ’": "μετά",
    "μεθ": "μετά",
    "μεθ’": "μετά",
    "κατ": "κατά",
    "κατ’": "κατά",
    "καθ": "κατά",
    "καθ’": "κατά",
    "ὑπ": "ὑπό",
    "ὑπ’": "ὑπό",
    "ὑφ": "ὑπό",
    "ὑφ’": "ὑπό",
    "ἀπ": "ἀπό",
    "ἀπ’": "ἀπό",
    "ἀφ": "ἀπό",
    "ἀφ’": "ἀπό",
    "παρ": "παρά",
    "παρ’": "παρά",
}


def normalize_token_morph(
    surface: str,
    raw_lemma: Optional[str] = None,
    raw_morph: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates a standardized token object for storage in tokens_json."""
    clean_word = re.sub(r"[.,·;:\"'«»\(\)\[\]—]", "", surface).strip()
    lemma = raw_lemma or clean_word

    # Check for elisions
    if surface.strip() in ELISION_MAP:
        lemma = ELISION_MAP[surface.strip()]

    decoded = parse_mate_morph(raw_morph) if raw_morph else {}

    return {
        "w": surface,
        "clean": clean_word,
        "l": lemma,
        "m": raw_morph or "",
        "p": decoded.get("pos", ""),
        "decoded": decoded,
    }
