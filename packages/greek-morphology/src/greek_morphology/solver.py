"""Morphological Constraint Resolution Solver for Ancient and Hellenistic Greek."""

from __future__ import annotations

from typing import Dict, Any, List, Optional, Tuple
from .normalizer import normalize_greek, strip_accents
from .rules import (
    COMMON_LEMMA_OVERRIDES,
    DEPONENT_FIXES,
    SURFACE_LEMMA_OVERRIDES,
    UPOS_TO_APP_POS,
    build_morph_code,
    parse_feats,
)
from .gazetteer import is_semitic_transliteration, canonicalize_proper_name
from .inflexion import gi_verb_check

# Elided word mappings: Surface -> (Canonical Lemma, POS, Morph)
ELIDED_WORDS: Dict[str, Tuple[str, int, str]] = {
    # Conjunctions
    "ἀλλ": ("ἀλλά", 1, "CONJ"), "ἀλλ᾿": ("ἀλλά", 1, "CONJ"), "ἀλλ'": ("ἀλλά", 1, "CONJ"),
    "Ἀλλ": ("ἀλλά", 1, "CONJ"), "Ἀλλ᾿": ("ἀλλά", 1, "CONJ"), "Ἀλλ'": ("ἀλλά", 1, "CONJ"),
    "οὐδ": ("οὐδέ", 1, "CONJ"), "οὐθ": ("οὐδέ", 1, "CONJ"),
    "Οὐδ": ("οὐδέ", 1, "CONJ"), "Οὐθ": ("οὐδέ", 1, "CONJ"),
    "μηδ": ("μηδέ", 1, "CONJ"), "Μηδ": ("μηδέ", 1, "CONJ"),
    "οὔτ": ("οὔτε", 1, "CONJ"), "οὔθ": ("οὔτε", 1, "CONJ"),
    "Οὔτ": ("οὔτε", 1, "CONJ"), "Οὔθ": ("οὔτε", 1, "CONJ"),
    "μήτ": ("μήτε", 1, "CONJ"), "μήθ": ("μήτε", 1, "CONJ"),
    "Μήτ": ("μήτε", 1, "CONJ"), "Μήθ": ("μήτε", 1, "CONJ"),
    "ἵν": ("ἵνα", 1, "CONJ"), "Ἵν": ("ἵνα", 1, "CONJ"),
    "ὥστ": ("ὥστε", 1, "CONJ"), "ὥσθ": ("ὥστε", 1, "CONJ"),
    "Ὥστ": ("ὥστε", 1, "CONJ"), "Ὥσθ": ("ὥστε", 1, "CONJ"),
    "ὅτ": ("ὅτε", 1, "CONJ"), "ὅθ": ("ὅτε", 1, "CONJ"),
    "Ὅτ": ("ὅτε", 1, "CONJ"), "Ὅθ": ("ὅτε", 1, "CONJ"),
    # Prepositions
    "ἐπ": ("ἐπί", 5, "PREP"), "ἐφ": ("ἐπί", 5, "PREP"),
    "Ἐπ": ("ἐπί", 5, "PREP"), "Ἐφ": ("ἐπί", 5, "PREP"),
    "μετ": ("μετά", 5, "PREP"), "μεθ": ("μετά", 5, "PREP"),
    "Μετ": ("μετά", 5, "PREP"), "Μεθ": ("μετά", 5, "PREP"),
    "ἀπ": ("ἀπό", 5, "PREP"), "ἀφ": ("ἀπό", 5, "PREP"),
    "Ἀπ": ("ἀπό", 5, "PREP"), "Ἀφ": ("ἀπό", 5, "PREP"),
    "ὑπ": ("ὑπό", 5, "PREP"), "ὑφ": ("ὑπό", 5, "PREP"),
    "Ὑπ": ("ὑπό", 5, "PREP"), "Ὑφ": ("ὑπό", 5, "PREP"),
    "κατ": ("κατά", 5, "PREP"), "καθ": ("κατά", 5, "PREP"),
    "Κατ": ("κατά", 5, "PREP"), "Καθ": ("κατά", 5, "PREP"),
    "δι": ("διά", 5, "PREP"), "Δι": ("διά", 5, "PREP"),
    "παρ": ("παρά", 5, "PREP"), "Παρ": ("παρά", 5, "PREP"),
    "ἀντ": ("ἀντί", 5, "PREP"), "ἀνθ": ("ἀντί", 5, "PREP"),
    "Ἀντ": ("ἀντί", 5, "PREP"), "Ἀνθ": ("ἀντί", 5, "PREP"),
    # Pronouns & Adjectives
    "τοῦτ": ("οὗτος", 6, "D"), "Τοῦτ": ("οὗτος", 6, "D"),
    "ταῦτ": ("οὗτος", 6, "D"), "Ταῦτ": ("οὗτος", 6, "D"),
    "πάντ": ("πᾶς", 0, "A"), "Πάντ": ("πᾶς", 0, "A"),
}

CLOSED_CLASS_POS: Dict[str, int] = {
    "καί": 1, "δέ": 1, "τε": 1, "ἀλλά": 1, "ὅτι": 1, "ἵνα": 1, "εἰ": 1, "ἐάν": 1, "ὥστε": 1, "ὅτε": 1, "ὅταν": 1, "ἤ": 1,
    "ἐν": 5, "εἰς": 5, "ἐκ": 5, "πρός": 5, "ἀπό": 5, "ὑπό": 5, "διά": 5, "μετά": 5, "κατά": 5, "ἐπί": 5, "περί": 5, "σύν": 5, "ἀνά": 5, "ὑπέρ": 5, "ἕως": 5, "πρό": 5,
    "οὐ": 12, "μή": 12, "ἄν": 12, "δή": 12, "οὖν": 12, "μέν": 12, "γε": 12, "ναί": 12, "ἆρα": 12,
    "ὁ": 6,
}

ARTICLE_SURFACES = {
    "ὁ", "ἡ", "τό", "τὸ", "τόν", "τὸν", "τήν", "τὴν", "τοῦ", "του", "τῆς", "της", "τῷ", "τῳ", "τῇ", "τῃ",
    "οἱ", "αἱ", "τά", "τὰ", "τούς", "τοὺς", "τάς", "τὰς", "τῶν", "των", "τοῖς", "τοις", "ταῖς", "ταις",
    "Ὁ", "Ἡ", "Τό", "Τὸ", "Τόν", "Τὸν", "Τήν", "Τὴν", "Τοῦ", "Τῆς", "Τῷ", "Τῇ",
    "Οἱ", "Αἱ", "Τά", "Τὰ", "Τούς", "Τοὺς", "Τάς", "Τὰς", "Τῶν", "Τοῖς", "Ταῖς",
}

RELATIVE_PRONOUN_SURFACES = {
    "ὅς", "ὃς", "ἥ", "ἣ", "ὅ", "ὃ", "οὗ", "ἧς", "ᾧ", "ᾗ", "ὅν", "ὃν", "ἥν", "ἣν",
    "οἵ", "οἳ", "αἵ", "αἳ", "ἅ", "ἃ", "ὧν", "οἷς", "αἷς", "οὕς", "οὓς", "ἅς", "ἃς",
    "Ὅς", "Ὃς", "Ἥ", "Ἣ", "Ὅ", "Ὃ", "Οὗ", "Ἧς", "ᾯ", "ᾟ", "Ὅν", "Ὃν", "Ἥν", "Ἣν",
    "Οἵ", "Οἳ", "Αἵ", "Αἳ", "Ἅ", "Ἃ", "Ὧν", "Οἷς", "Αἷς", "Οὕς", "Οὓς", "Ἅς", "Ἃς"
}


class MorphologySolver:
    """Constraint resolution solver combining rules, gazetteer, and neural predictions."""

    def __init__(
        self,
        gazetteer: Optional[Dict[str, Dict[str, Any]]] = None,
        gi_cache: Optional[Dict[str, Any]] = None,
    ):
        self.gazetteer = gazetteer or {}
        self.gi_cache = gi_cache or {}

    def resolve_single(
        self,
        surface: str,
        raw: str = "",
        neural_pred: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Resolve a single token's lemma, POS, morphology, and confidence."""
        clean = normalize_greek(surface)
        plain = strip_accents(clean)

        # 1. Surface Overrides
        if clean in SURFACE_LEMMA_OVERRIDES:
            ov = SURFACE_LEMMA_OVERRIDES[clean]
            return {
                "lemma": ov["lemma"],
                "pos": ov["pos"],
                "upos": "VERB" if ov["pos"] == 11 else "NOUN",
                "morph": ov["morph"],
                "confidence": 0.99,
                "source": "surface_override",
            }

        # 2. Elided Words
        for prefix, (e_lem, e_pos, e_morph) in ELIDED_WORDS.items():
            if clean == prefix or clean.startswith(prefix + "’") or clean.startswith(prefix + "'"):
                return {
                    "lemma": e_lem,
                    "pos": e_pos,
                    "upos": "ADP" if e_pos == 5 else "CCONJ",
                    "morph": e_morph,
                    "confidence": 0.98,
                    "source": "elided_override",
                }

        # 3. Definite Article vs Relative Pronoun
        if clean in ARTICLE_SURFACES:
            return {
                "lemma": "ὁ",
                "pos": 6,
                "upos": "DET",
                "morph": "D",
                "confidence": 0.98,
                "source": "article_rule",
            }
        if clean in RELATIVE_PRONOUN_SURFACES:
            return {
                "lemma": "ὅς",
                "pos": 10,
                "upos": "PRON",
                "morph": "R",
                "confidence": 0.98,
                "source": "relative_pronoun_rule",
            }

        # 4. Common closed-class overrides
        if plain in COMMON_LEMMA_OVERRIDES:
            canon_l = COMMON_LEMMA_OVERRIDES[plain]
            pos_val = CLOSED_CLASS_POS.get(canon_l, 15)
            return {
                "lemma": canon_l,
                "pos": pos_val,
                "upos": "ADP" if pos_val == 5 else "CCONJ" if pos_val == 1 else "PART",
                "morph": "PREP" if pos_val == 5 else "CONJ" if pos_val == 1 else "PRT",
                "confidence": 0.98,
                "source": "closed_class_rule",
            }

        # 5. Proper Noun Gazetteer & Semitic heuristics
        if plain in self.gazetteer:
            g_entry = self.gazetteer[plain]
            return {
                "lemma": g_entry["lemma"],
                "pos": 13,
                "upos": "PROPN",
                "morph": "N-PRI" if g_entry.get("is_indeclinable") else "N-PR",
                "confidence": 0.95,
                "source": "gazetteer",
            }

        if is_semitic_transliteration(plain) and (clean[0].isupper() or (raw and raw[0].isupper())):
            canon_l = canonicalize_proper_name(clean)
            return {
                "lemma": canon_l,
                "pos": 13,
                "upos": "PROPN",
                "morph": "N-PRI",
                "confidence": 0.92,
                "source": "semitic_pattern",
            }

        # 6. Neural predictions / Inflexion Verb Check
        if neural_pred:
            pred_lemma = normalize_greek(neural_pred.get("lemma", clean))
            pred_upos = neural_pred.get("upos", "X")
            feats_dict = parse_feats(neural_pred.get("feats", ""))
            morph_code = build_morph_code(pred_upos, feats_dict)

            # Check inflexion verb cache
            if self.gi_cache:
                gi_hit = gi_verb_check(self.gi_cache, clean, pred_upos)
                if gi_hit:
                    gi_lem, gi_m, _ = gi_hit
                    pred_lemma = gi_lem
                    morph_code = gi_m

            # Apply Deponent fix
            if pred_lemma in DEPONENT_FIXES:
                pred_lemma = DEPONENT_FIXES[pred_lemma]

            # Common lemma correction
            if pred_lemma in COMMON_LEMMA_OVERRIDES:
                pred_lemma = COMMON_LEMMA_OVERRIDES[pred_lemma]

            app_pos = UPOS_TO_APP_POS.get(pred_upos, 15)
            if pred_lemma and pred_lemma[0].isupper() and app_pos in (4, 15):
                app_pos = 13

            return {
                "lemma": pred_lemma,
                "pos": app_pos,
                "upos": pred_upos,
                "morph": morph_code,
                "confidence": 0.88,
                "source": "neural_solver",
            }

        # Fallback
        return {
            "lemma": clean,
            "pos": 13 if clean[0].isupper() else 4,
            "upos": "PROPN" if clean[0].isupper() else "NOUN",
            "morph": "X",
            "confidence": 0.50,
            "source": "fallback",
        }
