"""Apostolic Fathers Pipeline - Kirsopp Lake Loeb English Parser.

Parses Perseus TEI XML transcriptions of Kirsopp Lake's 1912-1913
Loeb Classical Library edition of the Apostolic Fathers.
Extracts clean English text keyed by (work_code, chapter, section).
"""

from __future__ import annotations
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Tuple, Optional
from ..config import CANONICAL_WORKS, PERSEUS_DIR, AFWork

TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}


def clean_xml_text(elem: ET.Element) -> str:
    """Recursively extracts text from element, ignoring editor footnotes and notes."""
    texts = []
    if elem.text:
        texts.append(elem.text)
    for child in elem:
        # Skip notes and pagebreaks
        tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
        if tag in ("note", "pb"):
            if child.tail:
                texts.append(child.tail)
            continue
        texts.append(clean_xml_text(child))
        if child.tail:
            texts.append(child.tail)
    raw = "".join(texts)
    # Normalize whitespaces
    return re.sub(r"\s+", " ", raw).strip()


class PerseusEnglishParser:
    def __init__(self, perseus_dir: Optional[Path] = None):
        self.perseus_dir = perseus_dir or PERSEUS_DIR

    def parse_work(self, work: AFWork) -> Dict[Tuple[int, int], str]:
        """Returns {(chapter, section): text} for the given work."""
        xml_path = self.perseus_dir / work.perseus_filename
        if not xml_path.exists():
            print(f"Warning: Perseus XML missing: {xml_path}")
            return {}

        tree = ET.parse(xml_path)
        root = tree.getroot()

        if work.code.startswith("IGN_"):
            return self._parse_ignatius(root, work)
        elif work.code == "HER":
            return self._parse_hermas(root, work)
        else:
            return self._parse_standard(root, work)

    def _parse_standard(self, root: ET.Element, work: AFWork) -> Dict[Tuple[int, int], str]:
        results: Dict[Tuple[int, int], str] = {}
        for ch_div in root.findall(".//tei:div[@subtype='chapter']", TEI_NS):
            ch_str = ch_div.get("n", "").strip()
            if not ch_str:
                continue
            # Treat "pref", "salutation", "title", "0" as chapter 0
            if ch_str in ("pref", "salutation", "title") or not ch_str.isdigit():
                ch_num = 0
            else:
                ch_num = int(ch_str)

            sections = ch_div.findall(".//tei:div[@subtype='section']", TEI_NS)
            if sections:
                for sec_div in sections:
                    sec_str = sec_div.get("n", "1").strip()
                    sec_num = int(sec_str) if sec_str.isdigit() else 1
                    txt = clean_xml_text(sec_div)
                    if txt:
                        results[(ch_num, sec_num)] = txt
            else:
                # If no section divs, grab text from p children
                p_elems = ch_div.findall(".//tei:p", TEI_NS)
                if p_elems:
                    for idx, p_elem in enumerate(p_elems, start=1):
                        txt = clean_xml_text(p_elem)
                        if txt:
                            results[(ch_num, idx)] = txt
                else:
                    txt = clean_xml_text(ch_div)
                    if txt:
                        results[(ch_num, 1)] = txt

        return results

    def _parse_ignatius(self, root: ET.Element, work: AFWork) -> Dict[Tuple[int, int], str]:
        results: Dict[Tuple[int, int], str] = {}
        # Order of epistles: Eph=1, Mag=2, Tra=3, Rom=4, Phl=5, Smy=6, Pol=7
        ign_map = {
            "IGN_EPH": 1,
            "IGN_MAG": 2,
            "IGN_TRA": 3,
            "IGN_ROM": 4,
            "IGN_PHL": 5,
            "IGN_SMY": 6,
            "IGN_POL": 7,
        }
        target_ep_idx = ign_map.get(work.code, 1)

        epistles = root.findall(".//tei:div[@subtype='epistle']", TEI_NS)
        if not epistles:
            return self._parse_standard(root, work)

        target_ep = None
        for ep in epistles:
            n_str = ep.get("n", "").strip()
            if n_str.isdigit() and int(n_str) == target_ep_idx:
                target_ep = ep
                break

        if target_ep is None and len(epistles) >= target_ep_idx:
            target_ep = epistles[target_ep_idx - 1]

        if target_ep is None:
            return results

        for ch_div in target_ep.findall(".//tei:div[@subtype='chapter']", TEI_NS):
            ch_str = ch_div.get("n", "").strip()
            if not ch_str:
                continue
            if ch_str in ("pref", "salutation", "title") or not ch_str.isdigit():
                ch_num = 0
            else:
                ch_num = int(ch_str)

            sections = ch_div.findall(".//tei:div[@subtype='section']", TEI_NS)
            if sections:
                for sec_div in sections:
                    sec_str = sec_div.get("n", "1").strip()
                    sec_num = int(sec_str) if sec_str.isdigit() else 1
                    txt = clean_xml_text(sec_div)
                    if txt:
                        results[(ch_num, sec_num)] = txt
            else:
                p_elems = ch_div.findall(".//tei:p", TEI_NS)
                if p_elems:
                    for idx, p_elem in enumerate(p_elems, start=1):
                        txt = clean_xml_text(p_elem)
                        if txt:
                            results[(ch_num, idx)] = txt
                else:
                    txt = clean_xml_text(ch_div)
                    if txt:
                        results[(ch_num, 1)] = txt

        return results

    def _parse_hermas(self, root: ET.Element, work: AFWork) -> Dict[Tuple[int, int], str]:
        results: Dict[Tuple[int, int], str] = {}
        # Hermas has 27 books matching Tauber book 1..27
        for bk in root.findall(".//tei:div[@subtype='book']", TEI_NS):
            bk_str = bk.get("n", "").strip()
            if not bk_str or not bk_str.isdigit():
                continue
            bk_num = int(bk_str)

            for ch_div in bk.findall(".//tei:div[@subtype='chapter']", TEI_NS):
                ch_str = ch_div.get("n", "").strip()
                ch_num = int(ch_str) if ch_str.isdigit() else 1

                sections = ch_div.findall(".//tei:div[@subtype='section']", TEI_NS)
                if sections:
                    for sec_div in sections:
                        sec_str = sec_div.get("n", "1").strip()
                        sec_num = int(sec_str) if sec_str.isdigit() else 1
                        txt = clean_xml_text(sec_div)
                        if txt:
                            # In Hermas, chapter is book number (1..27) and section is combined ch.sec
                            results[(bk_num, ch_num * 100 + sec_num)] = txt
                else:
                    txt = clean_xml_text(ch_div)
                    if txt:
                        results[(bk_num, ch_num)] = txt

        return results


if __name__ == "__main__":
    parser = PerseusEnglishParser()
    didache = next(w for w in CANONICAL_WORKS if w.code == "DID")
    did_res = parser.parse_work(didache)
    print(f"Didache parsed sections: {len(did_res)}")
    for k in sorted(did_res.keys())[:5]:
        print(f"  Didache {k[0]}.{k[1]}: {did_res[k][:60]}...")
