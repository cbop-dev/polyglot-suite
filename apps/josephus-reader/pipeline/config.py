"""Josephus Pipeline - Configuration & Metadata Catalog for 4 Works."""

from __future__ import annotations
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

# Ensure packages/pipeline-core is on sys.path
REPO_ROOT = Path(__file__).resolve().parents[3]
PIPELINE_CORE_DIR = REPO_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_CORE_DIR))

PIPELINE_DIR = Path(__file__).parent.resolve()
APP_DIR = PIPELINE_DIR.parent
SOURCE_DATA_DIR = PIPELINE_DIR / "raw_data"
BUILD_DIR = PIPELINE_DIR / "build"
STATIC_DB_DIR = APP_DIR / "static" / "db"
STATIC_SQLITE_DIR = APP_DIR / "static" / "sqlite"
GENERATED_TS_DIR = APP_DIR / "src" / "lib" / "config"

for d in [BUILD_DIR, STATIC_DB_DIR, STATIC_SQLITE_DIR, GENERATED_TS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


@dataclass
class JosephusWork:
    code: str                  # Short identifier: 'Antiquities', 'War', 'Life', 'Apion'
    tlg_id: str                # TLG identifier: '0526.001'
    order_index: int           # 1 to 4
    category: str              # 'history', 'autobiography', 'apology'
    abbrev: str                # Standard academic citation abbrev: e.g. 'Ant. Iud.'
    title_english: str         # 'Antiquities of the Jews'
    title_greek: str           # 'Ἰουδαϊκὴ Ἀρχαιολογία'
    title_latin: str           # 'Antiquitates Judaicae'
    total_books: int           # Number of books (20, 7, 1, 2)
    default_book: int = 1


CANONICAL_WORKS: List[JosephusWork] = [
    JosephusWork(
        code="Antiquities",
        tlg_id="0526.001",
        order_index=1,
        category="history",
        abbrev="Ant. Iud.",
        title_english="Antiquities of the Jews",
        title_greek="Ἰουδαϊκὴ Ἀρχαιολογία",
        title_latin="Antiquitates Judaicae",
        total_books=20,
        default_book=1,
    ),
    JosephusWork(
        code="War",
        tlg_id="0526.004",
        order_index=2,
        category="history",
        abbrev="Bel. Iud.",
        title_english="The Jewish War",
        title_greek="Ἰουδαϊκὸς Πόλεμος",
        title_latin="Bellum Judaicum",
        total_books=7,
        default_book=1,
    ),
    JosephusWork(
        code="Life",
        tlg_id="0526.002",
        order_index=3,
        category="autobiography",
        abbrev="Vita",
        title_english="The Life of Flavius Josephus",
        title_greek="Ἰωσήπου Βίος",
        title_latin="Vita",
        total_books=1,
        default_book=1,
    ),
    JosephusWork(
        code="Apion",
        tlg_id="0526.003",
        order_index=4,
        category="apology",
        abbrev="Con. Ap.",
        title_english="Against Apion",
        title_greek="Περὶ τῆς τῶν Ἰουδαίων ἀρχαιότητος (Κατʼ Ἀπίωνος)",
        title_latin="Contra Apionem",
        total_books=2,
        default_book=1,
    ),
]

WORK_BY_CODE = {w.code: w for w in CANONICAL_WORKS}
