"""Reusable Upstream Source Parsers (Celano XML, CCEL ThML XML, EpiDoc/TEI XML)."""

from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List


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
	def parse(xml_path: Path, max_chapter: int) -> Dict[int, Dict[int, List[Dict[str, Any]]]]:
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
