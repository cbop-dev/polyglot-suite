"""Python dataclass models for Biblical Corpora datasets."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class Lexeme:
    id: int
    lemma: str
    gloss: str
    pos: int
    total: int
    beta: str
    plain: str
    strongs: str = ""


@dataclass
class BookInfo:
    name: str
    abbrev: str
    node: int
    words: int
    chapters: Dict[str, str] = field(default_factory=dict)


@dataclass
class SectionEntry:
    words: int
    lex: Dict[str, int] = field(default_factory=dict)


@dataclass
class ConcordanceEntry:
    total: int
    bookcounts: Dict[str, int] = field(default_factory=dict)
    refs: List[str] = field(default_factory=list)
    nodes: List[int] = field(default_factory=list)


@dataclass
class VerseEntry:
    id: int
    section: str
    text: str


@dataclass
class DictionaryEntry:
    headword: str
    def_markdown: str
    lsj_index: Optional[str] = None
    match_type: Optional[str] = None
