# Polyglot Data Pipeline (`@polyglot/data-pipeline`)

Offline Python ETL pipeline, versification crosswalk engine, and master SQLite compiler for biblical texts and unabridged lexicons.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

The **Data Pipeline** is the centralized build system responsible for producing the unified master SQLite database (`polyglot-working.sqlite3`, ~857 MiB) used by **Polyglot Bible Reader** and **Biblical Lexeme Explorer**. For the full SQLite schema specification, see [Polyglot Bible Reader Database Design](../../apps/polyglot-bible-reader/docs/database-design.md).

It automates:
1. Fetching raw upstream text, morphology, and lexicon datasets into local cache.
2. Cross-tradition versification synchronization (TVTMS) across Hebrew, Greek, Latin, Syriac, English, and German schemes.
3. Ingesting 12 biblical corpora and 2 unabridged dictionaries (LSJ and BDB).
4. Normalizing headwords to universal integer lexeme identifiers (`lexemes.id`).
5. Generating $O(1)$ pre-computed lemma frequencies and concordance indexes.
6. Slicing the compiled SQLite database into 5MB static chunks for HTTP-VFS delivery.
7. Triggering build-time JSON manifest generation for Biblical Lexeme Explorer.

---

## Module Layout

```
packages/data-pipeline/
├── adapters/                    # Text and lexicon format ingestion adapters
│   ├── base.py                  # Base adapter class
│   ├── bdb.py                   # Brown-Driver-Briggs Hebrew lexicon adapter
│   ├── brenton.py               # Brenton English Septuagint adapter
│   ├── douay.py                 # Douay-Rheims Challoner revision adapter
│   ├── kjv.py                   # King James Version adapter
│   ├── lsj.py                   # STEPBible LSJ Greek lexicon adapter
│   ├── luther1912.py            # Lutherbibel 1912 adapter
│   ├── ognt.py                  # Open Greek New Testament adapter
│   ├── peshitta.py              # Syriac Peshitta adapter
│   ├── sblgnt.py                # SBL Greek New Testament adapter
│   ├── swete_lxx.py             # Swete Septuagint adapter
│   ├── usfm.py                  # USFM text parser utilities
│   ├── vamvas.py                # Modern Greek (Vamvas 1850) adapter
│   ├── vulgate.py               # Clementine Vulgate adapter
│   ├── webbe.py                 # World English Bible (British Edition) adapter
│   └── wlc.py                   # Westminster Leningrad Codex adapter
├── cache/                       # Cached raw upstream source downloads
├── build/                       # Output directory for compiled SQLite databases
├── data/                        # Static metadata, versification overrides & errata
├── swete_morphology/            # Stanza Ancient Greek NLP morphology pipeline
├── build.py                     # Main CLI pipeline orchestrator
├── chunker.py                   # SQLite database byte-range 5MB chunker
├── config.py                    # Corpus definitions, schema constants & file paths
├── db_builder.py                # SQLite schema creation & table population
├── export_lemma_search_json.py  # Lemma search JSON exporter
├── export_peshitta_tf.py        # Peshitta Text-Fabric exporter
├── fetcher.py                   # Polite HTTP cache downloader
├── generate_canonical_books.py  # Synchronizes canonical book definitions with frontend
├── lemma_indexer.py             # Pre-computes lemma distributions and concordance refs
├── tvtms.py                     # Tyndale Versification Mapping System crosswalk
└── validate.py                  # Automated referential integrity and alignment test suite
```

---

## Ingested Corpora & Dictionaries

The pipeline compiles 12 biblical editions and 2 unabridged dictionaries:

1. `wlc`: Westminster Leningrad Codex (Hebrew OT)
2. `swete_lxx`: Swete Septuagint 1930 (Greek OT)
3. `sblgnt`: SBL Greek New Testament (Greek NT)
4. `ognt`: Open Greek New Testament (NA28-aligned, Greek NT)
5. `peshitta`: Syriac Peshitta (Leiden OT / SEDRA III NT)
6. `vulgate`: Clementine Vulgate 1592/1598 (Latin, OT/NT)
7. `kjv`: King James Version 1611 with Apocrypha (English, OT/NT)
8. `webbe`: World English Bible British Edition (English, OT/NT)
9. `brenton-lxx`: Brenton English Septuagint 1851 (English, OT)
10. `douay`: Douay-Rheims Bible Challoner Revision (English, OT/NT)
11. `luther1912`: Lutherbibel 1912 mit den Apokryphen (German, OT/NT)
12. `vamvas`: Modern Greek Bible Neophytos Vamvas 1850 (Greek, OT/NT)
13. `bdb`: Brown-Driver-Briggs Hebrew Lexicon
14. `lsj`: STEPBible Liddell-Scott-Jones Greek Lexicon

---

## Versification Synchronization (`tvtms.py`)

Divergent textual traditions number chapters and verses differently (e.g., Psalm 51 in the Hebrew MT corresponds to Psalm 50 in the Septuagint and Vulgate).

The pipeline uses the **Tyndale Versification Mapping System (TVTMS)** to establish a dual-coordinate schema in `text_units`:
- **Universal Standard Hub Coordinates**: `std_book`, `std_chapter`, `std_verse` (used by the reader for side-by-side alignment).
- **Native Historical Coordinates**: `native_book`, `native_chapter`, `native_verse`, `native_citation` (preserving original edition references).

---

## Running the Pipeline

Run commands from the monorepo root:

```bash
# 1. Download upstream source texts and dictionaries into cache/
npm run fetch:db

# 2. Compile master SQLite database and generate BLE manifests
npm run build:db

# 3. Slice database into 5MB HTTP-VFS chunks in apps/polyglot-bible-reader/static/db/
npm run chunk:db

# Run the complete end-to-end pipeline in one step
npm run data:all
```

Or execute directly with Python (from package directory):
```bash
python3 build.py --fetch
python3 build.py --build
python3 validate.py
python3 build.py --chunk
```
