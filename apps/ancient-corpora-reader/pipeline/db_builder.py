"""ACR Pipeline - SQLite Database Builder.

Builds standardized canonical Tier-2 SQLite databases for Ancient Corpora Reader:
- Canonical corpus_versions and corpus_works catalog
- Lean text_units with standardized coordinates and milestone_ref
- Independent text_unit_tokens table
- Self-contained covering concordance_refs table (WITHOUT ROWID) with precomputed KWIC snippets
- Universal precomputed lemma_forms table for all corpora (Philo, Josephus, AF)
- Canonical lexicon_entries and lemma_stats tables
- Strict automated schema verification before chunking
"""

from __future__ import annotations
import json
import re
import sqlite3
import unicodedata
from pathlib import Path
from typing import Dict, List, Set, Any, Optional

from .snippet_builder import make_kwic_snippet


REQUIRED_TABLES = {
	"corpus_versions": {"id", "language", "title", "version_label", "direction", "order_index"},
	"corpus_works": {"code", "slug", "order_index", "category", "abbrev", "title_english", "total_divisions", "division_label"},
	"text_units": {"id", "version_id", "work_code", "book", "chapter", "section", "display_citation", "milestone_ref", "text_content"},
	"text_unit_tokens": {"work_unit_id", "tokens_json"},
	"concordance_refs": {"corpus_id", "lemma", "work_unit_id", "display_citation", "work_code", "matched_form", "kwic_snippet"},
	"lexicon_entries": {"id", "dictionary", "lemma", "normalized_lemma", "pos", "transliteration", "gloss", "definition"},
	"lemma_forms": {"id", "corpus_id", "lemma_key", "normalized_lemma", "forms_json"}
}


def strip_accents(text: str) -> str:
	"""Removes combining diacritical marks from Greek/Latin text."""
	if not text:
		return ""
	nfkd = unicodedata.normalize("NFKD", text)
	return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def slugify(text: str) -> str:
	"""Convert text to URL-friendly lowercase slug."""
	return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def verify_canonical_schema(db_path: Path):
	"""Asserts that the compiled database conforms 100% to the canonical schema contract."""
	conn = sqlite3.connect(db_path)
	cur = conn.cursor()
	cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
	existing_tables = {row[0] for row in cur.fetchall()}

	for tbl, req_cols in REQUIRED_TABLES.items():
		if tbl not in existing_tables:
			conn.close()
			raise AssertionError(f"Missing canonical table: '{tbl}' in {db_path.name}")
		cur.execute(f"PRAGMA table_info({tbl})")
		cols = {r[1] for r in cur.fetchall()}
		missing = req_cols - cols
		if missing:
			conn.close()
			raise AssertionError(f"Table '{tbl}' in {db_path.name} missing required columns: {missing}")

	conn.close()
	print(f"  ✓ Canonical schema verification passed for {db_path.name}")


def build_covering_concordance(
	src_conn: sqlite3.Connection,
	tgt_conn: sqlite3.Connection,
	corpus_type: str,
):
	"""Populates the covering concordance_refs table with snippets and surface forms."""
	print(f"  → Building covering concordance_refs with precomputed KWIC snippets ({corpus_type})...")
	src_cur = src_conn.cursor()
	tgt_cur = tgt_conn.cursor()

	tgt_cur.execute("""
	CREATE TABLE concordance_refs (
		corpus_id TEXT NOT NULL,
		lemma TEXT NOT NULL,
		work_unit_id INTEGER NOT NULL,
		display_citation TEXT NOT NULL,
		work_code TEXT NOT NULL,
		book INTEGER DEFAULT 0,
		chapter INTEGER DEFAULT 0,
		section INTEGER NOT NULL,
		milestone_ref TEXT DEFAULT '',
		niese_section TEXT DEFAULT '',
		matched_form TEXT NOT NULL,
		kwic_snippet TEXT NOT NULL,
		PRIMARY KEY (corpus_id, lemma, work_unit_id, matched_form)
	) WITHOUT ROWID;
	""")

	# Query text units with tokens from source DB
	src_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='text_unit_tokens'")
	has_tokens_table = src_cur.fetchone() is not None

	if corpus_type == "josephus":
		if has_tokens_table:
			src_cur.execute("""
				SELECT u.id, u.corpus_id, u.work_code, u.book, u.section_num, u.niese_section, u.display_citation, u.text_content, tok.tokens_json
				FROM text_units u
				JOIN text_unit_tokens tok ON tok.work_unit_id = u.id
			""")
		else:
			src_cur.execute("""
				SELECT id, corpus_id, work_code, book, section_num, niese_section, display_citation, text_content, tokens_json
				FROM text_units
				WHERE tokens_json IS NOT NULL
			""")
	elif corpus_type == "philo":
		if has_tokens_table:
			src_cur.execute("""
				SELECT u.id, u.corpus_id, u.work_code, u.chapter, u.section, u.mangey_ref, u.display_citation, u.text_content, tok.tokens_json
				FROM text_units u
				JOIN text_unit_tokens tok ON tok.work_unit_id = u.id
			""")
		else:
			src_cur.execute("""
				SELECT id, corpus_id, work_code, chapter, section, mangey_ref, display_citation, text_content, tokens_json
				FROM text_units
				WHERE tokens_json IS NOT NULL
			""")
	else:  # af
		if has_tokens_table:
			src_cur.execute("""
				SELECT u.id, u.corpus_id, u.work_code, u.chapter, u.section, u.display_citation, u.text_content, tok.tokens_json
				FROM text_units u
				JOIN text_unit_tokens tok ON tok.work_unit_id = u.id
			""")
		else:
			src_cur.execute("""
				SELECT id, corpus_id, work_code, chapter, section, display_citation, text_content, tokens_json
				FROM text_units
				WHERE tokens_json IS NOT NULL
			""")

	batch_rows = []
	seen_keys: Set[tuple] = set()
	total_units = 0

	while True:
		chunk = src_cur.fetchmany(500)
		if not chunk:
			break
		for row in chunk:
			total_units += 1
			if corpus_type == "josephus":
				u_id, c_id, w_code, b, sec_num, niese_sec, cit, text, raw_tokens = row
				ch = 0
				sec = sec_num
				milestone = str(niese_sec or "")
			elif corpus_type == "philo":
				u_id, c_id, w_code, ch_num, sec_num, mangey_ref, cit, text, raw_tokens = row
				b = ch_num
				ch = ch_num
				sec = sec_num
				milestone = str(mangey_ref or "")
			else:  # af
				u_id, c_id, w_code, ch_num, sec_num, cit, text, raw_tokens = row
				b = ch_num
				ch = ch_num
				sec = sec_num
				milestone = ""

			if not raw_tokens or not text:
				continue

			try:
				tokens = json.loads(raw_tokens)
			except Exception:
				continue

			# Map unique lemmas to surface forms in this section
			lemma_surface_map: Dict[str, Set[str]] = {}
			for tok in tokens:
				lemma = tok.get("l")
				word = tok.get("w")
				if not lemma or not word:
					continue
				clean_lemma = lemma.strip().strip(".,;:·'’—")
				clean_word = word.strip().strip(".,;:·'’—")
				if not clean_lemma or not clean_word:
					continue
				if clean_lemma not in lemma_surface_map:
					lemma_surface_map[clean_lemma] = set()
				lemma_surface_map[clean_lemma].add(clean_word)

			# Generate snippet for each distinct lemma and surface form
			for lem, surfaces in lemma_surface_map.items():
				for surf in surfaces:
					key = (c_id, lem, u_id, surf)
					if key in seen_keys:
						continue
					seen_keys.add(key)
					snippet = make_kwic_snippet(text, surf, radius=45)
					batch_rows.append((
						c_id,
						lem,
						u_id,
						cit,
						w_code,
						b,
						ch,
						sec,
						milestone,
						milestone,  # niese_section compatibility column
						surf,
						snippet,
					))

			if len(batch_rows) >= 5000:
				tgt_cur.executemany("""
					INSERT OR IGNORE INTO concordance_refs (
						corpus_id, lemma, work_unit_id, display_citation, work_code,
						book, chapter, section, milestone_ref, niese_section, matched_form, kwic_snippet
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				""", batch_rows)
				batch_rows.clear()

	if batch_rows:
		tgt_cur.executemany("""
			INSERT OR IGNORE INTO concordance_refs (
				corpus_id, lemma, work_unit_id, display_citation, work_code,
				book, chapter, section, milestone_ref, niese_section, matched_form, kwic_snippet
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		""", batch_rows)
		batch_rows.clear()

	tgt_cur.execute("""
	CREATE INDEX IF NOT EXISTS idx_concordance_paged ON concordance_refs(
		corpus_id, lemma, work_code, book, chapter, section
	);
	""")
	print(f"  ✓ Processed {total_units:,} text units into {len(seen_keys):,} covering concordance refs.")


def build_lemma_forms(src_conn: sqlite3.Connection, tgt_conn: sqlite3.Connection, corpus_type: str):
	"""Generates unified, precomputed lemma_forms for all corpora."""
	print(f"  → Generating canonical lemma_forms table ({corpus_type})...")
	tgt_cur = tgt_conn.cursor()
	src_cur = src_conn.cursor()

	tgt_cur.executescript("""
	CREATE TABLE IF NOT EXISTS lemma_forms (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		corpus_id TEXT NOT NULL,
		lemma_key TEXT NOT NULL,
		normalized_lemma TEXT NOT NULL,
		forms_json TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_lemma_forms_lookup ON lemma_forms(lemma_key, corpus_id);
	CREATE INDEX IF NOT EXISTS idx_lemma_forms_norm ON lemma_forms(normalized_lemma, corpus_id);
	""")

	rows_to_insert = []

	if corpus_type == "philo":
		# Philo source DB already has lemma_forms!
		src_cur.execute("SELECT corpus_id, lemma_key, forms_json FROM lemma_forms")
		for cid, l_key, f_json in src_cur.fetchall():
			norm_key = strip_accents(l_key)
			rows_to_insert.append((cid, l_key, norm_key, f_json))

	elif corpus_type == "josephus":
		# Josephus has attested_forms: lemma, form, pos, parse_code, description
		# Retrieve form occurrence counts from newly built concordance_refs
		tgt_cur.execute("""
			SELECT lemma, matched_form, COUNT(*)
			FROM concordance_refs
			GROUP BY lemma, matched_form
		""")
		form_counts = {}
		for lem, form, cnt in tgt_cur.fetchall():
			form_counts[(lem, form)] = cnt

		src_cur.execute("SELECT lemma, form, pos, parse_code, description FROM attested_forms")
		lemma_group: Dict[str, Dict[str, Any]] = {}
		for lem, form, pos, parse, desc in src_cur.fetchall():
			if not lem or not form:
				continue
			if lem not in lemma_group:
				lemma_group[lem] = {}
			if form not in lemma_group[lem]:
				cnt = form_counts.get((lem, form), 1)
				lemma_group[lem][form] = {
					"form": form,
					"canonicalForm": form,
					"rawForms": [form],
					"count": cnt,
					"analyses": []
				}
			if parse or desc or pos:
				lemma_group[lem][form]["analyses"].append({
					"rawCode": parse or "",
					"pos": pos or "",
					"summary": desc or f"{pos} {parse}".strip()
				})

		for lem, forms_dict in lemma_group.items():
			forms_list = list(forms_dict.values())
			forms_list.sort(key=lambda x: x["count"], reverse=True)
			forms_json = json.dumps({"forms": forms_list}, ensure_ascii=False)
			norm_lem = strip_accents(lem)
			rows_to_insert.append(("josephus_grc", lem, norm_lem, forms_json))

	else:  # af
		# Apostolic Fathers: Precompute from text_unit_tokens at build time
		src_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='text_unit_tokens'")
		if src_cur.fetchone():
			src_cur.execute("SELECT tokens_json FROM text_unit_tokens")
		else:
			src_cur.execute("SELECT tokens_json FROM text_units WHERE tokens_json IS NOT NULL")
		lemma_group: Dict[str, Dict[str, Any]] = {}
		for (raw_toks,) in src_cur.fetchall():
			if not raw_toks:
				continue
			try:
				tokens = json.loads(raw_toks)
			except Exception:
				continue
			for tok in tokens:
				lemma = tok.get("l")
				word = tok.get("w")
				if not lemma or not word:
					continue
				clean_lemma = lemma.strip().strip(".,;:·'’—")
				clean_word = word.strip().strip(".,;:·'’—")
				if not clean_lemma or not clean_word:
					continue
				pos = tok.get("p", "")
				morph = tok.get("m", "")

				if clean_lemma not in lemma_group:
					lemma_group[clean_lemma] = {}
				if clean_word not in lemma_group[clean_lemma]:
					lemma_group[clean_lemma][clean_word] = {
						"form": clean_word,
						"canonicalForm": clean_word,
						"rawForms": set(),
						"count": 0,
						"analyses_map": {}
					}
				entry = lemma_group[clean_lemma][clean_word]
				entry["rawForms"].add(word)
				entry["count"] += 1
				if morph or pos:
					entry["analyses_map"][morph] = {
						"rawCode": morph,
						"pos": pos,
						"summary": f"{pos} {morph}".strip()
					}

		for lem, forms_dict in lemma_group.items():
			forms_list = []
			for word, data in forms_dict.items():
				forms_list.append({
					"form": data["form"],
					"canonicalForm": data["canonicalForm"],
					"rawForms": list(data["rawForms"]),
					"count": data["count"],
					"analyses": list(data["analyses_map"].values())
				})
			forms_list.sort(key=lambda x: x["count"], reverse=True)
			forms_json = json.dumps({"forms": forms_list}, ensure_ascii=False)
			norm_lem = strip_accents(lem)
			rows_to_insert.append(("lake_grc", lem, norm_lem, forms_json))

	tgt_cur.executemany("""
		INSERT INTO lemma_forms (corpus_id, lemma_key, normalized_lemma, forms_json)
		VALUES (?, ?, ?, ?)
	""", rows_to_insert)
	print(f"  ✓ Precomputed {len(rows_to_insert):,} lemma_forms records for {corpus_type}.")


def build_optimized_corpus_db(corpus_type: str, src_path: Path, tgt_path: Path):
	"""Builds an optimized canonical Tier-2 SQLite database for a single corpus."""
	print(f"\n==================================================")
	print(f"Compiling Canonical Database: {corpus_type.upper()}")
	print(f"Source: {src_path}")
	print(f"Target: {tgt_path}")
	print(f"==================================================")

	if not src_path.exists():
		raise FileNotFoundError(f"Source database not found: {src_path}")

	tgt_path.parent.mkdir(parents=True, exist_ok=True)
	if tgt_path.exists():
		tgt_path.unlink()

	src_conn = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
	tgt_conn = sqlite3.connect(tgt_path)

	tgt_cur = tgt_conn.cursor()
	tgt_cur.execute("PRAGMA page_size = 16384;")
	tgt_cur.execute("PRAGMA synchronous = OFF;")
	tgt_cur.execute("PRAGMA journal_mode = MEMORY;")

	# 1. Compile corpus_versions (+ backward compatibility view 'corpora')
	print("  → Compiling corpus_versions...")
	tgt_cur.executescript("""
	CREATE TABLE corpus_versions (
		id TEXT PRIMARY KEY,
		language TEXT NOT NULL,
		title TEXT NOT NULL,
		version_label TEXT,
		direction TEXT DEFAULT 'ltr',
		order_index INTEGER DEFAULT 0
	);

	CREATE VIEW IF NOT EXISTS corpora AS
	SELECT id, title, language, direction, 1 AS is_source, '' AS license, '' AS attribution
	FROM corpus_versions;
	""")

	src_cur = src_conn.cursor()
	src_cur.execute("SELECT id, title, language, direction FROM corpora")
	src_versions = src_cur.fetchall()
	norm_versions = [
		(r[0], r[2], r[1], r[1], r[3] or 'ltr', idx + 1)
		for idx, r in enumerate(src_versions)
	]
	tgt_cur.executemany("INSERT INTO corpus_versions VALUES (?, ?, ?, ?, ?, ?)", norm_versions)

	# 2. Compile corpus_works (+ backward compatibility view 'canonical_works')
	print("  → Compiling corpus_works...")
	tgt_cur.executescript("""
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
	CREATE INDEX idx_corpus_works_order ON corpus_works(order_index ASC);

	CREATE VIEW IF NOT EXISTS canonical_works AS
	SELECT code, order_index, category, abbrev, tlg_id, title_english,
	       title_primary AS title_greek, title_secondary AS title_latin,
	       total_divisions AS total_books, total_divisions AS total_chapters,
	       0 AS total_sections, min_division AS default_book
	FROM corpus_works;
	""")

	src_cur.execute("PRAGMA table_info(canonical_works)")
	w_cols = [r[1] for r in src_cur.fetchall()]
	w_col_idx = {name: i for i, name in enumerate(w_cols)}

	src_cur.execute("SELECT * FROM canonical_works")
	norm_works = []
	for r in src_cur.fetchall():
		code = r[w_col_idx["code"]]
		order_idx = r[w_col_idx["order_index"]]
		category = r[w_col_idx["category"]]
		abbrev = r[w_col_idx["abbrev"]] if "abbrev" in w_col_idx and r[w_col_idx["abbrev"]] else code
		tlg_id = r[w_col_idx["tlg_id"]] if "tlg_id" in w_col_idx else None
		title_eng = r[w_col_idx["title_english"]]
		title_pri = r[w_col_idx["title_greek"]] if "title_greek" in w_col_idx else None
		title_sec = r[w_col_idx["title_latin"]] if "title_latin" in w_col_idx else None
		tot_books = r[w_col_idx["total_books"]] if "total_books" in w_col_idx else 0
		tot_chaps = r[w_col_idx["total_chapters"]] if "total_chapters" in w_col_idx else 0
		tot_secs = r[w_col_idx["total_sections"]] if "total_sections" in w_col_idx else 0

		slug = slugify(code)
		if corpus_type == "josephus":
			total_divs = tot_books or 1
			div_label = "Book"
			min_div = 1
		elif corpus_type == "philo":
			if (tot_books or 0) > 1:
				total_divs = tot_books
				div_label = "Book"
			else:
				total_divs = tot_chaps or tot_secs or 1
				div_label = "Chapter"
			min_div = 1
		else:  # af
			total_divs = tot_chaps or tot_secs or 1
			div_label = "Chapter"
			min_div = 0 if code in ("1CLE", "1-clem") else 1

		norm_works.append((
			code, slug, order_idx, category, abbrev, tlg_id,
			title_eng, title_pri, title_sec, total_divs, min_div, div_label
		))

	tgt_cur.executemany("""
		INSERT INTO corpus_works VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	""", norm_works)

	# 3. Create canonical text_units and text_unit_tokens
	print("  → Normalizing text_units and text_unit_tokens...")
	tgt_cur.executescript("""
	CREATE TABLE text_units (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		version_id TEXT NOT NULL REFERENCES corpus_versions(id),
		corpus_id TEXT NOT NULL,
		work_code TEXT NOT NULL REFERENCES corpus_works(code),
		book INTEGER NOT NULL DEFAULT 0,
		chapter INTEGER NOT NULL DEFAULT 0,
		section INTEGER NOT NULL,
		section_label TEXT,
		section_num INTEGER DEFAULT 0,
		niese_section TEXT DEFAULT '',
		mangey_ref TEXT,
		is_supplement INTEGER NOT NULL DEFAULT 0,
		display_citation TEXT NOT NULL,
		milestone_ref TEXT,
		text_content TEXT NOT NULL
	);
	CREATE INDEX idx_text_units_seek ON text_units(work_code, book, chapter, section, version_id);
	CREATE INDEX idx_text_units_coords ON text_units(work_code, book, chapter, section, corpus_id);
	""")

	if corpus_type == "josephus":
		src_cur.execute("""
			SELECT id, corpus_id, work_code, book, section_num, niese_section, display_citation, text_content
			FROM text_units
		""")
		norm_units = [
			(
				r[0], r[1], r[1], r[2], r[3], 0, r[4], str(r[4]), r[4],
				str(r[5] or ""), None, 0, r[6], str(r[5] or ""), r[7]
			)
			for r in src_cur.fetchall()
		]
	elif corpus_type == "philo":
		src_cur.execute("""
			SELECT id, corpus_id, work_code, chapter, section, mangey_ref, is_supplement, display_citation, text_content
			FROM text_units
		""")
		norm_units = [
			(
				r[0], r[1], r[1], r[2], r[3], r[3], r[4], str(r[4]), r[4],
				"", str(r[5] or ""), r[6] or 0, r[7], str(r[5] or ""), r[8]
			)
			for r in src_cur.fetchall()
		]
	else:  # af
		src_cur.execute("""
			SELECT id, corpus_id, work_code, chapter, section, display_citation, text_content
			FROM text_units
		""")
		norm_units = [
			(
				r[0], r[1], r[1], r[2], r[3], r[3], r[4], str(r[4]), r[4],
				"", None, 0, r[5], "", r[6]
			)
			for r in src_cur.fetchall()
		]

	tgt_cur.executemany("""
		INSERT INTO text_units (
			id, version_id, corpus_id, work_code, book, chapter, section, section_label,
			section_num, niese_section, mangey_ref, is_supplement, display_citation, milestone_ref, text_content
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	""", norm_units)

	# Populate text_unit_tokens
	tgt_cur.execute("""
	CREATE TABLE text_unit_tokens (
		work_unit_id INTEGER PRIMARY KEY,
		tokens_json TEXT NOT NULL
	) WITHOUT ROWID;
	""")
	src_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='text_unit_tokens'")
	if src_cur.fetchone():
		src_cur.execute("SELECT work_unit_id, tokens_json FROM text_unit_tokens")
	else:
		src_cur.execute("SELECT id, tokens_json FROM text_units WHERE tokens_json IS NOT NULL")
	tgt_cur.executemany("INSERT INTO text_unit_tokens VALUES (?, ?)", src_cur.fetchall())

	# 4. Canonical lexicon_entries
	print("  → Normalizing lexicon_entries...")
	tgt_cur.executescript("""
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
	CREATE INDEX idx_lexicon_lookup ON lexicon_entries(normalized_lemma, dictionary);
	CREATE INDEX idx_lexicon_lemma ON lexicon_entries(lemma, dictionary);
	CREATE INDEX idx_lexicon_exact ON lexicon_entries(dictionary, lemma);
	""")

	src_cur.execute("PRAGMA table_info(lexicon_entries)")
	lex_cols = [r[1] for r in src_cur.fetchall()]
	has_pos = "pos" in lex_cols
	has_translit = "transliteration" in lex_cols

	if has_pos and has_translit:
		src_cur.execute("""
			SELECT LOWER(dictionary), strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition
			FROM lexicon_entries
		""")
		norm_lex = src_cur.fetchall()
	elif has_pos and not has_translit:
		src_cur.execute("""
			SELECT LOWER(dictionary), strongs_id, lemma, normalized_lemma, pos, gloss, definition
			FROM lexicon_entries
		""")
		norm_lex = [(r[0], r[1], r[2], r[3], r[4], None, r[5], r[6]) for r in src_cur.fetchall()]
	elif has_translit and not has_pos:
		src_cur.execute("""
			SELECT LOWER(dictionary), strongs_id, lemma, normalized_lemma, transliteration, gloss, definition
			FROM lexicon_entries
		""")
		norm_lex = [(r[0], r[1], r[2], r[3], None, r[4], r[5], r[6]) for r in src_cur.fetchall()]
	else:
		src_cur.execute("""
			SELECT LOWER(dictionary), strongs_id, lemma, normalized_lemma, gloss, definition
			FROM lexicon_entries
		""")
		norm_lex = [(r[0], r[1], r[2], r[3], None, None, r[4], r[5]) for r in src_cur.fetchall()]

	tgt_cur.executemany("""
		INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	""", norm_lex)

	# 5. Copy lemma_stats
	print("  → Copying lemma_stats...")
	src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='lemma_stats'")
	stat_ddl_row = src_cur.fetchone()
	if stat_ddl_row:
		tgt_cur.execute(stat_ddl_row[0])
		src_cur.execute("PRAGMA table_info(lemma_stats)")
		stat_cols = [r[1] for r in src_cur.fetchall()]
		stat_cols_str = ", ".join(stat_cols)
		stat_placeholders = ", ".join(["?"] * len(stat_cols))
		src_cur.execute(f"SELECT {stat_cols_str} FROM lemma_stats")
		tgt_cur.executemany(f"INSERT INTO lemma_stats ({stat_cols_str}) VALUES ({stat_placeholders})", src_cur.fetchall())
		if "concordance_count" not in stat_cols:
			tgt_cur.execute("ALTER TABLE lemma_stats ADD COLUMN concordance_count INTEGER DEFAULT 0;")
		tgt_cur.execute("CREATE INDEX IF NOT EXISTS idx_lemma_stats_norm ON lemma_stats(corpus_id, normalized_lemma);")

	# 6. Copy corpus-specific optional tables (e.g. biblical_citations in Philo)
	if corpus_type == "philo":
		print("  → Copying biblical_citations...")
		src_cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='biblical_citations'")
		bib_row = src_cur.fetchone()
		if bib_row:
			tgt_cur.execute(bib_row[0])
			src_cur.execute("SELECT * FROM biblical_citations")
			tgt_cur.executemany("INSERT INTO biblical_citations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", src_cur.fetchall())

	# 7. Build Covering Concordance Table
	build_covering_concordance(src_conn, tgt_conn, corpus_type)

	# 7.1 Populate concordance_count in lemma_stats
	if stat_ddl_row:
		print("  → Populating concordance_count in lemma_stats...")
		tgt_cur.execute("""
			UPDATE lemma_stats
			SET concordance_count = COALESCE((
				SELECT count(*) 
				FROM concordance_refs c 
				WHERE c.corpus_id = lemma_stats.corpus_id AND c.lemma = lemma_stats.lemma
			), 0)
		""")

	# 8. Build Universal Precomputed lemma_forms
	build_lemma_forms(src_conn, tgt_conn, corpus_type)

	# 9. Commit before verification
	tgt_conn.commit()

	# 10. Automated Schema Verification Check
	verify_canonical_schema(tgt_path)

	# 11. Final Optimization & Vacuum
	print("  → Optimizing and vacuuming target database...")
	tgt_cur.execute("PRAGMA optimize;")
	tgt_cur.execute("VACUUM;")
	tgt_conn.commit()

	src_conn.close()
	tgt_conn.close()

	tgt_size_mb = tgt_path.stat().st_size / (1024 * 1024)
	print(f"✓ Compiled {tgt_path.name}: {tgt_size_mb:.2f} MB")
