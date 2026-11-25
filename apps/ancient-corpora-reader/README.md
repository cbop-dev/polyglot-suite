# Ancient Corpora Reader

An interactive web application for comparative reading, linguistic exploration, and morphological study of major Hellenistic and early Christian/Jewish Greek literature.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

The **Ancient Corpora Reader** unifies major historical corpora into a single interface:
1. **Apostolic Fathers** (*Clement of Rome, Ignatius of Antioch, Polycarp, Didache, Shepherd of Hermas, Barnabas, Papias, etc.*)
2. **Philo of Alexandria** (*All 31 surviving continuous Greek treatises*)
3. **Flavius Josephus** (*The Jewish War, Antiquities of the Jews, Life, and Against Apion*)
4. **Justin Martyr** (*First Apology, Second Apology, and Dialogue with Trypho*)

---

## Key Features

- **Unified Multi-Corpus Reader**:
  - Switch between Apostolic Fathers, Philo, and Josephus from the top header or keyboard command palette.
  - Deep-linkable routing: `/[corpus]/[work]/[division]` (e.g., `/af/1-clem/1`, `/philo/opif/1`, `/josephus/ant/1.1`).
- **Parallel Multilingual Columns**:
  - Synchronized Greek source text with English translation.
  - Parallel Latin column for Apostolic Fathers works preserving Latin manuscript witnesses (e.g., Shepherd of Hermas).
- **Interactive Morphology & Lexicons**:
  - Click any Greek word to inspect its lemma, part of speech, and attested grammatical forms.
  - Integrated unabridged **STEPBible LSJ (Liddell-Scott-Jones)** Greek lexicon.
- **Fast Paginated Concordance**:
  - CTE pushdown pagination (50 results per page) with "Load More" controls.
  - Dedicated covering index (`idx_concordance_refs_form`) enables fast searches without loading full text pages.
- **Scholarly Apparatus & Citations**:
  - **Philo**: Scripture Citations & Allusions Explorer tab (OT references), plus Cohn-Wendland and Mangey milestone citations.
  - **Josephus**: Benedikt Niese sectioning and William Whiston cross-references.
  - **Apostolic Fathers**: Kirsopp Lake Loeb alignment and Latin fragments.
  - One-click scholarly citation copying for papers and bibliographies.
- **Continuous Reading Themes**:
  - Powered by `@polyglot/theme` with smooth piecewise color-stop interpolation across Light, Dark, and Sepia palettes.
- **Zero-Backend Client Architecture**:
  - Powered by `@polyglot/db-vfs` (`sql.js-httpvfs`) querying pre-chunked SQLite databases in WebAssembly via HTTP range requests.
  - **Database Design & SSOT**: See [Database Design & Architecture](docs/database-design.md) for complete SQLite schema specifications, covering concordance tables, and manifest generation details.
  - **Chunking**: Each corpus database (`af`, `philo`, `josephus`, `justin`) is sliced into lightweight 5MB chunks, minimizing data transfer on mobile connections.

---

## Corpora & Text Editions

| Corpus | Extant Scope | Greek Critical Text | English / Latin Translation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Apostolic Fathers** | 15 canonical works | Kirsopp Lake (Loeb Classical Library, 1912–1913) | Kirsopp Lake English; Latin manuscript witnesses | Multi-column trilingual layout |
| **Philo of Alexandria** | 31 Greek treatises | Leopold Cohn & Paul Wendland (*Editio Maior*, 1896–1915) | Charles Duke Yonge (1854–1855) | Mangey citations & Scripture index |
| **Flavius Josephus** | 4 complete works | Benedikt Niese (*Flavii Iosephi Opera*, 1885–1890) | William Whiston (1737 / 1856) | Niese sections & Whiston mapping |
| **Justin Martyr** | 3 authentic works | *First1KGreek* (`tlg0645`) / Giuseppe Celano *LemmatizedAncientGreekXML* | Roberts & Donaldson (*Ante-Nicene Fathers* Vol. 1, CCEL) | Pre-lemmatized Greek (`CC BY-NC 4.0`) + Public Domain English |

---

## Project Structure

```
apps/ancient-corpora-reader/
├── docs/                        # Architecture specs, performance audits, and optimization plans
│   └── database-design.md       # Canonical SQLite database schema & SSOT manifest architecture
├── pipeline/                    # Offline Python database compilation & chunking pipeline
│   ├── build.py                 # CLI entry point for building and chunking SQLite databases
│   ├── config.py                # Master bibliographic catalog and normalization rules
│   ├── db_builder.py            # SQLite schema builder, covering concordance & indexing
│   ├── export_canonical_manifests.py # Exporter generating *.generated.ts from SQLite databases
│   └── snippet_builder.py       # Concordance snippet generator
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte 5 UI components (Reader, Columns, Headers, Modals)
│   │   ├── config/              # Manifests (corpusVersions.generated.ts, canonicalWorks.generated.ts)
│   │   ├── services/            # Multi-VFS DB client & Web Worker management
│   │   └── stores/              # Reactive reader & highlight stores ($state runes)
│   └── routes/                  # Dynamic SvelteKit routing (/[corpus]/[work]/[division])
├── static/
│   ├── db/                      # HTTP-VFS database chunks (5MB each) and config.json
│   │   ├── af/                  # Apostolic Fathers database chunks
│   │   ├── josephus/            # Flavius Josephus database chunks
│   │   ├── philo/               # Philo of Alexandria database chunks
│   │   └── justin/              # Justin Martyr database chunks
│   └── sqlite/                  # sql.js WASM binaries and worker scripts
└── tests/                       # Vitest unit test suites
```

---

## Development Guide

### 1. Local Development

Run commands from the repository root:
```bash
# Start development server (port 5173)
npm run dev:corpora

# Run type checks
npm run check:corpora

# Run unit tests
npm run test:corpora
```

### 2. Database Management

The pre-computed SQLite databases are hosted on GitHub Releases and tracked locally via `config.json` in `static/db/{af,philo,josephus}/`.

```bash
# Check status of local chunks against remote GitHub Releases
npm run status:db:gh corpora

# Download all Ancient Corpora database chunks
npm run pull:db:corpora

# Or download a specific corpus database
npm run pull:db:corpora:af
npm run pull:db:corpora:philo
npm run pull:db:corpora:josephus
```

### 3. Compiling Databases from Source (`pipeline/`)

To compile the normalized SQLite databases and slice them into 1MB HTTP-VFS chunks from raw upstream files:

```bash
# Build and chunk all three corpora
python3 apps/ancient-corpora-reader/pipeline/build.py --all

# Or build/chunk individually
python3 apps/ancient-corpora-reader/pipeline/build.py --build af
python3 apps/ancient-corpora-reader/pipeline/build.py --chunk af
```

---

## Licensing & Scholarly Use

- **Source Code**: Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** as part of the Polyglot Suite monorepo.
- **Texts & Linguistic Data**: Derived from public-domain critical editions, `CC BY-SA 4.0` open datasets (Perseus Digital Library, First1KGreek, STEPBible TFLSJ), and `CC BY-NC 4.0` pre-lemmatized texts (Giuseppe Celano’s *LemmatizedAncientGreekXML* used for Philo and Justin Martyr; see `/sources-and-licenses` in the app for per-corpus details).
- **Academic Citation**: While texts are curated from critical editions, automated tokenization and lemmatization may contain occasional discrepancies. Check quotations against standard printed critical editions for published academic work.
