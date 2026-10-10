"""Apostolic Fathers Pipeline - Morphological & Lexical Resolution Engine.

Resolves systematic errors, augment misclassifications, and elision artifacts
introduced by automated PROIEL (grc_proiel_lg) treebank tagging in Rick Brannan's
upstream datasets.
"""

from __future__ import annotations
import re
import unicodedata
from typing import Dict, Any, Optional, Tuple

ACCENT_REGEX = re.compile(r"[\u0300-\u036f\u1dc0-\u1dff\u1ab0-\u1aff\u1f00-\u1fff]")


def strip_accents(s: str) -> str:
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s)
    cleaned = ACCENT_REGEX.sub("", nfd)
    return unicodedata.normalize("NFC", cleaned).lower().strip()


# 1. Elisions table: Surface/Lemma -> (Canonical Lemma, POS, Morph)
ELISION_MAP: Dict[str, Tuple[str, str, str]] = {
    "ἀλλ": ("ἀλλά", "C-", "--------"),
    "ἀλλ’": ("ἀλλά", "C-", "--------"),
    "ἀλλ'": ("ἀλλά", "C-", "--------"),
    "δι": ("διά", "P-", "--------"),
    "δι’": ("διά", "P-", "--------"),
    "δι'": ("διά", "P-", "--------"),
    "ἐπ": ("ἐπί", "P-", "--------"),
    "ἐπ’": ("ἐπί", "P-", "--------"),
    "ἐφ": ("ἐπί", "P-", "--------"),
    "ἐφ’": ("ἐπί", "P-", "--------"),
    "μετ": ("μετά", "P-", "--------"),
    "μετ’": ("μετά", "P-", "--------"),
    "μεθ": ("μετά", "P-", "--------"),
    "μεθ’": ("μετά", "P-", "--------"),
    "κατ": ("κατά", "P-", "--------"),
    "κατ’": ("κατά", "P-", "--------"),
    "καθ": ("κατά", "P-", "--------"),
    "καθ’": ("κατά", "P-", "--------"),
    "ὑπ": ("ὑπό", "P-", "--------"),
    "ὑπ’": ("ὑπό", "P-", "--------"),
    "ὑφ": ("ὑπό", "P-", "--------"),
    "ὑφ’": ("ὑπό", "P-", "--------"),
    "ἀπ": ("ἀπό", "P-", "--------"),
    "ἀπ’": ("ἀπό", "P-", "--------"),
    "ἀφ": ("ἀπό", "P-", "--------"),
    "ἀφ’": ("ἀπό", "P-", "--------"),
    "παρ": ("παρά", "P-", "--------"),
    "παρ’": ("παρά", "P-", "--------"),
}

# 2. Canonicalization of malformed lemmas
LEMMA_CANONICALIZATION: Dict[str, str] = {
    "οὕτω(ς)": "οὕτως",
    "οὑτω(ς)": "οὕτως",
    "οὕτω": "οὕτως",
    "μέχρι(ς)": "μέχρι",
    "ἄχρι(ς)": "ἄχρι",
    "πεδίδωμι": "ἐπιδίδωμι",
    "ἵζημι": "ζάω",
    "παρηγγέλλω": "παραγγέλλω",
    "ἐγκρατεύω": "ἐγκρατεύομαι",
    "ἡρμόδομαι": "ἁρμόζω",
    "θελέω": "θέλω",
    "διψυχήω": "διψυχέω",
    "ἐπιδεδωκότης": "ἐπιδίδωμι",
    "ἐγνώριζομαι": "γνωρίζω",
    "λήμπτω": "λαμβάνω",
    "τουτέιμι": "τουτέστιν",
    "διαλίπω": "διαλείπω",
    "ἀποκριθεῖσος": "ἀποκρίνομαι",
    "γνώρισος": "γνωρίζω",
    "δήλωσος": "δηλόω",
    "ἐπιτύχω": "ἐπιτυγχάνω",
    "ἠρμένος": "αἴρω",
    "Ἔδειξε": "δείκνυμι",
    "ἔδειξε": "δείκνυμι",
    "ἐργάσησθε": "ἐργάζομαι",
    "ἀγαλλιάσεται": "ἀγαλλιάω",
    "ἐλάλησας": "λαλέω",
}

# 3. High-confidence surface overrides for verbs and blindspots
# surface (cleaned, no punct) -> (lemma, pos, morph)
SURFACE_OVERRIDES: Dict[str, Tuple[str, str, str]] = {
    # 1 Clement 1:3 Imperfect series misclassified by PROIEL as Imperative
    "παρηγγέλλετε": ("παραγγέλλω", "V-", "2IAI-P--"),
    "ἐπετρέπετε": ("ἐπιτρέπω", "V-", "2IAI-P--"),
    "ἐπορεύεσθε": ("πορεύομαι", "V-", "2IMI-P--"),
    # Participles wrongly treated as lemmas
    "ἀποκριθείς": ("ἀποκρίνομαι", "V-", "-APPNSM-"),
    "ἀποκριθεῖσα": ("ἀποκρίνομαι", "V-", "-APPNSF-"),
    "ἠρμένων": ("αἴρω", "V-", "-XMPGPM-"),
    "ἐπιδεδωκότας": ("ἐπιδίδωμι", "V-", "-XAPAPM-"),
    # Augmented / Past tense forms
    "ἐπεδίδουν": ("ἐπιδίδωμι", "V-", "3IAI-P--"),
    "ἡρμόσθησαν": ("ἁρμόζω", "V-", "3API-P--"),
    "ἔδειξε": ("δείκνυμι", "V-", "3AAI-S--"),
    "Ἔδειξε": ("δείκνυμι", "V-", "3AAI-S--"),
    "ἐγνώρισας": ("γνωρίζω", "V-", "2AAI-S--"),
    "ἐλάλησας": ("λαλέω", "V-", "2AAI-S--"),
    # Subjunctives / Futures
    "θελήσῃς": ("θέλω", "V-", "2AAS-S--"),
    "διψυχήσεις": ("διψυχέω", "V-", "2FAI-S--"),
    "διψυχήσῃς": ("διψυχέω", "V-", "2AAS-S--"),
    "ζήσονται": ("ζάω", "V-", "3FMI-P--"),
    "λήμψῃ": ("λαμβάνω", "V-", "2FMI-S--"),
    "ἐργάσησθε": ("ἐργάζομαι", "V-", "2AMS-P--"),
    "διαλίπῃς": ("διαλείπω", "V-", "2AAS-S--"),
    "ὁμοιωθήσῃ": ("ὁμοιόω", "V-", "2FPI-S--"),
    "ἀγαλλιάσεται": ("ἀγαλλιάω", "V-", "3FMI-S--"),
    "ἐπιτύχω": ("ἐπιτυγχάνω", "V-", "1AAS-S--"),
    # Imperatives
    "γνώρισον": ("γνωρίζω", "V-", "2AAD-S--"),
    "γνώρισόν": ("γνωρίζω", "V-", "2AAD-S--"),
    "δήλωσον": ("δηλόω", "V-", "2AAD-S--"),
    "δήλωσόν": ("δηλόω", "V-", "2AAD-S--"),
    "ἔνδυσαι": ("ἐνδύω", "V-", "2AMD-S--"),
    # Infinitives
    "ἐγκρατεύεσθαι": ("ἐγκρατεύομαι", "V-", "-PMN----"),
    # Particles / Idioms
    "τουτέστιν": ("τουτέστιν", "D-", "--------"),
    "τουτέστι": ("τουτέστιν", "D-", "--------"),
}


class MorphResolver:
    """Applies lexical and morphological corrections to raw token streams."""

    @staticmethod
    def resolve_token(token: Dict[str, Any]) -> Dict[str, Any]:
        surface_raw = token.get("w", "")
        # Strip trailing punctuation for matching
        surface_clean = surface_raw.rstrip(".,;:·!?᾽’”“«»()[]")
        lemma_raw = token.get("l", "")
        pos_raw = token.get("p", "")
        morph_raw = token.get("m", "")
        lang = token.get("lang", "grc")

        if lang != "grc":
            return token

        # 1. Check exact surface overrides
        if surface_clean in SURFACE_OVERRIDES:
            corr_lem, corr_pos, corr_morph = SURFACE_OVERRIDES[surface_clean]
            return {
                **token,
                "l": corr_lem,
                "p": corr_pos,
                "m": corr_morph,
            }

        # 2. Check elision table
        norm_surf = strip_accents(surface_clean)
        if surface_clean in ELISION_MAP:
            corr_lem, corr_pos, corr_morph = ELISION_MAP[surface_clean]
            return {
                **token,
                "l": corr_lem,
                "p": corr_pos,
                "m": corr_morph,
            }
        if lemma_raw in ELISION_MAP:
            corr_lem, corr_pos, corr_morph = ELISION_MAP[lemma_raw]
            return {
                **token,
                "l": corr_lem,
                "p": corr_pos,
                "m": corr_morph,
            }

        # 3. Canonicalize lemma if known malformed
        resolved_lemma = LEMMA_CANONICALIZATION.get(lemma_raw, lemma_raw)

        # 4. Fix augment bug where 2nd plural imperfect indicative was marked as imperative
        # e.g. surface starts with past augment and ends in -ετε, morph is 2PAD-P--
        if morph_raw == "2PAD-P--" and surface_clean.endswith("ετε"):
            # If the surface form carries an augment, it is imperfect indicative
            if re.match(r"^(ἐ|ἠ|παρη|κατε|ἀπε|διη|συνε|προε|εἰσε)", surface_clean):
                morph_raw = "2IAI-P--"

        return {
            **token,
            "l": resolved_lemma,
            "m": morph_raw,
        }
