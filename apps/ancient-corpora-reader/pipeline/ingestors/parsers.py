"""Reusable Upstream Source Parsers (Celano XML, CCEL ThML XML, EpiDoc/TEI XML)."""

from __future__ import annotations
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple


def join_tokens(tokens: List[Dict[str, Any]]) -> str:
	"""Reconstructs readable text from a token list with proper punctuation spacing."""
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


class CelanoParser:
	"""Parses Giuseppe Celano's LemmatizedAncientGreekXML files."""

	@staticmethod
	def parse(xml_path: Path, max_chapter: int, include_preface: bool = False) -> Dict[int, Dict[int, List[Dict[str, Any]]]]:
		"""Returns {chapter: {section: [raw_tokens]}}."""
		tree = ET.parse(xml_path)
		root = tree.getroot()
		chapters: Dict[int, Dict[int, List[Dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))

		for t in root.iter("t"):
			p_val = (t.attrib.get("p") or "").strip()
			if not p_val:
				continue
			if "." in p_val:
				ch_str, sec_str = p_val.split(".", 1)
				if ch_str == "praef" and include_preface and sec_str.isdigit():
					ch, sec = 0, int(sec_str)
				elif ch_str.isdigit() and sec_str.isdigit():
					ch, sec = int(ch_str), int(sec_str)
				else:
					continue
			elif p_val.isdigit():
				ch, sec = int(p_val), 1
			else:
				continue

			min_ch = 0 if include_preface else 1
			if ch < min_ch or ch > max_chapter:
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


class CCELThmlParser:
	"""Parses CCEL Theological Markup Language (ThML) XML volumes."""

	@staticmethod
	def clean_element(elem: ET.Element) -> str:
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
		return re.sub(r"\s+", " ", "".join(chunks)).strip()

	@classmethod
	def parse_div2_map(cls, xml_path: Path, div2_limits: Dict[str, int]) -> Dict[str, Dict[int, List[str]]]:
		"""Returns {div2_id: {chapter_num: [paragraph_texts]}}."""
		tree = ET.parse(xml_path)
		root = tree.getroot()
		result: Dict[str, Dict[int, List[str]]] = {}

		for d2 in root.iter("div2"):
			d2_id = d2.attrib.get("id", "")
			if d2_id not in div2_limits:
				continue
			max_ch = div2_limits[d2_id]
			ch_map: Dict[int, List[str]] = {}
			for idx, d3 in enumerate(d2.findall("div3"), 1):
				if idx > max_ch:
					break
				paras = [cls.clean_element(p) for p in d3.findall("p")]
				paras = [p for p in paras if p]
				if not paras:
					paras = [cls.clean_element(p) for p in d3.iter("p")]
					paras = [p for p in paras if p]
				ch_map[idx] = paras
			result[d2_id] = ch_map
		return result


class TEIParser:
	"""Parses EpiDoc / TEI XML files (First1KGreek, Corpus Corporum, CSEL)."""

	@staticmethod
	def _strip_ns(tag: str) -> str:
		return tag.split("}", 1)[-1] if "}" in tag else tag

	@classmethod
	def _extract_text(cls, elem: ET.Element) -> str:
		chunks: List[str] = []

		def walk(node: ET.Element):
			tag = cls._strip_ns(node.tag)
			if tag in ("note", "fw", "pb", "lb"):
				if tag == "lb":
					chunks.append(" ")
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
		return re.sub(r"\s+", " ", "".join(chunks)).strip()

	@classmethod
	def parse_chapters(cls, xml_path: Path, chapter_subtype: str = "chapter") -> Dict[int, Dict[int, str]]:
		"""Extracts {chapter_num: {section_num: text}} from TEI <div type='textpart'> elements."""
		tree = ET.parse(xml_path)
		root = tree.getroot()
		chapters: Dict[int, Dict[int, str]] = defaultdict(dict)

		for div in root.iter():
			if cls._strip_ns(div.tag) != "div":
				continue
			if div.attrib.get("subtype") != chapter_subtype:
				continue
			n_str = (div.attrib.get("n") or "").strip()
			if not n_str.isdigit():
				continue
			ch_num = int(n_str)

			sec_divs = [
				c for c in div
				if cls._strip_ns(c.tag) == "div" and c.attrib.get("subtype") == "section" and (c.attrib.get("n") or "").isdigit()
			]
			if sec_divs:
				for sd in sec_divs:
					chapters[ch_num][int(sd.attrib["n"])] = cls._extract_text(sd)
			else:
				paras = [cls._extract_text(p) for p in div if cls._strip_ns(p.tag) == "p"]
				paras = [p for p in paras if p]
				if paras:
					for idx, p_text in enumerate(paras, 1):
						chapters[ch_num][idx] = p_text
				else:
					txt = cls._extract_text(div)
					if txt:
						chapters[ch_num][1] = txt
		return chapters


class SabbatismusEpubParser:
	"""Parses Sabbatismus bilingual Latin/English EPUB files into {book: {chapter: [(lat, eng), ...]}}."""

	ROMAN_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}

	@staticmethod
	def _strip_ns(tag: str) -> str:
		return tag.split("}", 1)[-1] if "}" in tag else tag

	@classmethod
	def _clean_text(cls, elem: ET.Element) -> str:
		txt = "".join(elem.itertext())
		return re.sub(r"\s+", " ", txt).strip()

	@classmethod
	def parse(cls, epub_path: Path) -> Dict[int, Dict[int, List[Tuple[str, str]]]]:
		books: Dict[int, Dict[int, List[Tuple[str, str]]]] = defaultdict(dict)
		current_book = 0

		with zipfile.ZipFile(epub_path, "r") as z:
			xhtml_names = sorted(n for n in z.namelist() if re.search(r"ch\d+\.xhtml$", n))
			for name in xhtml_names:
				raw = z.read(name).decode("utf-8", errors="replace")
				root = ET.fromstring(raw)

				title_el = next((el for el in root.iter() if cls._strip_ns(el.tag) == "title"), None)
				h1_el = next((el for el in root.iter() if cls._strip_ns(el.tag) == "h1"), None)
				title_txt = cls._clean_text(title_el) if title_el is not None else ""
				h1_txt = cls._clean_text(h1_el) if h1_el is not None else ""

				header = h1_txt or title_txt
				book_m = re.match(r"^Book\s+([IVX]+)\b", header)
				if book_m:
					current_book = cls.ROMAN_MAP.get(book_m.group(1), current_book)

				if current_book == 0:
					continue

				if "Preface" in header or "Preface" in title_txt:
					ch_num = 0
				else:
					ch_m = re.search(r"\bChapter\s+(\d+)\b", title_txt) or re.search(r"\bChapter\s+(\d+)\b", h1_txt)
					if not ch_m:
						# Skip editorial notes (e.g. "Note from the library...")
						continue
					ch_num = int(ch_m.group(1))

				pairs: List[Tuple[str, str]] = []
				for div in root.iter():
					if cls._strip_ns(div.tag) != "div" or div.attrib.get("class") != "pair":
						continue
					la_p = next((p for p in div if cls._strip_ns(p.tag) == "p" and p.attrib.get("class") == "la"), None)
					tr_p = next((p for p in div if cls._strip_ns(p.tag) == "p" and p.attrib.get("class") == "tr"), None)
					la_txt = cls._clean_text(la_p) if la_p is not None else ""
					tr_txt = cls._clean_text(tr_p) if tr_p is not None else ""
					if la_txt or tr_txt:
						pairs.append((la_txt, tr_txt))

				if pairs:
					books[current_book][ch_num] = pairs

		return books


class CorpusCorporumPosParser:
	"""Parses Corpus Corporum lemmatized TEI XML (mlat.uzh.ch/2.0) by mlat:pid."""

	MLAT_PID = "{http://mlat.uzh.ch/2.0}pid"

	@staticmethod
	def _join_words(words: List[str]) -> str:
		no_space_before = set(".,;:!?)]»’\"'")
		no_space_after = set("([«\"'")
		parts: List[str] = []
		for w in words:
			if not parts:
				parts.append(w)
			elif w in no_space_before or parts[-1] in no_space_after:
				parts.append(w)
			else:
				parts.append(" " + w)
		return "".join(parts).strip()

	@classmethod
	def parse_by_pid(cls, xml_path: Path) -> Dict[str, str]:
		"""Returns {pid_suffix: reconstructed_text} e.g. {'1.1.1': '...', '4.1': '...'}."""
		tree = ET.parse(xml_path)
		root = tree.getroot()
		out: Dict[str, str] = {}

		for div in root.iter():
			if not div.tag.endswith("div"):
				continue
			pid = div.attrib.get(cls.MLAT_PID, "")
			if ":" not in pid:
				continue
			key = pid.split(":", 1)[1]
			# Only leaf divs that directly contain <p>
			p_elems = [c for c in div if c.tag.endswith("p")]
			if not p_elems:
				continue
			paras: List[str] = []
			for p in p_elems:
				words: List[str] = []
				for el in p.iter():
					if el.tag.endswith("w") and el.text:
						words.append(el.text.strip())
				joined = cls._join_words(words)
				if joined:
					paras.append(joined)
			if paras:
				out[key] = "\n\n".join(paras)
		return out


