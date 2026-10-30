"""Polyglot Bible Reader - Database Builder.

Builds the clean, pre-aligned SQLite database (polyglot-working.sqlite3).
Populates:
  - canonical_books (86 standard USFM book definitions)
  - corpora (metadata for texts, translations, lexicons)
  - text_units (pre-aligned verses with tokens, lemmas, Strong's, and morphology)
  - lexicon_entries (BDB Hebrew and LSJ Greek unabridged lexicons)
"""

from __future__ import annotations
import sqlite3
import sys
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

from .config import BUILD_DIR, CANONICAL_BOOKS, MONOREPO_ROOT, APP_ROOT
from .tvtms import load_tvtms, TVTMSResolver
from .adapters import (
    BaseAdapter,
    VulgateAdapter,
    WLCAdapter,
    SweteLXXAdapter,
    OGNTAdapter,
    SBLGNTAdapter,
    KJVAdapter,
    WEBBEAdapter,
    BrentonAdapter,
    PeshittaAdapter,
    BDBAdapter,
    LSJAdapter,
)
from .lemma_indexer import index_lemmas_and_concordance

SCHEMA_SQL = """
-- 1. Metadata for Textual Corpora
CREATE TABLE IF NOT EXISTS corpora (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    language_name TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'ltr',
    category TEXT NOT NULL,
    testament TEXT NOT NULL DEFAULT 'both',
    default_scheme TEXT NOT NULL,
    has_tokens BOOLEAN NOT NULL DEFAULT 0,
    has_audio BOOLEAN NOT NULL DEFAULT 0,
    primary_dictionary TEXT,
    aliases TEXT,
    search_names TEXT,
    license TEXT,
    attribution TEXT
);

-- 2. Books Reference Table (Exhaustive Standard Canon)
CREATE TABLE IF NOT EXISTS canonical_books (
    code TEXT PRIMARY KEY,
    order_index INTEGER NOT NULL,
    testament TEXT NOT NULL,
    name_english TEXT NOT NULL,
    name_hebrew TEXT,
    name_greek TEXT,
    name_latin TEXT,
    total_chapters INTEGER NOT NULL
);

-- 3. Core Text Units (Bibles and Verse-by-Verse Commentaries)
CREATE TABLE IF NOT EXISTS text_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    corpus_id TEXT NOT NULL REFERENCES corpora(id),
    
    -- Universal Hub Coordinates (Used for side-by-side alignment range scans)
    std_book TEXT NOT NULL REFERENCES canonical_books(code),
    std_chapter INTEGER NOT NULL,
    std_verse INTEGER NOT NULL,
    std_subverse TEXT DEFAULT '',
    
    -- Native Historical Coordinates (Preserving true scheme citation)
    native_book TEXT NOT NULL,
    native_chapter INTEGER NOT NULL,
    native_verse INTEGER NOT NULL,
    native_subverse TEXT DEFAULT '',
    native_citation TEXT NOT NULL,
    
    -- Content
    text_content TEXT NOT NULL,
    tokens_json TEXT
);

-- 4. Master Universal Lexemes (Phase 4.2 Consolidated Model)
CREATE TABLE IF NOT EXISTS lexemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language TEXT NOT NULL,         -- 'hebrew', 'aramaic', 'greek', 'syriac', 'latin'
    lemma TEXT NOT NULL,            -- Standard NFC display form (Greek Tonos-normalized, pointed Hebrew)
    lemma_clean TEXT NOT NULL,      -- Accent/vowel-stripped search/sort key
    strongs_id TEXT,                -- 'G2316', 'H430' (normalized, nullable)
    pos TEXT,                       -- Standardized POS
    gloss TEXT,                     -- Primary English gloss
    source_id TEXT                  -- Original Text-Fabric / source node ID
);

-- 5. Lexicon Entries (Strong's, Morphology, Glosses)
CREATE TABLE IF NOT EXISTS lexicon_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lexeme_id INTEGER REFERENCES lexemes(id),
    strongs_id TEXT NOT NULL,
    dictionary TEXT NOT NULL,
    lemma TEXT NOT NULL,
    consonant_key TEXT,
    transliteration TEXT,
    gloss TEXT NOT NULL,
    definition TEXT
);

-- 6. Normalized Cross-Corpus Lemma Statistics
CREATE TABLE IF NOT EXISTS corpus_lemma_stats (
    lexeme_id INTEGER NOT NULL REFERENCES lexemes(id),
    corpus_id TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    frequency_per_10k REAL,
    book_counts_json TEXT NOT NULL,
    PRIMARY KEY (lexeme_id, corpus_id)
);

-- 7. Pre-computed Lemma Statistics (O(1) Book Frequency Distributions)
CREATE TABLE IF NOT EXISTS lemma_stats (
    corpus_id TEXT NOT NULL,
    lemma_key TEXT NOT NULL,
    display_lemma TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    book_counts_json TEXT NOT NULL,
    lexeme_id INTEGER REFERENCES lexemes(id),
    PRIMARY KEY (corpus_id, lemma_key)
);

-- 8. Pre-indexed Concordance References (O(1) Occurrence Range Scans)
CREATE TABLE IF NOT EXISTS concordance_refs (
    corpus_id TEXT NOT NULL,
    lemma_key TEXT NOT NULL,
    display_lemma TEXT NOT NULL,
    ref_label TEXT NOT NULL,
    work_unit_id INTEGER NOT NULL,
    lexeme_id INTEGER,
    PRIMARY KEY (corpus_id, lemma_key, work_unit_id)
) WITHOUT ROWID;

-- 9. Pre-computed Corpus Book Statistics (Word & Verse totals per book)
CREATE TABLE IF NOT EXISTS corpus_book_stats (
    corpus_id TEXT NOT NULL,
    book_code TEXT NOT NULL,
    total_words INTEGER NOT NULL,
    total_verses INTEGER NOT NULL,
    PRIMARY KEY (corpus_id, book_code)
);

-- 10. Pre-computed Lemma Attested Forms (O(1) Inflections & Grammatical Analyses)
CREATE TABLE IF NOT EXISTS lemma_forms (
    corpus_id TEXT NOT NULL,
    lemma_key TEXT NOT NULL,
    display_lemma TEXT NOT NULL,
    total_occurrences INTEGER NOT NULL,
    forms_json TEXT NOT NULL,
    lexeme_id INTEGER REFERENCES lexemes(id),
    PRIMARY KEY (corpus_id, lemma_key)
);
"""

INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_text_units_hub 
ON text_units(std_book, std_chapter, std_verse, corpus_id);

CREATE INDEX IF NOT EXISTS idx_text_units_native 
ON text_units(corpus_id, native_book, native_chapter, native_verse);

CREATE INDEX IF NOT EXISTS idx_lexemes_lookup 
ON lexemes(language, lemma_clean);

CREATE INDEX IF NOT EXISTS idx_lexemes_strongs 
ON lexemes(strongs_id) WHERE strongs_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lexemes_lang_lemma 
ON lexemes(language, lemma);

CREATE INDEX IF NOT EXISTS idx_lexemes_source_id 
ON lexemes(source_id);

CREATE INDEX IF NOT EXISTS idx_cls_corpus_count 
ON corpus_lemma_stats(corpus_id, total_count DESC);

CREATE INDEX IF NOT EXISTS idx_cls_lexeme 
ON corpus_lemma_stats(lexeme_id);

CREATE INDEX IF NOT EXISTS idx_lexicon_strongs 
ON lexicon_entries(strongs_id);

CREATE INDEX IF NOT EXISTS idx_lexicon_dict_strongs 
ON lexicon_entries(dictionary, strongs_id);

CREATE INDEX IF NOT EXISTS idx_lexicon_consonant 
ON lexicon_entries(consonant_key);

CREATE INDEX IF NOT EXISTS idx_lexicon_lexeme_id 
ON lexicon_entries(lexeme_id);

CREATE INDEX IF NOT EXISTS idx_lemma_stats_lookup 
ON lemma_stats(corpus_id, lemma_key);

CREATE INDEX IF NOT EXISTS idx_lemma_stats_lexeme_id 
ON lemma_stats(lexeme_id);

CREATE INDEX IF NOT EXISTS idx_concordance_refs_lookup 
ON concordance_refs(corpus_id, lemma_key, work_unit_id);

CREATE INDEX IF NOT EXISTS idx_concordance_lexeme_id 
ON concordance_refs(lexeme_id);

CREATE INDEX IF NOT EXISTS idx_lemma_forms_lookup 
ON lemma_forms(corpus_id, lemma_key);

CREATE INDEX IF NOT EXISTS idx_lemma_forms_lexeme_id 
ON lemma_forms(lexeme_id);
"""


class DatabaseBuilder:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or (BUILD_DIR / "polyglot-working.sqlite3")
        self.tvtms: Optional[TVTMSResolver] = None

    def init_schema(self, conn: sqlite3.Connection):
        print(f"Creating database schema at {self.db_path}...")
        conn.executescript(SCHEMA_SQL)
        conn.commit()

    def create_indexes(self, conn: sqlite3.Connection):
        print("Building high-efficiency indexes...")
        t0 = time.time()
        conn.executescript(INDEX_SQL)
        conn.commit()
        print(f"Indexes created in {time.time() - t0:.2f}s")

    def populate_canonical_books(self, conn: sqlite3.Connection):
        print(f"Populating canonical_books with {len(CANONICAL_BOOKS)} books...")
        rows = [
            (
                b["code"],
                b["order"],
                b["testament"],
                b["name_en"],
                b.get("name_he"),
                b.get("name_el"),
                b.get("name_la"),
                b["chapters"],
            )
            for b in CANONICAL_BOOKS
        ]
        conn.executemany(
            """
            INSERT OR REPLACE INTO canonical_books 
            (code, order_index, testament, name_english, name_hebrew, name_greek, name_latin, total_chapters)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()

    def populate_corpora(self, conn: sqlite3.Connection):
        print("Populating corpora metadata...")
        corpora_records = [
            (
                "vulgate",
                "Vulgate",
                "Biblia Sacra Vulgata (Clementine Vulgate 1592/1598)",
                "lat",
                "Latin",
                "ltr",
                "bible",
                "both",
                "Vulgate",
                0,
                0,
                None,
                "vulgate,vulgate-clementine",
                '["Latin Vulgate", "Clementine Vulgate", "Biblia Sacra Vulgata"]',
                "Public Domain",
                "Clementine Vulgate Project",
            ),
            (
                "wlc",
                "BHS",
                "Westminster Leningrad Codex (Hebrew Old Testament)",
                "hbo",
                "Hebrew",
                "rtl",
                "bible",
                "ot",
                "MT",
                1,
                0,
                "bdb",
                "bhs,wlc",
                '["Biblia Hebraica Stuttgartensia", "Hebrew Bible", "Tanakh", "Old Testament"]',
                "Public Domain / CC BY 4.0",
                "OpenScriptures MorphHB / J. Alan Groves Center",
            ),
            (
                "swete_lxx",
                "LXX",
                "The Old Testament in Greek according to the Septuagint (H.B. Swete, 1930)",
                "grc",
                "Greek",
                "ltr",
                "bible",
                "ot",
                "LXX",
                1,
                0,
                "lsj",
                "lxx,swete,swete_lxx,swete-lxx",
                '["Septuagint", "Greek Old Testament", "Swete Septuagint"]',
                "Public Domain / CC BY-NC-SA 4.0",
                "Swete Septuagint & Biblical Data Pipeline Lemmatization",
            ),
            (
                "ognt",
                "OpenGNT",
                "Open Greek New Testament (NA28-aligned)",
                "grc",
                "Greek",
                "ltr",
                "bible",
                "nt",
                "ENG",
                1,
                0,
                "lsj",
                "ognt,opengnt",
                '["Open Greek New Testament", "Greek New Testament"]',
                "CC BY-SA 4.0",
                "OpenGNT Project (Eliran Wong)",
            ),
            (
                "sblgnt",
                "SBLGNT",
                "The Greek New Testament: SBL Edition",
                "grc",
                "Greek",
                "ltr",
                "bible",
                "nt",
                "ENG",
                1,
                0,
                "lsj",
                "sbl,sblgnt,morphgnt",
                '["Society of Biblical Literature Greek New Testament", "SBL Greek New Testament", "MorphGNT", "Greek New Testament"]',
                "CC BY 4.0",
                "Holmes (2010) / MorphGNT (Tauber)",
            ),
            (
                "kjv",
                "KJV",
                "King James Version (with Apocrypha)",
                "eng",
                "English",
                "ltr",
                "bible",
                "both",
                "ENG",
                0,
                0,
                None,
                "kjv,av",
                '["King James Version", "Authorized Version", "AV"]',
                "Public Domain",
                "King James Bible 1611/1769 with Apocrypha",
            ),
            (
                "webbe",
                "WEB",
                "World English Bible (British Edition with Apocrypha)",
                "eng",
                "English",
                "ltr",
                "bible",
                "both",
                "ENG",
                0,
                0,
                None,
                "web,webbe",
                '["World English Bible"]',
                "Public Domain",
                "eBible.org / Rainbow Missions",
            ),
            (
                "brenton-lxx",
                "Brenton",
                "The Septuagint with an English Translation (Sir L.C.L. Brenton, 1851)",
                "eng",
                "English",
                "ltr",
                "bible",
                "ot",
                "LXX",
                0,
                0,
                None,
                "brenton,brenton-lxx",
                '["Brenton Septuagint Translation", "Brenton English Septuagint"]',
                "Public Domain",
                "Samuel Bagster & Sons / eBible.org",
            ),
            (
                "peshitta",
                "Peshitta",
                "The Syriac Peshitta (Leiden OT / SEDRA NT)",
                "syc",
                "Syriac",
                "rtl",
                "bible",
                "both",
                "Peshitta",
                1,
                0,
                "sedra",
                "peshitta,syc",
                '["Syriac Peshitta", "Peshitta"]',
                "MIT / CC BY-NC 4.0",
                "Peshitta Institute Leiden / George A. Kiraz (SEDRA) / ETCBC",
            ),
            (
                "bdb",
                "BDB",
                "Brown-Driver-Briggs Hebrew and English Lexicon",
                "hbo",
                "Hebrew",
                "ltr",
                "lexicon",
                "ot",
                "MT",
                0,
                0,
                "bdb",
                "bdb",
                '["Brown-Driver-Briggs Hebrew and English Lexicon", "BDB"]',
                "Public Domain",
                "Unabridged BDB (Eliran Wong / STEPBible)",
            ),
            (
                "lsj",
                "LSJ",
                "Liddell-Scott-Jones Greek-English Lexicon (STEPBible Formatted)",
                "grc",
                "Greek",
                "ltr",
                "lexicon",
                "both",
                "LXX",
                0,
                0,
                "lsj",
                "lsj",
                '["Liddell-Scott-Jones Greek-English Lexicon", "LSJ"]',
                "CC BY",
                "STEPBible.org / LSJ Lexicon",
            ),
        ]
        conn.executemany(
            """
            INSERT OR REPLACE INTO corpora 
            (id, version, title, language, language_name, direction, category, testament, default_scheme, has_tokens, has_audio, primary_dictionary, aliases, search_names, license, attribution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            corpora_records,
        )
        conn.commit()

    def populate_lexicons(self, conn: sqlite3.Connection):
        print("\n=== Ingesting Lexicons ===")
        t0 = time.time()
        lex_rows = []

        # 1. BDB (Hebrew)
        print("Ingesting BDB Hebrew Lexicon...")
        bdb_adapter = BDBAdapter()
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

        # 2. LSJ (Greek)
        print("Ingesting STEPBible LSJ Greek Lexicon...")
        lsj_adapter = LSJAdapter()
        for entry in lsj_adapter.iter_entries():
            lex_rows.append((
                entry["strongs_id"],
                entry["dictionary"],
                entry["headword"],
                entry.get("consonant_key", ""),
                entry.get("transliteration", ""),
                entry["gloss"],
                entry["definition"],
            ))

        print(f"Inserting {len(lex_rows):,} lexicon entries into SQLite...")
        conn.executemany(
            """
            INSERT OR REPLACE INTO lexicon_entries
            (strongs_id, dictionary, lemma, consonant_key, transliteration, gloss, definition)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            lex_rows,
        )
        conn.commit()
        print(f"Lexicons ingested in {time.time() - t0:.2f}s")

    def populate_text_corpus(self, conn: sqlite3.Connection, adapter: BaseAdapter):
        print(f"\nIngesting text corpus: {adapter.title} ({adapter.corpus_id})...")
        t0 = time.time()
        batch = []
        count = 0
        batch_size = 5000

        for vu in adapter.iter_verses():
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
            count += 1

            if len(batch) >= batch_size:
                conn.executemany(
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
                print(f"  ... inserted {count:,} verses")

        if batch:
            conn.executemany(
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

        elapsed = time.time() - t0
        print(f"Finished {adapter.corpus_id}: {count:,} verses inserted in {elapsed:.2f}s")

    def build_all(self):
        start_time = time.time()
        print(f"==================================================")
        print(f"Building Polyglot Bible SQLite Database")
        print(f"Target: {self.db_path}")
        print(f"==================================================")

        if self.db_path.exists():
            print(f"Removing previous build artifact: {self.db_path}")
            self.db_path.unlink()

        conn = sqlite3.connect(self.db_path)
        # SQLite speed optimizations for bulk building
        conn.execute("PRAGMA journal_mode = MEMORY")
        conn.execute("PRAGMA synchronous = OFF")
        conn.execute("PRAGMA cache_size = 100000")

        try:
            # 1. Schema
            self.init_schema(conn)

            # 2. Canonical Books
            self.populate_canonical_books(conn)

            # 3. Corpora Metadata
            self.populate_corpora(conn)

            # 4. TVTMS Resolver Initialization
            if self.tvtms is None:
                self.tvtms = load_tvtms()

            # 5. Lexicons
            self.populate_lexicons(conn)

            # 6. Biblical Text Units
            print("\n=== Ingesting Biblical Text Corpora ===")
            adapters = [
                VulgateAdapter(tvtms=self.tvtms),
                WLCAdapter(tvtms=self.tvtms),
                SweteLXXAdapter(tvtms=self.tvtms),
                OGNTAdapter(tvtms=self.tvtms),
                SBLGNTAdapter(tvtms=self.tvtms),
                KJVAdapter(tvtms=self.tvtms),
                WEBBEAdapter(tvtms=self.tvtms),
                BrentonAdapter(tvtms=self.tvtms),
                PeshittaAdapter(tvtms=self.tvtms),
            ]

            for adapter in adapters:
                self.populate_text_corpus(conn, adapter)

            # 7. Lemma Statistics and Concordance References
            index_lemmas_and_concordance(conn)

            # 7b. Phase 4.2: Master Lexemes & Corpus Lemma Stats Consolidation
            root_scripts = MONOREPO_ROOT / "scripts"
            if str(root_scripts) not in sys.path:
                sys.path.insert(0, str(root_scripts))
            from migrate_phase4_2_lexemes import migrate_connection
            migrate_connection(conn)

            # Auto-export compact lemma search indexes for single-request client search
            try:
                app_scripts = APP_ROOT / "scripts"
                if str(app_scripts) not in sys.path:
                    sys.path.insert(0, str(app_scripts))
                from export_lemma_search_json import export_lemma_indexes
                export_lemma_indexes(conn)
            except Exception as e:
                print(f"Warning: Failed to auto-export lemma search JSON: {e}")

            # 8. Indexes
            self.create_indexes(conn)

            # Run integrity check and vacuum/analyze
            print("\nOptimizing and analyzing database...")
            conn.execute("PRAGMA foreign_key_check")
            conn.execute("ANALYZE")
            conn.commit()

        finally:
            conn.close()

        total_elapsed = time.time() - start_time
        size_mb = self.db_path.stat().st_size / (1024 * 1024)
        print(f"\n==================================================")
        print(f"BUILD COMPLETE!")
        print(f"Database: {self.db_path}")
        print(f"Size: {size_mb:.2f} MB")
        print(f"Elapsed: {total_elapsed:.1f}s")
        print(f"==================================================")

    def ingest_corpus(self, corpus_id: str):
        """Incrementally ingests or updates a single text corpus in the working database."""
        c_clean = corpus_id.lower().strip()
        print(f"==================================================")
        print(f"Targeted Ingestion for corpus: '{c_clean}'")
        print(f"Target Database: {self.db_path}")
        print(f"==================================================")

        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found at {self.db_path}. Run build_all first.")

        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode = MEMORY")
        conn.execute("PRAGMA synchronous = OFF")
        conn.execute("PRAGMA cache_size = 100000")

        try:
            self.init_schema(conn)
            self.populate_canonical_books(conn)
            self.populate_corpora(conn)

            if self.tvtms is None:
                self.tvtms = load_tvtms()

            adapter: Optional[BaseAdapter] = None
            if c_clean == "sblgnt":
                adapter = SBLGNTAdapter(tvtms=self.tvtms)
            elif c_clean == "ognt":
                adapter = OGNTAdapter(tvtms=self.tvtms)
            elif c_clean in ("wlc", "bhs"):
                adapter = WLCAdapter(tvtms=self.tvtms)
            elif c_clean in ("swete_lxx", "lxx"):
                adapter = SweteLXXAdapter(tvtms=self.tvtms)
            elif c_clean == "kjv":
                adapter = KJVAdapter(tvtms=self.tvtms)
            elif c_clean == "vulgate":
                adapter = VulgateAdapter(tvtms=self.tvtms)
            elif c_clean == "webbe":
                adapter = WEBBEAdapter(tvtms=self.tvtms)
            elif c_clean in ("brenton", "brenton-lxx"):
                adapter = BrentonAdapter(tvtms=self.tvtms)
            elif c_clean == "peshitta":
                adapter = PeshittaAdapter(tvtms=self.tvtms)
            else:
                raise ValueError(f"Unknown corpus: {corpus_id}")

            print(f"Deleting existing text_units for '{adapter.corpus_id}'...")
            conn.execute("DELETE FROM text_units WHERE corpus_id = ?", (adapter.corpus_id,))
            conn.commit()

            self.populate_text_corpus(conn, adapter)

            print(f"Indexing lemma statistics for '{adapter.corpus_id}'...")
            index_lemmas_and_concordance(conn, corpus_filter=adapter.corpus_id)

            # Re-run Phase 4.2 migration to link lexemes
            root_scripts = MONOREPO_ROOT / "scripts"
            if str(root_scripts) not in sys.path:
                sys.path.insert(0, str(root_scripts))
            try:
                from migrate_phase4_2_lexemes import migrate_connection
                migrate_connection(conn)
            except Exception as e:
                print(f"Note on Phase 4.2 migration: {e}")

            # Re-index
            self.create_indexes(conn)
            conn.execute("ANALYZE")
            conn.commit()
            print(f"\nSuccessfully ingested '{adapter.corpus_id}' into {self.db_path}!")
        finally:
            conn.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", type=str, help="Ingest a single specific corpus")
    args = parser.parse_args()

    builder = DatabaseBuilder()
    if args.corpus:
        builder.ingest_corpus(args.corpus)
    else:
        builder.build_all()
