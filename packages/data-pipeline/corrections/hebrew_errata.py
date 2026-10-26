"""Polyglot Bible Reader - Hebrew Upstream Errata Loader and Applier.

Loads curated errata from the canonical GitHub repository URL (with graceful offline
fallback to the local bundled copy) and applies lexeme- and token-level corrections.
"""

from __future__ import annotations
import json
import urllib.request
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..adapters.base import WordToken

ERRATA_REMOTE_URL = "https://raw.githubusercontent.com/cbop-dev/polyglot-suite/main/apps/polyglot-bible-reader/pipeline/data/hebrew_errata.json"
LOCAL_ERRATA_PATH = Path(__file__).resolve().parent.parent / "data" / "hebrew_errata.json"


def load_hebrew_errata(use_remote: bool = True, timeout_sec: float = 2.0) -> Dict[str, Any]:
    """Loads errata from remote URL with automatic fallback to local bundled file."""
    if use_remote:
        try:
            req = urllib.request.Request(
                ERRATA_REMOTE_URL,
                headers={"User-Agent": "PolyglotBibleReader-ErrataFetcher/1.0"}
            )
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    # Cache fresh copy locally if writable
                    try:
                        with open(LOCAL_ERRATA_PATH, "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                    except Exception:
                        pass
                    return data
        except Exception:
            # Fall back to local file if network fails or offline
            pass

    if LOCAL_ERRATA_PATH.exists():
        try:
            with open(LOCAL_ERRATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to parse local errata file {LOCAL_ERRATA_PATH}: {e}")

    return {"lexemes": {}, "tokens": {}}


def apply_lexeme_errata(lexemes: Dict[str, Any], errata: Dict[str, Any]) -> int:
    """Patches lexeme dictionary in-memory from errata."""
    count = 0
    for lex_id, patch in errata.get("lexemes", {}).items():
        if lex_id in lexemes:
            for k in ("strongs", "gloss", "lemma", "plain"):
                if k in patch:
                    lexemes[lex_id][k] = patch[k]
            count += 1
    return count


def apply_token_errata(
    std_book: str,
    std_chapter: int,
    std_verse: int,
    tokens: List[WordToken],
    errata: Dict[str, Any]
) -> int:
    """Applies contextual token-level overrides (e.g. Isa 25:7 noun vs verb)."""
    token_rules = errata.get("tokens", {})
    ref_key = f"{std_book}.{std_chapter}.{std_verse}"
    if ref_key not in token_rules:
        return 0

    rules = token_rules[ref_key]
    count = 0

    # Count matching occurrences for indexing
    surface_matches: Dict[str, int] = {}

    for t in tokens:
        surface = t.word
        cur_idx = surface_matches.get(surface, 0)
        surface_matches[surface] = cur_idx + 1

        for r in rules:
            target_word = r.get("word")
            target_idx = r.get("match_index")

            if target_word == surface and (target_idx is None or target_idx == cur_idx):
                if "strongs" in r:
                    t.strongs = r["strongs"]
                if "gloss" in r:
                    t.gloss = r["gloss"]
                if "lemma" in r:
                    t.lemma = r["lemma"]
                count += 1

    return count
