"""Pipeline Core - LSJ Lexicon Adapter.

Loads STEPBible TFLSJ unabridged LSJ lexicon files and indexes entries
by normalized Greek headwords, plain consonant keys, and deponent/variant
aliases for instant lookup.
"""

from __future__ import annotations
import re
import unicodedata
from pathlib import Path
from typing import Iterator, Dict, Any, Optional, List

ACCENT_REGEX = re.compile(r"[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]")


def strip_greek_accents(s: str) -> str:
    """Strips Greek diacritics and breathing marks to yield a normalized search key."""
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s)
    cleaned = ACCENT_REGEX.sub("", nfd)
    return unicodedata.normalize("NFC", cleaned).lower().strip()


class LSJAdapter:
    """Parses and indexes STEPBible TFLSJ unabridged lexicon files."""

    def __init__(
        self,
        lexicon_dir: Path | str,
        core_filename: str = "TFLSJ_0_5624.txt",
        extra_filename: str = "TFLSJ_extra.txt",
        supplements: Optional[List[Dict[str, Any]]] = None,
    ):
        self.lexicon_dir = Path(lexicon_dir).resolve()
        self.core_file = self.lexicon_dir / core_filename
        self.extra_file = self.lexicon_dir / extra_filename
        self.supplements = supplements or []

    def iter_entries(self) -> Iterator[Dict[str, Any]]:
        """Yields parsed and alias-expanded LSJ lexicon entries."""
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

        # Yield any custom corpus supplements
        for supp in self.supplements:
            key = supp.get("normalized_lemma") or strip_greek_accents(supp.get("lemma", ""))
            if key not in seen_keys:
                seen_keys.add(key)
                yield {
                    "dictionary": supp.get("dictionary", "lsj"),
                    "strongs_id": supp.get("strongs_id"),
                    "lemma": supp.get("lemma", ""),
                    "normalized_lemma": key,
                    "transliteration": supp.get("transliteration", ""),
                    "gloss": supp.get("gloss", ""),
                    "definition": supp.get("definition", ""),
                }
