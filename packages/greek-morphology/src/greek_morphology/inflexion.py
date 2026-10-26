"""Adapter and cache bridge for greek-inflexion verb parsing."""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, List
from .normalizer import normalize_greek, strip_accents

_PSILI = "\u0313"   # combining smooth breathing
_DASIA = "\u0314"   # combining rough breathing


def _strip_initial_breathing_nfd(nfd_text: str) -> str:
    """Strip breathing mark from base character in NFD string."""
    result = []
    in_first_letter_diacritics = False
    first_base_seen = False

    for ch in nfd_text:
        cat = unicodedata.category(ch)
        is_base = cat.startswith("L")

        if not first_base_seen:
            if is_base:
                first_base_seen = True
                in_first_letter_diacritics = True
            result.append(ch)
        elif in_first_letter_diacritics:
            if is_base:
                in_first_letter_diacritics = False
                result.append(ch)
            elif ch in (_PSILI, _DASIA):
                pass
            else:
                result.append(ch)
        else:
            result.append(ch)

    return "".join(result)


def _strip_compound_markers(lemma: str) -> str:
    """Remove GI's prefix-boundary markers (++ and +) and fix spurious breathing."""
    if not ("++" in lemma or "+" in lemma):
        return normalize_greek(lemma)

    parts = lemma.replace("++", "+").split("+")
    reconstructed = parts[0]
    for seg in parts[1:]:
        seg_nfd = unicodedata.normalize("NFD", seg)
        seg_clean = _strip_initial_breathing_nfd(seg_nfd)
        reconstructed += seg_clean

    return normalize_greek(reconstructed)


def load_gi(gi_dir: Optional[Path] = None):
    """Attempt to import greek_inflexion from gi_dir or sys.path."""
    if gi_dir is None:
        gi_dir_env = os.environ.get("GREEK_INFLEXION_DIR", "/tmp/greek-inflexion")
        gi_dir = Path(gi_dir_env)

    if gi_dir.exists() and str(gi_dir) not in sys.path:
        sys.path.insert(0, str(gi_dir))

    try:
        from greek_inflexion import GreekInflexion  # type: ignore
        # Look for default stem files if available
        stem_dir = gi_dir
        if (stem_dir / "stemming").exists():
            return GreekInflexion(
                str(stem_dir / "stemming" / "lexicon.yaml"),
                str(stem_dir / "stemming" / "rules.yaml")
            )
        return GreekInflexion()
    except Exception:
        return None


def gi_verb_check(
    cache: Dict[str, Any],
    surface: str,
    stanza_upos: str,
) -> Optional[Tuple[str, str, List[Tuple[str, str]]]]:
    """O(1) cache lookup for verb surface forms."""
    if stanza_upos not in ("VERB", "AUX"):
        return None

    entry = cache.get(surface) or cache.get(surface.lower()) or cache.get(normalize_greek(surface))
    if not entry:
        return None

    candidates = entry.get("candidates", [])
    if not candidates:
        return None

    primary_lemma, primary_morph = candidates[0]
    extra = candidates[1:]
    return primary_lemma, primary_morph, extra


def build_or_load_gi_cache(
    gi_instance: Any,
    surface_verbs: List[str],
    cache_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Load cached parsed verbs or evaluate using gi_instance."""
    if cache_path and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    cache: Dict[str, Any] = {}
    if not gi_instance:
        return cache

    for surf in set(surface_verbs):
        norm_s = normalize_greek(surf)
        try:
            parses = gi_instance.parse(norm_s)
            if parses:
                candidates = []
                for p in parses:
                    lemma = _strip_compound_markers(getattr(p, "lemma", str(p)))
                    morph = getattr(p, "parse", "V")
                    candidates.append((lemma, morph))
                cache[norm_s] = {"candidates": candidates}
        except Exception:
            continue

    if cache_path and cache:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)

    return cache
