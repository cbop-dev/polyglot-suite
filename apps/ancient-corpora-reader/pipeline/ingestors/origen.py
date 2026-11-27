"""Origen of Alexandria Ingestor for Ancient Corpora Reader (ACR).

Ingests 7 freely available bilingual/trilingual works of Origen:
  - PRIN:    De Principiis (Latin Rufinus POS.xml + Greek Migne PG 11 PDF + ANF04 English)
  - CELS:    Contra Celsum (Celano Greek + ANF04 English)
  - COMM_JO: Commentary on John (Celano Greek + ANF09 English)
  - COMM_MT: Commentary on Matthew (Celano Greek + First1KGreek Latin + ANF09 English)
  - EP_AFR:  Letter to Africanus (Celano Greek + ANF04 English)
  - ORAT:    On Prayer / De Oratione (Celano Greek + Tertullian.org English)
  - PHIL:    Philocalia (First1KGreek TEI Greek + Tertullian.org English)
"""

from __future__ import annotations
import html as html_lib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
CACHE_DIR = PIPELINE_DIR / "cache" / "origen"

PIPELINE_CORE_DIR = WORKSPACE_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))
if str(PIPELINE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_DIR))

from pipeline_core.cache_fetcher import download_file  # noqa: E402
from config import CORPUS_VERSIONS_CATALOG  # noqa: E402
from lemmatizers import get_lemmatizer  # noqa: E402
from ingestors.base import RawCorpusWriter  # noqa: E402
from ingestors.parsers import (  # noqa: E402
	CCELThmlParser,
	CelanoParser,
	CorpusCorporumPosParser,
	TEIParser,
	join_tokens,
)
from ingestors.aligner import ExactMatchHybridAligner  # noqa: E402

SOURCES = {
	"anf04.xml": "https://www.ccel.org/ccel/schaff/anf04/anf04.xml",
	"anf09.xml": "https://www.ccel.org/ccel/schaff/anf09/anf09.xml",
	"tlg2042.tlg001.perseus-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg001.perseus-grc1.xml",
	"tlg2042.tlg005.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg005.opp-grc1.xml",
	"tlg2042.tlg008.perseus-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg008.perseus-grc1.xml",
	"tlg2042.tlg029.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg029.opp-grc1.xml",
	"tlg2042.tlg030.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg030.opp-grc1.xml",
	"tlg2042.tlg045.1st1K-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg2042.tlg045.1st1K-grc1.xml",
	"tlg2042.tlg019.1st1K-grc1.xml": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2042/tlg019/tlg2042.tlg019.1st1K-grc1.xml",
	"tlg2042.tlg030.opp-lat1.xml": "https://raw.githubusercontent.com/OpenGreekAndLatin/First1KGreek/master/data/tlg2042/tlg030/tlg2042.tlg030.opp-lat1.xml",
	"origen_on_prayer_02_text.htm": "https://www.tertullian.org/fathers/origen_on_prayer_02_text.htm",
	"origen_philocalia_02_text.htm": "https://www.tertullian.org/fathers/origen_philocalia_02_text.htm",
	"origen_de_principiis_mgr.pdf": "https://www.documentacatholicaomnia.eu/02g/0185-0254,_Origenes,_De_principiis,_MGR.pdf",
}

WORKS_SPEC = [
	{
		"code": "PRIN",
		"slug": "de-principiis",
		"order_index": 1,
		"category": "treatise",
		"abbrev": "Princ.",
		"tlg_id": None,
		"title_english": "On First Principles (De Principiis)",
		"title_primary": "Περὶ ἀρχῶν",
		"title_secondary": "De Principiis",
		"total_divisions": 4,
		"min_division": 1,
		"division_label": "Book",
		"hierarchy_levels": ["Book", "Chapter", "Section"],
	},
	{
		"code": "CELS",
		"slug": "contra-celsum",
		"order_index": 2,
		"category": "apology",
		"abbrev": "Cels.",
		"tlg_id": "tlg2042.tlg001",
		"title_english": "Against Celsus (Contra Celsum)",
		"title_primary": "Κατὰ Κέλσου",
		"title_secondary": "Contra Celsum",
		"total_divisions": 8,
		"min_division": 1,
		"division_label": "Book",
	},
	{
		"code": "COMM_JO",
		"slug": "commentary-on-john",
		"order_index": 3,
		"category": "commentary",
		"abbrev": "Comm. Jo.",
		"tlg_id": "tlg2042.tlg005",
		"title_english": "Commentary on the Gospel of John",
		"title_primary": "Εἰς τὸ κατὰ Ἰωάννην εὐαγγέλιον",
		"title_secondary": "Commentarii in Evangelium Joannis",
		"total_divisions": 32,
		"min_division": 1,
		"division_label": "Book",
	},
	{
		"code": "COMM_MT",
		"slug": "commentary-on-matthew",
		"order_index": 4,
		"category": "commentary",
		"abbrev": "Comm. Matt.",
		"tlg_id": "tlg2042.tlg029",
		"title_english": "Commentary on the Gospel of Matthew",
		"title_primary": "Εἰς τὸ κατὰ Ματθαῖον εὐαγγέλιον",
		"title_secondary": "Commentarium in Evangelium Matthaei",
		"total_divisions": 17,
		"min_division": 10,
		"division_label": "Book",
	},
	{
		"code": "ORAT",
		"slug": "on-prayer",
		"order_index": 5,
		"category": "treatise",
		"abbrev": "Or.",
		"tlg_id": "tlg2042.tlg008",
		"title_english": "On Prayer (De Oratione)",
		"title_primary": "Περὶ εὐχῆς",
		"title_secondary": "De Oratione",
		"total_divisions": 34,
		"min_division": 1,
		"division_label": "Chapter",
	},
	{
		"code": "PHIL",
		"slug": "philocalia",
		"order_index": 6,
		"category": "anthology",
		"abbrev": "Philoc.",
		"tlg_id": "tlg2042.tlg019",
		"title_english": "Philocalia",
		"title_primary": "Φιλοκαλία",
		"title_secondary": "Philocalia",
		"total_divisions": 27,
		"min_division": 1,
		"division_label": "Chapter",
	},
	{
		"code": "EP_AFR",
		"slug": "letter-to-africanus",
		"order_index": 7,
		"category": "epistle",
		"abbrev": "Ep. Afr.",
		"tlg_id": "tlg2042.tlg045",
		"title_english": "Letter to Africanus",
		"title_primary": "Πρὸς Ἀφρικανόν",
		"title_secondary": "Epistula ad Africanum",
		"total_divisions": 1,
		"min_division": 1,
		"division_label": "Chapter",
	},
]

ROMAN_MAP = {
	"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
	"IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
	"XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20, "XXI": 21,
	"XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25, "XXVI": 26, "XXVII": 27,
	"XXVIII": 28, "XXIX": 29, "XXX": 30, "XXXI": 31, "XXXII": 32, "XXXIII": 33,
	"XXXIV": 34,
}


CORPUS_CORPORUM_POS_URL = "https://mlat.uzh.ch/php_modules/download.php?type=file-pos-xml&idno=21750"


def ensure_sources() -> None:
	CACHE_DIR.mkdir(parents=True, exist_ok=True)
	pos_dest = CACHE_DIR / "Origenes_De-principiis.POS.xml"
	if not pos_dest.exists():
		zip_dest = CACHE_DIR / "Origenes_De-principiis.POS.xml.zip"
		download_file(CORPUS_CORPORUM_POS_URL, zip_dest)
		with zipfile.ZipFile(zip_dest, "r") as zf:
			xml_names = [n for n in zf.namelist() if n.endswith(".xml")]
			if not xml_names:
				raise FileNotFoundError(f"No .xml file found inside {zip_dest}")
			pos_dest.write_bytes(zf.read(xml_names[0]))

	for fname, url in SOURCES.items():
		dest = CACHE_DIR / fname
		if not dest.exists():
			download_file(url, dest)


def _strip_html(raw: str) -> str:
	txt = re.sub(r"<sup[^>]*>.*?</sup>", "", raw, flags=re.I | re.S)
	txt = re.sub(r"<[^>]+>", " ", txt)
	txt = html_lib.unescape(txt)
	return re.sub(r"\s+", " ", txt).strip()


def _parse_numbered_paragraphs(paras: List[str]) -> Dict[int, str]:
	"""Extracts {section_num: text} from paragraphs starting with '1. ...'."""
	out: Dict[int, str] = {}
	current_sec = 0
	for p in paras:
		m = re.match(r"^(\d+)\.\s+(.*)$", p)
		if m:
			current_sec = int(m.group(1))
			out[current_sec] = m.group(2).strip()
		elif current_sec > 0:
			out[current_sec] = f"{out[current_sec]}\n\n{p}"
	return out


def _parse_migne_pdf(pdf_path: Path) -> Dict[Tuple[int, int, int], str]:
	"""Extracts {(book, chapter, section): greek_text} from Migne PG 11 De Principiis PDF."""
	txt_path = pdf_path.with_suffix(".txt")
	if not txt_path.exists():
		subprocess.run(["pdftotext", str(pdf_path), str(txt_path)], check=True)
	raw = txt_path.read_text("utf-8", errors="replace")
	# Remove PDF page headers / sentence numbers [00001] / soft hyphenated line breaks
	raw = re.sub(r"\[\d{5}\]", " ", raw)
	raw = re.sub(r"-\s*\n\s*", "", raw)
	raw = re.sub(r"\s+", " ", raw)

	parts = re.split(r"\[(\d+\.\d+\.\d+)\]", raw)
	out: Dict[Tuple[int, int, int], str] = {}
	for i in range(1, len(parts), 2):
		b, c, s = (int(x) for x in parts[i].split("."))
		body = parts[i + 1].strip()
		if body:
			out[(b, c, s)] = body
	return out


def _parse_on_prayer_html(html_path: Path) -> Dict[int, List[str]]:
	"""Parses Tertullian.org On Prayer HTML into {chapter_num: [paragraphs]}."""
	raw = html_path.read_text("utf-8", errors="replace")
	chunks = re.split(r"<p[^>]*>", raw, flags=re.I)
	chapters: Dict[int, List[str]] = defaultdict(list)
	current_ch = 0
	for ch in chunks:
		txt = _strip_html(ch)
		if not txt or "Roger Pearse" in txt or "Origen, On Prayer" in txt:
			continue
		m = re.match(r"^([IVXLCDM]+)\.\s+", txt)
		if m and m.group(1) in ROMAN_MAP:
			current_ch = ROMAN_MAP[m.group(1)]
		if current_ch > 0:
			chapters[current_ch].append(txt)
	return chapters


def _parse_philocalia_html(html_path: Path) -> Dict[int, Dict[int, str]]:
	"""Parses Tertullian.org Philocalia HTML into {chapter_num: {section_num: text}}."""
	raw = html_path.read_text("utf-8", errors="replace")
	# Split on chapter anchors <A NAME="C1"></A>
	parts = re.split(r'<A\s+NAME="C(\d+)"[^>]*></A>', raw, flags=re.I)
	out: Dict[int, Dict[int, str]] = {}
	for i in range(1, len(parts), 2):
		ch_num = int(parts[i])
		block = parts[i + 1]
		# Stop at footer if present
		block = block.split("<HR>", 1)[0]
		paras = [_strip_html(p) for p in re.findall(r"<P[^>]*>(.*?)</P>", block, flags=re.I | re.S)]
		paras = [p for p in paras if p]
		secs = _parse_numbered_paragraphs(paras)
		if secs:
			out[ch_num] = secs
	return out


def _parse_anf_div4_work(root: ET.Element, div2_id: str) -> Dict[str, List[Dict[str, Any]]]:
	"""Returns {div3_id: [{'id': d4_id, 'title': d4_title, 'paras': [...]}]} plus direct_paras."""
	result: Dict[str, Any] = {}
	for d2 in root.iter("div2"):
		if d2.attrib.get("id") != div2_id:
			continue
		result["_direct"] = [
			p_txt for p_txt in (CCELThmlParser.clean_element(p) for p in d2.findall("p")) if p_txt
		]
		for d3 in d2.findall("div3"):
			d3_id = d3.attrib.get("id", "")
			d3_title = d3.attrib.get("title", "")
			direct = [
				p_txt for p_txt in (CCELThmlParser.clean_element(p) for p in d3.findall("p")) if p_txt
			]
			d4_list = []
			for d4 in d3.findall("div4"):
				d4_paras = [
					p_txt for p_txt in (CCELThmlParser.clean_element(p) for p in d4.findall("p")) if p_txt
				]
				d4_list.append({
					"id": d4.attrib.get("id", ""),
					"title": d4.attrib.get("title", ""),
					"paras": d4_paras,
				})
			result[d3_id] = {"title": d3_title, "direct": direct, "div4s": d4_list}
		break
	return result


def _parse_tei_books(xml_path: Path) -> Dict[int, Dict[int, Dict[int, str]]]:
	"""Parses First1KGreek TEI XML into {book: {chapter: {section: text}}}."""
	root = ET.parse(xml_path).getroot()
	out: Dict[int, Dict[int, Dict[int, str]]] = defaultdict(lambda: defaultdict(dict))

	def walk_divs(node: ET.Element, book: int = 1, ch: int = 0):
		for child in node:
			tag = TEIParser._strip_ns(child.tag)
			if tag != "div":
				walk_divs(child, book, ch)
				continue
			st = child.attrib.get("subtype", "")
			n = (child.attrib.get("n") or "").strip()
			if st == "book" and n.isdigit():
				walk_divs(child, int(n), ch)
			elif st == "chapter" and n.isdigit():
				ch_num = int(n)
				sec_divs = [
					c for c in child
					if TEIParser._strip_ns(c.tag) == "div"
					and c.attrib.get("subtype") == "section"
					and (c.attrib.get("n") or "").isdigit()
				]
				if sec_divs:
					for sd in sec_divs:
						txt = TEIParser._extract_text(sd)
						if txt:
							out[book][ch_num][int(sd.attrib["n"])] = txt
				else:
					txt = TEIParser._extract_text(child)
					if txt:
						out[book][ch_num][1] = txt
			else:
				walk_divs(child, book, ch)

	walk_divs(root)
	return out


def _book4_flat_to_modern(sec_num: int) -> Tuple[int, int]:
	"""Maps De Principiis Book 4 flat section (1..37) -> (modern_chapter, modern_section)."""
	if sec_num <= 7:
		return 1, sec_num
	if sec_num <= 16:
		return 2, sec_num - 7
	if sec_num <= 27:
		return 3, sec_num - 16
	return 4, sec_num - 27


def _ingest_de_principiis(writer: RawCorpusWriter, anf04_root: ET.Element) -> int:
	lat_pids = CorpusCorporumPosParser.parse_by_pid(CACHE_DIR / "Origenes_De-principiis.POS.xml")
	grc_map = _parse_migne_pdf(CACHE_DIR / "origen_de_principiis_mgr.pdf")
	anf_princ = _parse_anf_div4_work(anf04_root, "vi.v")
	anf_prol = _parse_anf_div4_work(anf04_root, "vi.iv")

	units = 0

	# 0. Rufinus Prologue (English)
	prol_txt = "\n\n".join(anf_prol.get("_direct", []))
	if prol_txt:
		writer.insert_text_unit("origen_anf_eng", "PRIN", 1, 0, 1, "Princ. Prol.", prol_txt, section_label="Prol.")
		units += 1

	# 1. Book 1 Preface (Latin 1.1.1..1.1.10 + ANF04 vi.v.i)
	pref_lat = "\n\n".join(lat_pids[f"1.1.{s}"] for s in range(1, 11) if f"1.1.{s}" in lat_pids)
	pref_eng = "\n\n".join(anf_princ.get("vi.v.i", {}).get("direct", []))
	if pref_lat:
		writer.insert_text_unit("origen_cc_lat", "PRIN", 1, 0, 2, "Princ. 1.Pref", pref_lat, section_label="Pref.")
		units += 1
	if pref_eng:
		writer.insert_text_unit("origen_anf_eng", "PRIN", 1, 0, 2, "Princ. 1.Pref", pref_eng, section_label="Pref.")
		units += 1

	# 2. Books 1–3
	anf_book_keys = {1: "vi.v.ii", 2: "vi.v.iii", 3: "vi.v.iv"}
	for book_num in (1, 2, 3):
		b_data = anf_princ.get(anf_book_keys[book_num], {})
		d4s = b_data.get("div4s", [])

		# Map chapters in ANF04
		anf_ch_secs: Dict[int, Dict[int, str]] = {}
		anf_grc_ch_secs: Dict[int, Dict[int, str]] = {}
		for d4 in d4s:
			d4_id = d4["id"]
			if book_num == 3 and d4_id == "vi.v.iv.i":
				# Book 3 Rufinus Preface
				txt = "\n\n".join(d4["paras"])
				if txt:
					writer.insert_text_unit("origen_anf_eng", "PRIN", 3, 0, 1, "Princ. 3.Pref", txt, section_label="Pref.")
					units += 1
				continue
			if book_num == 3 and d4_id == "vi.v.iv.iii":
				anf_grc_ch_secs[1] = _parse_numbered_paragraphs(d4["paras"])
				continue
			# Determine chapter number
			if book_num == 3:
				ch_map = {"vi.v.iv.ii": 1, "vi.v.iv.iv": 2, "vi.v.iv.v": 3, "vi.v.iv.vi": 4, "vi.v.iv.vii": 5, "vi.v.iv.viii": 6}
				ch_num = ch_map.get(d4_id)
			else:
				roman_idx = d4_id.rsplit(".", 1)[-1]
				ch_num = ROMAN_MAP.get(roman_idx.upper())
				if ch_num is None:
					# Fallback sequential index
					ch_num = d4s.index(d4) + 1
			if ch_num is not None:
				anf_ch_secs[ch_num] = _parse_numbered_paragraphs(d4["paras"])

		# Collect Latin sections for this book
		lat_ch_secs: Dict[int, Dict[int, str]] = defaultdict(dict)
		for pid, txt in lat_pids.items():
			parts = pid.split(".")
			if len(parts) == 3 and int(parts[0]) == book_num:
				raw_ch, sec = int(parts[1]), int(parts[2])
				if book_num == 1:
					if raw_ch == 1:
						continue
					ch_num = raw_ch - 1
				else:
					ch_num = raw_ch
				lat_ch_secs[ch_num][sec] = txt

		all_chs = sorted(set(lat_ch_secs.keys()) | set(anf_ch_secs.keys()))
		for ch_num in all_chs:
			grc_secs = {s: t for (b, c, s), t in grc_map.items() if b == book_num and c == ch_num}
			all_secs = sorted(
				set(lat_ch_secs.get(ch_num, {}).keys())
				| set(anf_ch_secs.get(ch_num, {}).keys())
				| set(grc_secs.keys())
				| set(anf_grc_ch_secs.get(ch_num, {}).keys())
			)
			for sec in all_secs:
				cit = f"Princ. {book_num}.{ch_num}.{sec}"
				if sec in grc_secs:
					writer.insert_text_unit("origen_mgr_grc", "PRIN", book_num, ch_num, sec, cit, grc_secs[sec])
					units += 1
				if sec in lat_ch_secs.get(ch_num, {}):
					writer.insert_text_unit("origen_cc_lat", "PRIN", book_num, ch_num, sec, cit, lat_ch_secs[ch_num][sec])
					units += 1
				if sec in anf_ch_secs.get(ch_num, {}):
					writer.insert_text_unit("origen_anf_eng", "PRIN", book_num, ch_num, sec, cit, anf_ch_secs[ch_num][sec])
					units += 1
				if sec in anf_grc_ch_secs.get(ch_num, {}):
					writer.insert_text_unit("origen_anf_grc_eng", "PRIN", book_num, ch_num, sec, cit, anf_grc_ch_secs[ch_num][sec])
					units += 1

	# 3. Book 4 (map flat 1..37 -> modern (4, ch 1..4, sec))
	b4_d4s = anf_princ.get("vi.v.v", {}).get("div4s", [])
	anf_b4_lat: Dict[int, str] = {}
	anf_b4_grc: Dict[int, str] = {}
	for d4 in b4_d4s:
		if d4["id"] == "vi.v.v.i":
			anf_b4_lat.update(_parse_numbered_paragraphs(d4["paras"]))
		elif d4["id"] == "vi.v.v.ii":
			anf_b4_grc.update(_parse_numbered_paragraphs(d4["paras"]))
		elif d4["id"] == "vi.v.v.iii":
			anf_b4_lat.update(_parse_numbered_paragraphs(d4["paras"]))

	for flat_sec in range(1, 38):
		ch_num, sec = _book4_flat_to_modern(flat_sec)
		cit = f"Princ. 4.{ch_num}.{sec}"
		if (4, ch_num, sec) in grc_map:
			writer.insert_text_unit("origen_mgr_grc", "PRIN", 4, ch_num, sec, cit, grc_map[(4, ch_num, sec)])
			units += 1
		if f"4.{flat_sec}" in lat_pids:
			writer.insert_text_unit("origen_cc_lat", "PRIN", 4, ch_num, sec, cit, lat_pids[f"4.{flat_sec}"])
			units += 1
		if flat_sec in anf_b4_lat:
			writer.insert_text_unit("origen_anf_eng", "PRIN", 4, ch_num, sec, cit, anf_b4_lat[flat_sec])
			units += 1
		if flat_sec in anf_b4_grc:
			writer.insert_text_unit("origen_anf_grc_eng", "PRIN", 4, ch_num, sec, cit, anf_b4_grc[flat_sec])
			units += 1

	return units


def build_origen_raw_db(lemmatizer_scheme: str = "celano") -> Path:
	ensure_sources()
	lemmatizer = get_lemmatizer(lemmatizer_scheme)

	anf04_root = ET.parse(CACHE_DIR / "anf04.xml").getroot()
	anf09_root = ET.parse(CACHE_DIR / "anf09.xml").getroot()

	writer = RawCorpusWriter("origen", lemmatizer_scheme=lemmatizer_scheme)
	writer.insert_versions(CORPUS_VERSIONS_CATALOG["origen"])
	for spec in WORKS_SPEC:
		writer.insert_work(spec)

	# 1. De Principiis
	princ_units = _ingest_de_principiis(writer, anf04_root)
	print(f"  ✓ Ingested PRIN ({princ_units} text units)")

	# 2. Contra Celsum (Books 1-8 + Preface)
	cels_grc = CelanoParser.parse(CACHE_DIR / "tlg2042.tlg001.perseus-grc1.xml", 8, include_preface=True)
	cels_anf = _parse_anf_div4_work(anf04_root, "vi.ix")
	cels_d3_ids = ["vi.ix.i", "vi.ix.ii", "vi.ix.iii", "vi.ix.iv", "vi.ix.v", "vi.ix.vi", "vi.ix.vii", "vi.ix.viii"]
	cels_units = 0
	for sec_num, raw_toks in sorted(cels_grc.get(0, {}).items()):
		canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
		writer.insert_text_unit("origen_celano_grc", "CELS", 0, 0, sec_num, f"Cels. Pref.{sec_num}", join_tokens(canon_toks), tokens=canon_toks, section_label=f"Pref.{sec_num}")
		cels_units += 1
	for book_num, d3_id in enumerate(cels_d3_ids, 1):
		d4s = cels_anf.get(d3_id, {}).get("div4s", [])
		eng_secs = {idx: "\n\n".join(d4["paras"]) for idx, d4 in enumerate(d4s, 1)}
		grc_secs = cels_grc.get(book_num, {})
		for sec in sorted(set(grc_secs.keys()) | set(eng_secs.keys())):
			cit = f"Cels. {book_num}.{sec}"
			if sec in grc_secs:
				canon_toks = lemmatizer.lemmatize_tokens(grc_secs[sec], lang="grc")
				writer.insert_text_unit("origen_celano_grc", "CELS", book_num, book_num, sec, cit, join_tokens(canon_toks), tokens=canon_toks)
				cels_units += 1
			if sec in eng_secs and eng_secs[sec]:
				writer.insert_text_unit("origen_anf_eng", "CELS", book_num, book_num, sec, cit, eng_secs[sec])
				cels_units += 1
	print(f"  ✓ Ingested CELS ({cels_units} text units)")

	# 3. Commentary on John (Celano Bks 1..32 + ANF09 Bks 1,2,4,5,6,10)
	jo_grc = CelanoParser.parse(CACHE_DIR / "tlg2042.tlg005.opp-grc1.xml", 32)
	jo_anf = _parse_anf_div4_work(anf09_root, "xv.iii")
	jo_eng_map = {1: "xv.iii.i", 2: "xv.iii.ii", 5: "xv.iii.iv", 6: "xv.iii.v", 10: "xv.iii.vi"}
	jo_units = 0
	for book_num in sorted(jo_grc.keys()):
		eng_list: List[str] = []
		if book_num in jo_eng_map:
			eng_list = ["\n\n".join(d4["paras"]) for d4 in jo_anf.get(jo_eng_map[book_num], {}).get("div4s", [])]
		elif book_num == 4:
			eng_list = jo_anf.get("xv.iii.iii", {}).get("direct", [])

		if eng_list:
			exact, pairs = ExactMatchHybridAligner.align_chapter(jo_grc[book_num], eng_list)
			if not exact and len(eng_list) > 1 and len(jo_grc[book_num]) > len(eng_list):
				# Proportional bucket alignment so Books 1, 2, 5, 6, 10 stay split into ANF chapters
				grc_keys = sorted(jo_grc[book_num].keys())
				n_g = len(grc_keys)
				n_e = len(eng_list)
				pairs = []
				for idx, eng_text in enumerate(eng_list):
					start = (idx * n_g) // n_e
					end = ((idx + 1) * n_g) // n_e
					bucket_toks: List[Dict[str, Any]] = []
					for k in grc_keys[start:end]:
						bucket_toks.extend(jo_grc[book_num][k])
					pairs.append((idx + 1, bucket_toks, eng_text))
			for sec_num, raw_toks, eng_text in pairs:
				cit = f"Comm. Jo. {book_num}.{sec_num}"
				canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
				writer.insert_text_unit("origen_celano_grc", "COMM_JO", book_num, book_num, sec_num, cit, join_tokens(canon_toks), tokens=canon_toks)
				writer.insert_text_unit("origen_anf_eng", "COMM_JO", book_num, book_num, sec_num, cit, eng_text)
				jo_units += 2
		else:
			for sec_num, raw_toks in sorted(jo_grc[book_num].items()):
				cit = f"Comm. Jo. {book_num}.{sec_num}"
				canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
				writer.insert_text_unit("origen_celano_grc", "COMM_JO", book_num, book_num, sec_num, cit, join_tokens(canon_toks), tokens=canon_toks)
				jo_units += 1
	print(f"  ✓ Ingested COMM_JO ({jo_units} text units)")

	# 4. Commentary on Matthew (Celano 10-17 + First1KGreek Latin 12-17 + ANF09 10-14)
	mt_grc = {}
	mt_grc.update(CelanoParser.parse(CACHE_DIR / "tlg2042.tlg029.opp-grc1.xml", 11))
	mt_grc.update(CelanoParser.parse(CACHE_DIR / "tlg2042.tlg030.opp-grc1.xml", 17))
	mt_lat = _parse_tei_books(CACHE_DIR / "tlg2042.tlg030.opp-lat1.xml")
	mt_anf = _parse_anf_div4_work(anf09_root, "xvi.ii")
	mt_eng_map = {10: "xvi.ii.iii", 11: "xvi.ii.iv", 12: "xvi.ii.v", 13: "xvi.ii.vi", 14: "xvi.ii.vii"}
	mt_units = 0
	for book_num in sorted(set(mt_grc.keys()) | set(mt_lat.keys())):
		grc_secs = mt_grc.get(book_num, {})
		lat_chs = mt_lat.get(book_num, {})
		eng_d4s = mt_anf.get(mt_eng_map.get(book_num, ""), {}).get("div4s", [])
		eng_secs = {idx: "\n\n".join(d4["paras"]) for idx, d4 in enumerate(eng_d4s, 1)}
		all_secs = sorted(set(grc_secs.keys()) | set(lat_chs.keys()) | set(eng_secs.keys()))
		for sec in all_secs:
			cit = f"Comm. Matt. {book_num}.{sec}"
			if sec in grc_secs:
				canon_toks = lemmatizer.lemmatize_tokens(grc_secs[sec], lang="grc")
				writer.insert_text_unit("origen_celano_grc", "COMM_MT", book_num, book_num, sec, cit, join_tokens(canon_toks), tokens=canon_toks)
				mt_units += 1
			if sec in lat_chs:
				lat_txt = "\n\n".join(lat_chs[sec][s] for s in sorted(lat_chs[sec].keys()))
				writer.insert_text_unit("origen_f1k_lat", "COMM_MT", book_num, book_num, sec, cit, lat_txt)
				mt_units += 1
			if sec in eng_secs and eng_secs[sec]:
				writer.insert_text_unit("origen_anf_eng", "COMM_MT", book_num, book_num, sec, cit, eng_secs[sec])
				mt_units += 1
	print(f"  ✓ Ingested COMM_MT ({mt_units} text units)")

	# 5. On Prayer (Celano Bks 1-34 + Tertullian.org HTML)
	orat_grc = CelanoParser.parse(CACHE_DIR / "tlg2042.tlg008.perseus-grc1.xml", 34)
	orat_eng = _parse_on_prayer_html(CACHE_DIR / "origen_on_prayer_02_text.htm")
	orat_units = 0
	for ch in range(1, 35):
		_, pairs = ExactMatchHybridAligner.align_chapter(orat_grc.get(ch, {}), orat_eng.get(ch, []))
		for sec_num, raw_toks, eng_text in pairs:
			cit = f"Or. {ch}.{sec_num}"
			canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
			writer.insert_text_unit("origen_celano_grc", "ORAT", ch, ch, sec_num, cit, join_tokens(canon_toks), tokens=canon_toks)
			writer.insert_text_unit("origen_tert_eng", "ORAT", ch, ch, sec_num, cit, eng_text)
			orat_units += 2
	print(f"  ✓ Ingested ORAT ({orat_units} text units)")

	# 6. Philocalia (First1KGreek TEI + Tertullian.org Lewis 1911 HTML)
	phil_grc = _parse_tei_books(CACHE_DIR / "tlg2042.tlg019.1st1K-grc1.xml").get(1, {})
	# tlg2042.tlg019 also wraps chapters directly or under book=2; merge any books
	phil_all = _parse_tei_books(CACHE_DIR / "tlg2042.tlg019.1st1K-grc1.xml")
	phil_grc_merged: Dict[int, Dict[int, str]] = {}
	for b_map in phil_all.values():
		phil_grc_merged.update(b_map)
	phil_eng = _parse_philocalia_html(CACHE_DIR / "origen_philocalia_02_text.htm")
	phil_units = 0
	for ch in range(1, 28):
		g_secs = phil_grc_merged.get(ch, {})
		e_secs = phil_eng.get(ch, {})
		for sec in sorted(set(g_secs.keys()) | set(e_secs.keys())):
			cit = f"Philoc. {ch}.{sec}"
			if sec in g_secs:
				writer.insert_text_unit("origen_f1k_grc", "PHIL", ch, ch, sec, cit, g_secs[sec])
				phil_units += 1
			if sec in e_secs:
				writer.insert_text_unit("origen_tert_eng", "PHIL", ch, ch, sec, cit, e_secs[sec])
				phil_units += 1
	print(f"  ✓ Ingested PHIL ({phil_units} text units)")

	# 7. Letter to Africanus (Celano 1.1..1.18 + ANF04 vi.vii)
	afr_grc = CelanoParser.parse(CACHE_DIR / "tlg2042.tlg045.1st1K-grc1.xml", 1).get(1, {})
	afr_eng = CCELThmlParser.parse_div2_map(CACHE_DIR / "anf04.xml", {"vi.vii": 1})
	# Note: vi.vii has direct <p>s without div3
	afr_d2 = next(d for d in anf04_root.iter("div2") if d.attrib.get("id") == "vi.vii")
	afr_paras = [CCELThmlParser.clean_element(p) for p in afr_d2.findall("p")]
	afr_paras = [p for p in afr_paras if p]
	_, pairs = ExactMatchHybridAligner.align_chapter(afr_grc, afr_paras)
	afr_units = 0
	for sec_num, raw_toks, eng_text in pairs:
		cit = f"Ep. Afr. {sec_num}"
		canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
		writer.insert_text_unit("origen_celano_grc", "EP_AFR", 1, 1, sec_num, cit, join_tokens(canon_toks), tokens=canon_toks)
		writer.insert_text_unit("origen_anf_eng", "EP_AFR", 1, 1, sec_num, cit, eng_text)
		afr_units += 2
	print(f"  ✓ Ingested EP_AFR ({afr_units} text units)")

	return writer.finalize(stats_corpus_id="origen_celano_grc")


if __name__ == "__main__":
	build_origen_raw_db()
