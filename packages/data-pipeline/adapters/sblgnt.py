"""Polyglot Bible Reader - SBL Greek New Testament (SBLGNT) Adapter.

Parses MorphGNT SBLGNT files (sblgnt-master.zip), extracting
all 27 NT books (Matthew to Revelation) with accented Greek words, lemmas,
MorphGNT morphological codes, Extended Strong's IDs, glosses, and punctuation.
"""

from __future__ import annotations
import json
import re
import unicodedata
import zipfile
from pathlib import Path
from typing import Iterator, Optional, List, Dict, Tuple
from .base import BaseAdapter, VerseUnit, WordToken
from ..config import CACHE_DIR, MONOREPO_ROOT
from ..tvtms import TVTMSResolver, load_tvtms

# Mapping of MorphGNT 2-digit book numbers (1-27) to USFM 3-letter codes
NT_BOOK_MAP: Dict[int, str] = {
    1: "MAT", 2: "MRK", 3: "LUK", 4: "JHN", 5: "ACT",
    6: "ROM", 7: "1CO", 8: "2CO", 9: "GAL", 10: "EPH",
    11: "PHP", 12: "COL", 13: "1TH", 14: "2TH", 15: "1TI",
    16: "2TI", 17: "TIT", 18: "PHM", 19: "HEB", 20: "JAS",
    21: "1PE", 22: "2PE", 23: "1JN", 24: "2JN", 25: "3JN",
    26: "JUD", 27: "REV"
}

OXIA_TO_TONOS = {
    0x1F70: 0x03AC, 0x1F71: 0x03AC,  # alpha
    0x1F72: 0x03AD, 0x1F73: 0x03AD,  # epsilon
    0x1F74: 0x03AE, 0x1F75: 0x03AE,  # eta
    0x1F76: 0x03AF, 0x1F77: 0x03AF,  # iota
    0x1F78: 0x03CC, 0x1F79: 0x03CC,  # omicron
    0x1F7A: 0x03CD, 0x1F7B: 0x03CD,  # upsilon
    0x1F7C: 0x03CE, 0x1F7D: 0x03CE,  # omega
    # Capitals
    0x1FBB: 0x0386, 0x1FC9: 0x0388, 0x1FCB: 0x0389,
    0x1FDB: 0x038A, 0x1FEB: 0x038E, 0x1FF9: 0x038C, 0x1FFB: 0x038F,
}

def to_tonos(s: str) -> str:
    """Converts Greek polytonic Oxia to modern Tonos, normalized NFC."""
    return unicodedata.normalize("NFC", s.translate(OXIA_TO_TONOS))

def strip_accents(s: str) -> str:
    """Strips all Greek accents, breathing marks, and normalizes sigmas to σ."""
    s = unicodedata.normalize("NFD", s)
    s = re.sub(r"[\u0300-\u036f\u1fbd\u1fbf\u1fc0]", "", s)
    return unicodedata.normalize("NFC", s).replace("ς", "σ").lower().strip()


# Specific irregular lemma overrides (from MorphGNT conventions to standard Strong's/gloss)
LEMMA_OVERRIDES: Dict[str, Tuple[str, str]] = {
    "μέχρι(ς)": ("G3360", "until"),
    "ἄχρις": ("G891", "until"),
    "μαράνα": ("G3134", "our Lord"),
    "θά": ("G3134", "come!"),
    "Σεμεΐν": ("G4584", "Semein"),
    "βραχύ": ("G1024", "brief, short"),
    "τρίτον": ("G5154", "third, thirdly"),
    "πτηνόν": ("G4421", "feathered, bird"),
    "ἔκγονον": ("G1549", "descendant"),
    "ἐνάλιον": ("G1724", "marine, in the sea"),
    "πορρώτερον": ("G4206", "further, far"),
    "χρήσιμον": ("G5539", "useful"),
    "ἥδιστα": ("G2236", "most gladly"),
    "τυπικῶς": ("G5112", "as an example"),
    "δεσμόν": ("G1199", "bond, chain"),
    "ἐνορκίζω": ("G1844", "adjure, charge under oath"),
    "ἀντιδιατίθεμαι": ("G475", "oppose"),
    "εὐπάρεδρον": ("G2145", "constant attendance"),
    "Ἰωβήδ": ("G5603", "Obed"),
    "Ναθάμ": ("G3481", "Nathan"),
    "ἔντρομος": ("G1790", "terrified"),
    "ἐπισπείρω": ("G2006", "sow over"),
    "πρωΐα": ("G4405", "early morning"),
    "ἀφυστερέω": ("G853", "fall short"),
    "περισπάομαι": ("G4049", "be distracted"),
}


class SBLGNTAdapter(BaseAdapter):
    corpus_id = "sblgnt"
    title = "The Greek New Testament: SBL Edition"
    language = "grc"
    direction = "ltr"
    category = "bible"
    default_scheme = "GREEK"

    def __init__(self, zip_path: Optional[Path] = None, tvtms: Optional[TVTMSResolver] = None):
        self.zip_path = zip_path or (CACHE_DIR / "sblgnt-master.zip")
        self.tvtms = tvtms or load_tvtms()
        self._lexicon_cache: Dict[str, Tuple[str, str]] = {}
        self._plain_cache: Dict[str, Tuple[str, str]] = {}
        self._load_lexicon()

    def _load_lexicon(self) -> None:
        """Loads BLE's SBLGNT lexemes to resolve Strong's IDs and glosses."""
        ble_lex_path = MONOREPO_ROOT / "apps" / "biblical-lexeme-explorer" / "static" / "data" / "sblgnt" / "lexemes.json"
        if ble_lex_path.exists():
            with open(ble_lex_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for _, entry in data.items():
                lem = entry.get("lemma", "")
                t_lem = to_tonos(lem)
                p_lem = strip_accents(t_lem)
                strongs = entry.get("strongs", "")
                gloss = entry.get("gloss", "")
                val = (strongs, gloss)
                if t_lem not in self._lexicon_cache:
                    self._lexicon_cache[t_lem] = val
                if p_lem not in self._plain_cache:
                    self._plain_cache[p_lem] = val

        # Also fallback to master database lexicon if available
        working_db = MONOREPO_ROOT / "packages" / "data-pipeline" / "build" / "polyglot-working.sqlite3"
        if working_db.exists():
            try:
                import sqlite3
                conn = sqlite3.connect(working_db)
                cur = conn.cursor()
                cur.execute("SELECT strongs_id, lemma, gloss FROM lexicon_entries WHERE strongs_id LIKE 'G%';")
                for sid, l_raw, gl in cur.fetchall():
                    t_l = to_tonos(l_raw)
                    p_l = strip_accents(t_l)
                    val = (sid, gl)
                    if t_l not in self._lexicon_cache:
                        self._lexicon_cache[t_l] = val
                    if p_l not in self._plain_cache:
                        self._plain_cache[p_l] = val
                conn.close()
            except Exception:
                pass

    def _resolve_lex(self, lemma: str) -> Tuple[str, str]:
        """Resolves Strong's ID and gloss for a given MorphGNT lemma."""
        if lemma in LEMMA_OVERRIDES:
            return LEMMA_OVERRIDES[lemma]

        t_lem = to_tonos(lemma)
        if t_lem in self._lexicon_cache:
            return self._lexicon_cache[t_lem]

        p_lem = strip_accents(t_lem)
        if p_lem in self._plain_cache:
            return self._plain_cache[p_lem]

        # Middle/deponent variations: -ομαι -> -ω, -εω, -αω
        if p_lem.endswith("ομαι"):
            stem = p_lem[:-4]
            for alt in [stem + "ω", stem + "εω", stem + "αω"]:
                if alt in self._plain_cache:
                    return self._plain_cache[alt]

        # Neuter / adverb variations
        if p_lem.endswith("ον") or p_lem.endswith("ως"):
            alt = p_lem[:-2] + "ος"
            if alt in self._plain_cache:
                return self._plain_cache[alt]

        return ("", "")

    def iter_verses(self) -> Iterator[VerseUnit]:
        if not self.zip_path.exists():
            raise FileNotFoundError(f"SBLGNT zip not found at {self.zip_path}")

        print(f"Reading SBLGNT text from: {self.zip_path}")

        current_bcv: Optional[Tuple[str, int, int]] = None
        current_tokens: List[WordToken] = []
        current_words_meta: List[str] = []
        total_verses = 0

        with zipfile.ZipFile(self.zip_path) as z:
            txt_names = sorted([n for n in z.namelist() if n.endswith("-morphgnt.txt") and not n.startswith("__MACOSX")])
            if not txt_names:
                raise ValueError("No morphgnt.txt files found in SBLGNT zip")

            for txt_name in txt_names:
                with z.open(txt_name) as f:
                    for line_b in f:
                        line = line_b.decode("utf-8").strip("\r\n")
                        if not line:
                            continue

                        parts = line.split()
                        if len(parts) < 7:
                            continue

                        # Col 0: 6-digit BCV e.g. '010101'
                        bcv_str = parts[0]
                        book_num = int(bcv_str[0:2])
                        ch_num = int(bcv_str[2:4])
                        v_num = int(bcv_str[4:6])

                        book_code = NT_BOOK_MAP.get(book_num)
                        if not book_code:
                            continue

                        this_bcv = (book_code, ch_num, v_num)
                        if current_bcv is not None and this_bcv != current_bcv:
                            prev_book, prev_ch, prev_v = current_bcv
                            std_ref = self.tvtms.resolve_to_standard("GREEK", prev_book, prev_ch, prev_v)
                            yield VerseUnit(
                                corpus_id=self.corpus_id,
                                std_book=std_ref.book,
                                std_chapter=std_ref.chapter,
                                std_verse=std_ref.verse,
                                std_subverse=std_ref.subverse,
                                native_book=prev_book,
                                native_chapter=prev_ch,
                                native_verse=prev_v,
                                native_citation=f"{prev_book} {prev_ch}:{prev_v}",
                                text=" ".join(current_words_meta),
                                tokens=current_tokens
                            )
                            total_verses += 1
                            current_tokens = []
                            current_words_meta = []

                        current_bcv = this_bcv

                        # Col 1: POS, Col 2: Parse, Col 3: Surface with punc, Col 4: Surface plain, Col 5: Norm, Col 6: Lemma
                        pos = parts[1]
                        parse = parts[2]
                        morph_code = f"{pos} {parse}"
                        surface_with_punc = parts[3]
                        surface_plain = parts[4]
                        norm = parts[5]
                        lemma = parts[6]

                        strongs, gloss = self._resolve_lex(lemma)

                        current_words_meta.append(surface_with_punc)

                        # this trailer assignment and WordToken parameter caused 2 bugs: 
                        #   1. punctuation, etc., was stored/displayed twice
                        #   2. the trailer wrongly assumed only suffixes (and not prefixes like apparatus marks) caused the
                        #      differences in length. 
                        # Simplest solution for now: remove trailer logic entirely, and handle punctuation in the UI
                        #
                        #trailer = surface_with_punc[len(surface_plain):] if len(surface_with_punc) > len(surface_plain) else " "

                        token = WordToken(
                            word=surface_with_punc,
                            normalized=norm,
                            lemma=lemma,
                            morph=morph_code,
                            strongs=strongs,
                            gloss=gloss,
                            #trailer=trailer
                        )
                        current_tokens.append(token)

            # Flush last verse
            if current_bcv is not None and current_tokens:
                prev_book, prev_ch, prev_v = current_bcv
                std_ref = self.tvtms.resolve_to_standard("GREEK", prev_book, prev_ch, prev_v)
                yield VerseUnit(
                    corpus_id=self.corpus_id,
                    std_book=std_ref.book,
                    std_chapter=std_ref.chapter,
                    std_verse=std_ref.verse,
                    std_subverse=std_ref.subverse,
                    native_book=prev_book,
                    native_chapter=prev_ch,
                    native_verse=prev_v,
                    native_citation=f"{prev_book} {prev_ch}:{prev_v}",
                    text=" ".join(current_words_meta),
                    tokens=current_tokens
                )
                total_verses += 1

        print(f"SBLGNT parsed: {total_verses:,} verses across 27 NT books.")
