#!/usr/bin/env python3
import os
import json
import re
import xml.etree.ElementTree as ET

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "raw_xml")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "data")
os.makedirs(OUT_DIR, exist_ok=True)

WORKS_META = {
    "tlg001": {
        "id": "antiquities",
        "title": "Jewish Antiquities",
        "title_grc": "Ἰουδαϊκὴ Ἀρχαιολογία",
        "abbr": "Ant.",
        "author": "Flavius Josephus",
        "num_books": 20
    },
    "tlg002": {
        "id": "life",
        "title": "The Life of Flavius Josephus",
        "title_grc": "Ἰωσήπου Βίος",
        "abbr": "Life",
        "author": "Flavius Josephus",
        "num_books": 1
    },
    "tlg003": {
        "id": "apion",
        "title": "Against Apion",
        "title_grc": "Περὶ τῆς τῶν Ἰουδαίων Ἀρχαιότητος",
        "abbr": "Apion",
        "author": "Flavius Josephus",
        "num_books": 2
    },
    "tlg004": {
        "id": "war",
        "title": "The Jewish War",
        "title_grc": "Ἰουδαϊκὸς Πόλεμος",
        "abbr": "BJ",
        "author": "Flavius Josephus",
        "num_books": 7
    }
}

NS = {"tei": "http://www.tei-c.org/ns/1.0"}

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'[\r\n\t]+', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def get_node_text(elem):
    """Extract text recursively excluding note tag text, but preserving note.tail."""
    text = elem.text or ""
    for child in elem:
        tag = child.tag.replace('{http://www.tei-c.org/ns/1.0}', '')
        if tag == 'note':
            if child.tail:
                text += child.tail
        else:
            text += get_node_text(child)
            if child.tail:
                text += child.tail
    return text

def parse_work_xml(work_id):
    meta = WORKS_META[work_id]
    grc_path = os.path.join(RAW_DIR, work_id, "grc.perseus-grc2.xml")
    eng_path = os.path.join(RAW_DIR, work_id, "eng.perseus-eng2.xml")
    
    if not os.path.exists(grc_path) or not os.path.exists(eng_path):
        print(f"Skipping {work_id}: files not found.")
        return
        
    print(f"Parsing {meta['title']} ({work_id}) with 100% aligned text and restored prefaces...")
    
    grc_root = ET.parse(grc_path).getroot()
    eng_root = ET.parse(eng_path).getroot()
    
    grc_body = grc_root.find('.//tei:body', NS)
    eng_body = eng_root.find('.//tei:body', NS)
    
    grc_books = grc_body.findall('.//tei:div[@type="textpart"][@subtype="book"]', NS) or [grc_body]
    eng_books = eng_body.findall('.//tei:div[@type="textpart"][@subtype="book"]', NS) or [eng_body]
    
    work_out_dir = os.path.join(OUT_DIR, meta["id"])
    os.makedirs(work_out_dir, exist_ok=True)
    
    parsed_books_meta = []
    full_books = []
    
    for i, g_book in enumerate(grc_books):
        b_num_str = g_book.attrib.get('n', str(i + 1))
        try:
            b_num = int(b_num_str)
        except ValueError:
            b_num = i + 1
            
        e_book = None
        for eb in eng_books:
            if eb.attrib.get('n') == str(b_num_str):
                e_book = eb
                break
        if e_book is None and len(eng_books) > i:
            e_book = eng_books[i]
            
        # Extract Greek sections
        g_raw = g_book.findall('.//tei:div[@type="textpart"][@subtype="section"]', NS) or g_book.findall('.//tei:p', NS)
        g_secs = {}
        for gs in g_raw:
            n_val = gs.attrib.get('n', '')
            txt = clean_text(get_node_text(gs))
            if txt:
                g_secs[n_val] = txt

        # Extract English sections
        e_raw = e_book.findall('.//tei:div[@type="textpart"][@subtype="section"]', NS) if e_book is not None else []
        if not e_raw and e_book is not None:
            e_raw = e_book.findall('.//tei:p', NS)
            
        e_secs = []
        for es in e_raw:
            n_val = es.attrib.get('n', '')
            txt = clean_text(get_node_text(es))
            if txt:
                e_secs.append((n_val, txt))

        e_num_starts = sorted([int(n) for n, t in e_secs if n.isdigit()])

        section_list = []

        # 1. Non-numeric prefaces/arguments ('arg', 'pr.')
        for n_val, txt in e_secs:
            if not n_val.isdigit():
                g_txt = g_secs.get(n_val, '')
                section_list.append({
                    "niese": n_val,
                    "grc": f"[{n_val}] {g_txt}" if g_txt else "",
                    "eng": txt
                })

        # 2. Aligned numeric section ranges
        if e_num_starts:
            max_g = max([int(k) for k in g_secs.keys() if str(k).isdigit()], default=max(e_num_starts))
            for idx, start_n in enumerate(e_num_starts):
                end_n = e_num_starts[idx + 1] if idx + 1 < len(e_num_starts) else max_g + 1
                
                g_parts = []
                for sec_i in range(start_n, end_n):
                    if str(sec_i) in g_secs:
                        g_parts.append(f"[{sec_i}] {g_secs[str(sec_i)]}")
                    elif sec_i in g_secs:
                        g_parts.append(f"[{sec_i}] {g_secs[sec_i]}")
                        
                eng_txt = ""
                for n_val, txt in e_secs:
                    if n_val == str(start_n):
                        eng_txt = txt
                        break
                        
                niese_label = str(start_n) if start_n == end_n - 1 else f"{start_n}–{end_n - 1}"
                section_list.append({
                    "niese": niese_label,
                    "grc": " ".join(g_parts),
                    "eng": eng_txt
                })
                
        book_obj = {
            "work_id": meta["id"],
            "book": b_num,
            "title": f"Book {b_num}",
            "sections": section_list
        }
        
        full_books.append(book_obj)
        
        book_file = os.path.join(work_out_dir, f"book-{b_num}.json")
        with open(book_file, "w", encoding="utf-8") as f:
            json.dump(book_obj, f, ensure_ascii=False, indent=2)
            
        parsed_books_meta.append({
            "book": b_num,
            "title": f"Book {b_num}",
            "num_sections": len(section_list)
        })
        
    work_json = {
        "id": meta["id"],
        "title": meta["title"],
        "title_grc": meta["title_grc"],
        "abbr": meta["abbr"],
        "author": meta["author"],
        "books": full_books
    }
    out_file = os.path.join(OUT_DIR, f"{meta['id']}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(work_json, f, ensure_ascii=False, indent=2)
        
    print(f"  Saved aligned {out_file} ({len(parsed_books_meta)} books).")
    
    return {
        "id": meta["id"],
        "title": meta["title"],
        "title_grc": meta["title_grc"],
        "abbr": meta["abbr"],
        "author": meta["author"],
        "books": parsed_books_meta
    }

def main():
    manifest = []
    for work_id in WORKS_META:
        m = parse_work_xml(work_id)
        if m:
            manifest.append(m)
            
    manifest_file = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Saved manifest to {manifest_file}.")

if __name__ == "__main__":
    main()
