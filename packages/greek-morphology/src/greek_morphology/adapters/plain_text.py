"""Plain Text Greek Corpus Adapter."""

from __future__ import annotations

import re
from typing import List, Dict, Tuple, Union
from ..normalizer import normalize_greek, strip_accents
from .base import BaseCorpusAdapter, Token, Verse, BookMeta

PUNCTUATION_REGEX = re.compile(r"[.,;:·!?᾽'\"«»\-\u2014()\[\]]+")


class PlainTextAdapter(BaseCorpusAdapter):
    """Adapter for raw Greek sentences or plain text lines."""

    def __init__(self, text_or_lines: Union[str, List[str]], title: str = "Text"):
        if isinstance(text_or_lines, str):
            self.lines = [line.strip() for line in text_or_lines.strip().split("\n") if line.strip()]
        else:
            self.lines = [line.strip() for line in text_or_lines if line.strip()]
        self.title = title

    def load_corpus(self) -> tuple[List[Token], List[Verse], Dict[int, BookMeta]]:
        tokens: List[Token] = []
        verses: List[Verse] = []
        books_dict: Dict[int, BookMeta] = {
            1: BookMeta(id=1, name=self.title, abbrev=self.title[:6], words=0, chapters={1: "1"})
        }

        total_words = 0
        for line_idx, line in enumerate(self.lines):
            v_id = line_idx + 1
            raw_words = line.split()
            verse_token_indices = []

            for raw_w in raw_words:
                cleaned = PUNCTUATION_REGEX.sub("", raw_w)
                norm_w = normalize_greek(cleaned)
                if not norm_w:
                    continue

                tok_idx = len(tokens)
                verse_token_indices.append(tok_idx)
                plain = strip_accents(norm_w)
                tokens.append(Token(
                    raw=raw_w,
                    clean=norm_w,
                    plain=plain,
                    verse_id=v_id,
                    book_abbrev=self.title[:6],
                    chap=1,
                    verse=v_id,
                ))
                total_words += 1

            verses.append(Verse(
                id=v_id,
                section=f"{self.title[:6]} 1:{v_id}",
                text=line,
                book_abbrev=self.title[:6],
                chap=1,
                verse=v_id,
                token_indices=verse_token_indices
            ))

        books_dict[1].words = total_words
        return tokens, verses, books_dict
