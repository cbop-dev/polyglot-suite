"""Reference parsing utilities for Niese sections."""

from __future__ import annotations

import re

_NIESE_RE = re.compile(r"^§?\s*(\d+)$")


def parse_column(ref: str) -> str | None:
    m = _NIESE_RE.match(ref.strip())
    if m:
        return m.group(1)
    return None


def column_prefix_key(col: str) -> int:
    try:
        return int(col.lstrip("§").strip())
    except ValueError:
        return 0
