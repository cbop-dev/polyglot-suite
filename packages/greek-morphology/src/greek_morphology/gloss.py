"""Gloss and Strong's Number Resolver for Greek Lemmata."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set, Any
from .normalizer import normalize_greek, strip_accents

# Top Biblical Proper Names: Greek lemma -> English biblical name
BIBLICAL_PROPER_NAMES: Dict[str, str] = {
    "Ἀαρών": "Aaron",
    "Ἄβελ": "Abel",
    "Ἀβιά": "Abijah",
    "Ἀβιούδ": "Abiud",
    "Ἀβραάμ": "Abraham",
    "Ἀδάμ": "Adam",
    "Αἴγυπτος": "Egypt",
    "Ἀμινάδαβ": "Amminadab",
    "Ἀμιναδάβ": "Amminadab",
    "Ἀμώς": "Amos",
    "Ἀράμ": "Aram",
    "Ἀσάφ": "Asaph",
    "Ἀσήρ": "Asher",
    "Ἀχάζ": "Ahaz",
    "Ἀχίμ": "Achim",
    "Βαβυλών": "Babylon",
    "Βαλάκ": "Balak",
    "Βαλαάμ": "Balaam",
    "Βενιαμίν": "Benjamin",
    "Βηθλέεμ": "Bethlehem",
    "Βόες": "Boaz",
    "Γάδ": "Gad",
    "Γαλιλαία": "Galilee",
    "Γεδεών": "Gideon",
    "Δαυίδ": "David",
    "Δανιήλ": "Daniel",
    "Ἑζεκίας": "Hezekiah",
    "Ἐλεάζαρ": "Eleazar",
    "Ἐλιακίμ": "Eliakim",
    "Ἐλιούδ": "Eliud",
    "Ἐλισαιέ": "Elisha",
    "Ἐλισάβετ": "Elizabeth",
    "Ἐμμανουήλ": "Emmanuel",
    "Ἑνώχ": "Enoch",
    "Ἐφραίμ": "Ephraim",
    "Εὕα": "Eve",
    "Ζαβουλών": "Zebulun",
    "Ζαχαρίας": "Zechariah",
    "Ζάρα": "Zerah",
    "Ζοροβαβέλ": "Zerubbabel",
    "Ἡλίας": "Elijah",
    "Ἡρῴδης": "Herod",
    "Ἡσαῦ": "Esau",
    "Ἠσαΐας": "Isaiah",
    "Ἑσρώμ": "Hezron",
    "Θαμάρ": "Tamar",
    "Ἰακώβ": "Jacob",
    "Ἰεζεκιήλ": "Ezekiel",
    "Ἰερεμίας": "Jeremiah",
    "Ἰεροβοάμ": "Jeroboam",
    "Ἰεροσόλυμα": "Jerusalem",
    "Ἰερουσαλήμ": "Jerusalem",
    "Ἰεσσαί": "Jesse",
    "Ἰεφθάε": "Jephthah",
    "Ἰεχονίας": "Jechoniah",
    "Ἰησοῦς": "Jesus, Joshua",
    "Ἰορδάνης": "Jordan",
    "Ἰούδας": "Judah, Judas",
    "Ἰουδαία": "Judea",
    "Ἰσαάκ": "Isaac",
    "Ἰσραήλ": "Israel",
    "Ἰωάννης": "John",
    "Ἰωνᾶς": "Jonah",
    "Ἰωσήφ": "Joseph",
    "Ἰωσίας": "Josiah",
    "Κάιν": "Cain",
    "Καφαρναούμ": "Capernaum",
    "Κύπρος": "Cyprus",
    "Κυρήνη": "Cyrene",
    "Λάζαρος": "Lazarus",
    "Λευί": "Levi",
    "Λεία": "Leah",
    "Λώτ": "Lot",
    "Μανασσῆς": "Manasseh",
    "Μαρία": "Mary, Miriam",
    "Μαριάμ": "Mary, Miriam",
    "Μάρθα": "Martha",
    "Ματθαῖος": "Matthew",
    "Μωυσῆς": "Moses",
    "Μωϋσῆς": "Moses",
    "Ναζαρέτ": "Nazareth",
    "Ναθαναήλ": "Nathanael",
    "Νεεμίας": "Nehemiah",
    "Νεφθαλί": "Naphtali",
    "Νῶε": "Noah",
    "Παῦλος": "Paul",
    "Πέτρος": "Peter",
    "Πιλᾶτος": "Pilate",
    "Ῥαχήλ": "Rachel",
    "Ῥεβέκκα": "Rebekah",
    "Ῥουβήν": "Reuben",
    "Ῥούθ": "Ruth",
    "Σαδδουκαῖος": "Sadducee",
    "Σαμαρεία": "Samaria",
    "Σαμάρεια": "Samaria",
    "Σαμψών": "Samson",
    "Σαμουήλ": "Samuel",
    "Σαούλ": "Saul",
    "Σάρρα": "Sarah",
    "Σεδεκίας": "Zedekiah",
    "Σιών": "Zion",
    "Σίμων": "Simon",
    "Σόδομα": "Sodom",
    "Σολομών": "Solomon",
    "Στέφανος": "Stephen",
    "Τίτος": "Titus",
    "Τιμόθεος": "Timothy",
    "Φαρισαῖος": "Pharisee",
    "Φαραώ": "Pharaoh",
    "Φίλιππος": "Philip",
    "Χαναάν": "Canaan",
    "Χριστός": "Christ, Messiah",
}


class GlossResolver:
    """Resolves English glosses and Strong's concordance numbers for Greek lemmata."""

    def __init__(
        self,
        sblgnt_lexicon: Optional[Dict[str, Any]] = None,
        custom_glosses: Optional[Dict[str, str]] = None,
    ):
        self.sblgnt_lexicon = sblgnt_lexicon or {}
        self.custom_glosses = custom_glosses or {}
        self._sblgnt_lemma_map: Dict[str, Dict[str, Any]] = {}

        for _, entry in self.sblgnt_lexicon.items():
            lem = entry.get("lemma")
            if lem:
                self._sblgnt_lemma_map[normalize_greek(lem)] = entry
                self._sblgnt_lemma_map[strip_accents(lem)] = entry

    def resolve_gloss(self, lemma: str, pos: Optional[int] = None) -> str:
        """Resolve English gloss for lemma."""
        if not lemma:
            return ""

        # 1. Check custom overrides
        if lemma in self.custom_glosses:
            return self.custom_glosses[lemma]

        # 2. Check biblical proper names
        if lemma in BIBLICAL_PROPER_NAMES:
            return BIBLICAL_PROPER_NAMES[lemma]
        plain = strip_accents(lemma)
        for k, v in BIBLICAL_PROPER_NAMES.items():
            if strip_accents(k) == plain:
                return v

        # 3. Check SBLGNT lexicon
        norm_lem = normalize_greek(lemma)
        if norm_lem in self._sblgnt_lemma_map:
            gloss = self._sblgnt_lemma_map[norm_lem].get("gloss", "")
            if gloss:
                return gloss
        if plain in self._sblgnt_lemma_map:
            gloss = self._sblgnt_lemma_map[plain].get("gloss", "")
            if gloss:
                return gloss

        # 4. Fallback for proper nouns
        if pos == 13 and lemma and lemma[0].isupper():
            return lemma

        return ""

    def resolve_strongs(self, lemma: str) -> str:
        """Resolve Strong's concordance number if known."""
        if not lemma:
            return ""
        norm_lem = normalize_greek(lemma)
        if norm_lem in self._sblgnt_lemma_map:
            return str(self._sblgnt_lemma_map[norm_lem].get("strongs", "") or "")
        plain = strip_accents(lemma)
        if plain in self._sblgnt_lemma_map:
            return str(self._sblgnt_lemma_map[plain].get("strongs", "") or "")
        return ""
