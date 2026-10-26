"""Base data models and abstract corpus adapter."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class Token:
    raw: str
    clean: str
    plain: str
    verse_id: int
    book_abbrev: str
    chap: int = 1
    verse: int = 1
    lemma: Optional[str] = None
    pos: Optional[int] = None
    upos: Optional[str] = None
    morph: Optional[str] = None
    confidence: float = 0.0
    source: str = "raw"


@dataclass
class Verse:
    id: int
    section: str
    text: str
    book_abbrev: str
    chap: int
    verse: int
    token_indices: List[int] = field(default_factory=list)


@dataclass
class BookMeta:
    id: int
    name: str
    abbrev: str
    words: int
    chapters: Dict[int, str] = field(default_factory=dict)


class BaseCorpusAdapter(ABC):
    """Abstract base class for reading and tokenizing corpus texts."""

    @abstractmethod
    def load_corpus(self) -> tuple[List[Token], List[Verse], Dict[int, BookMeta]]:
        """Load and tokenize corpus into tokens, verses, and books metadata."""
        pass
