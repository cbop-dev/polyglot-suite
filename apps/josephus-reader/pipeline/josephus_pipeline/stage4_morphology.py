"""Stage 4: Morphological Analysis and Lemma Mapping using CLTK / Stanza."""

from __future__ import annotations

import ast
import json
import re
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

from .config import BUILD_DIR, REPO_ROOT, Manifest
from .ud_mapper import map_ud_to_classical

CLTK_URL = "https://raw.githubusercontent.com/cltk/grc_models_cltk/master/lemmata/greek_lemmata_cltk.py"

_nlp_pipeline = None


def get_nlp():
    """Lazily initialize and cache the Stanza/CLTK Ancient Greek neural NLP pipeline."""
    global _nlp_pipeline
    if _nlp_pipeline is None:
        try:
            import stanza
            _nlp_pipeline = stanza.Pipeline(
                "grc",
                package="perseus",
                processors="tokenize,pos,lemma",
                download_method=None,
                verbose=False
            )
        except Exception as e:
            print(f"Warning: Could not initialize Stanza Perseus pipeline, trying default: {e}")
            try:
                import stanza
                _nlp_pipeline = stanza.Pipeline(
                    "grc",
                    package="proiel",
                    processors="tokenize,pos,lemma",
                    download_method=None,
                    verbose=False
                )
            except Exception as e2:
                print(f"Warning: Could not initialize Stanza NLP pipeline: {e2}")
                _nlp_pipeline = None
    return _nlp_pipeline


def strip_accents(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text).lower().replace("ς", "σ")


def normalize_lemma_accents(text: str) -> str:
    if not text:
        return ""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0300", "\u0301"))


def load_cltk_lemmatizer() -> dict:
    cache_path = REPO_ROOT / "sources" / "greek_lemmata_cltk.py"
    if not cache_path.exists():
        print("Fetching CLTK Ancient Greek Lemmatizer dictionary...")
        req = urllib.request.Request(CLTK_URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        with open(cache_path, "r", encoding="utf-8") as f:
            content = f.read()

    m = re.search(r"LEMMATA\s*=\s*(\{.*\})", content, re.DOTALL)
    if m:
        return ast.literal_eval(m.group(1))
    return {}


COMMON_LEMMA_OVERRIDES = {
    "και": "καί", "καὶ": "καί", "καί": "καί",
    "δε": "δέ", "δὲ": "δέ", "δέ": "δέ",
    "τε": "τέ", "τὲ": "τέ", "τέ": "τέ",
    "ει": "εἰ", "εἰ": "εἰ", "εἴ": "εἰ",
    "εν": "ἐν", "ἐν": "ἐν",
    "εισ": "εἰς", "εἰς": "εἰς", "εσ": "εἰς",
    "εκ": "ἐκ", "ἐκ": "ἐκ", "εξ": "ἐκ", "ἐξ": "ἐκ",
    "προσ": "πρός", "πρὸς": "πρός", "πρός": "πρός",
    "απο": "ἀπό", "ἀπὸ": "ἀπό", "ἀπό": "ἀπό",
    "υπο": "ὑπό", "ὑπὸ": "ὑπό", "ὑπό": "ὑπό",
    "δια": "διά", "διὰ": "διά", "διά": "διά",
    "μετα": "μετά", "μετὰ": "μετά", "μετά": "μετά",
    "κατα": "κατά", "κατὰ": "κατά", "κατά": "κατά",
    "επι": "ἐπί", "ἐπὶ": "ἐπί", "ἐπί": "ἐπί",
    "περι": "περί", "περὶ": "περί", "περί": "περί",
    "παρα": "παρά", "παρὰ": "παρά", "παρά": "παρά",
    "ο": "ὁ", "η": "ἡ", "το": "ὁ", "του": "ὁ", "τησ": "ὁ", "τω": "ὁ", "τη": "ὁ", "τον": "ὁ", "την": "ὁ",
    "οι": "ὁ", "αι": "ὁ", "τα": "ὁ", "των": "ὁ", "τοισ": "ὁ", "ταισ": "ὁ", "τουσ": "ὁ", "τασ": "ὁ"
}


def run_stage4(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage1_file = BUILD_DIR / "stage1" / work_id / f"{work_id}.json"
    stage3_file = BUILD_DIR / "stage3" / work_id / "tokens.json"

    if not stage1_file.exists():
        from .stage1_niese import run_stage1
        run_stage1(manifest)
    if not stage3_file.exists():
        from .stage3_tokenize import run_stage3
        run_stage3(manifest)

    with open(stage1_file, "r", encoding="utf-8") as f:
        work_data = json.load(f)
    with open(stage3_file, "r", encoding="utf-8") as f:
        token_data = json.load(f)

    tokens = token_data.get("tokens", [])
    print(f"[Stage 4] Performing neural morphological analysis with CLTK/Stanza for {work_id} ({len(tokens):,} unique words)...")

    nlp = get_nlp()
    cltk_dict = load_cltk_lemmatizer()
    norm_cltk = {strip_accents(k): v for k, v in cltk_dict.items()}

    # Readings counter: word -> Counter(reading_tuple)
    # reading_tuple: (lemma, pos, parse_tag, parse_desc)
    readings = defaultdict(Counter)

    if nlp is not None:
        books = work_data.get("books", [])
        total_sections = sum(len(b.get("sections", [])) for b in books)
        sec_count = 0

        for book in books:
            b_num = book.get("book", 1)
            sections = book.get("sections", [])
            for sec in sections:
                sec_count += 1
                if sec_count % 25 == 0 or sec_count == total_sections:
                    print(f"  [Stage 4] {work_id} Book {b_num}: Analyzed {sec_count}/{total_sections} sections...")

                grc_text = sec.get("grc", "").strip()
                if not grc_text:
                    continue

                try:
                    doc = nlp(grc_text)
                    for sent in doc.sentences:
                        for word in sent.words:
                            raw_w = word.text or ""
                            clean_w = re.sub(r'^[«»"\'\(\)\[\]\.\,·;:!\?]+|[«»"\'\(\)\[\]\.\,·;:!\?]+$', '', raw_w).strip()
                            if not clean_w:
                                continue

                            norm_w = strip_accents(clean_w)
                            lemma = word.lemma or clean_w
                            if clean_w in COMMON_LEMMA_OVERRIDES:
                                lemma = COMMON_LEMMA_OVERRIDES[clean_w]
                            elif norm_w in COMMON_LEMMA_OVERRIDES:
                                lemma = COMMON_LEMMA_OVERRIDES[norm_w]
                            elif clean_w in cltk_dict:
                                # Retain high quality dictionary citation form if available
                                lemma = cltk_dict[clean_w]
                            elif norm_w in norm_cltk and not lemma:
                                lemma = norm_cltk[norm_w]

                            lemma = normalize_lemma_accents(lemma)
                            xpos_val = getattr(word, 'xpos', None)
                            pos, parse_tag, parse_desc = map_ud_to_classical(word.upos, word.feats, xpos=xpos_val, word=clean_w)

                            reading = (lemma, pos, parse_tag, parse_desc)
                            readings[clean_w][reading] += 1
                            if norm_w and norm_w != clean_w:
                                readings[norm_w][reading] += 1
                except Exception as err:
                    print(f"  [Stage 4] Warning: NLP parse error in section {sec.get('niese', '')}: {err}")

    # Build final morph_map
    morph_map = {}
    for w, counter in readings.items():
        best_reading, _ = counter.most_common(1)[0]
        lemma, pos, parse_tag, parse_desc = best_reading
        entry = {
            "lemma": lemma,
            "lemma_norm": strip_accents(lemma),
            "pos": pos,
            "parse": parse_tag,
            "desc": parse_desc
        }
        morph_map[w] = entry

    # Fallback for any remaining unanalyzed tokens from stage 3
    fallback_count = 0
    for word in tokens:
        if word not in morph_map:
            norm = strip_accents(word)
            lemma = (
                COMMON_LEMMA_OVERRIDES.get(word)
                or COMMON_LEMMA_OVERRIDES.get(norm)
                or cltk_dict.get(word)
                or norm_cltk.get(norm)
                or word
            )
            lemma = normalize_lemma_accents(lemma)
            entry = {
                "lemma": lemma,
                "lemma_norm": strip_accents(lemma),
                "pos": "",
                "parse": "Form",
                "desc": "Greek word form"
            }
            morph_map[word] = entry
            if norm and norm not in morph_map:
                morph_map[norm] = entry
            fallback_count += 1

    if fallback_count > 0:
        print(f"  [Stage 4] {fallback_count} rare tokens resolved via dictionary fallbacks.")

    out_dir = BUILD_DIR / "stage4" / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "morph_map.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(morph_map, f, ensure_ascii=False, indent=2)

    print(f"  [Stage 4] {work_id}: {len(morph_map):,} morphological entries analyzed and saved.")
    return morph_map
