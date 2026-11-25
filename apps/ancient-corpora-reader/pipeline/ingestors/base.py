"""Reusable Raw Corpus SQLite Writer for ACR Ingestors."""

from __future__ import annotations
import json
import sqlite3
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
BUILD_DIR = ACR_DIR / "build" / "db"

PIPELINE_CORE_DIR = WORKSPACE_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))

from pipeline_core.lsj_resolver import LSJAdapter, strip_greek_accents  # noqa: E402


class RawCorpusWriter:
	"""Writes a canonical intermediate <corpus_id>.raw.sqlite3 database."""

	def __init__(self, corpus_id: str, lemmatizer_scheme: str = "celano"):
		self.corpus_id = corpus_id
		self.lemmatizer_scheme = lemmatizer_scheme
		BUILD_DIR.mkdir(parents=True, exist_ok=True)
		self.raw_db_path = BUILD_DIR / f"{corpus_id}.raw.sqlite3"
		if self.raw_db_path.exists():
			self.raw_db_path.unlink()

		self.conn = sqlite3.connect(self.raw_db_path)
		self.cur = self.conn.cursor()
		self._create_schema()

		self.lemma_totals: Dict[str, int] = defaultdict(int)
		self.lemma_work_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
		self.used_norm_lemmas: set[str] = set()

	def _create_schema(self) -> None:
		self.cur.executescript("""
		CREATE TABLE db_metadata (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
		CREATE TABLE corpus_versions (
			id TEXT PRIMARY KEY,
			language TEXT NOT NULL,
			title TEXT NOT NULL,
			version_label TEXT,
			direction TEXT DEFAULT 'ltr',
			order_index INTEGER DEFAULT 0,
			role TEXT NOT NULL DEFAULT 'translation',
			editor TEXT,
			translator TEXT,
			booktitle TEXT NOT NULL DEFAULT '',
			series TEXT,
			publisher TEXT NOT NULL DEFAULT '',
			address TEXT,
			year TEXT NOT NULL DEFAULT '',
			volume TEXT,
			sbl_qualifier TEXT,
			applicable_works TEXT,
			url TEXT
		);
		CREATE TABLE corpus_works (
			code TEXT PRIMARY KEY,
			slug TEXT NOT NULL,
			order_index INTEGER NOT NULL,
			category TEXT NOT NULL,
			abbrev TEXT NOT NULL,
			tlg_id TEXT,
			title_english TEXT NOT NULL,
			title_primary TEXT,
			title_secondary TEXT,
			total_divisions INTEGER NOT NULL,
			min_division INTEGER DEFAULT 1,
			division_label TEXT NOT NULL
		);
		CREATE TABLE text_units (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			version_id TEXT NOT NULL,
			corpus_id TEXT NOT NULL,
			work_code TEXT NOT NULL,
			book INTEGER NOT NULL DEFAULT 0,
			chapter INTEGER NOT NULL DEFAULT 0,
			section INTEGER NOT NULL,
			section_label TEXT,
			display_citation TEXT NOT NULL,
			milestone_ref TEXT,
			text_content TEXT NOT NULL
		);
		CREATE TABLE text_unit_tokens (
			work_unit_id INTEGER PRIMARY KEY,
			tokens_json TEXT NOT NULL
		);
		CREATE TABLE lexicon_entries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			dictionary TEXT NOT NULL,
			strongs_id TEXT,
			lemma TEXT NOT NULL,
			normalized_lemma TEXT NOT NULL,
			pos TEXT,
			transliteration TEXT,
			gloss TEXT NOT NULL,
			definition TEXT NOT NULL
		);
		CREATE TABLE lemma_stats (
			corpus_id TEXT NOT NULL,
			lemma TEXT NOT NULL,
			normalized_lemma TEXT NOT NULL,
			total_count INTEGER NOT NULL,
			work_counts_json TEXT NOT NULL,
			concordance_count INTEGER DEFAULT 0,
			PRIMARY KEY (corpus_id, lemma)
		);
		""")

		self.cur.executemany(
			"INSERT INTO db_metadata (key, value) VALUES (?, ?)",
			[
				("schema_version", "2"),
				("corpus_id", self.corpus_id),
				("lemmatizer_scheme", self.lemmatizer_scheme),
				("built_at", datetime.now(timezone.utc).isoformat()),
			],
		)

	def insert_versions(self, versions: Iterable[Dict[str, Any]]) -> None:
		rows = [
			(
				v["id"],
				v["language"],
				v["title"],
				v.get("version_label"),
				v.get("direction", "ltr"),
				v.get("order_index", idx),
				v.get("role", "translation"),
				v.get("editor"),
				v.get("translator"),
				v.get("booktitle", ""),
				v.get("series"),
				v.get("publisher", ""),
				v.get("address"),
				v.get("year", ""),
				v.get("volume"),
				v.get("sbl_qualifier"),
				v.get("applicable_works"),
				v.get("url"),
			)
			for idx, v in enumerate(versions, 1)
		]
		self.cur.executemany(
			"""
			INSERT INTO corpus_versions (
				id, language, title, version_label, direction, order_index,
				role, editor, translator, booktitle, series, publisher,
				address, year, volume, sbl_qualifier, applicable_works, url
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			rows,
		)

	def insert_work(self, spec: Dict[str, Any]) -> None:
		self.cur.execute(
			"""
			INSERT INTO corpus_works (
				code, slug, order_index, category, abbrev, tlg_id,
				title_english, title_primary, title_secondary,
				total_divisions, min_division, division_label
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			(
				spec["code"],
				spec["slug"],
				spec["order_index"],
				spec["category"],
				spec["abbrev"],
				spec.get("tlg_id"),
				spec["title_english"],
				spec.get("title_primary"),
				spec.get("title_secondary"),
				spec["total_divisions"],
				spec.get("min_division", 1),
				spec.get("division_label", "Chapter"),
			),
		)

	def insert_text_unit(
		self,
		version_id: str,
		work_code: str,
		book: int,
		chapter: int,
		section: int,
		display_citation: str,
		text_content: str,
		tokens: Optional[List[Dict[str, Any]]] = None,
		section_label: Optional[str] = None,
		milestone_ref: str = "",
	) -> Optional[int]:
		if not text_content:
			return None
		self.cur.execute(
			"""
			INSERT INTO text_units (
				version_id, corpus_id, work_code, book, chapter, section,
				section_label, display_citation, milestone_ref, text_content
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			(
				version_id,
				version_id,
				work_code,
				book,
				chapter,
				section,
				section_label if section_label is not None else str(section),
				display_citation,
				milestone_ref,
				text_content,
			),
		)
		unit_id = self.cur.lastrowid

		if tokens:
			self.cur.execute(
				"INSERT INTO text_unit_tokens (work_unit_id, tokens_json) VALUES (?, ?)",
				(unit_id, json.dumps(tokens, ensure_ascii=False)),
			)
			for tok in tokens:
				lem = tok.get("l")
				if lem:
					clean_lem = lem.strip().strip(".,;:·'’—")
					if clean_lem:
						self.lemma_totals[clean_lem] += 1
						self.lemma_work_counts[clean_lem][work_code] += 1
						self.used_norm_lemmas.add(strip_greek_accents(clean_lem))
		return unit_id

	def finalize(self, stats_corpus_id: str) -> Path:
		stat_rows = [
			(
				stats_corpus_id,
				lem,
				strip_greek_accents(lem),
				cnt,
				json.dumps(dict(self.lemma_work_counts[lem]), ensure_ascii=False),
			)
			for lem, cnt in self.lemma_totals.items()
		]
		self.cur.executemany(
			"INSERT INTO lemma_stats (corpus_id, lemma, normalized_lemma, total_count, work_counts_json) VALUES (?, ?, ?, ?, ?)",
			stat_rows,
		)

		lsj_dir = WORKSPACE_ROOT / "packages" / "data-pipeline" / "cache"
		if (lsj_dir / "TFLSJ_0_5624.txt").exists() and self.used_norm_lemmas:
			lsj = LSJAdapter(lsj_dir)
			lex_rows = [
				(
					entry["dictionary"],
					entry["strongs_id"],
					entry["lemma"],
					entry["normalized_lemma"],
					entry.get("pos"),
					entry.get("transliteration"),
					entry["gloss"],
					entry["definition"],
				)
				for entry in lsj.iter_entries()
				if entry["normalized_lemma"] in self.used_norm_lemmas
			]
			self.cur.executemany(
				"INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				lex_rows,
			)
			print(f"  ✓ Loaded {len(lex_rows):,} matching LSJ lexicon entries.")

		self.conn.commit()
		self.conn.close()
		print(f"✓ Built raw {self.corpus_id} DB at {self.raw_db_path}")
		return self.raw_db_path
