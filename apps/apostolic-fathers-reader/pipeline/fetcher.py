"""Apostolic Fathers Pipeline - Fetcher for upstream data sources."""

from pathlib import Path
import urllib.request
import shutil
from typing import Optional
from .config import CACHE_DIR, CANONICAL_WORKS

MORPH_DIR = CACHE_DIR / "morph"
TEXTS_DIR = CACHE_DIR / "texts"
PERSEUS_DIR = CACHE_DIR / "perseus"
LEXICON_DIR = CACHE_DIR / "lexicon"

MORPH_DIR.mkdir(parents=True, exist_ok=True)
TEXTS_DIR.mkdir(parents=True, exist_ok=True)
PERSEUS_DIR.mkdir(parents=True, exist_ok=True)
LEXICON_DIR.mkdir(parents=True, exist_ok=True)

BRANNAN_BASE_URL = "https://raw.githubusercontent.com/RickBrannan/apostolic-fathers/main/data/morph"
TAUBER_BASE_URL = "https://raw.githubusercontent.com/jtauber/apostolic-fathers/master/texts"
PERSEUS_BASE_URL = "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data"


def download_file(url: str, dest: Path, force: bool = False) -> bool:
    if dest.exists() and not force and dest.stat().st_size > 0:
        return False
    print(f"Downloading: {url} -> {dest.name}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PolyglotSuite/1.0)"})
    with urllib.request.urlopen(req) as response:
        with open(dest, "wb") as out:
            shutil.copyfileobj(response, out)
    return True


def fetch_brannan_morph(force: bool = False):
    print("\n--- Fetching Rick Brannan's Morphology Files ---")
    for work in CANONICAL_WORKS:
        url = f"{BRANNAN_BASE_URL}/{work.brannan_filename}"
        dest = MORPH_DIR / work.brannan_filename
        try:
            download_file(url, dest, force=force)
        except Exception as e:
            print(f"Error fetching {work.brannan_filename}: {e}")


def fetch_tauber_texts(force: bool = False):
    print("\n--- Fetching James Tauber's Greek Texts ---")
    for work in CANONICAL_WORKS:
        url = f"{TAUBER_BASE_URL}/{work.tauber_filename}"
        dest = TEXTS_DIR / work.tauber_filename
        try:
            download_file(url, dest, force=force)
        except Exception as e:
            print(f"Error fetching {work.tauber_filename}: {e}")


def fetch_perseus_english(force: bool = False):
    print("\n--- Fetching Kirsopp Lake Loeb English Translations (Perseus) ---")
    for work in CANONICAL_WORKS:
        url = f"{PERSEUS_BASE_URL}/{work.perseus_tlg_author}/{work.perseus_tlg_work}/{work.perseus_filename}"
        dest = PERSEUS_DIR / work.perseus_filename
        try:
            download_file(url, dest, force=force)
        except Exception as e:
            print(f"Error fetching {work.perseus_filename}: {e}")


def link_lsj_lexicons():
    print("\n--- Ensuring LSJ Lexicon Files ---")
    source_candidates = [
        Path("/home/cbrannan/dev/2-tmp/polyglot-bible-reader/pipeline/cache"),
        Path("/home/cbrannan/dev/2-tmp/polyglot-suite/apps/polyglot-bible-reader/pipeline/cache"),
    ]
    for filename in ["TFLSJ_0_5624.txt", "TFLSJ_extra.txt"]:
        dest = LEXICON_DIR / filename
        if dest.exists() and dest.stat().st_size > 0:
            print(f"LSJ {filename} already present.")
            continue
        copied = False
        for sdir in source_candidates:
            src = sdir / filename
            if src.exists():
                print(f"Copying {filename} from {src}")
                shutil.copyfile(src, dest)
                copied = True
                break
        if not copied:
            print(f"Warning: {filename} not found in local candidates.")


def fetch_all(force: bool = False):
    fetch_brannan_morph(force=force)
    fetch_tauber_texts(force=force)
    fetch_perseus_english(force=force)
    link_lsj_lexicons()
    print("\n✓ Fetching completed successfully.")


if __name__ == "__main__":
    fetch_all()
