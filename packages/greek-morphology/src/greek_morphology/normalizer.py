"""Greek Unicode normalization, diacritic utilities, and Beta Code conversion."""

from __future__ import annotations

import unicodedata
from typing import Dict

# Map Archaic Oxia (Varia/Oxia polytonic block) to Modern Greek Tonos
OXIA_TO_TONOS: Dict[int, int] = {
    0x1F71: 0x03AC, 0x1F73: 0x03AD, 0x1F75: 0x03AE, 0x1F77: 0x03AF,
    0x1F79: 0x03CC, 0x1F7B: 0x03CD, 0x1F7D: 0x03CE, 0x1FBB: 0x03AC,
    0x1FC9: 0x03AD, 0x1FCB: 0x03AE, 0x1FDB: 0x03AF, 0x1FEB: 0x03CD,
    0x1FF9: 0x03CC, 0x1FFB: 0x03CE,
}

# Beta code character mapping
GREEK_TO_BETA: Dict[str, str] = {
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z',
    'η': 'h', 'θ': 'q', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
    'ν': 'n', 'ξ': 'c', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
    'ς': 's', 'τ': 't', 'υ': 'u', 'φ': 'f', 'χ': 'x', 'ψ': 'y',
    'ω': 'w',
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
    'Η': 'H', 'Θ': 'Q', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M',
    'Ν': 'N', 'Ξ': 'C', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S',
    'Τ': 'T', 'Υ': 'U', 'Φ': 'F', 'Χ': 'X', 'Ψ': 'Y', 'Ω': 'W',
}


def normalize_greek(text: str) -> str:
    """Normalize Greek text to NFC standard with modern tonos accents, converting contextual grave accents to acute."""
    if not text:
        return ""
    nfd = unicodedata.normalize("NFD", text).replace("\u0300", "\u0301")
    return unicodedata.normalize("NFC", nfd).translate(OXIA_TO_TONOS).strip()


def strip_accents(text: str) -> str:
    """Strip all diacritics, accents, breathings, and iota subscripts, normalizing sigmas."""
    if not text:
        return ""
    norm = unicodedata.normalize("NFKD", text)
    clean = "".join(
        c for c in norm
        if not unicodedata.combining(c) and c != "ͅ" and c != "\u0345"
    )
    return unicodedata.normalize("NFC", clean).lower().replace("ς", "σ").strip()


def to_beta_code(text: str) -> str:
    """Convert polytonic or plain Greek text to simplified ASCII Beta Code."""
    if not text:
        return ""
    clean = strip_accents(text)
    return "".join(GREEK_TO_BETA.get(c, c) for c in clean)


def is_capitalized(text: str) -> bool:
    """Return True if the first alphabetical character in the word is uppercase."""
    if not text:
        return False
    clean = strip_accents(text)
    if not clean:
        return False
    # Check original first letter
    for c in text:
        if c.isalpha():
            return c.isupper()
    return False
