#!/usr/bin/env python3
"""
Targeted Rebuilder for WLC (Hebrew OT) and BDB (Hebrew Lexicon).

Rebuilds:
  1. text_units for 'wlc' (with clean Strong's alignments from hebrew_errata.json)
  2. lexicon_entries for 'bdb' (with Pe-with-dagesh font decoding restored)
  3. Analytical tables via lemma_indexer:
     - corpus_book_stats
     - lemma_stats
     - concordance_refs
"""

import sqlite3
import time
from pathlib import Path

from .config import BUILD_DIR
from .adapters.wlc import WLCAdapter
from .adapters.bdb import BDBAdapter
from .lemma_indexer import index_lemmas_and_concordance


def rebuild_hebrew():
    db_path = BUILD_DIR / "polyglot-working.sqlite3"
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")

    print("==================================================")
    print("Rebuilding WLC & BDB in Polyglot SQLite Database")
    print(f"Target: {db_path}")
    print("==================================================")

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode = MEMORY")
    conn.execute("PRAGMA synchronous = OFF")
    cur = conn.cursor()

    t_start = time.time()

    # 1. Rebuild BDB in lexicon_entries
    print("\n--- 1. Rebuilding BDB Lexicon Entries ---")
    cur.execute("DELETE FROM lexicon_entries WHERE dictionary = 'bdb'")
    print(f"Deleted old BDB rows: {cur.rowcount}")

    bdb_adapter = BDBAdapter()
    lex_rows = []
    for entry in bdb_adapter.iter_entries():
        lex_rows.append((
            entry["strongs_id"],
            entry["dictionary"],
            entry["headword"],
            entry.get("consonant_key", ""),
            entry.get("transliteration", ""),
            entry.get("gloss", ""),
            entry["definition"],
        ))

    cur.executemany(
        """
        INSERT INTO lexicon_entries
        (strongs_id, dictionary, lemma, consonant_key, transliteration, gloss, definition)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        lex_rows
    )
    conn.commit()
    print(f"Inserted {len(lex_rows):,} restored BDB records.")

    # 2. Rebuild WLC in text_units
    print("\n--- 2. Rebuilding WLC Text Units ---")
    cur.execute("DELETE FROM text_units WHERE corpus_id = 'wlc'")
    print(f"Deleted old WLC text_units: {cur.rowcount}")

    wlc_adapter = WLCAdapter()
    batch = []
    batch_size = 5000
    wlc_count = 0

    for vu in wlc_adapter.iter_verses():
        batch.append((
            vu.corpus_id,
            vu.std_book,
            vu.std_chapter,
            vu.std_verse,
            vu.std_subverse,
            vu.native_book,
            vu.native_chapter,
            vu.native_verse,
            vu.native_subverse,
            vu.native_citation,
            vu.text,
            vu.tokens_to_json(),
        ))
        wlc_count += 1

        if len(batch) >= batch_size:
            cur.executemany(
                """
                INSERT INTO text_units
                (corpus_id, std_book, std_chapter, std_verse, std_subverse,
                 native_book, native_chapter, native_verse, native_subverse,
                 native_citation, text_content, tokens_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                batch,
            )
            conn.commit()
            batch.clear()
            print(f"  ... inserted {wlc_count:,} WLC verses")

    if batch:
        cur.executemany(
            """
            INSERT INTO text_units
            (corpus_id, std_book, std_chapter, std_verse, std_subverse,
             native_book, native_chapter, native_verse, native_subverse,
             native_citation, text_content, tokens_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            batch,
        )
        conn.commit()

    print(f"Inserted {wlc_count:,} updated WLC verses.")

    # 3. Re-index Lemma Stats & Concordance References
    print("\n--- 3. Indexing Lemma Stats & Concordance ---")
    index_lemmas_and_concordance(conn)

    # Optimize and close
    print("\nOptimizing SQLite indexes...")
    conn.execute("PRAGMA optimize")
    conn.commit()
    conn.close()

    elapsed = time.time() - t_start
    print(f"\n==================================================")
    print(f"WLC & BDB Rebuild Complete in {elapsed:.2f}s!")
    print(f"==================================================")


if __name__ == "__main__":
    rebuild_hebrew()
