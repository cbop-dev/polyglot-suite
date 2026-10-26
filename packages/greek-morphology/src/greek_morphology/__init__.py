"""greek-morphology: High-performance Ancient and Hellenistic Greek lemmatization and NLP engine."""

from .normalizer import normalize_greek, strip_accents, to_beta_code, is_capitalized
from .rules import UPOS_TO_APP_POS, DEPONENT_FIXES, COMMON_LEMMA_OVERRIDES, SURFACE_LEMMA_OVERRIDES
from .canon import are_lexically_equivalent, generate_variations
from .gazetteer import is_semitic_transliteration, canonicalize_proper_name, build_gazetteer_from_tokens
from .gloss import GlossResolver
from .consolidator import LemmaConsolidator
from .solver import MorphologySolver
from .lemmatizer import GreekLemmatizer, LemmatizedWord
from .emit import CorpusEmitter
from .pipeline import MorphologicalPipeline
from .adapters import BaseCorpusAdapter, Token, Verse, BookMeta, SweteCsvAdapter, PlainTextAdapter

__version__ = "0.1.0"

__all__ = [
    "normalize_greek",
    "strip_accents",
    "to_beta_code",
    "is_capitalized",
    "UPOS_TO_APP_POS",
    "DEPONENT_FIXES",
    "COMMON_LEMMA_OVERRIDES",
    "SURFACE_LEMMA_OVERRIDES",
    "are_lexically_equivalent",
    "generate_variations",
    "is_semitic_transliteration",
    "canonicalize_proper_name",
    "build_gazetteer_from_tokens",
    "GlossResolver",
    "LemmaConsolidator",
    "MorphologySolver",
    "GreekLemmatizer",
    "LemmatizedWord",
    "CorpusEmitter",
    "MorphologicalPipeline",
    "BaseCorpusAdapter",
    "Token",
    "Verse",
    "BookMeta",
    "SweteCsvAdapter",
    "PlainTextAdapter",
]
