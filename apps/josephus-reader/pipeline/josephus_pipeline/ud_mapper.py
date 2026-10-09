"""Universal Dependencies (UD) morphological feature to classical Greek notation mapper."""

from __future__ import annotations
import re
from typing import Any

UPOS_MAP = {
    "VERB": "verb",
    "AUX": "verb",
    "NOUN": "noun",
    "PROPN": "noun",
    "ADJ": "adjective",
    "DET": "article",
    "PRON": "pronoun",
    "ADV": "adverb",
    "ADP": "preposition",
    "CCONJ": "conjunction",
    "SCONJ": "conjunction",
    "PART": "particle",
    "INTJ": "interjection",
    "NUM": "numeral",
}

TENSE_NAMES = {
    "Pres": "Present",
    "Impf": "Imperfect",
    "Fut": "Future",
    "Aor": "Aorist",
    "Perf": "Perfect",
    "Plup": "Pluperfect",
    "Past": "Past",
}

MOOD_NAMES = {
    "Ind": "indicative",
    "Sub": "subjunctive",
    "Opt": "optative",
    "Imp": "imperative",
}

VOICE_NAMES = {
    "Act": "active",
    "Mid": "middle",
    "Pass": "passive",
    "MidPass": "middle/passive",
}

CASE_NAMES = {
    "Nom": "Nominative",
    "Gen": "Genitive",
    "Dat": "Dative",
    "Acc": "Accusative",
    "Voc": "Vocative",
}

GENDER_NAMES = {
    "Masc": "masculine",
    "Fem": "feminine",
    "Neut": "neuter",
}

NUMBER_NAMES = {
    "Sing": "singular",
    "Plur": "plural",
    "Dual": "dual",
}

PERSON_NAMES = {
    "1": "1st",
    "2": "2nd",
    "3": "3rd",
}


def parse_feats_dict(feats: Any) -> dict[str, str]:
    """Normalize features input into a key-value dictionary."""
    if not feats:
        return {}
    if isinstance(feats, dict):
        return {str(k): str(v) for k, v in feats.items()}
    
    feats_str = str(feats).strip()
    if not feats_str or feats_str in ("_", "None"):
        return {}

    res = {}
    feats_clean = feats_str.strip("[]{}")
    for item in feats_clean.replace(",", "|").split("|"):
        item = item.strip()
        if "=" in item:
            k, v = item.split("=", 1)
            res[k.strip()] = v.strip()
        elif ":" in item:
            k, v = item.split(":", 1)
            res[k.strip().strip("'\"")] = v.strip().strip("'\"")
    return res


def parse_perseus_xpos(xpos: str | None) -> dict[str, str] | None:
    """Parse a Perseus 9-character morphological code if available."""
    if not xpos or not isinstance(xpos, str) or len(xpos) < 6:
        return None
    xpos = xpos.strip()
    pos_code = xpos[0]
    res: dict[str, str] = {}

    if pos_code == "v":
        res["pos"] = "verb"
        if len(xpos) > 1 and xpos[1] in "123":
            res["Person"] = xpos[1]
        if len(xpos) > 2 and xpos[2] in "spd":
            res["Number"] = {"s": "Sing", "p": "Plur", "d": "Dual"}[xpos[2]]
        if len(xpos) > 3 and xpos[3] in "piraflt":
            res["Tense"] = {
                "p": "Pres",
                "i": "Impf",
                "a": "Aor",
                "r": "Perf",
                "l": "Plup",
                "f": "Fut",
                "t": "FutPerf"
            }[xpos[3]]
        if len(xpos) > 4 and xpos[4] in "isonmp":
            mood_map = {"i": "Ind", "s": "Sub", "o": "Opt", "m": "Imp", "n": "Inf", "p": "Part"}
            res["Mood"] = mood_map[xpos[4]]
            if xpos[4] == "n":
                res["VerbForm"] = "Inf"
            elif xpos[4] == "p":
                res["VerbForm"] = "Part"
            else:
                res["VerbForm"] = "Fin"
        if len(xpos) > 5 and xpos[5] in "ampe":
            res["Voice"] = {"a": "Act", "m": "Mid", "p": "Pass", "e": "MidPass"}[xpos[5]]
        if len(xpos) > 6 and xpos[6] in "ngdav":
            res["Case"] = {"n": "Nom", "g": "Gen", "d": "Dat", "a": "Acc", "v": "Voc"}[xpos[6]]
        if len(xpos) > 7 and xpos[7] in "mfn":
            res["Gender"] = {"m": "Masc", "f": "Fem", "n": "Neut"}[xpos[7]]
        return res

    elif pos_code in ("n", "a", "l", "p", "m"):
        pos_labels = {"n": "noun", "a": "adjective", "l": "article", "p": "pronoun", "m": "numeral"}
        res["pos"] = pos_labels[pos_code]
        if len(xpos) > 2 and xpos[2] in "spd":
            res["Number"] = {"s": "Sing", "p": "Plur", "d": "Dual"}[xpos[2]]
        if len(xpos) > 6 and xpos[6] in "ngdav":
            res["Case"] = {"n": "Nom", "g": "Gen", "d": "Dat", "a": "Acc", "v": "Voc"}[xpos[6]]
        if len(xpos) > 7 and xpos[7] in "mfn":
            res["Gender"] = {"m": "Masc", "f": "Fem", "n": "Neut"}[xpos[7]]
        return res

    return None


def map_ud_to_classical(upos: str, feats: Any, xpos: str | None = None, word: str | None = None) -> tuple[str, str, str]:
    """
    Given UPOS, UD features, and optional xpos/word, returns:
    (pos_label, short_parse_tag, full_parse_desc)
    
    Example:
      ("VERB", "Tense=Past|VerbForm=Inf|Voice=Act", xpos="v--ana---", word="περιλαβεῖν")
      -> ("verb", "Aor Inf Act", "Aorist active infinitive")
    """
    upos = (upos or "").upper()
    pos = UPOS_MAP.get(upos, upos.lower() if upos else "")
    f = parse_feats_dict(feats)

    # 0. Check Perseus xpos if available
    x_data = parse_perseus_xpos(xpos)
    if x_data:
        if "pos" in x_data:
            pos = x_data["pos"]
        for k, v in x_data.items():
            if k != "pos" and v:
                f[k] = v

    if not f and not x_data:
        default_tag = "Form"
        default_desc = "Greek word form"
        if pos == "conjunction": return (pos, "Conj", "Conjunction")
        if pos == "preposition": return (pos, "Prep", "Preposition")
        if pos == "particle": return (pos, "Part", "Particle")
        if pos == "adverb": return (pos, "Adv", "Adverb")
        return (pos, default_tag, default_desc)

    verb_form = f.get("VerbForm", "")
    tense = f.get("Tense", "")
    aspect = f.get("Aspect", "")
    mood = f.get("Mood", "")
    voice = f.get("Voice", "")
    person = f.get("Person", "")
    number = f.get("Number", "")
    case = f.get("Case", "")
    gender = f.get("Gender", "")

    # Normalize Voice
    if not voice:
        voice = "Act"
    elif voice in ("Mid,Pass", "Pass,Mid"):
        voice = "MidPass"

    # Normalize Tense & Aspect
    clean_w = (word or "").strip()
    
    # Check for perfect indicators in Greek word form (reduplication + kappa or -κασι, -κεν, -κα)
    is_perfect_form = bool(clean_w and re.search(r'(?:κασι|κεν|κατε|καμεν|κα|κας)$', clean_w))

    if not tense:
        if aspect == "Perf":
            tense = "Perf" if is_perfect_form else "Aor"
    elif tense == "Past":
        if aspect == "Perf":
            # In Ancient Greek UD: Aspect=Perf + Tense=Past is the AORIST!
            # Except if clearly perfect form (like συμβεβήκασι)
            if is_perfect_form and not clean_w.startswith("ἐ") and not clean_w.startswith("η"):
                tense = "Perf"
            else:
                tense = "Aor"
        elif aspect == "Imp":
            tense = "Impf"
        elif verb_form in ("Inf", "Part"):
            # Infinitives with Past tense in Greek UD are Aorist Infinitives
            tense = "Aor"
        else:
            tense = "Aor"
    elif tense == "Pres" and aspect == "Perf":
        tense = "Perf"

    # 1. Participles
    if verb_form == "Part" or mood == "Part":
        pos = "verb"
        tense_code = tense or "Pres"
        g_abbr = {"Masc": "M", "Fem": "F", "Neut": "N"}.get(gender, "")
        n_abbr = {"Sing": "Sg", "Plur": "Pl", "Dual": "Du"}.get(number, "")
        tag_parts = [p for p in [tense_code, "Part", voice, case, n_abbr, g_abbr] if p]
        tag = " ".join(tag_parts)

        desc_parts = [
            TENSE_NAMES.get(tense_code, tense_code),
            VOICE_NAMES.get(voice, voice),
            "participle",
            CASE_NAMES.get(case, ""),
            NUMBER_NAMES.get(number, ""),
            GENDER_NAMES.get(gender, "")
        ]
        desc = " ".join(p for p in desc_parts if p)
        return (pos, tag, desc)

    # 2. Infinitives
    if verb_form == "Inf" or mood == "Inf":
        pos = "verb"
        # If infinitive has past/perf aspect, it's Aorist unless it ends in -εναι (Perfect)
        if tense in ("Past", "Plup") or aspect == "Perf":
            if clean_w.endswith("εναι") or clean_w.endswith("έναι"):
                tense = "Perf"
            else:
                tense = "Aor"
        tense_code = tense or "Pres"
        tag_parts = [p for p in [tense_code, "Inf", voice] if p]
        tag = " ".join(tag_parts)
        desc_parts = [p for p in [TENSE_NAMES.get(tense_code, tense_code), VOICE_NAMES.get(voice, voice), "infinitive"] if p]
        return (pos, tag, " ".join(desc_parts))

    # 3. Finite Verbs
    if verb_form == "Fin" or (mood and person) or (pos == "verb" and (tense or mood or person)):
        pos = "verb"
        mood_code = mood if mood in ("Ind", "Sub", "Opt", "Imp") else "Ind"
        num_code = "s" if number == "Sing" else ("p" if number == "Plur" else ("d" if number == "Dual" else ""))
        p_code = f"{person}{num_code}" if person else ("Sg" if number == "Sing" else ("Pl" if number == "Plur" else ""))

        tag_parts = [p for p in [tense, mood_code, voice, p_code] if p]
        tag = " ".join(tag_parts) or "Verb"

        desc_parts = []
        if tense in TENSE_NAMES: desc_parts.append(TENSE_NAMES[tense])
        if mood in MOOD_NAMES: desc_parts.append(MOOD_NAMES[mood])
        if voice in VOICE_NAMES: desc_parts.append(VOICE_NAMES[voice])
        if person in PERSON_NAMES and number in NUMBER_NAMES:
            desc_parts.append(f"{PERSON_NAMES[person]} {NUMBER_NAMES[number]}")
        elif number in NUMBER_NAMES:
            desc_parts.append(NUMBER_NAMES[number])
        desc = " ".join(desc_parts) or "Finite verb"
        return (pos, tag, desc)

    # 4. Nominals (Nouns, Adjectives, Pronouns, Articles)
    if case or number or gender:
        g_abbr = {"Masc": "M", "Fem": "F", "Neut": "N"}.get(gender, "")
        n_abbr = {"Sing": "Sg", "Plur": "Pl", "Dual": "Du"}.get(number, "")
        tag_parts = [p for p in [case, n_abbr, g_abbr] if p]
        tag = " ".join(tag_parts) or (pos.capitalize() if pos else "Form")

        desc_parts = [
            CASE_NAMES.get(case, ""),
            NUMBER_NAMES.get(number, ""),
            GENDER_NAMES.get(gender, "")
        ]
        desc = " ".join(p for p in desc_parts if p) or f"{pos.capitalize()} form"
        return (pos, tag, desc)

    return (pos, "Form", "Greek word form")
