"""Configuration, paths, and book name mapping for the Swete LXX morphology pipeline."""

from __future__ import annotations

from pathlib import Path

# Paths
PIPELINE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = PIPELINE_DIR.parent
SOURCES_DIR = PIPELINE_DIR / "sources" / "LXX-Swete-1930"
BUILD_DIR = PIPELINE_DIR / "build"
SCRATCH_DIR = REPO_ROOT.parent / "scratch"

# greek-inflexion repo (read-only). Override with GREEK_INFLEXION_DIR env var.
import os as _os
GI_DIR = Path(_os.environ.get("GREEK_INFLEXION_DIR", "/tmp/greek-inflexion"))

SWETE_VERSIFICATION_CSV = SOURCES_DIR / "00-Swete_versification.csv"
SWETE_WORDS_CSV = SOURCES_DIR / "01-Swete_word_with_punctuations.csv"

# Output files
TOKENS_FILE = BUILD_DIR / "swete_tokens.json"
VERSES_FILE = BUILD_DIR / "swete_verses.json"
TYPES_FILE = BUILD_DIR / "swete_types.json"
GAZETTEER_FILE = BUILD_DIR / "swete_gazetteer.json"
RESOLVED_TOKENS_FILE = BUILD_DIR / "swete_resolved_tokens.json"

# Web app destination directories
APP_LXX_DATA_DIR = REPO_ROOT / "static" / "data" / "lxx"
APP_LXX_LIB_DIR = REPO_ROOT / "src" / "lib" / "lxx"

# Swete 3-letter abbreviation -> Canonical Web App Abbreviation
SWETE_BOOK_MAP = {
    "Gen": "Gen",
    "Exo": "Exod",
    "Lev": "Lev",
    "Num": "Num",
    "Deu": "Deut",
    "Jos": "Josh",
    "Jdg": "Judg",
    "Rut": "Ruth",
    "1Sa": "1Sam",
    "2Sa": "2Sam",
    "1Ki": "1Kgs",
    "2Ki": "2Kgs",
    "1Ch": "1Chr",
    "2Ch": "2Chr",
    "1Es": "1Esdr",
    "Ezr": "Ezra",
    "Neh": "Neh",
    "Est": "Esth",
    "Jdt": "Jdt",
    "Tob": "TobBA",    # Tobit (Vaticanus/Alexandrinus)
    "Tbs": "TobS",     # Tobit (Sinaiticus)
    "1Ma": "1Mac",
    "2Ma": "2Mac",
    "3Ma": "3Mac",
    "4Ma": "4Mac",
    "Psa": "Ps",
    "Pro": "Prov",
    "Ecc": "Qoh",
    "Sol": "Cant",
    "Job": "Job",
    "Wis": "Wis",
    "Sip": "SirProl",  # Sirach Prologue
    "Sir": "Sir",
    "Hos": "Hos",
    "Amo": "Amos",
    "Mic": "Mic",
    "Joe": "Joel",
    "Oba": "Obad",
    "Jon": "Jonah",
    "Nah": "Nah",
    "Hab": "Hab",
    "Zep": "Zeph",
    "Hag": "Hag",
    "Zec": "Zech",
    "Mal": "Mal",
    "Isa": "Isa",
    "Jer": "Jer",
    "Bar": "Bar",
    "Lam": "Lam",
    "Epj": "EpJer",
    "Eze": "Ezek",
    "Sus": "Sus",      # Susanna (LXX)
    "Sut": "SusTh",    # Susanna (Theodotion)
    "Dan": "Dan",      # Daniel (LXX)
    "Dat": "DanTh",    # Daniel (Theodotion)
    "Bel": "Bel",      # Bel and the Dragon (LXX)
    "Bet": "BelTh",    # Bel and the Dragon (Theodotion)
    "Pss": "PsSol",    # Psalms of Solomon
    "Ode": "Od",       # Odes
    "1En": "1En"       # 1 Enoch Greek fragments
}
