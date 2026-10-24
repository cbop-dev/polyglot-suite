"""Apostolic Fathers Pipeline - LSJ Lexicon Adapter.

Backward-compatible forwarding adapter around pipeline_core.LSJAdapter,
configured with local patristic supplementary vocabulary.
"""

from __future__ import annotations
from pathlib import Path
from typing import Dict, Any, Optional
from pipeline_core import LSJAdapter as CoreLSJAdapter, strip_greek_accents
from ..config import LEXICON_DIR

# Supplementary Patristic / Hermas terms not in standard NT Strongs
PATRISTIC_SUPPLEMENT: list[Dict[str, Any]] = [
    {
        "dictionary": "lsj",
        "strongs_id": None,
        "lemma": "διψυχία",
        "normalized_lemma": strip_greek_accents("διψυχία"),
        "transliteration": "dipsychia",
        "gloss": "doubt, hesitation, double-mindedness",
        "definition": "<b>διψυχία</b>, ἡ, <i>doubt, hesitation, double-mindedness</i>. Characteristic virtue-testing term in the Shepherd of Hermas and 1 Clement.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": None,
        "lemma": "ὀξυχολία",
        "normalized_lemma": strip_greek_accents("ὀξυχολία"),
        "transliteration": "oxucholia",
        "gloss": "quick temper, sudden anger, irascibility",
        "definition": "<b>ὀξυχολία</b>, ἡ, <i>sudden anger, quick temper, irascibility</i>. In Shepherd of Hermas (Mandate 5), the destructive spiritual adversary of patience.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G1374",
        "lemma": "διψυχέω",
        "normalized_lemma": strip_greek_accents("διψυχέω"),
        "transliteration": "dipsycheō",
        "gloss": "to doubt, to hesitate, to be double-minded",
        "definition": "<b>διψυχέω</b>, <i>to be in two minds, hesitate, doubt</i>. Frequently tested in Hermas and 1 Clement.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G3475",
        "lemma": "Μωϋσῆς",
        "normalized_lemma": strip_greek_accents("Μωϋσῆς"),
        "transliteration": "Mōysēs",
        "gloss": "Moses",
        "definition": "<b>Μωϋσῆς</b>, ὁ, <i>Moses</i>, leader and lawgiver of Israel.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G4178",
        "lemma": "Πολύκαρπος",
        "normalized_lemma": strip_greek_accents("Πολύκαρπος"),
        "transliteration": "Polykarpos",
        "gloss": "Polycarp",
        "definition": "<b>Πολύκαρπος</b>, ὁ, <i>Polycarp</i>, bishop of Smyrna, disciple of John, and martyr.",
    },
    {
        "dictionary": "lsj",
        "strongs_id": "G1138",
        "lemma": "Δαυίδ",
        "normalized_lemma": strip_greek_accents("Δαυίδ"),
        "transliteration": "Dauid",
        "gloss": "David",
        "definition": "<b>Δαυίδ</b>, ὁ, indecl., <i>David</i>, King of Israel, shepherd, and psalmist.",
    },
]


class LSJAdapter(CoreLSJAdapter):
    """Apostolic Fathers LSJ adapter extending CoreLSJAdapter with patristic supplements."""

    def __init__(self, lexicon_dir: Optional[Path] = None):
        super().__init__(
            lexicon_dir=lexicon_dir or LEXICON_DIR,
            core_filename="TFLSJ_0_5624.txt",
            extra_filename="TFLSJ_extra.txt",
            supplements=PATRISTIC_SUPPLEMENT,
        )
