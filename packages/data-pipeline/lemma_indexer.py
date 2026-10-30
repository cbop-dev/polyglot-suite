"""Polyglot Bible Reader - High-Performance Lemma & Concordance Indexer.

Precomputes two high-cardinality analytical tables:
  1. lemma_stats:
     (corpus_id, lemma_key, display_lemma, total_count, book_counts_json)
     Stores overall lemma count and compact JSON book distributions:
     [["MAT", 15], ["MRK", 8], ...] for O(1) frequency charts.
  2. concordance_refs:
     (corpus_id, lemma_key, display_lemma, ref_label, work_unit_id)
     Maps every lemma occurrence to its verse reference and text_unit ID.
  3. corpus_book_stats:
     (corpus_id, book_code, total_words, total_verses)
     Stores total word counts and verse counts per book per corpus for relative frequencies.
"""

from __future__ import annotations
import json
import re
import sqlite3
import time
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple

# Mapping of corpus_id to legacy work_id for backward compatibility
CORPUS_WORK_IDS = {
    "vulgate": 1,
    "wlc": 2,
    "bhs": 2,
    "swete_lxx": 24,
    "lxx": 24,
    "ognt": 40,
    "sblgnt": 40,
    "kjv": 5,
    "webbe": 6,
    "brenton-lxx": 7,
    "peshitta": 8,
}

SYRIAC_PUNCT_DIACRITICS = re.compile(r'[\u0730-\u074F\u0300-\u036F\.\,\;\:\?\!\(\)\[\]]')

# Greek Morphology Maps
GREEK_POS = {
    'V': 'Verb', 'N': 'Noun', 'A': 'Adjective', 'RA': 'Article',
    'RD': 'Demonstrative Pronoun', 'RI': 'Interrogative/Indefinite Pronoun',
    'RP': 'Personal Pronoun', 'RR': 'Relative Pronoun', 'C': 'Conjunction',
    'P': 'Preposition', 'D': 'Adverb', 'X': 'Particle', 'I': 'Interjection',
    'PREP': 'Preposition', 'CONJ': 'Conjunction', 'ADV': 'Adverb',
    'PRON': 'Pronoun', 'NUM': 'Numeral', 'INTERJ': 'Interjection', 'PART': 'Particle'
}
GREEK_TENSE = {'P': 'Present', 'I': 'Imperfect', 'F': 'Future', 'A': 'Aorist', 'X': 'Perfect', 'Y': 'Pluperfect'}
GREEK_VOICE = {'A': 'Active', 'M': 'Middle', 'P': 'Passive', 'E': 'Middle/Passive'}
GREEK_MOOD = {'I': 'Indicative', 'S': 'Subjunctive', 'O': 'Optative', 'D': 'Imperative', 'N': 'Infinitive', 'P': 'Participle'}
GREEK_CASE = {'N': 'Nominative', 'G': 'Genitive', 'D': 'Dative', 'A': 'Accusative', 'V': 'Vocative'}
GREEK_NUMBER = {'S': 'Singular', 'P': 'Plural'}
GREEK_GENDER = {'M': 'Masculine', 'F': 'Feminine', 'N': 'Neuter'}
GREEK_PERSON = {'1': '1st', '2': '2nd', '3': '3rd'}

# Load hebrew_morph_dict if available
HEBREW_DICT: Dict[str, str] = {}
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
hebrew_dict_file = REPO_ROOT / "packages" / "ancient-languages" / "src" / "data" / "hebrew_morph_dict.json"
if hebrew_dict_file.exists():
    try:
        with open(hebrew_dict_file, "r", encoding="utf-8") as f:
            HEBREW_DICT = json.load(f)
    except Exception:
        pass


def clean_surface_word(surface: str) -> str:
    if not surface:
        return ""
    apparatus_symbols = {"†", "‡", "*", "⸈", "⸉", "⸊", "⸋", "⸂", "⸃", "⸆", "⸇", "⸀", "⸁", "⸄", "⸅"}
    return "".join(
        c for c in surface
        if not unicodedata.category(c).startswith("P")
        and not unicodedata.category(c).startswith("Z")
        and c not in apparatus_symbols
    ).strip()


def get_canonical_greek_form(raw_word: str) -> str:
    if not raw_word:
        return ""
    w = clean_surface_word(raw_word).lower()
    if not w:
        return ""
    w = unicodedata.normalize('NFD', w).replace('\u0300', '\u0301')
    accents = [i for i, c in enumerate(w) if c == '\u0301']
    if len(accents) > 1:
        last_idx = accents[-1]
        w = w[:last_idx] + w[last_idx + 1:]
    w = unicodedata.normalize('NFC', w)
    w = clean_surface_word(w)

    if w.endswith('ν'):
        stem = w[:-1]
        norm_stem = re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', stem))
        if re.search(r'[ε|σι|τι|ει]$', norm_stem):
            return f'{stem}(ν)'
    else:
        norm_w = re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', w))
        if re.search(r'[ε|σι|τι|ει]$', norm_w):
            return f'{w}(ν)'
    return w


def get_canonical_hebrew_form(raw_word: str) -> str:
    if not raw_word:
        return ""
    w = clean_surface_word(raw_word)
    # Strip cantillation / ta'amim: \u0591 to \u05AF
    return re.sub(r'[\u0591-\u05AF]', '', w)


def parse_greek_morph(code: str) -> Dict[str, Any]:
    trimmed = (code or '').strip()
    analysis: Dict[str, Any] = {'rawCode': trimmed}
    if not trimmed:
        return analysis

    if len(trimmed) == 11 and trimmed[2] == ' ':
        pos_code = trimmed[:2].replace('-', '').strip()
        analysis['pos'] = GREEK_POS.get(pos_code, 'Article' if pos_code == 'RA' else pos_code)
        p, t, v, m, c, n, g = trimmed[3], trimmed[4], trimmed[5], trimmed[6], trimmed[7], trimmed[8], trimmed[9]
        if p in GREEK_PERSON: analysis['person'] = GREEK_PERSON[p]
        if t in GREEK_TENSE: analysis['tense'] = GREEK_TENSE[t]
        if v in GREEK_VOICE: analysis['voice'] = GREEK_VOICE[v]
        if m in GREEK_MOOD: analysis['mood'] = GREEK_MOOD[m]
        if c in GREEK_CASE: analysis['case'] = GREEK_CASE[c]
        if n in GREEK_NUMBER: analysis['number'] = GREEK_NUMBER[n]
        if g in GREEK_GENDER: analysis['gender'] = GREEK_GENDER[g]
    elif '-' in trimmed:
        parts = trimmed.split('-')
        pos_code = parts[0]
        analysis['pos'] = 'Article' if pos_code == 'D' else GREEK_POS.get(pos_code, pos_code)
        if pos_code == 'V':
            tvm = parts[1] if len(parts) > 1 else ''
            if len(tvm) > 0 and tvm[0] in GREEK_TENSE: analysis['tense'] = GREEK_TENSE[tvm[0]]
            if len(tvm) > 1 and tvm[1] in GREEK_VOICE: analysis['voice'] = GREEK_VOICE[tvm[1]]
            if len(tvm) > 2 and tvm[2] in GREEK_MOOD: analysis['mood'] = GREEK_MOOD[tvm[2]]
            pn = parts[2] if len(parts) > 2 else ''
            if len(pn) == 2 and pn[0] in GREEK_PERSON:
                analysis['person'] = GREEK_PERSON[pn[0]]
                if pn[1] in GREEK_NUMBER: analysis['number'] = GREEK_NUMBER[pn[1]]
            elif len(pn) == 3 and pn[0] in GREEK_CASE:
                analysis['case'] = GREEK_CASE[pn[0]]
                if pn[1] in GREEK_NUMBER: analysis['number'] = GREEK_NUMBER[pn[1]]
                if pn[2] in GREEK_GENDER: analysis['gender'] = GREEK_GENDER[pn[2]]
        else:
            cng = parts[1] if len(parts) > 1 else ''
            if len(cng) == 3:
                if cng[0] in GREEK_CASE: analysis['case'] = GREEK_CASE[cng[0]]
                if cng[1] in GREEK_NUMBER: analysis['number'] = GREEK_NUMBER[cng[1]]
                if cng[2] in GREEK_GENDER: analysis['gender'] = GREEK_GENDER[cng[2]]

    summary_parts = [
        analysis.get('pos'),
        analysis.get('tense'),
        analysis.get('voice'),
        analysis.get('mood'),
        f"{analysis['person']} {analysis.get('number', '')}".strip() if 'person' in analysis else analysis.get('number'),
        analysis.get('case'),
        analysis.get('gender')
    ]
    analysis['summary'] = ' • '.join([p for p in summary_parts if p])
    return analysis


def parse_hebrew_morph(code: str) -> Dict[str, Any]:
    trimmed = (code or '').strip()
    analysis: Dict[str, Any] = {'rawCode': trimmed}
    if not trimmed:
        return analysis

    stem_code = trimmed
    if '|' in trimmed:
        parts = [p.strip() for p in trimmed.split('|')]
        stem_code = parts[-1] or trimmed

    if '.' in stem_code:
        parts = stem_code.split('.')
        for p in parts:
            if p == 'verb': analysis['pos'] = 'Verb'
            elif p in ('subs', 'nmpr'): analysis['pos'] = 'Noun'
            elif p == 'adjv': analysis['pos'] = 'Adjective'
            elif p == 'art': analysis['pos'] = 'Article'
            elif p in ('prps', 'prde', 'prin'): analysis['pos'] = 'Pronoun'
            elif p == 'prep': analysis['pos'] = 'Preposition'
            elif p == 'conj': analysis['pos'] = 'Conjunction'
            elif p == 'p1': analysis['person'] = '1st'
            elif p == 'p2': analysis['person'] = '2nd'
            elif p == 'p3': analysis['person'] = '3rd'
            elif p == 'm': analysis['gender'] = 'Masculine'
            elif p == 'f': analysis['gender'] = 'Feminine'
            elif p == 'sg': analysis['number'] = 'Singular'
            elif p == 'pl': analysis['number'] = 'Plural'
            elif p == 'du': analysis['number'] = 'Dual'
            elif p == 'perf': analysis['tense'] = 'Perfect'
            elif p in ('impf', 'wayq'): analysis['tense'] = 'Imperfect'
            elif p == 'ptca':
                analysis['mood'] = 'Participle'
                analysis['voice'] = 'Active'
            elif p == 'ptcp':
                analysis['mood'] = 'Participle'
                analysis['voice'] = 'Passive'
            elif p in ('infc', 'infa'): analysis['mood'] = 'Infinitive'
            elif p == 'impv': analysis['mood'] = 'Imperative'
            elif p in ('qal', 'piel', 'hif'): analysis['voice'] = 'Active'
            elif p in ('nif', 'pual', 'hof'): analysis['voice'] = 'Passive'
            elif p == 'hit': analysis['voice'] = 'Middle'

        if trimmed in HEBREW_DICT:
            badges = [b.strip().title() for b in HEBREW_DICT[trimmed].split(',')]
            analysis['summary'] = ' • '.join(badges)
        else:
            summary_parts = [analysis.get('pos'), analysis.get('tense'), analysis.get('voice'), analysis.get('mood'), analysis.get('person'), analysis.get('gender'), analysis.get('number')]
            analysis['summary'] = ' • '.join([p for p in summary_parts if p])
        return analysis

    if stem_code.startswith('V-'):
        analysis['pos'] = 'Verb'
        rest = stem_code[2:]
        if len(rest) >= 2:
            aspect = rest[1]
            if aspect == 'p': analysis['tense'] = 'Perfect'
            elif aspect in ('i', 'w'): analysis['tense'] = 'Imperfect'
            elif aspect == 'v': analysis['mood'] = 'Imperative'
            elif aspect in ('c', 'a'): analysis['mood'] = 'Infinitive'
            elif aspect == 'r':
                analysis['mood'] = 'Participle'
                analysis['voice'] = 'Active'
            elif aspect == 's':
                analysis['mood'] = 'Participle'
                analysis['voice'] = 'Passive'

            if len(rest) > 2:
                if rest[2] == '1': analysis['person'] = '1st'
                elif rest[2] == '2': analysis['person'] = '2nd'
                elif rest[2] == '3': analysis['person'] = '3rd'
            if len(rest) > 3:
                if rest[3] == 'm': analysis['gender'] = 'Masculine'
                elif rest[3] == 'f': analysis['gender'] = 'Feminine'
            if len(rest) > 4:
                if rest[4] == 's': analysis['number'] = 'Singular'
                elif rest[4] == 'p': analysis['number'] = 'Plural'
                elif rest[4] == 'd': analysis['number'] = 'Dual'
    elif stem_code.startswith('N-') or stem_code.startswith('A-'):
        analysis['pos'] = 'Noun' if stem_code.startswith('N-') else 'Adjective'
        rest = stem_code[2:]
        for c in rest:
            if c == 'm': analysis['gender'] = 'Masculine'
            elif c == 'f': analysis['gender'] = 'Feminine'
            elif c == 's': analysis['number'] = 'Singular'
            elif c == 'p': analysis['number'] = 'Plural'
            elif c == 'd': analysis['number'] = 'Dual'

    summary_parts = [analysis.get('pos'), analysis.get('tense'), analysis.get('voice'), analysis.get('mood'), analysis.get('person'), analysis.get('gender'), analysis.get('number')]
    analysis['summary'] = ' • '.join([p for p in summary_parts if p])
    return analysis


def clean_syriac(s: str) -> str:
    """Removes vocalization points, reading dots, and punctuation from Syriac text."""
    if not s:
        return ""
    return SYRIAC_PUNCT_DIACRITICS.sub("", s).strip()


def normalize_strongs(s: str) -> str:
    if not s:
        return ""
    s = s.strip()
    m = re.match(r"^([A-Za-z]+)0*(\d+.*)$", s)
    if m:
        return m.group(1).upper() + m.group(2)
    if s.isdigit():
        return f"H{s}"
    return s.upper()


def resolve_token_keys(corpus_id: str, tok: Any) -> Tuple[List[str], str]:
    """Resolves a token into one or more canonical lookup keys and a display lemma."""
    if isinstance(tok, list):
        # Tuple format: [word, norm, strongs, morph, lemma, gloss, trailer, flags]
        word = tok[0] if len(tok) > 0 else ""
        norm = tok[1] if len(tok) > 1 else ""
        raw_strongs = tok[2] if len(tok) > 2 else ""
        morph = tok[3] if len(tok) > 3 else ""
        lemma = tok[4] if len(tok) > 4 and tok[4] else (norm or word)
        gloss = tok[5] if len(tok) > 5 else ""
    else:
        word = tok.get("word") or ""
        norm = tok.get("normalized") or ""
        raw_strongs = tok.get("strongs") or ""
        lemma = tok.get("lemma") or norm or word or ""

    keys: List[str] = []
    display_lemma = lemma or norm or word

    # 1. Syriac Peshitta
    if corpus_id == "peshitta":
        cleaned_lemma = clean_syriac(lemma or norm or word)
        if cleaned_lemma:
            keys.append(cleaned_lemma)
            display_lemma = cleaned_lemma
        return keys, display_lemma

    # 2. Strong's based corpora (WLC Hebrew, OGNT Greek, KJV)
    if raw_strongs:
        for s in str(raw_strongs).split(","):
            ns = normalize_strongs(s)
            if ns:
                keys.append(ns)

    # 3. Fallback to normalized lemma / word
    if not keys:
        target = norm or lemma or word
        if target:
            keys.append(target.strip())
            display_lemma = target.strip()

    return keys, display_lemma


def index_lemmas_and_concordance(conn: sqlite3.Connection, corpus_filter: Optional[str] = None):
    """Generates lemma_stats, concordance_refs, and lemma_forms from populated text_units."""
    cur = conn.cursor()
    start_time = time.time()
    filter_msg = f" for '{corpus_filter}'" if corpus_filter else ""
    print(f"\n=== Indexing Lemma Statistics, Concordance References & Attested Forms{filter_msg} ===")

    # 1. Load canonical books for titles and abbreviations
    cur.execute("SELECT code, order_index, name_english FROM canonical_books")
    books_meta: Dict[str, Tuple[int, str]] = {}
    for code, order_idx, name_en in cur.fetchall():
        books_meta[code] = (order_idx, name_en)
    print(f"Loaded {len(books_meta)} canonical book definitions.")

    # 2. Iterate through all text_units with tokens
    if corpus_filter:
        cur.execute(
            """
            SELECT id, corpus_id, std_book, native_citation, tokens_json
            FROM text_units
            WHERE tokens_json IS NOT NULL AND corpus_id = ?
            ORDER BY id
            """,
            (corpus_filter,)
        )
    else:
        cur.execute(
            """
            SELECT id, corpus_id, std_book, native_citation, tokens_json
            FROM text_units
            WHERE tokens_json IS NOT NULL
            ORDER BY id
            """
        )

    # Book and corpus word & verse aggregations
    corpus_word_counts: Dict[str, int] = defaultdict(int)
    book_word_counts: Dict[Tuple[str, str], int] = defaultdict(int)
    book_verse_counts: Dict[Tuple[str, str], int] = defaultdict(int)

    # In-memory aggregations:
    # key: (corpus_id, lemma_key) -> dict of book_code -> count
    lemma_book_counts: Dict[Tuple[str, str], Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    # best display lemma for this key: (corpus_id, lemma_key) -> display_lemma
    lemma_labels: Dict[Tuple[str, str], str] = {}
    # concordance set: (corpus_id, lemma_key, display_lemma, native_citation, text_unit_id)
    concordance_set: Set[Tuple[str, str, str, str, int]] = set()

    # Lemma forms aggregation: (corpus_id, lemma_key) -> { total, forms }
    lemma_forms_data: Dict[Tuple[str, str], Dict[str, Any]] = defaultdict(
        lambda: {"total": 0, "forms": defaultdict(lambda: {"count": 0, "raw": set(), "analyses": {}, "work_units": set()})}
    )

    verse_count = 0
    token_count = 0

    print("Aggregating tokens from text_units...")
    for tu_id, corpus_id, std_book, citation, tokens_json in cur:
        verse_count += 1

        try:
            tokens = json.loads(tokens_json)
        except Exception:
            continue

        n_tok = len(tokens)
        token_count += n_tok
        corpus_word_counts[corpus_id] += n_tok
        book_word_counts[(corpus_id, std_book)] += n_tok
        book_verse_counts[(corpus_id, std_book)] += 1

        # Track keys already encountered in this verse to avoid duplicate count in concordance
        verse_keys_seen: Set[str] = set()

        for tok in tokens:
            keys, display_lemma = resolve_token_keys(corpus_id, tok)

            # Extract token details
            if isinstance(tok, list):
                surface = tok[0] if len(tok) > 0 else ""
                norm = tok[1] if len(tok) > 1 else ""
                raw_strongs = tok[2] if len(tok) > 2 else ""
                morph = tok[3] if len(tok) > 3 else ""
            else:
                surface = tok.get("word") or ""
                norm = tok.get("normalized") or ""
                raw_strongs = tok.get("strongs") or ""
                morph = tok.get("morph") or ""

            surface_clean = clean_surface_word(surface)

            # Determine canonical form and parse morphology
            is_greek = corpus_id in ("ognt", "sblgnt", "swete_lxx", "lxx") or (raw_strongs and str(raw_strongs).startswith("G"))
            is_hebrew = corpus_id in ("wlc", "bhs") or (raw_strongs and str(raw_strongs).startswith("H"))

            if is_greek:
                canonical_form = get_canonical_greek_form(surface_clean)
                morph_analysis = parse_greek_morph(morph) if morph else {}
            elif is_hebrew:
                canonical_form = get_canonical_hebrew_form(surface_clean)
                morph_analysis = parse_hebrew_morph(morph) if morph else {}
            else:
                canonical_form = surface_clean
                morph_analysis = {"rawCode": morph, "summary": morph} if morph else {}

            for lk in keys:
                stat_key = (corpus_id, lk)
                lemma_book_counts[stat_key][std_book] += 1
                if stat_key not in lemma_labels or not lemma_labels[stat_key]:
                    lemma_labels[stat_key] = display_lemma

                if lk not in verse_keys_seen:
                    verse_keys_seen.add(lk)
                    concordance_set.add((corpus_id, lk, display_lemma, citation, tu_id))

                if surface_clean:
                    lf_entry = lemma_forms_data[stat_key]
                    lf_entry["total"] += 1
                    form_entry = lf_entry["forms"][canonical_form]
                    form_entry["count"] += 1
                    form_entry["raw"].add(surface_clean)
                    form_entry["work_units"].add(tu_id)
                    if morph_analysis:
                        m_key = morph_analysis.get("rawCode") or morph_analysis.get("summary") or json.dumps(morph_analysis)
                        form_entry["analyses"][m_key] = morph_analysis

    print(
        f"Processed {verse_count:,} verses ({token_count:,} tokens) in {time.time() - start_time:.2f}s."
    )
    print(
        f"Identified {len(lemma_book_counts):,} unique lemmas and {len(concordance_set):,} verse occurrences."
    )

    # 3. Create and populate corpus_book_stats table
    print("Populating corpus_book_stats table...")
    t_cbs = time.time()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS corpus_book_stats (
            corpus_id TEXT NOT NULL,
            book_code TEXT NOT NULL,
            total_words INTEGER NOT NULL,
            total_verses INTEGER NOT NULL,
            PRIMARY KEY (corpus_id, book_code)
        )
    """)
    if corpus_filter:
        cur.execute("DELETE FROM corpus_book_stats WHERE corpus_id = ?", (corpus_filter,))
    else:
        cur.execute("DELETE FROM corpus_book_stats")
    cbs_rows = [
        (c_id, b_code, w_cnt, book_verse_counts.get((c_id, b_code), 0))
        for (c_id, b_code), w_cnt in book_word_counts.items()
    ]
    cur.executemany(
        "INSERT INTO corpus_book_stats (corpus_id, book_code, total_words, total_verses) VALUES (?, ?, ?, ?)",
        cbs_rows
    )
    conn.commit()
    print(f"Inserted {len(cbs_rows):,} rows into corpus_book_stats in {time.time() - t_cbs:.2f}s.")

    # 4. Populate lemma_stats table
    print("Populating lemma_stats table...")
    t_stats = time.time()
    if corpus_filter:
        cur.execute("DELETE FROM lemma_stats WHERE corpus_id = ?", (corpus_filter,))
    else:
        cur.execute("DELETE FROM lemma_stats")

    lemma_rows = []
    for (corpus_id, lk), book_counts in lemma_book_counts.items():
        best_lemma = lemma_labels.get((corpus_id, lk), lk)

        # Build compact list of [book_code, count] sorted by count descending, then canonical order
        sorted_books = sorted(
            book_counts.items(),
            key=lambda x: (-x[1], books_meta.get(x[0], (999, ""))[0])
        )
        book_list = [[b_code, count] for b_code, count in sorted_books]
        total_count = sum(count for _, count in sorted_books)

        lemma_rows.append((
            corpus_id,
            lk,
            best_lemma,
            total_count,
            json.dumps(book_list, separators=(",", ":")),
        ))

    cur.executemany(
        """
        INSERT INTO lemma_stats
        (corpus_id, lemma_key, display_lemma, total_count, book_counts_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        lemma_rows,
    )
    conn.commit()
    print(f"Inserted {len(lemma_rows):,} rows into lemma_stats in {time.time() - t_stats:.2f}s.")

    # 5. Populate concordance_refs table
    print("Populating concordance_refs table...")
    t_conc = time.time()
    if corpus_filter:
        cur.execute("DELETE FROM concordance_refs WHERE corpus_id = ?", (corpus_filter,))
    else:
        cur.execute("DELETE FROM concordance_refs")

    batch_size = 50000
    batch = []
    inserted_conc = 0

    for record in concordance_set:
        batch.append(record)
        if len(batch) >= batch_size:
            cur.executemany(
                """
                INSERT OR IGNORE INTO concordance_refs
                (corpus_id, lemma_key, display_lemma, ref_label, work_unit_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                batch,
            )
            inserted_conc += len(batch)
            conn.commit()
            batch.clear()

    if batch:
        cur.executemany(
            """
            INSERT OR IGNORE INTO concordance_refs
            (corpus_id, lemma_key, display_lemma, ref_label, work_unit_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            batch,
        )
        inserted_conc += len(batch)
        conn.commit()

    print(f"Inserted {inserted_conc:,} rows into concordance_refs in {time.time() - t_conc:.2f}s.")

    # 6. Populate lemma_forms table
    print("Populating lemma_forms table...")
    t_forms = time.time()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lemma_forms (
            corpus_id TEXT NOT NULL,
            lemma_key TEXT NOT NULL,
            display_lemma TEXT NOT NULL,
            total_occurrences INTEGER NOT NULL,
            forms_json TEXT NOT NULL,
            PRIMARY KEY (corpus_id, lemma_key)
        )
    """)
    if corpus_filter:
        cur.execute("DELETE FROM lemma_forms WHERE corpus_id = ?", (corpus_filter,))
    else:
        cur.execute("DELETE FROM lemma_forms")

    lf_rows = []
    alias_candidates: List[Tuple[str, str, str, int, str]] = []

    for (corpus_id, lk), lf_data in lemma_forms_data.items():
        best_lemma = lemma_labels.get((corpus_id, lk), lk)
        total_occ = lf_data["total"]

        forms_list = []
        for cf, f_info in sorted(lf_data["forms"].items(), key=lambda x: (-x[1]["count"], x[0])):
            forms_list.append({
                "form": cf,
                "canonicalForm": cf,
                "rawForms": sorted(list(f_info["raw"])),
                "count": f_info["count"],
                "analyses": list(f_info["analyses"].values()),
                "work_unit_ids": sorted(list(f_info["work_units"]))
            })

        forms_json = json.dumps({
            "forms": forms_list
        }, separators=(",", ":"), ensure_ascii=False)

        lf_rows.append((
            corpus_id,
            lk,
            best_lemma,
            total_occ,
            forms_json
        ))

        # Aliases for direct lookup by display lemma or unpointed lemma
        if best_lemma and best_lemma != lk:
            alias_candidates.append((corpus_id, best_lemma, best_lemma, total_occ, forms_json))
            unpointed_lem = re.sub(r'[\u0591-\u05C7]', '', best_lemma).strip()
            if unpointed_lem and unpointed_lem != best_lemma and unpointed_lem != lk:
                alias_candidates.append((corpus_id, unpointed_lem, best_lemma, total_occ, forms_json))

    insert_batch_size = 5000
    for i in range(0, len(lf_rows), insert_batch_size):
        cur.executemany(
            """
            INSERT OR REPLACE INTO lemma_forms
            (corpus_id, lemma_key, display_lemma, total_occurrences, forms_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            lf_rows[i:i + insert_batch_size]
        )
    conn.commit()

    if alias_candidates:
        for i in range(0, len(alias_candidates), insert_batch_size):
            cur.executemany(
                """
                INSERT OR IGNORE INTO lemma_forms
                (corpus_id, lemma_key, display_lemma, total_occurrences, forms_json)
                VALUES (?, ?, ?, ?, ?)
                """,
                alias_candidates[i:i + insert_batch_size]
            )
        conn.commit()

    # Ensure index exists
    cur.execute("CREATE INDEX IF NOT EXISTS idx_lemma_forms_lookup ON lemma_forms(corpus_id, lemma_key)")
    conn.commit()

    print(f"Inserted {len(lf_rows):,} primary rows and {len(alias_candidates):,} alias rows into lemma_forms in {time.time() - t_forms:.2f}s.")
    print(f"Lemma indexing finished in {time.time() - start_time:.2f}s.")

