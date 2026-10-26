"""Surgically patch remaining high-frequency unmatched words in swete_resolved_tokens.json.

Runs in < 2 seconds without re-running any slow neural models or the full pipeline.
"""

from __future__ import annotations

import json
from pathlib import Path
from collections import Counter

REPO_ROOT = Path(__file__).resolve().parent.parent
BUILD_DIR = REPO_ROOT / "pipeline" / "build"
RESOLVED_TOKENS_FILE = BUILD_DIR / "swete_resolved_tokens.json"

# High-frequency exact surface mappings for remaining unmatched patterns
SURFACE_PATCHES = {
    # Solomon: align with Septuagint reference transliteration
    "Σαλωμὼν": {"lemma": "Σαλωμών", "pos": 13, "morph": "N-PRI"},
    "Σαλωμών": {"lemma": "Σαλωμών", "pos": 13, "morph": "N-PRI"},
    "Σαλωμῶνος": {"lemma": "Σαλωμών", "pos": 13, "morph": "N-PRI"},
    "Σαλωμῶνι": {"lemma": "Σαλωμών", "pos": 13, "morph": "N-PRI"},
    "Σαλωμῶντα": {"lemma": "Σαλωμών", "pos": 13, "morph": "N-PRI"},

    # Proper names with false declension or accent
    "Ἰορδάνην": {"lemma": "Ἰορδάνης", "pos": 13, "morph": "N-PR-ASM"},
    "Ναβουχοδονοσὸρ": {"lemma": "Ναβουχοδονόσορ", "pos": 13, "morph": "N-PRI"},
    "Ναβουχοδονόσορ": {"lemma": "Ναβουχοδονόσορ", "pos": 13, "morph": "N-PRI"},
    "Ἰωὰς": {"lemma": "Ἰωάς", "pos": 13, "morph": "N-PRI"},
    "Ἰωδᾶε": {"lemma": "Ἰωδαέ", "pos": 13, "morph": "N-PRI"},
    "αἰλὰμ": {"lemma": "αἰλάμ", "pos": 13, "morph": "N-PRI"},
    "Ἁδὲρ": {"lemma": "Ἁδέρ", "pos": 13, "morph": "N-PRI"},
    "Μεμφιβόσθε": {"lemma": "Μεμφιβόσθε", "pos": 13, "morph": "N-PRI"},
    "Ἀσσοὺρ": {"lemma": "Ἀσσούρ", "pos": 13, "morph": "N-PRI"},
    "Βαναίας": {"lemma": "Βαναίας", "pos": 13, "morph": "N-PRI"},
    "Ὀλοφέρνου": {"lemma": "Ὀλοφέρνης", "pos": 13, "morph": "N-PRI"},
    "Ὀλοφέρνην": {"lemma": "Ὀλοφέρνης", "pos": 13, "morph": "N-PRI"},
    "Ὀλοφέρνῃ": {"lemma": "Ὀλοφέρνης", "pos": 13, "morph": "N-PRI"},
    "Μανῶε": {"lemma": "Μανωέ", "pos": 13, "morph": "N-PRI"},
    "Βασὰν": {"lemma": "Βασάν", "pos": 13, "morph": "N-PRI"},
    "Σαρουίας": {"lemma": "Σαρουία", "pos": 13, "morph": "N-PRI"},

    # Divine title & adjectives
    "Ὑψίστου": {"lemma": "ὕψιστος", "pos": 0, "morph": "A-GSM"},
    "Ὕψιστος": {"lemma": "ὕψιστος", "pos": 0, "morph": "A-NSM"},
    "Ὑψίστῳ": {"lemma": "ὕψιστος", "pos": 0, "morph": "A-DSM"},
    "Ὕψιστον": {"lemma": "ὕψιστος", "pos": 0, "morph": "A-ASM"},
    "ἵλεως": {"lemma": "ἵλεως", "pos": 0, "morph": "A-NSM"},
    "εὐθὲς": {"lemma": "εὐθύς", "pos": 0, "morph": "A-NSN"},
    "ἡμίσει": {"lemma": "ἥμισυς", "pos": 0, "morph": "A-DSN"},
    "χρυσῶν": {"lemma": "χρυσοῦς", "pos": 0, "morph": "A-GPM"},
    "πεζῶν": {"lemma": "πεζός", "pos": 0, "morph": "A-GPM"},
    "πεντακόσιοι": {"lemma": "πεντακόσιοι", "pos": 14, "morph": "NUM"},

    # Third-declension abstract nouns
    "ὅρασιν": {"lemma": "ὅρασις", "pos": 4, "morph": "N-ASF"},
    "κατάσχεσιν": {"lemma": "κατάσχεσις", "pos": 4, "morph": "N-ASF"},
    "γνῶσιν": {"lemma": "γνῶσις", "pos": 4, "morph": "N-ASF"},
    "λύτρα": {"lemma": "λύτρον", "pos": 4, "morph": "N-APN"},
    "ἀμνοῖς": {"lemma": "ἀμνός", "pos": 4, "morph": "N-DPM"},
    "τραυματιῶν": {"lemma": "τραυματίας", "pos": 4, "morph": "N-GPM"},
    "γιγάντων": {"lemma": "γίγας", "pos": 4, "morph": "N-GPM"},
    "χειμάρρου": {"lemma": "χειμάρρους", "pos": 4, "morph": "N-GSM"},
    "χειμάρρουν": {"lemma": "χειμάρρους", "pos": 4, "morph": "N-ASM"},
    "χειμάρρους": {"lemma": "χειμάρρους", "pos": 4, "morph": "N-APM"},

    # Adverbs misparsed as verbs
    "ἐπάνωθεν": {"lemma": "ἐπάνωθεν", "pos": 2, "morph": "ADV"},
    "ὑποκάτωθεν": {"lemma": "ὑποκάτωθεν", "pos": 2, "morph": "ADV"},
    "περικύκλῳ": {"lemma": "περικύκλῳ", "pos": 2, "morph": "ADV"},

    # Suppletive and irregular verbs
    "προσοίσει": {"lemma": "προσφέρω", "pos": 11, "morph": "V-FAI-3S"},
    "προσοίσουσι": {"lemma": "προσφέρω", "pos": 11, "morph": "V-FAI-3P"},
    "προσοίσουσιν": {"lemma": "προσφέρω", "pos": 11, "morph": "V-FAI-3P"},
    "προσοίσετε": {"lemma": "προσφέρω", "pos": 11, "morph": "V-FAI-2P"},
    "ἀνοίσει": {"lemma": "ἀναφέρω", "pos": 11, "morph": "V-FAI-3S"},
    "ἀνοίσουσι": {"lemma": "ἀναφέρω", "pos": 11, "morph": "V-FAI-3P"},
    "ἀνοίσουσιν": {"lemma": "ἀναφέρω", "pos": 11, "morph": "V-FAI-3P"},
    "ἐξήγαγον": {"lemma": "ἐξάγω", "pos": 11, "morph": "V-AAI-1S"},
    "ἐξήγαγεν": {"lemma": "ἐξάγω", "pos": 11, "morph": "V-AAI-3S"},
    "ἐξήγαγες": {"lemma": "ἐξάγω", "pos": 11, "morph": "V-AAI-2S"},
    "ἐξήμαρτεν": {"lemma": "ἐξαμαρτάνω", "pos": 11, "morph": "V-AAI-3S"},
    "ἐξήμαρτον": {"lemma": "ἐξαμαρτάνω", "pos": 11, "morph": "V-AAI-3P"},
    "ἐξωλέθρευσαν": {"lemma": "ἐξολεθρεύω", "pos": 11, "morph": "V-AAI-3P"},
    "ἐξωλέθρευσεν": {"lemma": "ἐξολεθρεύω", "pos": 11, "morph": "V-AAI-3S"},
    "ἠθέτησεν": {"lemma": "ἀθετέω", "pos": 11, "morph": "V-AAI-3S"},
    "ἐκτενῶ": {"lemma": "ἐκτείνω", "pos": 11, "morph": "V-FAI-1S"},
    "πλυνεῖ": {"lemma": "πλύνω", "pos": 11, "morph": "V-FAI-3S"},
    "πλυνεῖς": {"lemma": "πλύνω", "pos": 11, "morph": "V-FAI-2S"},
    "ἐξαροῦσιν": {"lemma": "ἐξαίρω", "pos": 11, "morph": "V-FAI-3P"},
    "φείσεται": {"lemma": "φείδομαι", "pos": 11, "morph": "V-FMI-3S"},
    "ἐπεσκεμμένοι": {"lemma": "ἐπισκέπτομαι", "pos": 11, "morph": "V-RPP-NPM"},
    "ἐνέπρησεν": {"lemma": "ἐμπίπρημι", "pos": 11, "morph": "V-AAI-3S"},
}

# Lemma replacements (if Stanza produced an invalid lemma for any token)
LEMMA_PATCHES = {
    "Σολομών": "Σαλωμών",
    "Ναβουχοδονορορ": "Ναβουχοδονόσορ",
    "Ἰωής": "Ἰωάς",
    "Ἁδώρ": "Ἁδέρ",
    "Μεμφίβοσθος": "Μεμφιβόσθε",
    "Ἀσσός": "Ἀσσούρ",
    "Ὀλοφέρνος": "Ὀλοφέρνης",
    "Μάνης": "Μανωέ",
    "Βαάν": "Βασάν",
    "Ἄψιστος": "ὕψιστος",
    "κατάσχησις": "κατάσχεσις",
    "προσοίθημι": "προσφέρω",
    "ἀναφίνω": "ἀναφέρω",
    "ξηγάγω": "ἐξάγω",
    "ἐξημαρθάνω": "ἐξαμαρτάνω",
    "ἐξιλεθρεύω": "ἐξολεθρεύω",
    "ἐθετέω": "ἀθετέω",
    "ἐπανίδωμι": "ἐπάνωθεν",
    "ὑποκατέω": "ὑποκάτωθεν",
    "περίκυκλος": "περικύκλῳ",
    "λύπρα": "λύτρον",
    "τραυματιός": "τραυματίας",
}


def patch_tokens():
    if not RESOLVED_TOKENS_FILE.exists():
        print(f"Error: {RESOLVED_TOKENS_FILE} does not exist.")
        return

    print(f"Loading {RESOLVED_TOKENS_FILE}...")
    with open(RESOLVED_TOKENS_FILE, "r", encoding="utf-8") as f:
        tokens = json.load(f)

    patched_count = 0
    patch_stats = Counter()

    for t in tokens:
        surface = t["surface"]
        lemma = t["lemma"]

        if surface in SURFACE_PATCHES:
            p = SURFACE_PATCHES[surface]
            t["lemma"] = p["lemma"]
            t["pos"] = p["pos"]
            t["morph"] = p.get("morph", t.get("morph", "X"))
            t["source"] = "targeted_patch"
            patched_count += 1
            patch_stats[p["lemma"]] += 1
        elif lemma in LEMMA_PATCHES:
            new_lem = LEMMA_PATCHES[lemma]
            t["lemma"] = new_lem
            t["source"] = "targeted_patch"
            patched_count += 1
            patch_stats[new_lem] += 1

    print(f"\nSurgically patched {patched_count:,} tokens out of {len(tokens):,} total tokens.")
    print("\nTop patched lemmata:")
    for lem, count in patch_stats.most_common(15):
        print(f"  {lem:<20}: {count:4d}")

    print(f"\nWriting updated tokens back to {RESOLVED_TOKENS_FILE}...")
    with open(RESOLVED_TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(tokens, f, ensure_ascii=False)
    print("Done!")


if __name__ == "__main__":
    patch_tokens()
