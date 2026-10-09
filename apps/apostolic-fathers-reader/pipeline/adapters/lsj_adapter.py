"""Apostolic Fathers Pipeline - LSJ Lexicon Adapter.

Loads STEPBible's TFLSJ full LSJ lexicon files and indexes entries
by normalized Greek headwords and plain consonant keys for instant lookup.
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


class LSJAdapter:
    def __init__(self, lexicon_dir: Optional[Path] = None):
        self.lexicon_dir = lexicon_dir or LEXICON_DIR
        self.core_file = self.lexicon_dir / "TFLSJ_0_5624.txt"
        self.extra_file = self.lexicon_dir / "TFLSJ_extra.txt"

    def iter_entries(self) -> Iterator[Dict[str, Any]]:
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
                    if not m:
                        continue

                    strongs_id = f"G{int(m.group(1))}"
                    headword = parts[3].strip() if len(parts) > 3 else ""
                    if not headword:
                        continue

                    translit = parts[4].strip() if len(parts) > 4 else ""
                    gloss = parts[6].strip() if len(parts) > 6 else ""
                    defn = parts[7].strip() if len(parts) > 7 else ""
                    plain_key = strip_greek_accents(headword)

                    yield {
                        "dictionary": "lsj",
                        "strongs_id": strongs_id,
                        "lemma": headword,
                        "normalized_lemma": plain_key,
                        "transliteration": translit,
                        "gloss": gloss,
                        "definition": defn,
                    }


if __name__ == "__main__":
    adapter = LSJAdapter()
    count = 0
    sample = None
    for entry in adapter.iter_entries():
        count += 1
        if entry["lemma"] == "ἀγάπη":
            sample = entry
    print(f"Total LSJ entries: {count:,}")
    if sample:
        print(f"Sample 'ἀγάπη': gloss='{sample['gloss']}', def={sample['definition'][:60]}...")
