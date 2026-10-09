"""Stage 5: LSJ Dictionary Entry Resolution with BetaCode to Unicode Greek conversion & short gloss extraction."""

from __future__ import annotations

import json
import glob
import re
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path
import betacode.conv as betacode
from .config import Manifest, BUILD_DIR, REPO_ROOT


def strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text).lower().replace("ς", "σ")


def clean_gloss_text(raw_gloss: str) -> str:
    """Clean a raw gloss string to eliminate double commas, stray quotes, and whitespace."""
    if not raw_gloss:
        return ""
    cleaned = re.sub(r',\s*,+', ', ', raw_gloss)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip(" ,;:\"'")


def extract_tight_gloss(body_str: str, entries_db: dict[str, str] | None = None) -> str:
    """Extract a tight, 1-2 term translation gloss from an LSJ entry TEI XML snippet."""
    # 1. Clean XML body for translation gloss extraction
    # Strip citations (<cit>), quotes (<quote>), bibl (<bibl>)
    clean_body = re.sub(r"<(cit|quote|bibl)[^>]*>.*?</\1>", "", body_str, flags=re.DOTALL)
    
    # Strip <foreign>...</foreign> elements (Greek example phrases & idioms) along with immediately following <tr> phrase translations
    clean_body = re.sub(r"<foreign[^>]*>.*?</foreign>\s*(?:<tr[^>]*>.*?</tr>)?", "", clean_body, flags=re.DOTALL)
    
    # Strip proverb blocks
    clean_body = re.sub(r"\bprov\.[^;<.]*?(?:;|\.|$)", "", clean_body, flags=re.IGNORECASE)
    
    # Strip opposition phrases: e.g. "opp. <tr>...</tr>"
    clean_body = re.sub(
        r",?\s*(?:opp\.|opposite|contrary\s+to|v\.|cf\.)\s*<tr[^>]*>.*?</tr>(?:(?:\s+or\s+|\s+,\s*)<tr[^>]*>.*?</tr>)*",
        "",
        clean_body,
        flags=re.IGNORECASE
    )

    xml_str = '<entryFree>' + clean_body + '</entryFree>'
    xml_str = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;)', '&amp;', xml_str)

    try:
        root = ET.fromstring(xml_str)
    except Exception:
        return ""

    terms = []
    seen = set()

    for tr in root.findall('.//tr'):
        raw_text = (tr.text or "").strip()
        if not raw_text:
            continue
        
        # Split on internal commas or semicolons
        parts = re.split(r'[,;]+', raw_text)
        for part in parts:
            p = part.strip(" '\"`:,.-")
            if not p:
                continue
            
            p_lower = p.lower()
            
            # Exclusion rules:
            # 1. Skip meta terms, latin phrases, proverb terms, or opposition words
            if re.search(r'\b(opp|opposite|contrary|prov|cf|v|etc|e\.g|i\.e|in vino|veritas|idem|ibid)\b', p_lower):
                continue
            # 2. Skip single quoted latin phrases or quotes
            if p.startswith("'") or p.endswith("'") or "in vino" in p_lower or "veritas" in p_lower:
                continue
            # 3. Skip long explanations (> 30 chars or > 4 words)
            if len(p) > 30 or len(p.split()) > 4:
                continue
            # 4. Skip Greek/BetaCode characters
            if re.search(r'[\u0370-\u03ff\u1f00-\u1fff]', p):
                continue
            
            if p_lower not in seen:
                seen.add(p_lower)
                terms.append(p)

    if not terms:
        # Cross reference resolution if entry refers to another word (e.g., e)peidh/ -> v. e)pei/)
        if entries_db and body_str:
            m_ref = re.search(r'<ref[^>]*lang="greek"[^>]*>(.*?)</ref>', body_str)
            if m_ref:
                ref_key = m_ref.group(1).strip(" .;")
                ref_key_raw = re.sub(r'\d+$', '', ref_key).strip()
                if ref_key_raw in entries_db:
                    return extract_tight_gloss(entries_db[ref_key_raw], entries_db=None)
        return ""

    selected = terms[:2]
    return clean_gloss_text(', '.join(selected))


def parse_lsj_entry(key: str, body_str: str, entries_db: dict[str, str] | None = None) -> tuple[str, str, str]:
    """Parse LSJ entry TEI XML snippet, converting BetaCode Greek to Unicode, extracting POS and short glosses."""
    raw_key = re.sub(r"\d+$", "", key).strip()
    pos = ""
    if raw_key.endswith("w") or raw_key.endswith("mai") or raw_key.endswith("mi") or raw_key.endswith("w/") or raw_key.endswith("ma/i"):
        pos = "verb"
    else:
        m_pos = re.search(r"<pos[^>]*>(.*?)</pos>", body_str)
        if m_pos:
            p = m_pos.group(1).strip().lower()
            if "adv" in p: pos = "adverb"
            elif "prep" in p: pos = "preposition"
            elif "conj" in p: pos = "conjunction"
            elif "pron" in p: pos = "pronoun"
            elif "adj" in p: pos = "adjective"
            elif "subst" in p or "noun" in p: pos = "noun"
            elif "verb" in p or "v." in p: pos = "verb"

        if not pos:
            m_gen = re.search(r"<gen[^>]*>(.*?)</gen>", body_str)
            if m_gen:
                g = m_gen.group(1).strip()
                if g in ("o(", "h(", "to/", "o(/", "h(/"):
                    pos = "noun"

        if not pos:
            head_text = re.sub(r"<[^>]+>", " ", body_str[:400])
            head_text = re.sub(r"\s+", " ", head_text)
            if re.search(r"\b(Conj\.|copulative|disjunctive)\b", head_text, re.I):
                pos = "conjunction"
            elif re.search(r"\b(Prep\.|preposition)\b", head_text, re.I):
                pos = "preposition"
            elif re.search(r"\b(Pron\.|pronoun|relative pronoun|demonstrative pronoun)\b", head_text, re.I):
                pos = "pronoun"
            elif re.search(r"\b(Adv\.|adverb)\b", head_text, re.I):
                pos = "adverb"
            elif re.search(r"\b(Part\.|particle)\b", head_text, re.I):
                pos = "particle"
            elif re.search(r"\b(Adj\.|adjective)\b", head_text, re.I) or re.search(r"<\s*itype[^>]*>\s*(h/|o/n|a|on)\s*</itype>", body_str):
                pos = "adjective"

    short_gloss = extract_tight_gloss(body_str, entries_db=entries_db)

    # Re-parse full entry XML for complete definition & BetaCode conversion
    full_xml_str = '<entryFree>' + body_str + '</entryFree>'
    full_xml_str = re.sub(r'&(?!amp;|lt;|gt;|quot;|apos;)', '&amp;', full_xml_str)
    try:
        full_root = ET.fromstring(full_xml_str)
    except Exception:
        clean = re.sub(r'<[^>]+>', ' ', body_str)
        clean = re.sub(r'\s+', ' ', clean).strip()
        return clean[:3000], short_gloss, pos

    # Convert Greek BetaCode elements to Polytonic Unicode Greek
    def convert_greek_nodes(elem, in_greek=False):
        is_greek = in_greek or elem.attrib.get('lang') == 'greek' or elem.attrib.get('TEIform') in (
            'orth', 'foreign', 'quote', 'ref', 'itype', 'gen', 'pron'
        )
        if is_greek and elem.text:
            try:
                elem.text = betacode.beta_to_uni(elem.text)
            except Exception:
                pass
        for child in elem:
            convert_greek_nodes(child, in_greek=is_greek)
            if is_greek and child.tail:
                try:
                    child.tail = betacode.beta_to_uni(child.tail)
                except Exception:
                    pass

    convert_greek_nodes(full_root)

    # Flatten XML text
    def get_clean_text(elem):
        text = elem.text or ''
        for child in elem:
            text += get_clean_text(child)
            if child.tail:
                text += child.tail
        return text

    clean_def = get_clean_text(full_root)
    clean_def = re.sub(r'\s+', ' ', clean_def).strip()
    if len(clean_def) > 3500:
        clean_def = clean_def[:3500] + "..."

    return clean_def, short_gloss, pos


def normalize_lemma_accents(text: str) -> str:
    if not text:
        return ""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0300", "\u0301"))


def run_stage5(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage4_file = BUILD_DIR / "stage4" / work_id / "morph_map.json"
    if not stage4_file.exists():
        from .stage4_morphology import run_stage4
        run_stage4(manifest)

    with open(stage4_file, "r", encoding="utf-8") as f:
        morph_map = json.load(f)

    print(f"[Stage 5] Resolving LSJ glosses for {work_id}...")

    # Unique lemmata from stage 4
    lemmata_set = {v["lemma_norm"] for v in morph_map.values() if v.get("lemma_norm")}

    dict_map = {}
    lsj_files = sorted(glob.glob(str(REPO_ROOT / "raw_xml" / "lsj" / "grc.lsj.perseus-eng*.xml")))

    if lsj_files:
        entries_db = {}
        parsed_entries = []
        for xml_path in lsj_files:
            with open(xml_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            entries = re.findall(r'<entryFree[^>]*key=\"([^\"]+)\"[^>]*>(.*?)</entryFree>', content, re.DOTALL)
            for key, body in entries:
                raw_key = re.sub(r'\d+$', '', key).strip()
                if raw_key not in entries_db:
                    entries_db[raw_key] = body
                parsed_entries.append((key, raw_key, body))

        for key, raw_key, body in parsed_entries:
            try:
                greek_key = betacode.beta_to_uni(raw_key)
            except Exception:
                greek_key = raw_key
            greek_key = normalize_lemma_accents(greek_key)
            norm_key = strip_accents(greek_key)

            if norm_key in lemmata_set and norm_key not in dict_map:
                clean_def, short_gloss, pos = parse_lsj_entry(key, body, entries_db=entries_db)
                dict_map[norm_key] = {
                    "key": raw_key,
                    "lemma": greek_key,
                    "pos": pos,
                    "gloss": short_gloss,
                    "def": clean_def
                }

    out_dir = BUILD_DIR / "stage5" / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "lsj_map.json"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dict_map, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 5] {work_id}: {len(dict_map):,} LSJ dictionary entries resolved.")
    return dict_map

