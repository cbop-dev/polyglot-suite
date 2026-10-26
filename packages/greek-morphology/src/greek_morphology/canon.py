"""Linguistic variation and lexicographical canonicalization rules for Greek."""

from __future__ import annotations

import re
from typing import Set, Tuple
from .normalizer import strip_accents


class RegexRule:
    def __init__(self, pattern: str, replacement: str):
        self.regex = re.compile(pattern)
        self.replacement = replacement

    def apply(self, text: str) -> str:
        return self.regex.sub(self.replacement, text)


# Euphony rules
EUPHONY_RULES = [
    RegexRule(r"νγ", "γγ"),
    RegexRule(r"νκ", "γκ"),
    RegexRule(r"νμ", "μμ"),
    RegexRule(r"νχ", "γχ"),
    RegexRule(r"νπ", "μπ"),
    RegexRule(r"νφ", "μφ"),
    RegexRule(r"α+", "α"),
    RegexRule(r"υ+", "υ"),
    RegexRule(r"βτ|φτ", "πτ"),
    RegexRule(r"οο", "ου"),
    RegexRule(r"πσ", "ψ"),
]

# Ending rules
ENDING_RULES = [
    # Active vs Deponent
    RegexRule(r"ω$", "ομαι"),
    RegexRule(r"ομαι$", "ω"),
    RegexRule(r"αω$", "αομαι"),
    RegexRule(r"αομαι$", "αω"),
    RegexRule(r"εω$", "εομαι"),
    RegexRule(r"εομαι$", "εω"),
    # Inceptive / mi verbs
    RegexRule(r"αζω$", "αννυμι"),
    RegexRule(r"αμαι$", "αννυμι"),
    RegexRule(r"νυω$", "νυμι"),
    RegexRule(r"νυμι$", "νυω"),
    RegexRule(r"τιθεμαι$", "τιθημι"),
    RegexRule(r"τιθημι$", "τιθεμαι"),
    RegexRule(r"ολλυω$", "ολλυμι"),
    RegexRule(r"ολλυμι$", "ολλυω"),
    # Koine phonetics
    RegexRule(r"ινομαι$", "ιγνομαι"),
    RegexRule(r"ιγνομαι$", "ινομαι"),
    RegexRule(r"ινωσκω$", "ιγνωσκω"),
    RegexRule(r"ιγνωσκω$", "ινωσκω"),
    # Neuter / Adjective declension citation variations
    RegexRule(r"οσ$", "ον"),
    RegexRule(r"ον$", "οσ"),
    RegexRule(r"οσ$", "η"),
    RegexRule(r"η$", "οσ"),
    RegexRule(r"α$", "η"),
    RegexRule(r"η$", "α"),
    # Contract variants
    RegexRule(r"εοσ$", "ουσ"),
    RegexRule(r"ουσ$", "εοσ"),
    RegexRule(r"εωσ$", "υσ"),
    RegexRule(r"υσ$", "εωσ"),
]

# Well-known particles, pronouns, adverbs, and citation equivalents
MANUAL_EQUIVALENCES: Set[Tuple[str, str]] = {
    # Particles & adverbs
    ("ου", "ουχι"),
    ("ουχι", "ου"),
    ("ουκ", "ου"),
    ("ουχ", "ου"),
    ("ου", "οσ"),
    ("οσ", "ου"),
    ("ενεκα", "ενεκεν"),
    ("ενεκεν", "ενεκα"),
    ("εινεκα", "ενεκα"),
    ("εινεκεν", "ενεκα"),
    ("αν", "εαν"),
    ("εαν", "αν"),
    ("καθοπισθε", "κατοπισθεν"),
    ("κατοπισθεν", "καθοπισθε"),
    ("κυκλω", "κυκλοσ"),
    ("κυκλοσ", "κυκλω"),
    ("πλησιον", "πλησιοσ"),
    ("πλησιοσ", "πλησιον"),
    ("αμφοτεροι", "αμφοτεροσ"),
    ("αμφοτεροσ", "αμφοτεροι"),
    # Verbs
    ("θελω", "εθελω"),
    ("εθελω", "θελω"),
    ("ανοιγω", "ανοιγνυμι"),
    ("ανοιγνυμι", "ανοιγω"),
    ("ομνυω", "ομνυμι"),
    ("ομνυμι", "ομνυω"),
    ("δεικνυω", "δεικνυμι"),
    ("δεικνυμι", "δεικνυω"),
    ("απολλυω", "απολλυμι"),
    ("απολλυμι", "απολλυω"),
    ("εμπιπλημι", "εμπιμπλημι"),
    ("εμπιμπλημι", "εμπιπλημι"),
    ("πιπλημι", "πιμπλημι"),
    ("πιμπλημι", "πιπλημι"),
    ("φαγω", "εσθιω"),
    ("εσθιω", "φαγω"),
    ("επω", "λεγω"),
    ("λεγω", "επω"),
    ("ειπον", "λεγω"),
    ("ειπω", "λεγω"),
    ("αδω", "αειδω"),
    ("αειδω", "αδω"),
    ("αεισω", "αδω"),
    ("ευαρεστεω", "ευηρεστεω"),
    ("ευηρεστεω", "ευαρεστεω"),
    ("γηρασκω", "γηραω"),
    ("γηραω", "γηρασκω"),
    # Semitic Proper names
    ("λειασ", "λεια"),
    ("λεια", "λειασ"),
    ("γομορρασ", "γομορρα"),
    ("γομορρα", "γομορρασ"),
    ("σαρρασ", "σαρρα"),
    ("σαρρα", "σαρρασ"),
    ("μαριαμ", "μαρια"),
    ("μαρια", "μαριαμ"),
    ("ρουβην", "ρουβασ"),
    ("ρουβασ", "ρουβην"),
    ("αρραν", "αρρα"),
    ("αρρα", "αρραν"),
    ("θαμνα", "θαμνασ"),
    ("θαμνασ", "θαμνα"),
    ("χοδαδ", "χοδδαδ"),
    ("χοδδαδ", "χοδαδ"),
    ("μανασσησ", "μανασση"),
    ("μανασση", "μανασσησ"),
    ("ιερουσαλημ", "ιεροσολυμα"),
    ("ιεροσολυμα", "ιερουσαλημ"),
}


def generate_variations(plain: str) -> Set[str]:
    """Generate potential linguistic variants of a plain Greek word."""
    results = {plain}

    # 1. Apply ending rules
    for rule in ENDING_RULES:
        v = rule.apply(plain)
        if v != plain:
            results.add(v)

    # 2. Apply euphony rules
    for rule in EUPHONY_RULES:
        v = rule.apply(plain)
        if v != plain:
            results.add(v)
            for erule in ENDING_RULES:
                ev = erule.apply(v)
                if ev != v:
                    results.add(ev)

    # 3. Koine phonetics: γιν <-> γιγν
    if "γιν" in plain:
        results.add(plain.replace("γιν", "γιγν"))
    if "γιγν" in plain:
        results.add(plain.replace("γιγν", "γιν"))

    return results


def are_lexically_equivalent(lem1: str, lem2: str) -> bool:
    """Check if two lemmata are equivalent under lexical/citation conventions."""
    if not lem1 or not lem2:
        return False

    p1 = strip_accents(lem1)
    p2 = strip_accents(lem2)

    # Exact plain match
    if p1 == p2:
        return True

    # Check manual equivalences
    if (p1, p2) in MANUAL_EQUIVALENCES or (p2, p1) in MANUAL_EQUIVALENCES:
        return True

    # Rule-based variations
    vars1 = generate_variations(p1)
    if p2 in vars1:
        return True

    vars2 = generate_variations(p2)
    if p1 in vars2:
        return True

    # Intersection of variations
    if vars1.intersection(vars2):
        return True

    return False
