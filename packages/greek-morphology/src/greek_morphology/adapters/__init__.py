"""Corpus adapters for greek_morphology."""

from .base import BaseCorpusAdapter, Token, Verse, BookMeta
from .swete_csv import SweteCsvAdapter
from .plain_text import PlainTextAdapter

__all__ = [
    "BaseCorpusAdapter",
    "Token",
    "Verse",
    "BookMeta",
    "SweteCsvAdapter",
    "PlainTextAdapter",
]
