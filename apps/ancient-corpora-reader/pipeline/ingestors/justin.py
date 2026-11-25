"""Justin Martyr Ingestor for Ancient Corpora Reader (ACR).

Ingests the 3 authentic works of Justin Martyr:
  - 1APOL: First Apology (tlg0645.tlg001 + ANF01 viii.ii ch. 1-68)
  - 2APOL: Second Apology (tlg0645.tlg002 + ANF01 viii.iii ch. 1-15)
  - DIAL:  Dialogue with Trypho (tlg0645.tlg003 + ANF01 viii.iv ch. 1-142)

Uses Celano's LemmatizedAncientGreekXML via the pluggable lemmatizers.py interface
and CCEL Ante-Nicene Fathers Vol. 1 ThML XML, applying exact-match hybrid
sub-chapter alignment (1:1 when section/paragraph counts match; chapter-level fallback otherwise).
"""

from __future__ import annotations
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Any

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
CACHE_DIR = PIPELINE_DIR / "cache" / "justin"
BUILD_DIR = ACR_DIR / "build" / "db"

PIPELINE_CORE_DIR = WORKSPACE_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))
if str(PIPELINE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_DIR))

from pipeline_core.cache_fetcher import download_file  # noqa: E402
from pipeline_core.lsj_resolver import LSJAdapter, strip_greek_accents  # noqa: E402
from lemmatizers import get_lemmatizer  # noqa: E402


WORKS_SPEC = [
	{
		"code": "1APOL",
		"slug": "1-apology",
		"order_index": 1,
		"category": "apology",
		"abbrev": "1 Apol.",
		"tlg_id": "tlg0645.tlg001",
		"title_english": "First Apology",
		"title_primary": "Ἀπολογία Α΄ ὑπὲρ Χριστιανῶν",
		"title_secondary": "Apologia Prima",
		"celano_file": "tlg0645.tlg001.opp-grc1.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg001.opp-grc1.xml",
		"ccel_div2_id": "viii.ii",
		"max_chapter": 68,
	},
	{
		"code": "2APOL",
		"slug": "2-apology",
		"order_index": 2,
		"category": "apology",
		"abbrev": "2 Apol.",
		"tlg_id": "tlg0645.tlg002",
		"title_english": "Second Apology",
		"title_primary": "Ἀπολογία Β΄ ὑπὲρ Χριστιανῶν",
		"title_secondary": "Apologia Secunda",
		"celano_file": "tlg0645.tlg002.opp-grc1.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg002.opp-grc1.xml",
		"ccel_div2_id": "viii.iii",
		"max_chapter": 15,
	},
	{
		"code": "DIAL",
		"slug": "dialogue-with-trypho",
		"order_index": 3,
		"category": "dialogue",
		"abbrev": "Dial.",
		"tlg_id": "tlg0645.tlg003",
		"title_english": "Dialogue with Trypho",
		"title_primary": "Διάλογος πρὸς Τρύφωνα Ἰουδαῖον",
		"title_secondary": "Dialogus cum Tryphone",
		"celano_file": "tlg0645.tlg003.perseus-grc2.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg003.perseus-grc2.xml",
		"ccel_div2_id": "viii.iv",
		"max_chapter": 142,
	},
]

ANF01_URL = "https://www.ccel.org/ccel/schaff/anf01/anf01.xml"


def ensure_sources() -> None:
	"""Downloads any missing Justin Martyr source XMLs into pipeline/cache/justin/."""
	CACHE_DIR.mkdir(parents=True, exist_ok=True)
	download_file(ANF01_URL, CACHE_DIR / "anf01.xml")
	for spec in WORKS_SPEC:
		download_file(spec["celano_url"], CACHE_DIR / spec["celano_file"])


def _join_greek_tokens(tokens: List[Dict[str, Any]]) -> str:
	"""Reconstructs readable Greek text from token list with proper punctuation spacing."""
	no_space_before = set(".,;·:!?)]»’\"")
	no_space_after = set("([«\"'")
	parts: List[str] = []
	for tok in tokens:
		w = tok["w"]
		if not parts:
			parts.append(w)
		elif w in no_space_before or parts[-1] in no_space_after:
			parts.append(w)
		else:
			parts.append(" " + w)
	return "".join(parts).strip()


def parse_celano_work(xml_path: Path, max_chapter: int) -> Dict[int, Dict[int, List[Dict[str, Any]]]]:
	"""Parses Celano XML into {chapter: {section: [raw_tokens]}}."""
	tree = ET.parse(xml_path)
	root = tree.getroot()
	chapters: Dict[int, Dict[int, List[Dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))

	for t in root.iter("t"):
		p_val = (t.attrib.get("p") or "").strip()
		if not p_val:
			continue
		if "." in p_val:
			ch_str, sec_str = p_val.split(".", 1)
			if not (ch_str.isdigit() and sec_str.isdigit()):
				continue
			ch, sec = int(ch_str), int(sec_str)
		elif p_val.isdigit():
			ch, sec = int(p_val), 1
		else:
			continue

		if ch < 1 or ch > max_chapter:
			continue

		f_el = t.find("f")
		surface = (f_el.text or "").strip() if f_el is not None else ""
		if not surface:
			continue

		l1_el = t.find(".//l1")
		l2_el = t.find(".//l2")
		l1 = (l1_el.text or "").strip() if l1_el is not None and l1_el.text else ""
		l2 = (l2_el.text or "").strip() if l2_el is not None and l2_el.text else ""

		chapters[ch][sec].append({
			"w": surface,
			"o": (t.attrib.get("o") or "").strip(),
			"l1": l1,
			"l2": l2,
		})

	return chapters


def _clean_ccel_text(elem: ET.Element) -> str:
	"""Extracts clean English paragraph text from a CCEL ThML <p> element, stripping inline footnotes."""
	chunks: List[str] = []

	def walk(node: ET.Element):
		if node.tag == "note":
			if node.tail:
				chunks.append(node.tail)
			return
		if node.text:
			chunks.append(node.text)
		for child in node:
			walk(child)
		if node.tail and node is not elem:
			chunks.append(node.tail)

	walk(elem)
	text = "".join(chunks)
	return re.sub(r"\s+", " ", text).strip()


def parse_ccel_works(anf_path: Path) -> Dict[str, Dict[int, List[str]]]:
	"""Parses ANF01 ThML XML into {ccel_div2_id: {chapter_num: [paragraph_texts]}}."""
	tree = ET.parse(anf_path)
	root = tree.getroot()
	result: Dict[str, Dict[int, List[str]]] = {}

	target_ids = {s["ccel_div2_id"]: s["max_chapter"] for s in WORKS_SPEC}
	for d2 in root.iter("div2"):
		d2_id = d2.attrib.get("id", "")
		if d2_id not in target_ids:
			continue
		max_ch = target_ids[d2_id]
		ch_map: Dict[int, List[str]] = {}
		for idx, d3 in enumerate(d2.findall("div3"), 1):
			if idx > max_ch:
				break
			paras = [_clean_ccel_text(p) for p in d3.findall("p")]
			paras = [p for p in paras if p]
			if not paras:
				# Some chapters wrap text in <div4> or directly
				paras = [_clean_ccel_text(p) for p in d3.iter("p")]
				paras = [p for p in paras if p]
			ch_map[idx] = paras
		result[d2_id] = ch_map
	return result


def build_justin_raw_db(lemmatizer_scheme: str = "celano") -> Path:
	"""Ingests Justin Martyr sources and writes build/db/justin.raw.sqlite3."""
	import sqlite3

	ensure_sources()
	BUILD_DIR.mkdir(parents=True, exist_ok=True)
	raw_db_path = BUILD_DIR / "justin.raw.sqlite3"
	if raw_db_path.exists():
		raw_db_path.unlink()

	lemmatizer = get_lemmatizer(lemmatizer_scheme)
	ccel_data = parse_ccel_works(CACHE_DIR / "anf01.xml")

	conn = sqlite3.connect(raw_db_path)
	cur = conn.cursor()
	cur.executescript("""
	CREATE TABLE corpus_versions (
		id TEXT PRIMARY KEY,
		language TEXT NOT NULL,
		title TEXT NOT NULL,
		version_label TEXT,
		direction TEXT DEFAULT 'ltr',
		order_index INTEGER DEFAULT 0
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

	cur.executemany(
		"INSERT INTO corpus_versions (id, language, title, version_label, direction, order_index) VALUES (?, ?, ?, ?, ?, ?)",
		[
			("justin_grc", "grc", "Greek Critical Text (First1KGreek / Celano Lemmatized)", "First1KGreek / Celano", "ltr", 1),
			("justin_eng", "eng", "Roberts & Donaldson English Translation (ANF Vol. 1)", "ANF Vol. 1 (1885)", "ltr", 2),
		],
	)

	lemma_totals: Dict[str, int] = defaultdict(int)
	lemma_work_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
	used_norm_lemmas = set()

	for spec in WORKS_SPEC:
		w_code = spec["code"]
		max_ch = spec["max_chapter"]
		cur.execute(
			"""
			INSERT INTO corpus_works (
				code, slug, order_index, category, abbrev, tlg_id,
				title_english, title_primary, title_secondary,
				total_divisions, min_division, division_label
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Chapter')
			""",
			(
				w_code,
				spec["slug"],
				spec["order_index"],
				spec["category"],
				spec["abbrev"],
				spec["tlg_id"],
				spec["title_english"],
				spec["title_primary"],
				spec["title_secondary"],
				max_ch,
			),
		)

		grc_chapters = parse_celano_work(CACHE_DIR / spec["celano_file"], max_ch)
		eng_chapters = ccel_data.get(spec["ccel_div2_id"], {})

		exact_sub_matches = 0
		for ch in range(1, max_ch + 1):
			grc_secs = grc_chapters.get(ch, {})
			eng_paras = eng_chapters.get(ch, [])
			sorted_sec_keys = sorted(grc_secs.keys())

			# Exact-match hybrid: 1:1 sub-chapter alignment when section count == paragraph count (and > 1)
			if len(sorted_sec_keys) > 1 and len(sorted_sec_keys) == len(eng_paras):
				exact_sub_matches += 1
				pairs = [
					(idx, grc_secs[sec_k], eng_paras[idx - 1])
					for idx, sec_k in enumerate(sorted_sec_keys, 1)
				]
			else:
				merged_grc: List[Dict[str, Any]] = []
				for sec_k in sorted_sec_keys:
					merged_grc.extend(grc_secs[sec_k])
				merged_eng = "\n\n".join(eng_paras)
				pairs = [(1, merged_grc, merged_eng)]

			for sec_num, raw_toks, eng_text in pairs:
				cit = f"{spec['abbrev']} {ch}:{sec_num}"
				canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
				grc_text = _join_greek_tokens(canon_toks)

				if grc_text:
					cur.execute(
						"""
						INSERT INTO text_units (
							version_id, corpus_id, work_code, book, chapter, section,
							section_label, display_citation, milestone_ref, text_content
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						""",
						("justin_grc", "justin_grc", w_code, ch, ch, sec_num, str(sec_num), cit, "", grc_text),
					)
					unit_id = cur.lastrowid
					cur.execute(
						"INSERT INTO text_unit_tokens (work_unit_id, tokens_json) VALUES (?, ?)",
						(unit_id, json.dumps(canon_toks, ensure_ascii=False)),
					)
					for tok in canon_toks:
						lem = tok.get("l")
						if lem:
							clean_lem = lem.strip().strip(".,;:·'’—")
							if clean_lem:
								lemma_totals[clean_lem] += 1
								lemma_work_counts[clean_lem][w_code] += 1
								used_norm_lemmas.add(strip_greek_accents(clean_lem))

				if eng_text:
					cur.execute(
						"""
						INSERT INTO text_units (
							version_id, corpus_id, work_code, book, chapter, section,
							section_label, display_citation, milestone_ref, text_content
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
						""",
						("justin_eng", "justin_eng", w_code, ch, ch, sec_num, str(sec_num), cit, "", eng_text),
					)

		print(f"  ✓ Ingested {w_code} ({max_ch} chapters; {exact_sub_matches} exact sub-chapter alignments)")

	# Populate lemma_stats
	stat_rows = [
		(
			"justin_grc",
			lem,
			strip_greek_accents(lem),
			cnt,
			json.dumps(dict(lemma_work_counts[lem]), ensure_ascii=False),
		)
		for lem, cnt in lemma_totals.items()
	]
	cur.executemany(
		"INSERT INTO lemma_stats (corpus_id, lemma, normalized_lemma, total_count, work_counts_json) VALUES (?, ?, ?, ?, ?)",
		stat_rows,
	)

	# Populate LSJ lexicon_entries from packages/data-pipeline/cache
	lsj_dir = WORKSPACE_ROOT / "packages" / "data-pipeline" / "cache"
	if (lsj_dir / "TFLSJ_0_5624.txt").exists():
		lsj = LSJAdapter(lsj_dir)
		lex_rows = []
		for entry in lsj.iter_entries():
			if entry["normalized_lemma"] in used_norm_lemmas:
				lex_rows.append((
					entry["dictionary"],
					entry["strongs_id"],
					entry["lemma"],
					entry["normalized_lemma"],
					entry.get("pos"),
					entry.get("transliteration"),
					entry["gloss"],
					entry["definition"],
				))
		cur.executemany(
			"INSERT INTO lexicon_entries (dictionary, strongs_id, lemma, normalized_lemma, pos, transliteration, gloss, definition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			lex_rows,
		)
		print(f"  ✓ Loaded {len(lex_rows):,} matching LSJ lexicon entries.")
	else:
		print(f"  ! Warning: TFLSJ files not found in {lsj_dir}; lexicon_entries will be empty.")

	conn.commit()
	conn.close()
	print(f"✓ Built raw Justin Martyr DB at {raw_db_path}")
	return raw_db_path


if __name__ == "__main__":
	build_justin_raw_db()
