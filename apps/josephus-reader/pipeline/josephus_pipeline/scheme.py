"""Citation-scheme contract for Josephus Reader.

Supported scheme:
  * niese — Niese section numbers for Flavius Josephus (§ 1, § 2, ...).
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Scheme:
    name: str
    page_div_type: str
    section_div_type: str | None
    section_letters: tuple[str, ...]
    lines_user_facing: bool
    validation_mode: str
    range_sides: tuple[str, ...] | None
    display_label: str
    column_re: re.Pattern
    ref_re: re.Pattern

    @property
    def has_sections(self) -> bool:
        return self.section_div_type is not None

    def compose_column(self, page_n: str, section_n: str | None = None) -> str:
        return section_n or page_n


_NIESE_COLUMN_RE = re.compile(r"^§?\s*(\d+)$")
_NIESE_REF_RE = re.compile(r"^§?\s*(\d+)(\.\d+)?$")


SCHEMES: dict[str, Scheme] = {
    "niese": Scheme(
        name="niese",
        page_div_type="book",
        section_div_type="section",
        section_letters=(),
        lines_user_facing=False,
        validation_mode="observed",
        range_sides=None,
        display_label="Niese Section",
        column_re=_NIESE_COLUMN_RE,
        ref_re=_NIESE_REF_RE,
    )
}


def get(name: str | None) -> Scheme:
    return SCHEMES.get(name or "niese", SCHEMES["niese"])


def for_manifest(manifest) -> Scheme:
    data = getattr(manifest, "data", manifest)
    name = (data.get("citation") or {}).get("scheme") if isinstance(data, dict) else None
    return get(name)
