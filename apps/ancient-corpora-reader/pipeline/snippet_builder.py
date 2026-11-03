"""KWIC Context Snippet Generator for Ancient Corpora."""

from __future__ import annotations
import re
import unicodedata

def make_kwic_snippet(text: str, match_word: str, radius: int = 45) -> str:
    """Extracts a bounded ~120-char context window around match_word with word boundaries."""
    if not text:
        return ""
    
    clean_target = match_word.strip()
    idx = text.find(clean_target)
    
    if idx == -1:
        # Fallback to search ignoring punctuation
        stripped = re.sub(r"[.,;:·’'—\s]", "", clean_target)
        if stripped:
            pattern = re.compile(re.escape(stripped))
            m = pattern.search(text)
            idx = m.start() if m else 0
        else:
            idx = 0
            
    start = max(0, idx - radius)
    end = min(len(text), idx + len(clean_target) + radius)
    
    if start > 0:
        sp = text.find(" ", start)
        if sp != -1 and sp < idx:
            start = sp + 1
            
    if end < len(text):
        sp = text.rfind(" ", idx + len(clean_target), end)
        if sp != -1 and sp > idx:
            end = sp
            
    snippet = text[start:end].strip()
    prefix = "… " if start > 0 else ""
    suffix = " …" if end < len(text) else ""
    return f"{prefix}{snippet}{suffix}"
