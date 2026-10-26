"""Lemma Consolidator for Greek Headword Normalization & Deduplication."""

from __future__ import annotations

from typing import Dict, Set, Any, List, Optional
from collections import Counter, defaultdict
from .normalizer import strip_accents, normalize_greek

# High-frequency gentilic / ethnic adjectives that legitimately retain capitalization
GENTILIC_LEMMAS: Set[str] = {
    "Ἰουδαῖος", "Ἰουδαία", "Ἰσραηλίτης", "Λευίτης", "Λευιτικός",
    "Ἀσσύριος", "Αἰγύπτιος", "Χαλδαῖος", "Ἀμορραῖος", "Χαναναῖος",
    "Φυλιστιείμ", "Μωαβίτης", "Ἀμμανίτης", "Ἐδωμίτης", "Σύρος",
    "Πέρσης", "Περσικός", "Ἕλλην", "Ἑλληνικός", "Ἑβραῖος",
}

# Explicit overrides for corruptions, apparatus relics, and known single-token anomalies
EXPLICIT_CONSOLIDATIONS: Dict[str, str] = {
    # Relics / Apparatus tokens / Incipit drop caps
    "ΛΟΓΟΣ": "λόγος",
    "ΠΑΣΑ": "πᾶς",
    "ἀάρω": "θαρσέω",
    "ἀαδίζω": "βαδίζω",
    "ἁαδίζω": "βαδίζω",
    "ἀαθίζω": "καθίζω",
    "ἀαλύπτω": "καλύπτω",
    "ἀακράν": "μακράν",
    "ἀάρειμι": "Θαρσά",
    "ἀάπειμι": "Σαβά",
    "δοιέω": "ποιέω",
    "ὁανέω": "ἱκανόω",
    "αασιλεύω": "βασιλεύω",
    "αατρεύω": "ἰατρεύω",
    "ααδιάζομαι": "Χαδιάσαι",
    "Eπάκουσος": "Ἐπάκουσος",
    "Eπίστρέφος": "Ἐπίστρεφος",
    "nηστεύω": "νηστεύω",
    "Ελογέω": "εὐλογέω",
    "ελογέω": "εὐλογέω",
    "ΑΝΘΡΩεύς": "ἄνθρωπος",
    "ΡΗΜΑΤεύς": "ῥῆμα",
    "ΑΓΑιΗΣΑΤήν": "ἀγαπάω",
    "ΠΟΛΛΩς": "πολύς",
    "ΑΝΤΙΓΡαΦῷς": "ἀντίγραφον",
    "ΦΙΛΟλΟΦΩΤν": "φιλόσοφος",
    "ΕΒΟΗυα": "βοάω",
    "ΑΣΩΜα": "ᾄδω",
    # Elided word fallbacks
    "ἀάλ": "ἀλλά",
    "ἀλλάω": "ἀλλά",
    "Ἀλλ": "ἀλλά",
    "ἀλλ": "ἀλλά",
    "ἐπ": "ἐπί",
    "ἐφ": "ἐπί",
    "ἐφός": "ἐπί",
    "μετ": "μετά",
    "μεθ": "μετά",
    "μέτος": "μετά",
    "ἀπ": "ἀπό",
    "ἀφ": "ἀπό",
    "ἀπόπ": "ἀπό",
    "ἀπόφ": "ἀπό",
    "δι": "διά",
    "κατ": "κατά",
    "καθ": "κατά",
    "κατάθ": "κατά",
    "παρ": "παρά",
    "ὑπ": "ὑπό",
    "ὑφ": "ὑπό",
    "ἀντ": "ἀντί",
    "ἀνθ": "ἀντί",

    # Single-token typo accents / breathing glitches
    "καἱ": "καί",
    "πρὀς": "πρός",
    "σῦ": "σύ",
    "οὖτος": "οὗτος",
    "αὑτός": "αὐτός",
    "Πάς": "πᾶς",
    # Inflected surface forms mistakenly assigned as distinct lemmas
    "βαθεῖα": "βαθύς",
    "βαρεία": "βαρύς",
    "τράχεια": "τραχύς",
    "φάτναι": "φάτνη",
    "κόγχαι": "κόγχη",
    "βάθαι": "βάθη",
    "ῥόαι": "ῥόα",
    "ἀναβάθμαι": "ἀναβαθμός",
    "πεντήκοντοι": "πεντήκοντα",
    "πεντηκόντων": "πεντήκοντα",
    "ἐνενήκοντοι": "ἐνενήκοντα",
    "τεσσαράκοντοι": "τεσσαράκοντα",
    "ὀγδοήκοντοι": "ὀγδοήκοντα",
    "τριάκοντοι": "τριάκοντα",
    "ἑβδομήκοντοι": "ἑβδομήκοντα",
    "διακόσιοι": "διακόσιοι",
    "τριακόσιοι": "τριακόσιοι",
    "τετρακόσιοι": "τετρακόσιοι",
    "πεντακόσιοι": "πεντακόσιοι",
    "ἑξακόσιοι": "ἑξακόσιοι",
    "ἑπτακόσιοι": "ἑπτακόσιοι",
    "ὀκτακόσιοι": "ὀκτακόσιοι",
    "ἐνακόσιοι": "ἐνακόσιοι",
    "ἐννακόσιοι": "ἐνακόσιοι",
}


class LemmaConsolidator:
    """Consolidates redundant or fractured variants into canonical headwords."""

    def __init__(self, explicit_overrides: Optional[Dict[str, str]] = None):
        self.overrides = dict(EXPLICIT_CONSOLIDATIONS)
        if explicit_overrides:
            self.overrides.update(explicit_overrides)

    def canonicalize_lemma(self, lemma: str) -> str:
        """Return canonical headword for a given lemma."""
        if not lemma:
            return ""
        norm_l = normalize_greek(lemma)
        if norm_l in self.overrides:
            return self.overrides[norm_l]
        if lemma in self.overrides:
            return self.overrides[lemma]
        return norm_l
