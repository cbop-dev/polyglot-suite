"""Clement of Alexandria Ingestor for Ancient Corpora Reader (ACR).

Ingests 7 works of Clement of Alexandria (c. 150–215 CE, TLG tlg0555):
  - PROT:   Protrepticus / Exhortation to the Greeks (Celano Greek + ANF02 English + Butterworth 1919 English)
  - PAED:   Paedagogus / The Instructor, Books 1–3 (Celano Greek + ANF02 English)
  - STROM:  Stromata / Miscellanies, Books 1–8 (Perseus TEI + Stanza Greek Bks 1–6; Celano Greek Bks 7–8; ANF02 English Bks 1–2, 4–8; ANF02 Latin Bk 3)
  - QUIS:   Quis Dives Salvetur? (Celano Greek + ANF02 English + Butterworth 1919 English)
  - BAPT:   To the Newly Baptized (Perseus TEI + Stanza Greek + Butterworth 1919 English via ECW)
  - EXC_TH: Excerpta ex Theodoto (Celano Greek)
  - ECL_PR: Eclogae Propheticae (Celano Greek + ANF08 English)
"""

from __future__ import annotations
import html as html_lib
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
CACHE_DIR = PIPELINE_DIR / "cache" / "clement"

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
	join_tokens,
)
from ingestors.aligner import ExactMatchHybridAligner  # noqa: E402

SOURCES = {
	"tlg0555.tlg001.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg001.opp-grc1.xml",
	"tlg0555.tlg002.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg002.opp-grc1.xml",
	"tlg0555.tlg004b.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg004b.opp-grc1.xml",
	"tlg0555.tlg005.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg005.opp-grc1.xml",
	"tlg0555.tlg006.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg006.opp-grc1.xml",
	"tlg0555.tlg007.opp-grc1.xml": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0555.tlg007.opp-grc1.xml",
	"tlg0555.tlg004.perseus-grc2.xml": "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0555/tlg004/tlg0555.tlg004.perseus-grc2.xml",
	"tlg0555.tlg008.perseus-grc2.xml": "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0555/tlg008/tlg0555.tlg008.perseus-grc2.xml",
	"anf02.xml": "https://www.ccel.org/ccel/schaff/anf02/anf02.xml",
	"anf08.xml": "https://www.ccel.org/ccel/schaff/anf08/anf08.xml",
	"ecw_baptized.html": "https://www.earlychristianwritings.com/text/clement-baptized-uni.html",
	"butterworth_lcl92.txt": "https://archive.org/download/L092ClementOfAlexandriaTheExhortationToTheGreeks/L092-Clement%20of%20Alexandria%20The%20Exhortation%20to%20the%20Greeks_djvu.txt",
}

WORKS_SPEC = [
	{
		"code": "PROT",
		"slug": "protrepticus",
		"order_index": 1,
		"category": "apology",
		"abbrev": "Protr.",
		"tlg_id": "tlg0555.tlg001",
		"title_english": "Exhortation to the Greeks (Protrepticus)",
		"title_primary": "Προτρεπτικὸς πρὸς Ἕλληνας",
		"title_secondary": "Protrepticus",
		"total_divisions": 12,
		"min_division": 1,
		"division_label": "Chapter",
	},
	{
		"code": "PAED",
		"slug": "paedagogus",
		"order_index": 2,
		"category": "treatise",
		"abbrev": "Paed.",
		"tlg_id": "tlg0555.tlg002",
		"title_english": "The Instructor (Paedagogus)",
		"title_primary": "Παιδαγωγός",
		"title_secondary": "Paedagogus",
		"total_divisions": 3,
		"min_division": 1,
		"division_label": "Book",
	},
	{
		"code": "STROM",
		"slug": "stromata",
		"order_index": 3,
		"category": "treatise",
		"abbrev": "Strom.",
		"tlg_id": "tlg0555.tlg004",
		"title_english": "Miscellanies (Stromata)",
		"title_primary": "Στρωματεῖς",
		"title_secondary": "Stromata",
		"total_divisions": 8,
		"min_division": 1,
		"division_label": "Book",
	},
	{
		"code": "QUIS",
		"slug": "quis-dives-salvetur",
		"order_index": 4,
		"category": "homily",
		"abbrev": "Quis div.",
		"tlg_id": "tlg0555.tlg006",
		"title_english": "Who Is the Rich Man That Shall Be Saved?",
		"title_primary": "Τίς ὁ σῳζόμενος πλούσιος",
		"title_secondary": "Quis dives salvetur",
		"total_divisions": 42,
		"min_division": 1,
		"division_label": "Chapter",
	},
	{
		"code": "BAPT",
		"slug": "to-the-newly-baptized",
		"order_index": 5,
		"category": "fragment",
		"abbrev": "Bapt.",
		"tlg_id": "tlg0555.tlg008",
		"title_english": "To the Newly Baptized",
		"title_primary": "Ὁ προτρεπτικὸς εἰς ὑπομονὴν ἢ πρὸς τοὺς νεωστὶ βεβαπτισμένους",
		"title_secondary": "Ad neophytos",
		"total_divisions": 6,
		"min_division": 1,
		"division_label": "Section",
	},
	{
		"code": "EXC_TH",
		"slug": "excerpta-ex-theodoto",
		"order_index": 6,
		"category": "excerpts",
		"abbrev": "Exc.",
		"tlg_id": "tlg0555.tlg007",
		"title_english": "Excerpts from Theodotus (Excerpta ex Theodoto)",
		"title_primary": "Ἐκ τῶν Θεοδότου καὶ τῆς ἀνατολικῆς καλουμένης διδασκαλίας",
		"title_secondary": "Excerpta ex Theodoto",
		"total_divisions": 86,
		"min_division": 1,
		"division_label": "Section",
	},
	{
		"code": "ECL_PR",
		"slug": "eclogae-propheticae",
		"order_index": 7,
		"category": "excerpts",
		"abbrev": "Ecl.",
		"tlg_id": "tlg0555.tlg005",
		"title_english": "Prophetic Eclogues (Eclogae Propheticae)",
		"title_primary": "Ἐκ τῶν προφητικῶν ἐκλογαί",
		"title_secondary": "Eclogae propheticae",
		"total_divisions": 65,
		"min_division": 1,
		"division_label": "Section",
	},
]

TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}
GREEK_WORD_RE = re.compile(r"[\w\u0300-\u036f\u1f00-\u1fff]+|[.,;·:!?()\[\]«»\"'—–-]")

ROMAN_VALS = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}


def _roman_to_int(s: str) -> Optional[int]:
	s = s.strip().upper()
	if not s or not all(c in ROMAN_VALS for c in s):
		return None
	total = 0
	prev = 0
	for c in reversed(s):
		val = ROMAN_VALS[c]
		if val < prev:
			total -= val
		else:
			total += val
			prev = val
	return total


def ensure_sources() -> None:
	CACHE_DIR.mkdir(parents=True, exist_ok=True)
	for fname, url in SOURCES.items():
		dest = CACHE_DIR / fname
		if not dest.exists():
			download_file(url, dest, timeout=90)


def _strip_tei_text(el: ET.Element, skip_tags: Tuple[str, ...] = ("note", "bibl", "head")) -> str:
	parts: List[str] = []

	def _walk(node: ET.Element) -> None:
		tag = node.tag.split("}")[-1]
		if tag in skip_tags:
			if node.tail:
				parts.append(node.tail)
			return
		if node.text:
			parts.append(node.text)
		for child in node:
			_walk(child)
		if node.tail:
			parts.append(node.tail)

	_walk(el)
	return re.sub(r"\s+", " ", "".join(parts)).strip()


def _tokenize_greek(text: str) -> List[Dict[str, str]]:
	return [{"w": m.group(0)} for m in GREEK_WORD_RE.finditer(text) if m.group(0).strip()]


def _parse_tei_stromata_books(xml_path: Path, max_book: int = 6) -> Dict[int, Dict[int, str]]:
	"""Parses Perseus TEI Stromata Books 1..max_book into {book_num: {chap_num: greek_text}}."""
	root = ET.parse(xml_path).getroot()
	out: Dict[int, Dict[int, str]] = defaultdict(dict)
	for book_div in root.findall(".//tei:div[@subtype='book']", TEI_NS):
		bn_str = (book_div.attrib.get("n") or "").strip()
		if not bn_str.isdigit():
			continue
		bn = int(bn_str)
		if bn < 1 or bn > max_book:
			continue
		for chap_div in book_div.findall("./tei:div[@subtype='chapter']", TEI_NS):
			cn_str = (chap_div.attrib.get("n") or "").strip()
			if not cn_str.isdigit():
				continue
			cn = int(cn_str)
			txt = _strip_tei_text(chap_div, skip_tags=("note", "head"))
			if txt:
				out[bn][cn] = txt
	return out


def _parse_tei_baptized(xml_path: Path) -> Dict[int, str]:
	"""Parses Perseus TEI tlg0555.tlg008 into {sec_num: greek_text}."""
	root = ET.parse(xml_path).getroot()
	out: Dict[int, str] = {}
	for p_div in root.findall(".//tei:div[@subtype='paragraph']", TEI_NS):
		n_str = (p_div.attrib.get("n") or "").strip()
		if n_str.isdigit():
			txt = _strip_tei_text(p_div, skip_tags=("note", "head"))
			if txt:
				out[int(n_str)] = txt
	return out


def _extract_div_paragraphs(elem: ET.Element) -> List[str]:
	paras = [CCELThmlParser.clean_element(p) for p in elem.findall("p")]
	paras = [p for p in paras if p]
	if not paras:
		paras = [CCELThmlParser.clean_element(p) for p in elem.iter("p")]
		paras = [p for p in paras if p]
	return paras


def _parse_anf_div3_chapters(anf_root: ET.Element, div2_id: str) -> Dict[int, str]:
	"""Parses ANF div2 -> div3 chapters (e.g., Protrepticus vi.ii.i..vi.ii.xii)."""
	div2 = anf_root.find(f".//div2[@id='{div2_id}']")
	if div2 is None:
		return {}
	out: Dict[int, str] = {}
	for idx, d3 in enumerate(div2.findall("./div3"), 1):
		title = (d3.attrib.get("title") or "").strip()
		if "Elucidation" in title or "Introductory" in title:
			continue
		m = re.search(r"Chap(?:ter)?\.?\s+([IVXL]+)\b", title, re.I)
		chap_num = _roman_to_int(m.group(1)) if m else idx
		if chap_num is None:
			chap_num = idx
		paras = _extract_div_paragraphs(d3)
		if paras:
			out[chap_num] = "\n\n".join(paras)
	return out


def _parse_anf_div4_books(anf_root: ET.Element, div2_id: str, skip_books: set[int] | None = None) -> Dict[int, Dict[int, str]]:
	"""Parses ANF div2 -> div3 (books) -> div4 (chapters) into {book_num: {chap_num: text}}."""
	div2 = anf_root.find(f".//div2[@id='{div2_id}']")
	if div2 is None:
		return {}
	out: Dict[int, Dict[int, str]] = defaultdict(dict)
	for d3 in div2.findall("./div3"):
		d3_title = (d3.attrib.get("title") or "").strip()
		bm = re.search(r"Book\s+([IVXL]+)", d3_title, re.I)
		if not bm:
			continue
		book_num = _roman_to_int(bm.group(1))
		if book_num is None or (skip_books and book_num in skip_books):
			continue
		for idx, d4 in enumerate(d3.findall("./div4"), 1):
			title = (d4.attrib.get("title") or "").strip()
			if "Elucidation" in title or "Fragments" in title:
				continue
			cm = re.search(r"Chap(?:ter)?\.?\s+([IVXL]+)\b", title, re.I)
			chap_num = _roman_to_int(cm.group(1)) if cm else idx
			if chap_num is None:
				chap_num = idx
			paras = _extract_div_paragraphs(d4)
			if paras:
				out[book_num][chap_num] = "\n\n".join(paras)
	return out


def _parse_anf_stromata_book3_latin(anf_root: ET.Element) -> Dict[int, str]:
	"""Parses Stromata Book 3 Latin from anf02.xml div3[@id='vi.iv.iii']."""
	b3 = anf_root.find(".//div3[@id='vi.iv.iii']")
	if b3 is None:
		return {}
	out: Dict[int, List[str]] = defaultdict(list)
	curr_chap: Optional[int] = None
	for el in b3:
		tag = el.tag.lower()
		txt = CCELThmlParser.clean_element(el)
		if not txt:
			continue
		if tag == "h5":
			m = re.search(r"Caput\s+([IVXL]+)\b", txt, re.I)
			if m:
				curr_chap = _roman_to_int(m.group(1))
			continue
		if tag in ("h2", "h3", "h4", "pb", "hr"):
			continue
		if curr_chap is not None:
			out[curr_chap].append(txt)
	return {ch: "\n\n".join(paras) for ch, paras in out.items() if paras}


def _parse_anf_roman_sections(el: ET.Element, max_sec: int = 100) -> Dict[int, str]:
	"""Parses Roman-numeral-prefixed paragraphs (I., II., ...) inside an ANF element."""
	out: Dict[int, List[str]] = defaultdict(list)
	curr_sec: Optional[int] = None
	for child in el:
		tag = child.tag.lower()
		if tag in ("h2", "h3", "h4", "h5", "pb", "hr", "scripcom", "div3", "div4"):
			continue
		txt = CCELThmlParser.clean_element(child)
		if not txt or txt.startswith("——"):
			continue
		m = re.match(r"^([IVXL]+)\.\s+(.*)$", txt, re.S)
		if m:
			sec = _roman_to_int(m.group(1))
			if sec is not None and 1 <= sec <= max_sec:
				curr_sec = sec
				body = m.group(2).strip()
				if body:
					out[curr_sec].append(body)
				continue
		if curr_sec is not None:
			out[curr_sec].append(txt)
	return {sec: "\n\n".join(paras) for sec, paras in out.items() if paras}


def _parse_ecw_baptized(html_path: Path) -> Dict[int, str]:
	"""Parses Butterworth 1919 To the Newly Baptized from ecw_baptized.html (table cells)."""
	raw = html_path.read_text("utf-8", "ignore")
	tds = re.findall(r"<td[^>]*>(.*?)</td>", raw, re.S | re.I)
	eng_paras: List[str] = []
	for td in tds:
		clean = html_lib.unescape(re.sub(r"<[^>]+>", " ", td))
		clean = re.sub(r"\s+", " ", clean).strip()
		if not clean or len(clean) < 40:
			continue
		# Skip Greek cells (contain Greek characters or HTML entities decoded to Greek)
		greek_chars = sum(1 for ch in clean if "\u0370" <= ch <= "\u03ff" or "\u1f00" <= ch <= "\u1fff")
		if greek_chars > 5:
			continue
		if any(skip in clean for skip in ("Butterworth", "Early Christian Writings", "Greek text", "Beta Code")):
			continue
		eng_paras.append(clean)
	return {i + 1: p for i, p in enumerate(eng_paras[:6])}


def _parse_butterworth_lcl92(txt_path: Path) -> Tuple[Dict[int, str], Dict[int, str]]:
	"""Extracts English text for Protrepticus (1..12) and Quis Dives (1..42) from Loeb 92 OCR."""
	raw = txt_path.read_text("utf-8", "ignore")
	idx_ex = raw.find("THE EXHORTATION TO THE GREEKS", 6000)
	idx_rm = raw.find("THE RICH MAN", idx_ex if idx_ex > 0 else 6000)
	idx_bap = raw.find("TO THE NEWLY BAPTIZED", idx_rm if idx_rm > 0 else 460000)

	def _clean_loeb_pages(slice_txt: str) -> str:
		lines = slice_txt.splitlines()
		kept: List[str] = []
		skip_greek_page = False
		for line in lines:
			s = line.strip()
			if not s:
				kept.append("")
				continue
			if re.match(r"^(CLEMENT OF ALEXANDRIA|EXHORTATION TO THE GREEKS|THE RICH MAN.?S SALVATION)$", s):
				if s == "CLEMENT OF ALEXANDRIA":
					skip_greek_page = True
				else:
					skip_greek_page = False
				continue
			if re.match(r"^\d{1,3}$", s):
				continue
			if skip_greek_page:
				continue
			# Skip lines that are predominantly Greek or garbled Greek OCR
			ascii_letters = sum(1 for c in s if "a" <= c.lower() <= "z")
			if len(s) > 10 and ascii_letters < len(s) * 0.45:
				continue
			kept.append(s)
		return "\n".join(kept)

	# Protrepticus: split by sequential CHAP. I .. CHAP. XII (or start at Amphion)
	ex_clean = _clean_loeb_pages(raw[idx_ex:idx_rm]) if idx_ex > 0 and idx_rm > idx_ex else ""
	prot_eng: Dict[int, str] = {}
	if ex_clean:
		romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
		positions: List[Tuple[int, int]] = [(1, 0)]
		search_from = 0
		for ch_num in range(2, 13):
			rom = romans[ch_num - 1]
			m = re.search(rf"\bCHAP\.?\s+{rom}\b", ex_clean[search_from:])
			if m:
				pos = search_from + m.start()
				positions.append((ch_num, pos))
				search_from = pos + len(m.group(0))
		for i, (ch_num, start) in enumerate(positions):
			end = positions[i + 1][1] if i + 1 < len(positions) else len(ex_clean)
			body = re.sub(r"\n{3,}", "\n\n", ex_clean[start:end]).strip()
			if body:
				prot_eng[ch_num] = body

	# Quis Dives: split by numbered sections 1. .. 42.
	rm_clean = _clean_loeb_pages(raw[idx_rm:idx_bap]) if idx_rm > 0 and idx_bap > idx_rm else ""
	quis_eng: Dict[int, str] = {}
	if rm_clean:
		sec_matches = list(re.finditer(r"(?m)^(\d{1,2})\.\s+([A-Z\"].*)$", rm_clean))
		for i, m in enumerate(sec_matches):
			sec = int(m.group(1))
			if 1 <= sec <= 42 and sec not in quis_eng:
				end = sec_matches[i + 1].start() if i + 1 < len(sec_matches) else len(rm_clean)
				body = re.sub(r"\n{3,}", "\n\n", rm_clean[m.start():end]).strip()
				if body:
					quis_eng[sec] = body

	return prot_eng, quis_eng


def build_clement_raw_db(lemmatizer_scheme: str = "celano") -> Path:
	ensure_sources()
	celano_lem = get_lemmatizer("celano")
	stanza_lem = get_lemmatizer("stanza")

	anf02_root = ET.parse(CACHE_DIR / "anf02.xml").getroot()
	anf08_root = ET.parse(CACHE_DIR / "anf08.xml").getroot()

	writer = RawCorpusWriter("clement", lemmatizer_scheme=lemmatizer_scheme)
	writer.insert_versions(CORPUS_VERSIONS_CATALOG["clement"])
	for spec in WORKS_SPEC:
		writer.insert_work(spec)

	butter_prot, butter_quis = _parse_butterworth_lcl92(CACHE_DIR / "butterworth_lcl92.txt")

	# 1. PROT: Protrepticus (12 chapters)
	prot_grc = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg001.opp-grc1.xml", 12)
	prot_anf = _parse_anf_div3_chapters(anf02_root, "vi.ii")
	prot_units = 0
	for ch in sorted(set(prot_grc.keys()) | set(prot_anf.keys())):
		if ch == 0:
			continue
		grc_toks = [tok for sec in sorted(prot_grc.get(ch, {}).keys()) for tok in prot_grc[ch][sec]]
		if grc_toks:
			canon = celano_lem.lemmatize_tokens(grc_toks, lang="grc")
			writer.insert_text_unit("clement_celano_grc", "PROT", ch, 0, 1, f"Protr. {ch}", join_tokens(canon), tokens=canon, section_label=str(ch))
			prot_units += 1
		if ch in prot_anf:
			writer.insert_text_unit("clement_anf_eng", "PROT", ch, 0, 1, f"Protr. {ch}", prot_anf[ch], section_label=str(ch))
			prot_units += 1
		if ch in butter_prot:
			writer.insert_text_unit("clement_butterworth_eng", "PROT", ch, 0, 1, f"Protr. {ch}", butter_prot[ch], section_label=str(ch))
			prot_units += 1
	print(f"  ✓ Ingested PROT ({prot_units} text units)")

	# 2. PAED: Paedagogus (Books 1-3)
	paed_grc = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg002.opp-grc1.xml", 3)
	paed_anf = _parse_anf_div4_books(anf02_root, "vi.iii")
	paed_units = 0
	for b in (1, 2, 3):
		grc_b = paed_grc.get(b, {})
		eng_b = paed_anf.get(b, {})
		for ch in sorted(set(grc_b.keys()) | set(eng_b.keys())):
			if ch in grc_b:
				canon = celano_lem.lemmatize_tokens(grc_b[ch], lang="grc")
				writer.insert_text_unit("clement_celano_grc", "PAED", b, ch, 1, f"Paed. {b}.{ch}", join_tokens(canon), tokens=canon, section_label=f"{b}.{ch}")
				paed_units += 1
			if ch in eng_b:
				writer.insert_text_unit("clement_anf_eng", "PAED", b, ch, 1, f"Paed. {b}.{ch}", eng_b[ch], section_label=f"{b}.{ch}")
				paed_units += 1
	print(f"  ✓ Ingested PAED ({paed_units} text units)")

	# 3. STROM: Stromata (Books 1-6 Perseus + Stanza; Books 7-8 Celano; ANF02 Eng Bks 1-2,4-8; ANF02 Lat Bk 3)
	strom_grc_1_6 = _parse_tei_stromata_books(CACHE_DIR / "tlg0555.tlg004.perseus-grc2.xml", max_book=6)
	strom_grc_7_8 = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg004b.opp-grc1.xml", 8)
	strom_anf_eng = _parse_anf_div4_books(anf02_root, "vi.iv", skip_books={3})
	strom_anf_lat_b3 = _parse_anf_stromata_book3_latin(anf02_root)
	strom_units = 0
	for b in range(1, 9):
		if b <= 6:
			for ch, raw_txt in sorted(strom_grc_1_6.get(b, {}).items()):
				canon = stanza_lem.lemmatize_tokens(_tokenize_greek(raw_txt), lang="grc")
				writer.insert_text_unit("clement_perseus_grc", "STROM", b, ch, 1, f"Strom. {b}.{ch}", join_tokens(canon), tokens=canon, section_label=f"{b}.{ch}")
				strom_units += 1
		else:
			for ch, raw_toks in sorted(strom_grc_7_8.get(b, {}).items()):
				canon = celano_lem.lemmatize_tokens(raw_toks, lang="grc")
				writer.insert_text_unit("clement_celano_grc", "STROM", b, ch, 1, f"Strom. {b}.{ch}", join_tokens(canon), tokens=canon, section_label=f"{b}.{ch}")
				strom_units += 1

		if b == 3:
			for ch, lat_txt in sorted(strom_anf_lat_b3.items()):
				writer.insert_text_unit("clement_anf_lat", "STROM", 3, ch, 1, f"Strom. 3.{ch}", lat_txt, section_label=f"3.{ch}")
				strom_units += 1
		else:
			for ch, eng_txt in sorted(strom_anf_eng.get(b, {}).items()):
				writer.insert_text_unit("clement_anf_eng", "STROM", b, ch, 1, f"Strom. {b}.{ch}", eng_txt, section_label=f"{b}.{ch}")
				strom_units += 1
	print(f"  ✓ Ingested STROM ({strom_units} text units)")

	# 4. QUIS: Quis Dives Salvetur? (42 chapters)
	quis_grc = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg006.opp-grc1.xml", 42)
	quis_v = anf02_root.find(".//div2[@id='vi.v']")
	quis_anf = _parse_anf_roman_sections(quis_v, max_sec=42) if quis_v is not None else {}
	quis_units = 0
	for ch in sorted(set(quis_grc.keys()) | set(quis_anf.keys())):
		if ch == 0:
			continue
		grc_toks = [tok for sec in sorted(quis_grc.get(ch, {}).keys()) for tok in quis_grc[ch][sec]]
		if grc_toks:
			canon = celano_lem.lemmatize_tokens(grc_toks, lang="grc")
			writer.insert_text_unit("clement_celano_grc", "QUIS", ch, 0, 1, f"Quis div. {ch}", join_tokens(canon), tokens=canon, section_label=str(ch))
			quis_units += 1
		if ch in quis_anf:
			writer.insert_text_unit("clement_anf_eng", "QUIS", ch, 0, 1, f"Quis div. {ch}", quis_anf[ch], section_label=str(ch))
			quis_units += 1
		if ch in butter_quis:
			writer.insert_text_unit("clement_butterworth_eng", "QUIS", ch, 0, 1, f"Quis div. {ch}", butter_quis[ch], section_label=str(ch))
			quis_units += 1
	print(f"  ✓ Ingested QUIS ({quis_units} text units)")

	# 5. BAPT: To the Newly Baptized (6 sections, Perseus + Stanza + ECW Butterworth)
	bapt_grc = _parse_tei_baptized(CACHE_DIR / "tlg0555.tlg008.perseus-grc2.xml")
	bapt_eng = _parse_ecw_baptized(CACHE_DIR / "ecw_baptized.html")
	bapt_units = 0
	for sec in sorted(set(bapt_grc.keys()) | set(bapt_eng.keys())):
		if sec in bapt_grc:
			canon = stanza_lem.lemmatize_tokens(_tokenize_greek(bapt_grc[sec]), lang="grc")
			writer.insert_text_unit("clement_perseus_grc", "BAPT", sec, 0, 1, f"Bapt. {sec}", join_tokens(canon), tokens=canon, section_label=str(sec))
			bapt_units += 1
		if sec in bapt_eng:
			writer.insert_text_unit("clement_butterworth_eng", "BAPT", sec, 0, 1, f"Bapt. {sec}", bapt_eng[sec], section_label=str(sec))
			bapt_units += 1
	print(f"  ✓ Ingested BAPT ({bapt_units} text units)")

	# 6. EXC_TH: Excerpta ex Theodoto (86 sections, Celano Greek)
	exc_grc = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg007.opp-grc1.xml", 86)
	exc_units = 0
	for sec in sorted(exc_grc.keys()):
		if sec == 0:
			continue
		grc_toks = [tok for sub in sorted(exc_grc[sec].keys()) for tok in exc_grc[sec][sub]]
		if grc_toks:
			canon = celano_lem.lemmatize_tokens(grc_toks, lang="grc")
			writer.insert_text_unit("clement_celano_grc", "EXC_TH", sec, 0, 1, f"Exc. {sec}", join_tokens(canon), tokens=canon, section_label=str(sec))
			exc_units += 1
	print(f"  ✓ Ingested EXC_TH ({exc_units} text units)")

	# 7. ECL_PR: Eclogae Propheticae (65 sections, Celano Greek + ANF08 English)
	ecl_grc = CelanoParser.parse(CACHE_DIR / "tlg0555.tlg005.opp-grc1.xml", 65)
	ecl_div = anf08_root.find(".//div2[@id='iv.iii']")
	ecl_anf = _parse_anf_roman_sections(ecl_div, max_sec=65) if ecl_div is not None else {}
	ecl_units = 0
	for sec in sorted(set(ecl_grc.keys()) | set(ecl_anf.keys())):
		if sec == 0:
			continue
		grc_toks = [tok for sub in sorted(ecl_grc.get(sec, {}).keys()) for tok in ecl_grc[sec][sub]]
		if grc_toks:
			canon = celano_lem.lemmatize_tokens(grc_toks, lang="grc")
			writer.insert_text_unit("clement_celano_grc", "ECL_PR", sec, 0, 1, f"Ecl. {sec}", join_tokens(canon), tokens=canon, section_label=str(sec))
			ecl_units += 1
		if sec in ecl_anf:
			writer.insert_text_unit("clement_anf_eng", "ECL_PR", sec, 0, 1, f"Ecl. {sec}", ecl_anf[sec], section_label=str(sec))
			ecl_units += 1
	print(f"  ✓ Ingested ECL_PR ({ecl_units} text units)")

	writer.finalize("clement")
	return writer.raw_db_path


if __name__ == "__main__":
	build_clement_raw_db()
