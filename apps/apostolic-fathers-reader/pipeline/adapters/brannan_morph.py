"""Apostolic Fathers Pipeline - Rick Brannan Morphology & Token Parser.

Parses tokenized files (001-i_clement.txt to 015-diognetus.txt) containing
aligned tokens, part-of-speech codes, morphological analyses, and lemmas
for ancient Greek and Latin sections.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from ..config import CANONICAL_WORKS, MORPH_DIR, AFWork
from ..morph_resolver import MorphResolver


class BrannanMorphParser:
    def __init__(self, morph_dir: Optional[Path] = None):
        self.morph_dir = morph_dir or MORPH_DIR

    def parse_work(self, work: AFWork) -> Dict[Tuple[int, int], Dict[str, Any]]:
        """Parses a work into {(chapter, section): {'tokens': [...], 'text': str, 'lang': str}}."""
        filepath = self.morph_dir / work.brannan_filename
        if not filepath.exists():
            print(f"Warning: Morph file missing: {filepath}")
            return {}

        sections: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}

        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line_s = line.strip()
                if not line_s or line_s.startswith("#"):
                    continue

                parts = line_s.split()
                if len(parts) < 8:
                    continue

                ref = parts[0]
                pos = parts[1]
                morph = parts[2]
                surface_with_punct = parts[3]
                clean_word = parts[4]
                lemma = parts[6] if len(parts) > 6 else clean_word
                lang = parts[7] if len(parts) > 7 else "grc"

                if work.code == "HER":
                    coord = self._parse_hermas_ref(ref)
                else:
                    coord = self._parse_standard_ref(ref)

                if coord not in sections:
                    sections[coord] = []

                token_raw = {
                    "w": surface_with_punct,
                    "l": lemma,
                    "m": morph,
                    "p": pos,
                    "lang": lang
                }
                sections[coord].append(MorphResolver.resolve_token(token_raw))

        # Reconstruct plain text and finalize section
        result: Dict[Tuple[int, int], Dict[str, Any]] = {}
        for coord, tokens in sections.items():
            text_words = [t["w"] for t in tokens]
            # Join words cleanly
            text = " ".join(text_words)
            # Detect dominant language
            lat_count = sum(1 for t in tokens if t.get("lang") == "lat")
            dominant_lang = "lat" if lat_count > len(tokens) / 2 else "grc"

            result[coord] = {
                "tokens": tokens,
                "text": text,
                "lang": dominant_lang
            }

        return result

    def _parse_standard_ref(self, ref: str) -> Tuple[int, int]:
        # Ref format: {work:3}{chapter:3}{section:3}
        if len(ref) >= 9:
            try:
                ch = int(ref[3:6])
                sec = int(ref[6:9])
                return (ch, sec)
            except ValueError:
                pass
        return (1, 1)

    def _parse_hermas_ref(self, ref: str) -> Tuple[int, int]:
        # Ref format: 013 {div:3} {div_num:3} {ch:3} {sec:3}
        if len(ref) >= 15:
            try:
                div = int(ref[3:6])      # 1=Vis, 2=Mand, 3=Sim
                div_num = int(ref[6:9])  # 1..5, 1..12, 1..10
                ch = int(ref[9:12])
                sec = int(ref[12:15])
                # Map to Tauber book 1..27
                if div == 1:
                    bk = div_num          # 1..5
                elif div == 2:
                    bk = 5 + div_num      # 6..17
                elif div == 3:
                    bk = 17 + div_num     # 18..27
                else:
                    bk = 1

                # If ch is 0 and sec is 0, treat as section 1
                sec_code = ch * 100 + sec if sec > 0 else (ch if ch > 0 else 1)
                return (bk, sec_code)
            except ValueError:
                pass
        return (1, 1)


if __name__ == "__main__":
    parser = BrannanMorphParser()
    didache = next(w for w in CANONICAL_WORKS if w.code == "DID")
    did_res = parser.parse_work(didache)
    print(f"Didache parsed sections: {len(did_res)}")
    for k in sorted(did_res.keys())[:3]:
        print(f"  Didache {k[0]}.{k[1]} ({did_res[k]['lang']}): {did_res[k]['text'][:50]}... [{len(did_res[k]['tokens'])} tokens]")
