"""Irenaeus of Lyons Ingestor for Ancient Corpora Reader (ACR).

Ingests Against Heresies (Books 1-5) as a single 5-book work (`AH`) with 4 witnesses:
  - irenaeus_celano_grc: Surviving Greek fragments (tlg1447.tlg001, Celano CC BY-NC 4.0)
  - irenaeus_pg_lat:     Massuet / PG 7 Latin (Sabbatismus EPUB, Public Domain)
  - irenaeus_anf_eng:    Roberts & Rambaut English (ANF Vol. 1, CCEL, Public Domain)
  - irenaeus_sab_eng:    Sabbatismus English (Sabbatismus EPUB, CC BY-SA 4.0)
"""

from __future__ import annotations
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
CACHE_DIR = PIPELINE_DIR / "cache" / "irenaeus"

PIPELINE_CORE_DIR = WORKSPACE_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))
if str(PIPELINE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_DIR))

from pipeline_core.cache_fetcher import download_file  # noqa: E402
from config import CORPUS_VERSIONS_CATALOG  # noqa: E402
from lemmatizers import get_lemmatizer  # noqa: E402
from ingestors.base import RawCorpusWriter  # noqa: E402
from ingestors.parsers import CCELThmlParser, SabbatismusEpubParser, join_tokens  # noqa: E402

EPUB_URL = "https://www.sabbatismus.com/content/books/adversus-haereses-ireneo-de-lyon/adversus-haereses-ireneo-de-lyon-bi-en.epub"
CELANO_URL = "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg1447.tlg001.1st1K-grc1.xml"
ANF01_URL = "https://www.ccel.org/ccel/schaff/anf01/anf01.xml"

ANF_BOOK_DIVS = {
	"ix.ii": 32,   # Book I (Pref + 1..31)
	"ix.iii": 36,  # Book II (Pref + 1..35)
	"ix.iv": 26,   # Book III (Pref + 1..25)
	"ix.vi": 42,   # Book IV (Pref + 1..41)
	"ix.vii": 37,  # Book V (Pref + 1..36)
}
DIV2_TO_BOOK = {"ix.ii": 1, "ix.iii": 2, "ix.iv": 3, "ix.vi": 4, "ix.vii": 5}


def ensure_sources() -> None:
	CACHE_DIR.mkdir(parents=True, exist_ok=True)
	justin_anf = PIPELINE_DIR / "cache" / "justin" / "anf01.xml"
	local_anf = CACHE_DIR / "anf01.xml"
	if not local_anf.exists() and justin_anf.exists():
		shutil.copy2(justin_anf, local_anf)
	else:
		download_file(ANF01_URL, local_anf)

	download_file(EPUB_URL, CACHE_DIR / "adversus-haereses-bi-en.epub")
	download_file(CELANO_URL, CACHE_DIR / "tlg1447.tlg001.1st1K-grc1.xml")


def parse_irenaeus_greek_fragments(xml_path: Path) -> Dict[int, List[Dict[str, Any]]]:
	"""Parses tlg1447.tlg001 (Harvey Book 1 fragments) into {massuet_chapter: [raw_tokens]}."""
	tree = ET.parse(xml_path)
	root = tree.getroot()
	chapters: Dict[int, List[Dict[str, Any]]] = defaultdict(list)

	for t in root.iter("t"):
		p_val = (t.attrib.get("p") or "").strip()
		if not p_val:
			continue
		head = p_val.split(".", 1)[0]
		if head == "prooemium":
			ch_num = 0
		elif head in ("6a", "6b"):
			ch_num = 6
		elif head.isdigit():
			n = int(head)
			if n > 31:
				continue
			ch_num = n
		else:
			continue

		f_el = t.find("f")
		surface = (f_el.text or "").strip() if f_el is not None else ""
		if not surface:
			continue

		l1_el = t.find(".//l1")
		l2_el = t.find(".//l2")
		l1 = (l1_el.text or "").strip() if l1_el is not None and l1_el.text else ""
		l2 = (l2_el.text or "").strip() if l2_el is not None and l2_el.text else ""

		chapters[ch_num].append({
			"w": surface,
			"o": (t.attrib.get("o") or "").strip(),
			"l1": l1,
			"l2": l2,
		})
	return chapters


def build_irenaeus_raw_db(lemmatizer_scheme: str = "celano") -> Path:
	ensure_sources()
	lemmatizer = get_lemmatizer(lemmatizer_scheme)

	epub_books = SabbatismusEpubParser.parse(CACHE_DIR / "adversus-haereses-bi-en.epub")
	anf_divs = CCELThmlParser.parse_div2_map(CACHE_DIR / "anf01.xml", ANF_BOOK_DIVS)
	grc_book1 = parse_irenaeus_greek_fragments(CACHE_DIR / "tlg1447.tlg001.1st1K-grc1.xml")

	writer = RawCorpusWriter("irenaeus", lemmatizer_scheme=lemmatizer_scheme)
	writer.insert_versions(CORPUS_VERSIONS_CATALOG["irenaeus"])

	writer.insert_work({
		"code": "AH",
		"slug": "against-heresies",
		"order_index": 1,
		"category": "treatise",
		"abbrev": "Haer.",
		"tlg_id": "tlg1447.tlg001",
		"title_english": "Against Heresies",
		"title_primary": "Ἔλεγχος καὶ ἀνατροπὴ τῆς ψευδωνύμου γνώσεως",
		"title_secondary": "Adversus Haereses",
		"total_divisions": 5,
		"min_division": 1,
		"division_label": "Book",
	})

	anf_by_book: Dict[int, Dict[int, List[str]]] = {}
	for div2_id, book_num in DIV2_TO_BOOK.items():
		# CCEL div3 index 1 is Preface (ch=0), index 2 is Ch 1, etc.
		raw_ch = anf_divs.get(div2_id, {})
		anf_by_book[book_num] = {idx - 1: paras for idx, paras in raw_ch.items()}

	total_units = 0
	for book_num in range(1, 6):
		epub_ch_map = epub_books.get(book_num, {})
		anf_ch_map = anf_by_book.get(book_num, {})
		all_chs = sorted(set(epub_ch_map.keys()) | set(anf_ch_map.keys()))

		for ch_num in all_chs:
			sec_int = ch_num + 1  # 1-based section index per book (1 = Preface, 2 = Ch 1, ...)
			ch_label = "Pref." if ch_num == 0 else str(ch_num)
			cit = f"Haer. {book_num}.{ch_label}"

			# 1. Greek fragments (Book 1 where extant)
			if book_num == 1 and ch_num in grc_book1:
				canon_toks = lemmatizer.lemmatize_tokens(grc_book1[ch_num], lang="grc")
				grc_text = join_tokens(canon_toks)
				if grc_text:
					writer.insert_text_unit(
						"irenaeus_celano_grc",
						"AH",
						book_num,
						0,
						sec_int,
						cit,
						grc_text,
						tokens=canon_toks,
						section_label=ch_label,
					)
					total_units += 1

			# 2. Sabbatismus Latin & English
			pairs = epub_ch_map.get(ch_num, [])
			lat_text = "\n\n".join(la for la, _ in pairs if la)
			sab_eng_text = "\n\n".join(tr for _, tr in pairs if tr)

			if lat_text:
				writer.insert_text_unit(
					"irenaeus_pg_lat",
					"AH",
					book_num,
					0,
					sec_int,
					cit,
					lat_text,
					section_label=ch_label,
				)
				total_units += 1

			if sab_eng_text:
				writer.insert_text_unit(
					"irenaeus_sab_eng",
					"AH",
					book_num,
					0,
					sec_int,
					cit,
					sab_eng_text,
					section_label=ch_label,
				)
				total_units += 1

			# 3. ANF Vol. 1 English
			anf_paras = anf_ch_map.get(ch_num, [])
			anf_text = "\n\n".join(anf_paras)
			if anf_text:
				writer.insert_text_unit(
					"irenaeus_anf_eng",
					"AH",
					book_num,
					0,
					sec_int,
					cit,
					anf_text,
					section_label=ch_label,
				)
				total_units += 1

	print(f"  ✓ Ingested AH (5 books, {total_units} text units across 4 witnesses)")
	return writer.finalize(stats_corpus_id="irenaeus_celano_grc")


if __name__ == "__main__":
	build_irenaeus_raw_db()
