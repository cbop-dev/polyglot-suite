"""Stage 1: Ingest raw TEI XML for Greek (Niese) and English (Whiston)."""

from __future__ import annotations

import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from .config import Manifest, BUILD_DIR

NS = {"tei": "http://www.tei-c.org/ns/1.0"}


def ensure_source(path: Path, tlg_work: str, lang: str):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0526/tlg{tlg_work}/tlg0526.tlg{tlg_work}.perseus-{lang}2.xml"
        print(f"Downloading missing source XML for tlg0526.tlg{tlg_work} ({lang})...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
        with open(path, "wb") as f:
            f.write(data)


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[\r\n\t]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def get_node_text(elem: ET.Element) -> str:
    text = elem.text or ""
    for child in elem:
        tag = child.tag.replace("{http://www.tei-c.org/ns/1.0}", "")
        if tag == "note":
            if child.tail:
                text += child.tail
        else:
            text += get_node_text(child)
            if child.tail:
                text += child.tail
    return text


def run_stage1(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    tlg_work = manifest.data["work"]["tlg_work"]
    grc_path = manifest.greek_source()
    eng_path = manifest.english_source()

    ensure_source(grc_path, tlg_work, "grc")
    ensure_source(eng_path, tlg_work, "eng")

    print(f"[Stage 1] Ingesting {work_id} from {grc_path.name} & {eng_path.name}...")

    grc_root = ET.parse(grc_path).getroot()
    eng_root = ET.parse(eng_path).getroot()

    grc_body = grc_root.find(".//tei:body", NS)
    eng_body = eng_root.find(".//tei:body", NS)

    grc_books = grc_body.findall('.//tei:div[@type="textpart"][@subtype="book"]', NS) or [grc_body]
    eng_books = eng_body.findall('.//tei:div[@type="textpart"][@subtype="book"]', NS) or [eng_body]

    work_stage1_dir = BUILD_DIR / "stage1" / work_id
    work_stage1_dir.mkdir(parents=True, exist_ok=True)

    parsed_books = []

    for i, g_book in enumerate(grc_books):
        b_num_str = g_book.attrib.get("n", str(i + 1))
        try:
            b_num = int(b_num_str)
        except ValueError:
            b_num = i + 1

        e_book = None
        for eb in eng_books:
            if eb.attrib.get("n") == str(b_num_str):
                e_book = eb
                break
        if e_book is None and len(eng_books) > i:
            e_book = eng_books[i]

        # Extract Greek sections
        g_raw = g_book.findall('.//tei:div[@type="textpart"][@subtype="section"]', NS) or g_book.findall('.//tei:p', NS)
        g_secs = {}
        for gs in g_raw:
            n_val = gs.attrib.get("n", "")
            txt = clean_text(get_node_text(gs))
            if txt:
                g_secs[n_val] = txt

        # Extract English sections
        e_raw = e_book.findall('.//tei:div[@type="textpart"][@subtype="section"]', NS) if e_book is not None else []
        if not e_raw and e_book is not None:
            e_raw = e_book.findall('.//tei:p', NS)

        e_secs = []
        for es in e_raw:
            n_val = es.attrib.get("n", "")
            txt = clean_text(get_node_text(es))
            if txt:
                e_secs.append((n_val, txt))

        e_num_starts = sorted([int(n) for n, t in e_secs if n.isdigit()])

        section_list = []

        # 1. Prefaces/Arguments
        for n_val, txt in e_secs:
            if not n_val.isdigit():
                g_txt = g_secs.get(n_val, "")
                section_list.append({
                    "niese": n_val,
                    "grc": g_txt,
                    "eng": txt
                })

        # 2. Aligned section ranges
        if e_num_starts:
            max_g = max([int(k) for k in g_secs.keys() if str(k).isdigit()], default=max(e_num_starts))
            for idx, start_n in enumerate(e_num_starts):
                end_n = e_num_starts[idx + 1] if idx + 1 < len(e_num_starts) else max_g + 1

                g_parts = []
                for sec_i in range(start_n, end_n):
                    if str(sec_i) in g_secs:
                        g_parts.append(g_secs[str(sec_i)])
                    elif sec_i in g_secs:
                        g_parts.append(g_secs[sec_i])

                eng_txt = ""
                for n_val, txt in e_secs:
                    if n_val == str(start_n):
                        eng_txt = txt
                        break

                niese_label = str(start_n) if start_n == end_n - 1 else f"{start_n}–{end_n - 1}"
                section_list.append({
                    "niese": niese_label,
                    "section_num": start_n,
                    "grc": " ".join(g_parts),
                    "eng": eng_txt
                })

        book_data = {
            "work_id": work_id,
            "book": b_num,
            "title": f"Book {b_num}",
            "sections": section_list
        }

        book_out = work_stage1_dir / f"book-{b_num}.json"
        with open(book_out, "w", encoding="utf-8") as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)

        parsed_books.append(book_data)

    out_file = work_stage1_dir / f"{work_id}.json"
    work_data = {
        "id": work_id,
        "title": manifest.title,
        "abbrev": manifest.abbrev,
        "books": parsed_books
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(work_data, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 1] Completed {work_id}: {len(parsed_books)} books saved to {work_stage1_dir}.")
    return work_data
