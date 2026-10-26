"""Swete 1930 Septuagint CSV Corpus Adapter."""

from __future__ import annotations

import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Tuple, Any

from ..normalizer import normalize_greek, strip_accents
from .base import BaseCorpusAdapter, Token, Verse, BookMeta

SWETE_BOOK_MAP: Dict[str, str] = {
    "Gen": "Gen", "Exo": "Exod", "Lev": "Lev", "Num": "Num", "Deu": "Deut",
    "Jos": "Josh", "Jdg": "Judg", "Rut": "Ruth", "1Sa": "1Sam", "2Sa": "2Sam",
    "1Ki": "1Kgs", "2Ki": "2Kgs", "1Ch": "1Chr", "2Ch": "2Chr", "1Es": "1Esdr",
    "Ezr": "Ezra", "Neh": "Neh", "Est": "Esth", "Jdt": "Jdt", "Tob": "TobBA",
    "Tbs": "TobS", "1Ma": "1Mac", "2Ma": "2Mac", "3Ma": "3Mac", "4Ma": "4Mac",
    "Psa": "Ps", "Pro": "Prov", "Ecc": "Qoh", "Sol": "Cant", "Job": "Job",
    "Wis": "Wis", "Sip": "SirProl", "Sir": "Sir", "Hos": "Hos", "Amo": "Amos",
    "Mic": "Mic", "Joe": "Joel", "Oba": "Obad", "Jon": "Jonah", "Nah": "Nah",
    "Hab": "Hab", "Zep": "Zeph", "Hag": "Hag", "Zec": "Zech", "Mal": "Mal",
    "Isa": "Isa", "Jer": "Jer", "Bar": "Bar", "Lam": "Lam", "Epj": "EpJer",
    "Eze": "Ezek", "Sus": "Sus", "Sut": "SusTh", "Dan": "Dan", "Dat": "DanTh",
    "Bel": "Bel", "Bet": "BelTh", "Pss": "PsSol", "Ode": "Od", "1En": "1En"
}

ALL_CAPS_NORMALIZATIONS: Dict[str, str] = {
    "ΕΝ": "Ἐν", "ΑΡΧΗ": "ἀρχῇ", "ΤΑΥΤΑ": "Ταῦτα", "ΚΑΙ": "Καὶ", "ΟΥΤΟΙ": "Οὗτοι",
    "ἌΝΘΡΩΠΟΣ": "Ἄνθρωπος", "ΑΝΘΡΩΠΟΣ": "Ἄνθρωπος", "ΑΔΑΜ": "Ἀδάμ", "ΛΟΓΟΙ": "Λόγοι",
    "ΜΑΚΑΡΙΟΣ": "Μακάριος", "ΠΑΡΟΙΜΙΑΙ": "Παροιμίαι", "ΑΣΜΑ": "ᾎσμα", "ΑΣΜΑΤΩΝ": "ᾀσμάτων",
    "ΟΡΑCΙC": "Ὅρασις", "ΟΡΑΣΙΣ": "Ὅρασις", "ΤΟ": "Τὸ", "ΤΟΙΣ": "Τοῖς", "ΔΕ": "Δὲ",
    "ΡΗΜΑ": "ῥῆμα", "ΡΗΜΑΤΑ": "Ῥήματα", "ΠΡΟΦΗΤΕΙΑ": "Προφητεία", "ΒΙΒΛΟΣ": "Βίβλος",
    "ΛΗΜΜΑ": "Λῆμμα", "ΠΡΟΣΕΥΧΗ": "Προσευχή", "ΑΙΝΕΣΙΣ": "Αἴνεσις", "ΩΔΗ": "ᾨδή",
    "ΩΔΑΙ": "ᾨδαί", "ΕΤΟΥΣ": "Ἔτους", "ΑΓΑΠΗΣΑΤΕ": "Ἀγαπήσατε", "ΠΟΛΛΩΝ": "Πολλῶν",
    "ΠΑΣΑ": "Πᾶσα", "ΛΟΓΟΣ": "Λόγος", "ΑΝΤΙΓΡΑΦΟΝ": "Ἀντίγραφον", "ΕΠΙ": "Ἐπί",
    "ΦΙΛΟΣΟΦΩΤΑΤΟΝ": "Φιλοσοφώτατον", "ΕΒΟΗΣΑ": "Ἐβόησα", "ΑΣΩΜΕΝ": "ᾌσωμεν",
    "ΣέΒεε": "Σέβεε", "ΙΙερσῶν": "Περσῶν",
}

EDITORIAL_CHARS = set("⸂⸃⸆⸇⸀⸁⸄⸅⸈⸉⸊⸋[]⟦⟧⟨⟩⟪⟫()†‡*0123456789")


class SweteCsvAdapter(BaseCorpusAdapter):
    """Adapter for Henry Barclay Swete 1930 Septuagint CSV transcripts."""

    def __init__(self, versification_csv: Path, words_csv: Path):
        self.versification_csv = Path(versification_csv)
        self.words_csv = Path(words_csv)

    def load_corpus(self) -> tuple[List[Token], List[Verse], Dict[int, BookMeta]]:
        intervals = []
        with open(self.versification_csv, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) != 2:
                    continue
                start_idx = int(parts[0])
                raw_ref = parts[1]

                if "." in raw_ref:
                    raw_book, chap_verse = raw_ref.split(".", 1)
                else:
                    raw_book = raw_ref
                    chap_verse = "1:1"

                canonical_book = SWETE_BOOK_MAP.get(raw_book, raw_book)

                if ":" in chap_verse:
                    chap_str, v_str = chap_verse.split(":", 1)
                else:
                    chap_str, v_str = chap_verse, "1"

                try:
                    chap = int(chap_str)
                except ValueError:
                    chap = 1
                try:
                    verse = int(v_str)
                except ValueError:
                    verse = 1

                ref_str = f"{canonical_book} {chap_str}:{v_str}"
                intervals.append((start_idx, canonical_book, chap, verse, ref_str))

        raw_words = []
        with open(self.words_csv, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.rstrip("\n").split("\t")
                raw_words.append(parts[0] if parts else "")

        tokens: List[Token] = []
        verses: List[Verse] = []
        books_dict: Dict[int, BookMeta] = {}

        current_verse_idx = 0
        curr_book, curr_chap, curr_verse, curr_ref = intervals[0][1:]
        verse_words = []
        verse_tokens_start = 0

        book_counts = Counter()
        book_chapters = defaultdict(dict)
        book_id_map = {}
        next_book_id = 1000

        for i, raw_word in enumerate(raw_words):
            if current_verse_idx + 1 < len(intervals) and i >= intervals[current_verse_idx + 1][0]:
                if verse_words:
                    v_text = " ".join(verse_words)
                    verses.append(Verse(
                        id=current_verse_idx + 1,
                        section=curr_ref,
                        text=v_text,
                        book_abbrev=curr_book,
                        chap=curr_chap,
                        verse=curr_verse,
                        token_indices=list(range(verse_tokens_start, len(tokens)))
                    ))
                current_verse_idx += 1
                curr_book, curr_chap, curr_verse, curr_ref = intervals[current_verse_idx][1:]
                verse_words = []
                verse_tokens_start = len(tokens)

            # Clean word
            cleaned = "".join(c for c in raw_word if c not in EDITORIAL_CHARS)
            # Remove punctuation
            word_chars = []
            for c in cleaned:
                if c.isalpha() or c in ("\u0300", "\u0301", "\u0313", "\u0314", "\u0342", "\u0345", "\u0308"):
                    word_chars.append(c)

            norm_word = "".join(word_chars)
            if norm_word in ALL_CAPS_NORMALIZATIONS:
                norm_word = ALL_CAPS_NORMALIZATIONS[norm_word]

            norm_word = normalize_greek(norm_word)
            if not norm_word:
                continue

            verse_words.append(cleaned)
            plain = strip_accents(norm_word)
            tokens.append(Token(
                raw=raw_word,
                clean=norm_word,
                plain=plain,
                verse_id=current_verse_idx + 1,
                book_abbrev=curr_book,
                chap=curr_chap,
                verse=curr_verse,
            ))
            book_counts[curr_book] += 1
            book_chapters[curr_book][curr_chap] = str(curr_chap)

        # Final verse
        if verse_words:
            v_text = " ".join(verse_words)
            verses.append(Verse(
                id=current_verse_idx + 1,
                section=curr_ref,
                text=v_text,
                book_abbrev=curr_book,
                chap=curr_chap,
                verse=curr_verse,
                token_indices=list(range(verse_tokens_start, len(tokens)))
            ))

        for b_abbrev, count in book_counts.items():
            b_id = next_book_id
            next_book_id += 1
            books_dict[b_id] = BookMeta(
                id=b_id,
                name=b_abbrev,
                abbrev=b_abbrev,
                words=count,
                chapters=book_chapters[b_abbrev]
            )

        return tokens, verses, books_dict
