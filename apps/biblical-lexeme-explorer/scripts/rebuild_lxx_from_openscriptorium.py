#!/usr/bin/env python3
"""
scripts/rebuild_lxx_from_openscriptorium.py

Rebuilds all LXX static data assets for lxx-vocab-web from OpenScriptorium/lxx-morph
seed JSON files, using Open Scriptures / Abbott-Smith derived glosses and Strong's numbers.

Outputs:
  - static/data/lxx/lexemes.json
  - static/data/lxx/sections.json
  - static/data/lxx/concordance.json
  - static/data/lxx/books.json
  - static/data/lxx/verses.json
  - static/data/lxx/books/{abbrev}.json
  - src/lib/lxx/lxxLexes6.json
"""

import sys
import os
import re
import json
import glob
import unicodedata
from pathlib import Path
from collections import defaultdict, Counter

# ----------------------------------------------------------------------
# 1. Greek Normalization & Beta Code Utilities
# ----------------------------------------------------------------------
OXIA_TO_TONOS = {
    0x1F71: 0x03AC, # á
    0x1F73: 0x03AD, # é
    0x1F75: 0x03AE, # é:
    0x1F77: 0x03AF, # í
    0x1F79: 0x03CC, # ó
    0x1F7B: 0x03CD, # ú
    0x1F7D: 0x03CE, # ó:
    0x1FBB: 0x03AC, # Á
    0x1FC9: 0x03AD, # É
    0x1FCB: 0x03AE, # É:
    0x1FDB: 0x03AF, # Í
    0x1FEB: 0x03CD, # Ú
    0x1FF9: 0x03CC, # Ó
    0x1FFB: 0x03CE, # Ó:
}

GREEK_LETTERS = list("αβγδεζηιθκλμνξοπρσςτυφχψωϝΑΒΓΔΕΖΗΙΘΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩϜ")
BETA_LETTERS = list("abgdezhiqklmncoprsstufxywvABGDEZHIQKLMNCOPRSTUFXYWV")

def norm_greek(s: str) -> str:
    """Normalize Greek to NFC and convert oxia accents to tonos."""
    if not s:
        return ""
    return unicodedata.normalize("NFC", s).translate(OXIA_TO_TONOS).strip()

def strip_accents(s: str) -> str:
    """Strip all accents, breathings, and iota subscripts for plain search."""
    if not s:
        return ""
    nfkd = unicodedata.normalize("NFKD", s)
    stripped = "".join(c for c in nfkd if not unicodedata.combining(c) and c != "ͅ" and c != "\u0345")
    return stripped.lower().replace("ς", "σ")

def greek_to_beta(s: str) -> str:
    """Convert Greek string to simplified Beta Code."""
    if not s:
        return ""
    cleaned = unicodedata.normalize("NFD", s)
    res = []
    for c in cleaned:
        if c in GREEK_LETTERS:
            idx = GREEK_LETTERS.index(c)
            res.append(BETA_LETTERS[idx])
        elif c.isalnum():
            res.append(c)
    return "".join(res)

# ----------------------------------------------------------------------
# 2. POS Tag Mapping (OpenScriptorium String -> Lexeme.PosEnum)
# ----------------------------------------------------------------------
# Lexeme.PosEnum:
# NOUN: 4, VERB: 11, ADJECTIVE: 0, ADVERB: 2, PRONOUN_DEM: 7, PRONOUN_INTER: 8,
# PRONOUN_PRS: 9, PRONOUN_RELA: 10, CONJUNCTION: 1, INTERJECTION: 3, PREPOSITION: 5,
# ARTICLE: 6, PARTICLE: 12, PROPER_NOUN: 13, NUMBER: 14, UNSPECIFIED: 15, PRONOUN: 16
POS_MAP = {
    "noun": 4,
    "verb": 11,
    "participle": 11,
    "adjective": 0,
    "adverb": 2,
    "conjunction": 1,
    "interjection": 3,
    "preposition": 5,
    "article": 6,
    "particle": 12,
    "proper noun": 13,
    "numeral": 14,
    "pronoun": 16,
}

def resolve_pos(pos_str: str, lemma: str, parsing: str = "") -> int:
    if not pos_str:
        pos_str = ""
    pos_str = pos_str.lower().strip()
    
    # Check proper noun if lemma is capitalized
    if lemma and lemma[0].isupper() and pos_str in ("noun", "proper noun", ""):
        return 13
    
    # Specific pronoun types from parsing if available
    if "pronoun" in pos_str:
        p_lower = parsing.lower()
        if "demon" in p_lower:
            return 7
        if "rel" in p_lower:
            return 10
        if "inter" in p_lower or "indef" in p_lower:
            return 8
        if "pers" in p_lower or "poss" in p_lower:
            return 9
        return 16

    return POS_MAP.get(pos_str, 4 if pos_str.endswith("noun") else 15)

# ----------------------------------------------------------------------
# 3. Canonical 57 Books Configuration & OpenScriptorium File Mapping
# ----------------------------------------------------------------------
CANONICAL_BOOKS = [
    # Pentateuch
    {"name": "Gen", "abbrev": "Gen", "files": ["genesis.json"]},
    {"name": "Exod", "abbrev": "Exod", "files": ["exodus.json"]},
    {"name": "Lev", "abbrev": "Lev", "files": ["leviticus.json"]},
    {"name": "Num", "abbrev": "Num", "files": ["numbers.json"]},
    {"name": "Deut", "abbrev": "Deut", "files": ["deuteronomy.json"]},
    # Historical
    {"name": "Josh", "abbrev": "Josh", "files": ["joshua-vaticanus-b.json", "joshua.json"]},
    {"name": "Judg", "abbrev": "Judg", "files": ["judges.json", "judges-vaticanus-b.json"]},
    {"name": "Ruth", "abbrev": "Ruth", "files": ["ruth.json"]},
    {"name": "1Sam", "abbrev": "1Sam", "files": ["1-samuel.json"]},
    {"name": "2Sam", "abbrev": "2Sam", "files": ["2-samuel.json"]},
    {"name": "1Kgs", "abbrev": "1Kgs", "files": ["1-kings.json"]},
    {"name": "2Kgs", "abbrev": "2Kgs", "files": ["2-kings.json"]},
    {"name": "1Chr", "abbrev": "1Chr", "files": ["1-chronicles.json"]},
    {"name": "2Chr", "abbrev": "2Chr", "files": ["2-chronicles.json"]},
    {"name": "1Esdr", "abbrev": "1Esdr", "files": ["1-esdras.json"]},
    {"name": "2Esdr", "abbrev": "2Esdr", "files": ["2-esdras.json"]},
    {"name": "Esth", "abbrev": "Esth", "files": ["esther-greek.json"]},
    {"name": "Jdt", "abbrev": "Jdt", "files": ["judith.json"]},
    {"name": "TobBA", "abbrev": "TobBA", "files": ["tobit.json"]},
    {"name": "TobS", "abbrev": "TobS", "files": ["tobit-sinaiticus.json"]},
    {"name": "1Mac", "abbrev": "1Mac", "files": ["1-maccabees.json"]},
    {"name": "2Mac", "abbrev": "2Mac", "files": ["2-maccabees.json"]},
    {"name": "3Mac", "abbrev": "3Mac", "files": ["3-maccabees.json"]},
    {"name": "4Mac", "abbrev": "4Mac", "files": ["4-maccabees.json"]},
    # Poetical / Wisdom
    {"name": "Ps", "abbrev": "Ps", "files": ["psalms-lxx.json"]},
    {"name": "Od", "abbrev": "Od", "files": ["odes.json"]},
    {"name": "Prov", "abbrev": "Prov", "files": ["proverbs.json"]},
    {"name": "Qoh", "abbrev": "Qoh", "files": ["ecclesiastes.json"]},
    {"name": "Cant", "abbrev": "Cant", "files": ["song-of-solomon.json"]},
    {"name": "Job", "abbrev": "Job", "files": ["job-lxx.json"]},
    {"name": "Wis", "abbrev": "Wis", "files": ["wisdom.json"]},
    {"name": "Sir", "abbrev": "Sir", "files": ["sirach.json"]},
    {"name": "PsSol", "abbrev": "PsSol", "files": ["psalms-of-solomon.json"]},
    # Minor Prophets
    {"name": "Hos", "abbrev": "Hos", "files": ["hosea.json"]},
    {"name": "Mic", "abbrev": "Mic", "files": ["micah.json"]},
    {"name": "Amos", "abbrev": "Amos", "files": ["amos.json"]},
    {"name": "Joel", "abbrev": "Joel", "files": ["joel.json"]},
    {"name": "Jonah", "abbrev": "Jonah", "files": ["jonah.json"]},
    {"name": "Obad", "abbrev": "Obad", "files": ["obadiah.json"]},
    {"name": "Nah", "abbrev": "Nah", "files": ["nahum.json"]},
    {"name": "Hab", "abbrev": "Hab", "files": ["habakkuk.json"]},
    {"name": "Zeph", "abbrev": "Zeph", "files": ["zephaniah.json"]},
    {"name": "Hag", "abbrev": "Hag", "files": ["haggai.json"]},
    {"name": "Zech", "abbrev": "Zech", "files": ["zechariah.json"]},
    {"name": "Mal", "abbrev": "Mal", "files": ["malachi.json"]},
    # Major Prophets
    {"name": "Isa", "abbrev": "Isa", "files": ["isaiah.json"]},
    {"name": "Jer", "abbrev": "Jer", "files": ["jeremiah-lxx.json"]},
    {"name": "Bar", "abbrev": "Bar", "files": ["baruch.json"]},
    {"name": "EpJer", "abbrev": "EpJer", "files": ["letter-of-jeremiah.json"]},
    {"name": "Lam", "abbrev": "Lam", "files": ["lamentations.json"]},
    {"name": "Ezek", "abbrev": "Ezek", "files": ["ezekiel.json"]},
    {"name": "Bel", "abbrev": "Bel", "files": ["bel-and-the-dragon.json"]},
    {"name": "BelTh", "abbrev": "BelTh", "files": ["bel-and-the-dragon-theodotion.json"]},
    {"name": "Dan", "abbrev": "Dan", "files": ["daniel.json"]},
    {"name": "DanTh", "abbrev": "DanTh", "files": ["daniel-theodotion.json"]},
    {"name": "Sus", "abbrev": "Sus", "files": ["susanna.json"]},
    {"name": "SusTh", "abbrev": "SusTh", "files": ["susanna-theodotion.json"]},
]

# ----------------------------------------------------------------------
# 4. Gloss & Strong's Database Loader
# ----------------------------------------------------------------------
def load_gloss_and_strongs_db():
    print("Loading gloss and Strong's database from CenterBLC Text-Fabric export...")
    tf_dir = Path("/home/cbrannan/text-fabric-data/github/CenterBLC/LXX/tf/1935")
    
    def read_tf(feat):
        path = tf_dir / f"{feat}.tf"
        if not path.exists():
            return []
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        data = []
        in_data = False
        for line in lines:
            if not in_data:
                if not line.startswith("@"):
                    in_data = True
                    data.append(line.rstrip("\n"))
            else:
                data.append(line.rstrip("\n"))
        return data[1:] if len(data) > 1 else []

    words = read_tf("word")
    lex_utf8 = read_tf("lex_utf8")
    glosses = read_tf("gloss")
    strongs = read_tf("strongs")

    lemma_map = {}   # norm_lemma -> (gloss, strong)
    plain_map = {}   # plain_lemma -> (gloss, strong)
    surf_map = {}    # norm_surf -> (gloss, strong)
    surf_plain = {}  # plain_surf -> (gloss, strong)

    for w, l, g, s in zip(words, lex_utf8, glosses, strongs):
        nw = norm_greek(w)
        nl = norm_greek(l)
        pw = strip_accents(w)
        pl = strip_accents(l)

        if nl and g:
            if nl not in lemma_map:
                lemma_map[nl] = (g, s)
            if pl not in plain_map:
                plain_map[pl] = (g, s)
        if nw and g:
            if nw not in surf_map:
                surf_map[nw] = (g, s)
            if pw not in surf_plain:
                surf_plain[pw] = (g, s)

    print(f"Loaded {len(lemma_map)} lemmas and {len(surf_map)} surface forms for gloss lookup.")
    return lemma_map, plain_map, surf_map, surf_plain

# ----------------------------------------------------------------------
# 5. Main Processing Engine
# ----------------------------------------------------------------------
def main():
    repo_root = Path(__file__).resolve().parent.parent
    os_dir = Path("/home/cbrannan/.gemini/antigravity/brain/b3241914-adc5-4494-b0ca-0ff130a25a70/scratch/lxx-morph/db/seeds/lxx_morph")
    out_dir = repo_root / "static" / "data" / "lxx"
    out_books_dir = out_dir / "books"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_books_dir.mkdir(parents=True, exist_ok=True)

    lemma_map, plain_map, surf_map, surf_plain = load_gloss_and_strongs_db()

    print("\nProcessing 57 canonical books from OpenScriptorium seeds...")
    
    # Node numbering starting constants (matching legacy Text-Fabric bounds)
    # Books: start at 623694
    # Chapters: start at 623751
    # Verses: start at 655362
    BOOK_NODE_START = 623694
    CHAP_NODE_START = 623751
    VERSE_NODE_START = 655362

    current_book_node = BOOK_NODE_START
    current_chap_node = CHAP_NODE_START
    current_verse_node = VERSE_NODE_START

    books_meta = {}      # str(bNode) -> { name, abbrev, node, words, chapters: { str(cNode): str(cNum) } }
    sections_data = {}   # str(cNode) or str(bNode) -> { words: int, lex: { str(lexId): count } }
    verses_data = {}     # str(vNode) -> { id, section, text }
    
    # Lexeme aggregation: lemma -> metadata
    lemma_store = {}
    lemma_to_id = {}
    plain_to_id = {}
    next_lex_id = 14174

    # Pre-populate lemma IDs from established lexemes dictionary in git HEAD
    import subprocess
    try:
        old_lex_bytes = subprocess.check_output(["git", "show", "HEAD:static/data/lxx/lexemes.json"])
        old_lex_dict = json.loads(old_lex_bytes.decode("utf-8"))
        for sid, lentry in old_lex_dict.items():
            nlem = norm_greek(lentry["lemma"])
            plem = strip_accents(lentry["lemma"])
            lid = int(lentry["id"])
            if nlem not in lemma_to_id:
                lemma_to_id[nlem] = lid
            if plem not in plain_to_id:
                plain_to_id[plem] = lid
        max_existing_id = max(int(k) for k in old_lex_dict.keys())
        next_lex_id = max_existing_id + 1
        print(f"Initialized {len(lemma_to_id)} existing lemma IDs (next ID: {next_lex_id})")
    except Exception as e:
        print("Warning: could not load existing lexemes.json from git:", e)

    # Concordance data: str(lexId) -> { "total": int, "bookcounts": { str(bNode): count }, "refs": [], "nodes": [] }
    concordance = defaultdict(lambda: {"total": 0, "bookcounts": defaultdict(int), "refs": [], "nodes": []})

    total_words_corpus = 0
    processed_books = []

    for b_idx, b_cfg in enumerate(CANONICAL_BOOKS):
        b_name = b_cfg["name"]
        b_abbrev = b_cfg["abbrev"]
        b_files = b_cfg["files"]
        b_node = current_book_node
        current_book_node += 1

        b_words_count = 0
        b_chapters = {}       # chap_num_str -> { "node": int, "words_count": int, "lex_counts": Counter(), "verses": {} }
        b_chap_nodes = {}     # str(cNode) -> chap_num_str
        b_lex_counts = Counter()

        for fname in b_files:
            fpath = os_dir / fname
            if not fpath.exists():
                print(f"Error: {fpath} not found!")
                sys.exit(1)
            
            with open(fpath, "r", encoding="utf-8") as fp:
                verses_list = json.load(fp)

            for v_obj in verses_list:
                ref_str = v_obj.get("ref", "")
                words = v_obj.get("words", [])
                
                # Parse ref_str: e.g. "Gen 1:1" or "1 Kgs 2:35a"
                parts = ref_str.split(" ")
                if len(parts) < 2:
                    continue
                cv_str = parts[-1]
                if ":" not in cv_str:
                    continue
                c_num_str, v_num_str = cv_str.split(":", 1)

                if c_num_str not in b_chapters:
                    c_node = current_chap_node
                    current_chap_node += 1
                    b_chapters[c_num_str] = {
                        "node": c_node,
                        "words_count": 0,
                        "lex_counts": Counter(),
                        "verses": {}
                    }
                    b_chap_nodes[str(c_node)] = c_num_str

                chap_entry = b_chapters[c_num_str]
                v_node = current_verse_node
                current_verse_node += 1

                # Build verse surface text and register tokens
                surface_tokens = []
                for w in words:
                    raw_surf = w.get("surface", "").strip()
                    raw_lem = w.get("lemma", "").strip()
                    raw_pos = w.get("pos", "")
                    raw_parse = w.get("parsing", "")

                    if not raw_surf:
                        continue

                    norm_surf = norm_greek(raw_surf)
                    norm_lem = norm_greek(raw_lem) if raw_lem else norm_surf
                    surface_tokens.append(norm_surf)

                    b_words_count += 1
                    chap_entry["words_count"] += 1
                    total_words_corpus += 1

                    # Register lemma
                    if norm_lem in lemma_to_id:
                        lex_id = lemma_to_id[norm_lem]
                    else:
                        pl = strip_accents(norm_lem)
                        if pl in plain_to_id:
                            lex_id = plain_to_id[pl]
                            lemma_to_id[norm_lem] = lex_id
                        else:
                            lex_id = next_lex_id
                            next_lex_id += 1
                            lemma_to_id[norm_lem] = lex_id
                            plain_to_id[pl] = lex_id

                    if lex_id not in lemma_store:
                        # Resolve Gloss & Strongs
                        gloss = ""
                        strongs = ""
                        pl = strip_accents(norm_lem)
                        ps = strip_accents(norm_surf)

                        if norm_lem in lemma_map:
                            gloss, strongs = lemma_map[norm_lem]
                        elif pl in plain_map:
                            gloss, strongs = plain_map[pl]
                        elif norm_surf in surf_map:
                            gloss, strongs = surf_map[norm_surf]
                        elif ps in surf_plain:
                            gloss, strongs = surf_plain[ps]
                        elif raw_pos == "proper noun" or norm_lem[0].isupper():
                            gloss = norm_lem

                        pos_num = resolve_pos(raw_pos, norm_lem, raw_parse)
                        beta = greek_to_beta(norm_lem)
                        plain = strip_accents(norm_lem)

                        lemma_store[lex_id] = {
                            "id": lex_id,
                            "lemma": norm_lem,
                            "gloss": gloss,
                            "pos": pos_num,
                            "total": 0,
                            "beta": beta,
                            "plain": plain,
                            "strongs": strongs
                        }
                    lemma_store[lex_id]["total"] += 1
                    b_lex_counts[lex_id] += 1
                    chap_entry["lex_counts"][lex_id] += 1

                    # Concordance entry
                    conc = concordance[str(lex_id)]
                    conc["total"] += 1
                    conc["bookcounts"][str(b_node)] += 1
                    if not conc["refs"] or conc["refs"][-1] != ref_str:
                        conc["refs"].append(ref_str)
                        conc["nodes"].append(v_node)

                verse_text = " ".join(surface_tokens)
                chap_entry["verses"][v_num_str] = {
                    "id": v_node,
                    "section": ref_str,
                    "text": verse_text
                }
                verses_data[str(v_node)] = {
                    "id": v_node,
                    "section": ref_str,
                    "text": verse_text
                }

        # Store book metadata
        books_meta[str(b_node)] = {
            "name": b_name,
            "abbrev": b_abbrev,
            "node": b_node,
            "words": b_words_count,
            "chapters": b_chap_nodes
        }

        # Store section data for whole book
        sections_data[str(b_node)] = {
            "words": b_words_count,
            "lex": {str(lid): count for lid, count in b_lex_counts.items()}
        }

        # Store section data for each chapter
        book_file_chapters = {}
        for c_num_str, c_data in b_chapters.items():
            c_node = c_data["node"]
            sections_data[str(c_node)] = {
                "words": c_data["words_count"],
                "lex": {str(lid): count for lid, count in c_data["lex_counts"].items()}
            }
            book_file_chapters[c_num_str] = c_data["verses"]

        # Write book JSON: static/data/lxx/books/{abbrev}.json
        book_json_content = {
            "book": b_name,
            "abbrev": b_abbrev,
            "chapters": book_file_chapters
        }
        with open(out_books_dir / f"{b_abbrev}.json", "w", encoding="utf-8") as fp:
            json.dump(book_json_content, fp, ensure_ascii=False)

        processed_books.append((b_name, b_abbrev, b_words_count, len(b_chapters)))

    # Print summary of books
    print("\nProcessed Books Summary:")
    for b_name, b_abbrev, w_cnt, c_cnt in processed_books:
        print(f"  {b_abbrev:7s}: {w_cnt:6d} words, {c_cnt:3d} chapters")

    # ------------------------------------------------------------------
    # 6. Emit Global Static Datasets
    # ------------------------------------------------------------------
    print("\nEmitting static dataset JSON files...")
    
    # 1. lexemes.json
    lexemes_output = {str(lid): data for lid, data in lemma_store.items()}
    with open(out_dir / "lexemes.json", "w", encoding="utf-8") as fp:
        json.dump(lexemes_output, fp, ensure_ascii=False)
    print(f"  Saved lexemes.json ({len(lexemes_output)} entries)")

    # 2. books.json
    with open(out_dir / "books.json", "w", encoding="utf-8") as fp:
        json.dump(books_meta, fp, ensure_ascii=False)
    print(f"  Saved books.json ({len(books_meta)} books)")

    # 3. sections.json
    with open(out_dir / "sections.json", "w", encoding="utf-8") as fp:
        json.dump(sections_data, fp, ensure_ascii=False)
    print(f"  Saved sections.json ({len(sections_data)} sections)")

    # 4. verses.json
    with open(out_dir / "verses.json", "w", encoding="utf-8") as fp:
        json.dump(verses_data, fp, ensure_ascii=False)
    print(f"  Saved verses.json ({len(verses_data)} verses)")

    # 5. concordance.json
    with open(out_dir / "concordance.json", "w", encoding="utf-8") as fp:
        json.dump(concordance, fp, ensure_ascii=False)
    print(f"  Saved concordance.json ({len(concordance)} entries)")

    # ------------------------------------------------------------------
    # 7. Emit Client-Side Search Index: src/lib/lxx/lxxLexes6.json
    # ------------------------------------------------------------------
    print("\nGenerating client-side search index lxxLexes6.json...")
    sorted_lexemes = sorted(lemma_store.values(), key=lambda x: (x["plain"], x["lemma"]))
    client_search_index = {
        "greek": [x["lemma"] for x in sorted_lexemes],
        "plain": [x["plain"] for x in sorted_lexemes],
        "id": [x["id"] for x in sorted_lexemes]
    }
    client_search_path = repo_root / "src" / "lib" / "lxx" / "lxxLexes6.json"
    with open(client_search_path, "w", encoding="utf-8") as fp:
        json.dump(client_search_index, fp, ensure_ascii=False)
    print(f"  Saved {client_search_path} ({len(client_search_index['id'])} entries)")

    print(f"\nRebuild complete! Total corpus words: {total_words_corpus:,}, Total lexemes: {len(lemma_store):,}")

if __name__ == "__main__":
    main()
