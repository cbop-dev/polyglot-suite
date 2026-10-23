"""Philo Pipeline - Data Fetcher.

Downloads upstream XML texts and lexicons using pipeline_core.cache_fetcher.
"""

from __future__ import annotations
import shutil
from pathlib import Path
from .config import (
    CANONICAL_WORKS,
    TEXTS_GRC_DIR,
    TEXTS_ENG_DIR,
    LEXICON_DIR,
    REPO_ROOT,
)
from pipeline_core import download_file

CELANO_BASE_URL = "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts"
FIRST1K_BASE_URL = "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg0018"
STEPBIBLE_BASE_URL = "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons"


def fetch_greek_texts(force: bool = False):
    """Downloads Celano's 31 lemmatized Greek XML files."""
    print("\n--- Fetching Celano Lemmatized Greek Texts (31 treatises) ---")
    for work in CANONICAL_WORKS:
        filename = f"tlg0018.{work.tlg_id}.opp-grc1.xml"
        url = f"{CELANO_BASE_URL}/{filename}"
        dest = TEXTS_GRC_DIR / filename
        try:
            download_file(url, dest, force=force)
        except Exception as e:
            print(f"Error fetching Greek text for {work.code} ({filename}): {e}")


def fetch_english_texts(force: bool = False):
    """Downloads First1KGreek's 31 aligned Yonge English XML files."""
    print("\n--- Fetching First1KGreek Aligned Yonge English Texts (31 treatises) ---")
    for work in CANONICAL_WORKS:
        filename = f"tlg0018.{work.tlg_id}.1st1K-eng1.xml"
        url = f"{FIRST1K_BASE_URL}/{work.tlg_id}/{filename}"
        dest = TEXTS_ENG_DIR / filename
        try:
            download_file(url, dest, force=force)
        except Exception as e:
            print(f"Error fetching English text for {work.code} ({filename}): {e}")


def ensure_lsj_lexicon(force: bool = False):
    """Links or downloads the STEPBible TFLSJ lexicon files."""
    print("\n--- Ensuring STEPBible TFLSJ Lexicon Files ---")
    filenames = ["TFLSJ_0_5624.txt", "TFLSJ_extra.txt"]

    # 1. Check if already cached in apostolic-fathers or polyglot-bible
    candidate_sources = [
        REPO_ROOT / "apps" / "apostolic-fathers-reader" / "pipeline" / "cache" / "lexicon",
        REPO_ROOT / "apps" / "polyglot-bible-reader" / "pipeline" / "cache",
    ]

    for fname in filenames:
        dest = LEXICON_DIR / fname
        if dest.exists() and not force and dest.stat().st_size > 0:
            continue

        copied = False
        for cdir in candidate_sources:
            src = cdir / fname
            if src.exists() and src.stat().st_size > 0:
                print(f"Copying {fname} from {cdir.name}...")
                shutil.copyfile(src, dest)
                copied = True
                break

        if not copied:
            url = f"{STEPBIBLE_BASE_URL}/{fname}"
            download_file(url, dest, force=force)


def fetch_all(force: bool = False):
    """Fetches all upstream resources."""
    fetch_greek_texts(force=force)
    fetch_english_texts(force=force)
    ensure_lsj_lexicon(force=force)


if __name__ == "__main__":
    fetch_all()
