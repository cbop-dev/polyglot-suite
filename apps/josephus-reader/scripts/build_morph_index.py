#!/usr/bin/env python3
import os
import json
import re
import urllib.request
import ast
import unicodedata

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "data")
CLTK_URL = "https://raw.githubusercontent.com/cltk/grc_models_cltk/master/lemmata/greek_lemmata_cltk.py"

def strip_accents(text):
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return unicodedata.normalize('NFC', text).lower().replace('ς', 'σ')

def load_cltk_lemmatizer():
    print("Fetching CLTK 949,453 Ancient Greek Lemmatizer dictionary...")
    cache_path = os.path.join(os.path.dirname(__file__), "..", "raw_xml", "greek_lemmata_cltk.py")
    
    if not os.path.exists(cache_path):
        req = urllib.request.Request(CLTK_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        print("  Using cached CLTK lemmatizer script...")
        with open(cache_path, "r", encoding="utf-8") as f:
            content = f.read()
            
    m = re.search(r'LEMMATA\s*=\s*(\{.*\})', content, re.DOTALL)
    if m:
        lemmata = ast.literal_eval(m.group(1))
        print(f"Loaded {len(lemmata):,} CLTK Ancient Greek lemmatizer entries.")
        return lemmata
    return {}

def derive_parse_tag(word):
    norm = strip_accents(word)
    if norm.endswith("ται"):
        return ("Pres Ind MP 3s", "Present indicative middle/passive 3rd singular")
    elif norm.endswith("νται"):
        return ("Pres Ind MP 3p", "Present indicative middle/passive 3rd plural")
    elif norm.endswith("οντο") or norm.endswith("ετο"):
        return ("Impf Ind MP 3s/p", "Imperfect indicative middle/passive 3rd person")
    elif norm.endswith("ουσιν") or norm.endswith("ουσι"):
        return ("Pres Ind Act 3p", "Present indicative active 3rd plural")
    elif norm.endswith("ει"):
        return ("Pres Ind Act 3s", "Present indicative active 3rd singular")
    elif norm.endswith("ους") or norm.endswith("ων"):
        return ("Gen Pl", "Genitive plural")
    elif norm.endswith("οις") or norm.endswith("αις") or norm.endswith("σιν"):
        return ("Dat Pl", "Dative plural")
    elif norm.endswith("ιν") or norm.endswith("ον") or norm.endswith("αν"):
        return ("Acc Sg", "Accusative singular")
    elif norm.endswith("ος"):
        return ("Nom Sg M", "Nominative singular masculine")
    elif norm.endswith("α") or norm.endswith("η"):
        return ("Nom Sg F", "Nominative singular feminine")
    return ("Form", "Greek word form")

def main():
    cltk_lemmatizer = load_cltk_lemmatizer()
    
    print("Building O(1) normalized lookup index for CLTK lemmatizer...")
    norm_cltk = {}
    for k, v in cltk_lemmatizer.items():
        nk = strip_accents(k)
        if nk not in norm_cltk:
            norm_cltk[nk] = v

    print("Building morphological mapping index for all Josephus Greek words...")
    morph_map = {}
    total_tokens = 0
    
    for filename in ["antiquities.json", "war.json", "life.json", "apion.json"]:
        filepath = os.path.join(OUT_DIR, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            for book in data.get("books", []):
                for sec in book.get("sections", []):
                    grc_text = sec.get("grc", "")
                    tokens = re.findall(r'[\w\u0370-\u03FF\u1F00-\u1FFF]+', grc_text)
                    total_tokens += len(tokens)
                    for word in tokens:
                        if word not in morph_map:
                            lemma = cltk_lemmatizer.get(word) or norm_cltk.get(strip_accents(word)) or word
                            parse_tag, parse_desc = derive_parse_tag(word)
                            morph_map[word] = {
                                "lemma": lemma,
                                "parse": parse_tag,
                                "desc": parse_desc
                            }
                            
    out_file = os.path.join(OUT_DIR, "morph_map.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(morph_map, f, ensure_ascii=False)
        
    print(f"Processed {total_tokens:,} tokens -> {len(morph_map):,} unique words saved to {out_file}.")

if __name__ == "__main__":
    main()
