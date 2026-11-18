# Polyglot Bible Reader

An interactive web application for side-by-side reading, comparative textual study, and morphological exploration across ancient and modern biblical versions. 

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

> [!NOTE]
> *This application is an ongoing scholarly tool. Some lexical and morphological parsing data may contain edge-case inaccuracies.* **Always consult critical print editions for authoritative citation.**

---

## Features

- **Side-by-Side Multilingual Reading**: Synchronized parallel column and grid reading across Old and New Testament traditions.
- **Cross-Tradition Versification Alignment (TVTMS)**: Chapter and verse numbers are automatically aligned across diverging numbering traditions (e.g., Hebrew Ps 51 = Septuagint/Vulgate Ps 50) using the Tyndale Versification Mapping System.
- **Lexical & Morphological Inspection**: Click any Greek or Hebrew word to view dictionary definitions, grammatical parsing, frequency statistics, and concordance occurrences.
- **Unabridged Scholarly Lexicons**: Integrated Liddell-Scott-Jones (LSJ) for Greek and Brown-Driver-Briggs (BDB) for Hebrew.
- **Adaptive Reading Themes**: Continuous, contrast-invariant theme slider with Light, Dark, and Sepia palettes adapted from OpenScriptorium.
- **Zero-Backend Client Execution**: Powered by WebAssembly SQLite (`sql.js-httpvfs`) querying pre-chunked database files via HTTP range requests. No server-side database daemon required.

---

## Available Versions

The reader includes 12 biblical editions and 2 unabridged lexicons:

| Corpus ID | Version Title | Language | Testament |
| :--- | :--- | :--- | :--- |
| `wlc` | Westminster Leningrad Codex (BHS) | Hebrew / Aramaic (`hbo`) | OT |
| `swete_lxx` | The Old Testament in Greek according to the Septuagint (H.B. Swete, 1930) | Ancient Greek (`grc`) | OT |
| `sblgnt` | The Greek New Testament: SBL Edition (Michael W. Holmes, 2010) | Ancient Greek (`grc`) | NT |
| `ognt` | Open Greek New Testament (NA28-aligned) | Ancient Greek (`grc`) | NT |
| `peshitta` | The Syriac Peshitta (Leiden OT / SEDRA III NT) | Classical Syriac (`syc`) | Both |
| `vulgate` | Biblia Sacra Vulgata (Clementine Vulgate 1592/1598) | Latin (`lat`) | Both |
| `kjv` | King James Version (1611 with Apocrypha) | English (`eng`) | Both |
| `webbe` | World English Bible (British Edition with Apocrypha) | English (`eng`) | Both |
| `brenton-lxx`| The Septuagint with an English Translation (Sir L.C.L. Brenton, 1851) | English (`eng`) | OT |
| `douay` | Douay-Rheims Bible (Challoner Revision with Apocrypha) | English (`eng`) | Both |
| `luther1912` | Lutherbibel 1912 (mit den Apokryphen) | German (`deu`) | Both |
| `vamvas` | Modern Greek Bible (Neophytos Vamvas 1850) | Modern Greek (`ell`) | Both |
| `bdb` | Brown-Driver-Briggs Hebrew and English Lexicon | Hebrew (`hbo`) | Lexicon |
| `lsj` | Liddell-Scott-Jones Greek-English Lexicon (STEPBible Formatted) | Greek (`grc`) | Lexicon |

---

## Data Provenance & Sources

All textual assets are derived from open datasets that permit non-commercial research use. For complete details, see [LICENSES.md](LICENSES.md).

> [!IMPORTANT]
> **Non-Commercial Data Notice (Hebrew OT)**:
> The Hebrew Bible text, lemma, and morphological dataset is derived from the **ETCBC / Text-Fabric BHSA** dataset and **Eliran Wong's BHS-morphology** package, licensed under **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)** (commercial use prohibited).

- **Latin Vulgate**: Clementine Vulgate (1592); sourced from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (Public Domain).
- **King James Version (KJV)**: Authorized Version (1611 with Apocrypha); sourced from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (Public Domain).
- **World English Bible (WEB)**: Produced by Rainbow Missions / Michael Paul Johnson via [eBible.org](https://ebible.org) (Public Domain).
- **Hebrew Bible (WLC/BHS)**: Curated by the Eep Talstra Centre for Bible and Computer ([ETCBC/bhsa](https://github.com/ETCBC/bhsa)) and Eliran Wong ([BHS-morphology](https://github.com/eliranwong/BHS-morphology)) (CC BY-NC 4.0).
- **Septuagint (LXX)**: H.B. Swete edition (Cambridge, 1887–1912, reprint 1930), transcribed by Eliran Wong and collaborators ([LXX-Swete-1930](https://github.com/eliranwong/LXX-Swete-1930)) (Public Domain).
- **Greek New Testament (SBLGNT)**: Edited by Michael W. Holmes, Copyright 2010 Society of Biblical Literature and Logos Bible Software ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). MorphGNT parsing by James Tauber (CC BY 4.0).
- **Open Greek New Testament (OpenGNT)**: NA28-aligned open text and parsing curated by Eliran Wong (CC BY 4.0).
- **Syriac Peshitta**: Leiden Peshitta Institute OT and SEDRA III NT digital datasets curated by George Kiraz (Beth Mardutho) (CC BY-SA 3.0 / Public Domain).
- **Douay-Rheims Bible**: Challoner Revision (1749–1752); sourced via [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (Public Domain).
- **Lutherbibel 1912**: 1912 revision of Martin Luther's translation with Apocrypha (Public Domain worldwide).
- **Vamvas Modern Greek Bible**: Translation by Neophytos Vamvas (1850) (Public Domain worldwide).
- **Versification Alignment (TVTMS)**: Tyndale Versification Mapping System provided by STEPBible.org and Tyndale House, Cambridge ([STEPBible-Data](https://github.com/STEPBible/STEPBible-Data)) (CC BY 4.0).
- **Lexicons**: Liddell-Scott-Jones (LSJ) and Brown-Driver-Briggs (BDB) (Public Domain).

---

## Development & Building

### 1. Web Application Development

The frontend is built with SvelteKit 2 and Svelte 5. It reads pre-compiled database chunks directly from `static/db/`.

Run commands from the repository root:
```bash
# Start local development server (port 5171)
npm run dev:bible

# Run type checks
npm run check:bible

# Run unit tests
npm run test:bible

# Build static production bundle into dist/bible
npm run build:www:bible
```

### 2. Database Chunks Management

The compiled SQLite database (~857 MB) is split into 5MB chunks (`polyglot.db.00`, `polyglot.db.01`, ...) hosted on GitHub Releases. Chunks are not checked into Git.

To download chunks from GitHub Releases to local `static/db/`:
```bash
npm run pull:db:bible
```

To check database synchronization status:
```bash
npm run status:db:gh bible
```

### 3. Data Pipeline (`packages/data-pipeline`)

The offline Python ETL pipeline that fetches texts, aligns versification (TVTMS), and compiles the SQLite database is located in the shared package [`packages/data-pipeline`](../../packages/data-pipeline).

Run pipeline tasks from the repository root:
```bash
# Fetch raw source texts and lexicons into cache/
npm run fetch:db

# Compile the master SQLite database (packages/data-pipeline/build/polyglot-working.sqlite3)
# and automatically export BLE manifests
npm run build:db

# Slice the database into 5MB chunks in apps/polyglot-bible-reader/static/db/
npm run chunk:db

# Run full end-to-end pipeline (fetch -> build -> validate -> chunk -> manifests)
npm run data:all
```
