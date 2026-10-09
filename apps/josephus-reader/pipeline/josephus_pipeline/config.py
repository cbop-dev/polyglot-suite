"""Manifest loading and path resolution for Josephus Reader.

Repo layout assumed:
    josephus-reader/         <- repo root
      manifests/<Work>.yaml   (e.g. Antiquities.yaml)
      sources/               <- raw TEI XML sources
      build/                 <- pipeline build artifacts
      pipeline/              <- pipeline package
"""

from __future__ import annotations

import os
from pathlib import Path
import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILD_DIR = REPO_ROOT / "build"
SOURCES_DIR = REPO_ROOT / "sources"
MANIFESTS_DIR = REPO_ROOT / "manifests"


class Manifest:
    def __init__(self, data: dict, path: Path):
        self.data = data
        self.path = path

    @classmethod
    def load(cls, path: Path) -> "Manifest":
        with open(path, encoding="utf-8") as f:
            return cls(yaml.safe_load(f), path)

    @classmethod
    def for_work(cls, work: str) -> "Manifest":
        manifest_path = MANIFESTS_DIR / f"{work}.yaml"
        if not manifest_path.exists():
            # Try lower/case matches
            for p in MANIFESTS_DIR.glob("*.yaml"):
                if p.stem.lower() == work.lower():
                    manifest_path = p
                    break
        return cls.load(manifest_path)

    @property
    def work_id(self) -> str:
        return self.data["work"]["id"]

    @property
    def title(self) -> str:
        return self.data["work"]["title"]

    @property
    def abbrev(self) -> str:
        return self.data["work"].get("abbrev", self.work_id)

    @property
    def books(self) -> list[dict]:
        return self.data["books"]

    def greek_source(self) -> Path:
        filename = f"tlg0526.tlg{self.data['work']['tlg_work']}.perseus-grc2.xml"
        return SOURCES_DIR / "perseus-grc" / filename

    def english_source(self) -> Path:
        filename = f"tlg0526.tlg{self.data['work']['tlg_work']}.perseus-eng2.xml"
        return SOURCES_DIR / "perseus-eng" / filename
