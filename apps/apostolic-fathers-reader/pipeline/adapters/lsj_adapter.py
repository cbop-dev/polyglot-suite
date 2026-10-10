"""Apostolic Fathers Pipeline - LSJ Lexicon Adapter.

Loads STEPBible's TFLSJ full LSJ lexicon files and indexes entries
by normalized Greek headwords, plain consonant keys, and deponent/variant
aliases for instant lookup.
"""

from __future__ import annotations
import re
import unicodedata
from pathlib import Path
from typing import Iterator, Dict, Any, Optional
from ..config import LEXICON_DIR

ACCENT_REGEX = re.compile(r"[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]")


def strip_greek_accents(s: str) -> str:
    """Strips Greek diacritics and breathing marks to yield plain search key."""
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s)
    cleaned = ACCENT_REGEX.sub("", nfd)
    return unicodedata.normalize("NFC", cleaned).lower().strip()


# Supplementary Patristic / Hermas terms not in standard NT Strongs
PATRISTIC_SUPPLEMENT: list[Dict[str, Any]] = [
    {
        "dictionary": "lsj",
        "strongs_id": None,
        "lemma": "διψυχία",
        "normalized_lemma": strip_greek_accents("διψυχία"),
        "transliteration": "dipsychia",
        "gloss": "doubt, hesitation, double-mindedness",
        "definition": "<b>διψυχία</b>, ἡ, <i>doubt, hesitation, double-mindedness</i>. Characteristic virtue-testing term in the Shepherd of Hermas and 1 Clement.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": None,
        "lemma": "ὀξυχολία",
        "normalized_lemma": strip_greek_accents("ὀξυχολία"),
        "transliteration": "oxucholia",
        "gloss": "quick temper, sudden anger, irascibility",
        "definition": "<b>ὀξυχολία</b>, ἡ, <i>sudden anger, quick temper, irascibility</i>. In Shepherd of Hermas (Mandate 5), the destructive spiritual adversary of patience.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G1374",
        "lemma": "διψυχέω",
        "normalized_lemma": strip_greek_accents("διψυχέω"),
        "transliteration": "dipsycheō",
        "gloss": "to doubt, to hesitate, to be double-minded",
        "definition": "<b>διψυχέω</b>, <i>to be in two minds, hesitate, doubt</i>. Frequently tested in Hermas and 1 Clement.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G3475",
        "lemma": "Μωϋσῆς",
        "normalized_lemma": strip_greek_accents("Μωϋσῆς"),
        "transliteration": "Mōysēs",
        "gloss": "Moses",
        "definition": "<b>Μωϋσῆς</b> (or Μωσῆς), ὁ, <i>Moses</i>, the Hebrew prophet, leader, and lawgiver.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": None,
        "lemma": "Πολύκαρπος",
        "normalized_lemma": strip_greek_accents("Πολύκαρπος"),
        "transliteration": "Polykarpos",
        "gloss": "Polycarp",
        "definition": "<b>Πολύκαρπος</b>, ὁ, <i>Polycarp</i> (literally 'bearing much fruit'), Bishop of Smyrna, disciple of the Apostle John, and apostolic martyr.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G1138",
        "lemma": "Δαυίδ",
        "normalized_lemma": strip_greek_accents("Δαυίδ"),
        "transliteration": "Dauid",
        "gloss": "David",
        "definition": "<b>Δαυίδ</b>, ὁ, indecl., <i>David</i>, King of Israel, shepherd, and psalmist.",
    },
]


class LSJAdapter:
    def __init__(self, lexicon_dir: Optional[Path] = None):
        self.lexicon_dir = lexicon_dir or LEXICON_DIR
        self.core_file = self.lexicon_dir / "TFLSJ_0_5624.txt"
        self.extra_file = self.lexicon_dir / "TFLSJ_extra.txt"

    def iter_entries(self) -> Iterator[Dict[str, Any]]:
        seen_keys = set()

        for filepath in [self.core_file, self.extra_file]:
            if not filepath.exists():
                print(f"Warning: LSJ file missing: {filepath}")
                continue

            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line_s = line.strip("\r\n")
                    if not line_s or line_s.startswith("@") or line_s.startswith("#"):
                        continue

                    parts = line_s.split("\t")
                    if len(parts) < 6:
                        continue

                    raw_strongs = parts[0].strip()
                    m = re.match(r"^G(\d+)", raw_strongs)
                    strongs_id = f"G{int(m.group(1))}" if m else None

                    headword = parts[3].strip() if len(parts) > 3 else ""
                    if not headword:
                        continue

                    translit = parts[4].strip() if len(parts) > 4 else ""
                    gloss = parts[6].strip() if len(parts) > 6 else ""
                    defn = parts[7].strip() if len(parts) > 7 else ""
                    plain_key = strip_greek_accents(headword)

                    entry = {
                        "dictionary": "lsj",
                        "strongs_id": strongs_id,
                        "lemma": headword,
                        "normalized_lemma": plain_key,
                        "transliteration": translit,
                        "gloss": gloss,
                        "definition": defn,
                    }

                    if plain_key not in seen_keys:
                        seen_keys.add(plain_key)
                        yield entry

                    # Generate Deponent / Middle and -μι / -υω aliases
                    # 1. Active -ω <-> Middle -ομαι
                    if plain_key.endswith("ω") and not plain_key.endswith("εω") and not plain_key.endswith("αω"):
                        mid_key = plain_key[:-1] + "ομαι"
                        if mid_key not in seen_keys:
                            seen_keys.add(mid_key)
                            yield {
                                **entry,
                                "lemma": headword[:-1] + "ομαι" if headword.endswith("ω") else headword,
                                "normalized_lemma": mid_key,
                            }
                    elif plain_key.endswith("ομαι"):
                        act_key = plain_key[:-4] + "ω"
                        if act_key not in seen_keys:
                            seen_keys.add(act_key)
                            yield {
                                **entry,
                                "lemma": headword[:-4] + "ω" if headword.endswith("ομαι") else headword,
                                "normalized_lemma": act_key,
                            }

                    # 2. -υμι <-> -υω
                    if plain_key.endswith("υμι"):
                        alt_key = plain_key[:-3] + "υω"
                        if alt_key not in seen_keys:
                            seen_keys.add(alt_key)
                            yield {
                                **entry,
                                "lemma": headword[:-3] + "υω" if headword.endswith("υμι") else headword,
                                "normalized_lemma": alt_key,
                            }
                    elif plain_key.endswith("υω"):
                        alt_key = plain_key[:-2] + "υμι"
                        if alt_key not in seen_keys:
                            seen_keys.add(alt_key)
                            yield {
                                **entry,
                                "lemma": headword[:-2] + "υμι" if headword.endswith("υω") else headword,
                                "normalized_lemma": alt_key,
                            }

        # Yield supplementary Patristic vocabulary
        for supp in PATRISTIC_SUPPLEMENT:
            if supp["normalized_lemma"] not in seen_keys:
                seen_keys.add(supp["normalized_lemma"])
                yield supp
