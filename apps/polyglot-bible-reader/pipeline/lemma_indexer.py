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
from collections import defaultdict
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


def index_lemmas_and_concordance(conn: sqlite3.Connection):
    """Generates lemma_stats and concordance_refs from populated text_units."""
    cur = conn.cursor()
    start_time = time.time()
    print("\n=== Indexing Lemma Statistics & Concordance References ===")

    # 1. Load canonical books for titles and abbreviations
    cur.execute("SELECT code, order_index, name_english FROM canonical_books")
    books_meta: Dict[str, Tuple[int, str]] = {}
    for code, order_idx, name_en in cur.fetchall():
        books_meta[code] = (order_idx, name_en)
    print(f"Loaded {len(books_meta)} canonical book definitions.")

    # 2. Iterate through all text_units with tokens
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

            for lk in keys:
                stat_key = (corpus_id, lk)
                lemma_book_counts[stat_key][std_book] += 1
                if stat_key not in lemma_labels or not lemma_labels[stat_key]:
                    lemma_labels[stat_key] = display_lemma

                if lk not in verse_keys_seen:
                    verse_keys_seen.add(lk)
                    concordance_set.add((corpus_id, lk, display_lemma, citation, tu_id))

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
    print(f"Lemma indexing finished in {time.time() - start_time:.2f}s.")
