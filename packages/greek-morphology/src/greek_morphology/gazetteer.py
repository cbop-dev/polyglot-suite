"""Biblical Proper Name Gazetteer & Semitic Pattern Recognition Heuristics."""

from __future__ import annotations

from typing import Dict, Any, List, Set, Optional
from collections import Counter, defaultdict
from .normalizer import strip_accents, is_capitalized, normalize_greek
from .rules import DECLINABLE_PROPER_NOUNS, PROPER_NOUN_CANONICAL

# Common words that are capitalized in biblical texts (e.g. at start of quotations or divine titles)
NOT_PROPER_NAMES: Set[str] = {
    # Divine titles / nouns
    "κύριος", "κυρίου", "κυρίῳ", "κύριον", "κύριε",
    "θεός", "θεοῦ", "θεῷ", "θεόν", "θεέ", "θεοί", "θεῶν",
    "ἰδού", "ἰδοὺ", "τί", "τίς", "τίνος", "τίνι", "τίνα",
    "μή", "μὴ", "οὐ", "οὐκ", "οὐχ", "οὐχί",
    # Articles
    "ὁ", "ἡ", "τό", "τόν", "τήν", "τοῦ", "τῆς", "τῷ", "τῇ",
    "τούς", "τάς", "τά", "τῶν", "τοῖς", "ταῖς", "τω", "τοιν",
    # Demonstratives & Pronouns
    "τάδε", "οὗτος", "αὕτη", "τοῦτο", "ταῦτα", "τούτου", "ταύτης", "τούτῳ", "ταύτῃ",
    "τοῦτον", "ταύτην", "τούτων", "τούτοις", "ταύταις", "τούτους", "ταύτας",
    "αὐτός", "αὐτή", "αὐτό", "αὐτοῦ", "αὐτῆς", "αὐτῷ", "αὐτῇ", "αὐτόν", "αὐτήν", "αὐτῶν", "αὐτοῖς", "αὐταῖς", "αὐτούς", "αὐτάς", "αὐτά",
    "πᾶς", "πάντες", "πάντα", "πᾶσα", "παντός", "παντί", "πᾶν",
    "ἐγώ", "ἐγὼ", "ἐμοῦ", "μοῦ", "ἐμοί", "μοί", "ἐμέ", "μέ", "ἡμεῖς", "ἡμῶν", "ἡμῖν", "ἡμᾶς",
    "σύ", "σὺ", "σοῦ", "σοί", "σέ", "ὑμεῖς", "ὑμῶν", "ὑμῖν", "ὑμᾶς",
    "ὅς", "ἥ", "ὅ", "οὗ", "ἧς", "ᾧ", "ᾗ", "ὅν", "ἥν", "ὧν", "οἷς", "αἷς", "οὕς", "ἅς", "ἅ",
    # Conjunctions & Prepositions
    "καί", "καὶ", "δέ", "δὲ", "ἀλλά", "ἀλλὰ", "ὅτι", "εἰ", "ἐάν",
    "ἐν", "εἰς", "ἐκ", "ἐξ", "πρός", "πρὸς", "ἀπό", "ἀπὸ", "ὑπό", "ὑπὸ",
    "διά", "διὰ", "μετά", "μετὰ", "κατά", "κατὰ", "ἐπί", "ἐπὶ", "περί", "περὶ",
    "σύν", "σὺν", "ἀνά", "ἀνὰ", "ὑπέρ", "ὑπὲρ", "ἕως", "πρό", "πρὸ",
    # Common verbs
    "πρόσεχε", "ἄκουσον", "εἶπεν", "εἶπαν", "λέγει", "λέγων", "ἀπεκρίθη",
    "ἐποίησεν", "ἔδωκεν", "ἔστιν", "ἐστιν", "ἦν", "ἦσαν", "ἐγένετο", "ἦλθεν",
    # Common nouns
    "ἄνθρωπος", "ἄνθρωποι", "βασιλεύς", "βασιλέως", "βασιλεῖ",
    "πατήρ", "πατρός", "μήτηρ", "μητρός", "υἱός", "υἱοῦ",
    "οἶκος", "οἴκου", "πόλις", "πόλεως", "γῆ", "γῆς",
    "ἅγιος", "ἅγιοι", "ἁγίων", "δικαιοσύνη", "εἰρήνη",
}

# Consonant endings strictly typical of Semitic transliterations
SEMITIC_CONSONANT_ENDINGS = ("μ", "δ", "λ", "θ", "χ", "κ", "φ", "β", "γ")

# Known Semitic indeclinable names ending in -ν
KNOWN_SEMITIC_N_NAMES: Set[str] = {
    "ααρων", "συμεων", "σολομων", "γεδεων", "σιων", "χανααν", "βαβυλων",
    "λεβανων", "χεβρων", "ερμων", "αμαν", "λαμαν", "μαδιαν", "ωναν",
    "φαραν", "γομορραν", "σαλμων", "ναασσων", "γιων", "βελ", "νεβρων",
    "σαμψων", "ναν", "ρουβην", "αρραν", "βενιαμιν", "γεδδουρ", "ναασ",
    "εφραιμ", "σεδηρ", "σηειρ", "βηθελ", "δαν", "γαδ", "ασηρ",
    "νεφθαλι", "ισαχαρ", "ζαβουλων", "ωρ"
}

# Indeclinable names ending in vowels in biblical tradition
INDECLI_VOWEL_NAMES: Set[str] = {
    "νωε", "ναυη", "μανασση", "σαυχαι", "ιορδανα", "σιναι", "χωρηβ",
    "φαραω", "σαβαωθ", "ιωβηδ", "ιεσσαι", "οχοζια", "ιουδα", "βηρσαβεε",
    "θαμνα"
}


def is_semitic_transliteration(surface: str) -> bool:
    """Return True if surface form exhibits Semitic phonological/orthographic patterns."""
    plain = strip_accents(surface)
    if not plain:
        return False
    if plain.endswith(SEMITIC_CONSONANT_ENDINGS):
        return True
    if plain in KNOWN_SEMITIC_N_NAMES:
        return True
    if plain in INDECLI_VOWEL_NAMES:
        return True
    return False


def canonicalize_proper_name(lemma: str) -> str:
    """Return the canonical representation of a proper noun lemma."""
    if lemma in PROPER_NOUN_CANONICAL:
        return PROPER_NOUN_CANONICAL[lemma]
    plain = strip_accents(lemma)
    for k, v in PROPER_NOUN_CANONICAL.items():
        if strip_accents(k) == plain:
            return v
    return lemma


def build_gazetteer_from_tokens(tokens: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Build a proper noun gazetteer dictionary from a list of token dicts."""
    surface_cap_counts: Dict[str, int] = Counter()
    surface_total_counts: Dict[str, int] = Counter()
    surface_raw_forms: Dict[str, Counter] = defaultdict(Counter)

    for tok in tokens:
        raw = tok.get("raw", "")
        clean = tok.get("clean", "")
        if not clean or not clean[0].isalpha():
            continue

        plain = strip_accents(clean)
        surface_total_counts[plain] += 1
        surface_raw_forms[plain][clean] += 1

        if clean[0].isupper() or (raw and raw[0].isupper()):
            surface_cap_counts[plain] += 1

    gazetteer: Dict[str, Dict[str, Any]] = {}

    for plain, total in surface_total_counts.items():
        cap_count = surface_cap_counts[plain]
        cap_ratio = cap_count / total if total > 0 else 0.0

        most_common_clean = surface_raw_forms[plain].most_common(1)[0][0]
        lemma_candidate = most_common_clean

        is_semitic = is_semitic_transliteration(plain)
        is_known_declinable = any(strip_accents(p) == plain for p in DECLINABLE_PROPER_NOUNS)

        # Proper noun heuristic
        is_proper = False
        if is_semitic and (cap_count > 0 or total < 5):
            is_proper = True
        elif is_known_declinable:
            is_proper = True
        elif cap_ratio >= 0.7 and total >= 2 and most_common_clean.lower() not in NOT_PROPER_NAMES:
            is_proper = True
        elif cap_ratio >= 0.85 and total == 1 and most_common_clean.lower() not in NOT_PROPER_NAMES:
            is_proper = True

        if is_proper:
            canon_lemma = canonicalize_proper_name(lemma_candidate)
            gazetteer[plain] = {
                "lemma": canon_lemma,
                "pos": 13,
                "is_indeclinable": is_semitic and not is_known_declinable,
                "cap_ratio": round(cap_ratio, 2),
                "total": total,
                "raw_forms": list(surface_raw_forms[plain].keys()),
            }

    return gazetteer
