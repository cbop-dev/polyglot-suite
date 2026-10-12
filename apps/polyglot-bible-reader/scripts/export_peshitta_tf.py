"""Polyglot Bible Reader - Text-Fabric Peshitta Exporter.

Parses Text-Fabric feature files for both:
  1. ETCBC Peshitta Old Testament (Leiden critical edition)
  2. ETCBC Syriac New Testament (SEDRA 3 / BFBS edition)

Extracts verse units, surface words, punctuation, trailers, and word tokens
with lemma, roots, part-of-speech, and SEDRA / CAL identifiers.
Outputs clean, portable JSONL cache files:
  - pipeline/cache/peshitta_ot_raw.jsonl
  - pipeline/cache/peshitta_nt_raw.jsonl

Works completely standalone using pure Python (no C extensions or tf package required),
looking first in ~/text-fabric-data/etcbc/, or falling back to extracted cache folders.
"""

from __future__ import annotations
import json
import os
import sys
import zipfile
import urllib.request
from pathlib import Path
from typing import Iterator, Dict, Any, List, Optional

# Default paths
LOCAL_TF_DATA = Path.home() / "text-fabric-data" / "etcbc"
PIPELINE_CACHE = Path(__file__).resolve().parent.parent / "pipeline" / "cache"
PESHITTA_CACHE_DIR = PIPELINE_CACHE / "peshitta_tf"

# Book name normalization from TF to canonical USFM 3-letter codes
OT_BOOK_MAP = {
    "Gn": "GEN", "Ex": "EXO", "Lv": "LEV", "Nm": "NUM", "Dt": "DEU",
    "Jos": "JOS", "Jd": "JDG", "Sm1": "1SA", "Sm2": "2SA", "Rg1": "1KI", "Rg2": "2KI",
    "Is": "ISA", "Jr": "JER", "Ez": "EZK", "Hs": "HOS", "Jl": "JOL", "Am": "AMO",
    "Ob": "OBA", "Jon": "JON", "Mi": "MIC", "Na": "NAM", "Hb": "HAB", "Zf": "ZEP",
    "Hg": "HAG", "Sa": "ZEC", "Ml": "MAL", "Ps": "PSA", "Jb": "JOB", "Pr": "PRO",
    "Ru": "RUT", "Ct": "SNG", "Ec": "ECC", "Thr": "LAM", "Est": "EST", "Dn": "DAN",
    "Ezr": "EZR", "Neh": "NEH", "Chr1": "1CH", "Chr2": "2CH",
    # Apocrypha in Leiden Peshitta:
    "Sap": "WIS", "Sir": "SIR", "Bar": "BAR", "EpJr": "LJE", "Sus": "SUS",
    "BelDr": "BEL", "Jdt": "JDT", "Tb_A": "TOB", "Tb_B": "TOB",
    "Mc1_A": "1MA", "Mc1_B": "1MA", "Mc2": "2MA", "Mc3": "3MA", "Mc4": "4MA",
    "Esr3": "1ES", "Esr4": "2ES", "OrM_A": "MAN", "OrM_B": "MAN",
    "ApcPs_A": "PS2", "ApcPs": "PS2", "PsS": "PSS", "Oda": "ODA"
}

NT_BOOK_MAP = {
    "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
    "Rom": "ROM", "1Cor": "1CO", "2Cor": "2CO", "Gal": "GAL", "Eph": "EPH",
    "Phil": "PHP", "Col": "COL", "1Thess": "1TH", "2Thess": "2TH", "1Tim": "1TI",
    "2Tim": "2TI", "Titus": "TIT", "Phlm": "PHM", "Heb": "HEB", "James": "JAS",
    "1Peter": "1PE", "2Peter": "2PE", "1John": "1JN", "2John": "2JN", "3John": "3JN",
    "Jude": "JUD", "Rev": "REV"
}


def parse_tf_feature(filepath: Path) -> Dict[int, str]:
    """Parses a Text-Fabric .tf feature file into a dict mapping node -> string value."""
    if not filepath.exists():
        return {}
    lines = filepath.read_text(encoding="utf-8").splitlines()
    data = {}
    current_node = 0
    meta = True
    for line in lines:
        if meta:
            if line.startswith("@"):
                continue
            meta = False
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) == 2:
            current_node = int(parts[0])
            data[current_node] = parts[1]
        elif len(parts) == 1 and current_node is not None:
            current_node += 1
            data[current_node] = parts[0]
    return data


def parse_oslots(filepath: Path) -> Dict[int, List[int]]:
    """Parses a Text-Fabric oslots.tf file into a dict mapping complex nodes -> word slot lists."""
    if not filepath.exists():
        return {}
    lines = filepath.read_text(encoding="utf-8").splitlines()
    slots = {}
    current_node = None
    meta = True
    for line in lines:
        if meta:
            if line.startswith("@"):
                continue
            meta = False
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) == 2:
            current_node = int(parts[0])
            spec = parts[1]
        else:
            current_node += 1
            spec = parts[0]

        words = []
        for segment in spec.split(";"):
            for sub in segment.strip().split():
                sub = sub.strip()
                if not sub:
                    continue
                if "-" in sub:
                    start, end = map(int, sub.split("-"))
                    words.extend(range(start, end + 1))
                else:
                    words.append(int(sub))
        slots[current_node] = words
    return slots


def parse_otypes(filepath: Path) -> Dict[str, tuple[int, int]]:
    """Parses otype.tf returning {type_name: (min_node, max_node)}."""
    lines = filepath.read_text(encoding="utf-8").splitlines()
    otypes = {}
    for line in lines:
        if line.startswith("@") or not line.strip():
            continue
        parts = line.split()
        if len(parts) == 2:
            range_str, name = parts
            if "-" in range_str:
                start, end = map(int, range_str.split("-"))
            else:
                start = end = int(range_str)
            otypes[name] = (start, end)
    return otypes


def ensure_tf_dir(corpus_name: str) -> Path:
    """Finds or downloads the tf directory for 'peshitta' or 'syrnt'."""
    # 1. Check local ~/text-fabric-data
    local_path = LOCAL_TF_DATA / corpus_name / "tf" / "0.1"
    if local_path.exists():
        return local_path

    # 2. Check cached unzipped folder
    cache_path = PESHITTA_CACHE_DIR / corpus_name / "tf" / "0.1"
    if cache_path.exists():
        return cache_path

    # 3. Download from GitHub if missing
    PESHITTA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    zip_dest = PESHITTA_CACHE_DIR / f"{corpus_name}.zip"
    url = f"https://github.com/ETCBC/{corpus_name}/archive/refs/heads/master.zip"
    print(f"Downloading {corpus_name} Text-Fabric data from {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "PolyglotBibleReader/1.0"})
    with urllib.request.urlopen(req) as resp, open(zip_dest, "wb") as f:
        f.write(resp.read())

    print(f"Unpacking {zip_dest.name}...")
    with zipfile.ZipFile(zip_dest, "r") as zf:
        zf.extractall(PESHITTA_CACHE_DIR)

    # Look for extracted tf directory
    extracted_root = PESHITTA_CACHE_DIR / f"{corpus_name}-master" / "tf"
    if not extracted_root.exists():
        # Check subdirs
        matches = list(PESHITTA_CACHE_DIR.glob(f"**/{corpus_name}*/tf/*"))
        if matches:
            return matches[0]
        raise FileNotFoundError(f"Could not locate tf folder for {corpus_name}")

    subdirs = [d for d in extracted_root.iterdir() if d.is_dir()]
    return subdirs[0] if subdirs else extracted_root


def export_ot(out_file: Path):
    """Exports ETCBC Peshitta OT to JSONL."""
    tf_dir = ensure_tf_dir("peshitta")
    print(f"Exporting Peshitta OT from {tf_dir} -> {out_file.name}...")

    otypes = parse_otypes(tf_dir / "otype.tf")
    v_start, v_end = otypes["verse"]
    b_start, b_end = otypes["book"]
    c_start, c_end = otypes["chapter"]

    books = parse_tf_feature(tf_dir / "book.tf")
    chapters = parse_tf_feature(tf_dir / "chapter.tf")
    verses = parse_tf_feature(tf_dir / "verse.tf")
    words = parse_tf_feature(tf_dir / "word.tf")
    trailers = parse_tf_feature(tf_dir / "trailer.tf")
    trailers_etcbc = parse_tf_feature(tf_dir / "trailer_etcbc.tf")
    words_etcbc = parse_tf_feature(tf_dir / "word_etcbc.tf")
    slots = parse_oslots(tf_dir / "oslots.tf")

    # Map word node to book and chapter
    # Build word -> book lookup from book slots
    word_to_book = {}
    for b_node in range(b_start, b_end + 1):
        b_name = books.get(b_node)
        for w in slots.get(b_node, []):
            word_to_book[w] = b_name

    word_to_chapter = {}
    for c_node in range(c_start, c_end + 1):
        ch_num = int(chapters.get(c_node, 1))
        for w in slots.get(c_node, []):
            word_to_chapter[w] = ch_num

    out_file.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(out_file, "w", encoding="utf-8") as f:
        for v_node in range(v_start, v_end + 1):
            w_nodes = slots.get(v_node, [])
            if not w_nodes:
                continue

            first_w = w_nodes[0]
            raw_book = word_to_book.get(first_w, "")
            ch_num = word_to_chapter.get(first_w, 1)
            v_num = int(verses.get(v_node, 1))

            usfm_book = OT_BOOK_MAP.get(raw_book)
            if not usfm_book:
                continue  # skip secondary variant versions (e.g. Tb_B) or unknown

            tokens = []
            text_parts = []
            for w in w_nodes:
                w_syriac = words.get(w, "")
                w_translit = words_etcbc.get(w, "")
                trailer = trailers.get(w, " ")
                text_parts.append(w_syriac + trailer)

                tokens.append({
                    "word": w_syriac,
                    "trailer": trailer,
                    "translit": w_translit,
                })

            full_text = "".join(text_parts).strip()
            record = {
                "testament": "OT",
                "raw_book": raw_book,
                "book": usfm_book,
                "chapter": ch_num,
                "verse": v_num,
                "text": full_text,
                "tokens": tokens,
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1

    print(f"  [done] Exported {count:,} OT verses to {out_file.name}")


def export_nt(out_file: Path):
    """Exports ETCBC SyrNT to JSONL."""
    tf_dir = ensure_tf_dir("syrnt")
    print(f"Exporting Syriac NT from {tf_dir} -> {out_file.name}...")

    otypes = parse_otypes(tf_dir / "otype.tf")
    v_start, v_end = otypes["verse"]
    b_start, b_end = otypes["book"]
    c_start, c_end = otypes["chapter"]

    books = parse_tf_feature(tf_dir / "book.tf")
    chapters = parse_tf_feature(tf_dir / "chapter.tf")
    verses = parse_tf_feature(tf_dir / "verse.tf")
    words = parse_tf_feature(tf_dir / "word.tf")
    lexemes = parse_tf_feature(tf_dir / "lexeme.tf")
    lexemes_sedra = parse_tf_feature(tf_dir / "lexeme_sedra.tf")
    sp = parse_tf_feature(tf_dir / "sp.tf")
    slots = parse_oslots(tf_dir / "oslots.tf")

    word_to_book = {}
    for b_node in range(b_start, b_end + 1):
        b_name = books.get(b_node)
        for w in slots.get(b_node, []):
            word_to_book[w] = b_name

    word_to_chapter = {}
    for c_node in range(c_start, c_end + 1):
        ch_num = int(chapters.get(c_node, 1))
        for w in slots.get(c_node, []):
            word_to_chapter[w] = ch_num

    out_file.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(out_file, "w", encoding="utf-8") as f:
        for v_node in range(v_start, v_end + 1):
            w_nodes = slots.get(v_node, [])
            if not w_nodes:
                continue

            first_w = w_nodes[0]
            raw_book = word_to_book.get(first_w, "")
            ch_num = word_to_chapter.get(first_w, 1)
            v_num = int(verses.get(v_node, 1))

            usfm_book = NT_BOOK_MAP.get(raw_book)
            if not usfm_book:
                continue

            tokens = []
            text_parts = []
            for w in w_nodes:
                w_syriac = words.get(w, "")
                lex = lexemes.get(w, "")
                sedra_id = lexemes_sedra.get(w, "")
                pos = sp.get(w, "")
                trailer = " "
                text_parts.append(w_syriac + trailer)

                tokens.append({
                    "word": w_syriac,
                    "lemma": lex,
                    "sedra_id": sedra_id,
                    "morph": pos,
                    "trailer": trailer,
                })

            full_text = "".join(text_parts).strip()
            record = {
                "testament": "NT",
                "raw_book": raw_book,
                "book": usfm_book,
                "chapter": ch_num,
                "verse": v_num,
                "text": full_text,
                "tokens": tokens,
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1

    print(f"  [done] Exported {count:,} NT verses to {out_file.name}")


def export_all():
    ot_cache = PIPELINE_CACHE / "peshitta_ot_raw.jsonl"
    nt_cache = PIPELINE_CACHE / "peshitta_nt_raw.jsonl"
    export_ot(ot_cache)
    export_nt(nt_cache)
    print("\nBoth Peshitta datasets exported successfully!")


if __name__ == "__main__":
    export_all()
