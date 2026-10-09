#!/usr/bin/env python3
import os
import json
import re
import glob
import unicodedata

RAW_LSJ_DIR = os.path.join(os.path.dirname(__file__), "..", "raw_xml", "lsj")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "data")
os.makedirs(OUT_DIR, exist_ok=True)

BETA_MAP = {
    'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'e': 'ε', 'z': 'ζ', 'h': 'η', 'q': 'θ',
    'i': 'ι', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν', 'c': 'ξ', 'o': 'ο', 'p': 'π',
    'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'f': 'φ', 'x': 'χ', 'y': 'ψ', 'w': 'ω',
    'v': 'ϝ'
}

def betacode_to_greek(text):
    text = text.lower()
    res = []
    for c in text:
        if c in BETA_MAP:
            res.append(BETA_MAP[c])
    return ''.join(res)

def betacode_word_to_greek(word):
    res = []
    for c in word.lower():
        if c in BETA_MAP:
            res.append(BETA_MAP[c])
        elif c not in '()/=\\|*+1234567890^':
            res.append(c)
    return ''.join(res)

def strip_accents(text):
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return unicodedata.normalize('NFC', text).lower().replace('ς', 'σ')

def format_lsj_body(body):
    clean = re.sub(r'<[^>]+>', ' ', body)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    tokens = clean.split()
    formatted = []
    for t in tokens:
        if re.search(r'[/=\\|]', t) or t in ['h(', 'o(', 'to/']:
            formatted.append(betacode_word_to_greek(t))
        else:
            formatted.append(t)
    return ' '.join(formatted)

def main():
    print("Parsing 27 LSJ XML files to build full Ancient Greek dictionary...")
    
    dict_map = {}
    total_entries = 0
    
    xml_files = sorted(glob.glob(os.path.join(RAW_LSJ_DIR, "grc.lsj.perseus-eng*.xml")))
    
    for xml_path in xml_files:
        with open(xml_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
        entries = re.findall(r'<entryFree[^>]*key=\"([^\"]+)\"[^>]*>(.*?)</entryFree>', content, re.DOTALL)
        for key, body in entries:
            total_entries += 1
            
            raw_key = re.sub(r'\d+$', '', key).strip()
            greek_key = betacode_to_greek(raw_key)
            norm_key = strip_accents(greek_key)
            
            clean_def = format_lsj_body(body)
            short_def = clean_def[:500] + ("..." if len(clean_def) > 500 else "")
            
            entry_obj = {
                "key": raw_key,
                "greek_key": greek_key,
                "def": short_def
            }
            
            if greek_key and greek_key not in dict_map:
                dict_map[greek_key] = entry_obj
            if norm_key and norm_key not in dict_map:
                dict_map[norm_key] = entry_obj

    print(f"Parsed {total_entries:,} total entries -> {len(dict_map):,} unique Greek lemma keys.")
    
    out_file = os.path.join(OUT_DIR, "dictionary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dict_map, f, ensure_ascii=False)
        
    file_size_mb = os.path.getsize(out_file) / (1024 * 1024)
    print(f"Saved {out_file} ({file_size_mb:.2f} MB).")

if __name__ == "__main__":
    main()
