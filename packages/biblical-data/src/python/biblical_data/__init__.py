"""biblical_data: Reusable data models and readers for LXX, SBLGNT, BHS and LSJ dictionary."""

from .models import Lexeme, BookInfo, SectionEntry, ConcordanceEntry, VerseEntry, DictionaryEntry
from .reader import CorpusReader, LsjDictionaryReader

__version__ = "0.1.0"

__all__ = [
    "Lexeme",
    "BookInfo",
    "SectionEntry",
    "ConcordanceEntry",
    "VerseEntry",
    "DictionaryEntry",
    "CorpusReader",
    "LsjDictionaryReader",
]
