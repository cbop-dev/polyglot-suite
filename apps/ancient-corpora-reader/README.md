# Ancient Corpora Reader

An interactive, high-performance web application—deployable as a 100% static client-side site—for comparative reading, linguistic exploration, and morphological study of major Hellenistic and early Christian/Jewish Greek literature.

The **Ancient Corpora Reader** unifies three core corpora into a single coherent interface:
1. **Apostolic Fathers** (*Clement of Rome, Ignatius of Antioch, Polycarp, Didache, Shepherd of Hermas, Barnabas, Papias, etc.*)
2. **Philo of Alexandria** (*All 31 surviving continuous Greek treatises*)
3. **Flavius Josephus** (*The Jewish War, Antiquities of the Jews, Life, and Against Apion*)

> [!NOTE]
> **AI Generation Notice**: Developed and documented with the assistance of **Antigravity 2.26.0** (Engine: **Gemini 3.8 Flash**). Code developed under human supervision. This README.md was almost entirely AI-generated.

---

## Key Features

- **Consolidated Multi-Corpus Reader**:
  - Seamlessly switch between Apostolic Fathers, Philo, and Josephus from a unified header selector or command palette.
  - Deep-linkable dynamic routing: `/[corpus]/[work]/[division]` (e.g. `/af/1-clem/1`, `/philo/opif/1`, `/josephus/ant/1.1`).
- **Parallel Multilingual Columns**:
  - Synchronized Greek source text with English translation.
  - Specialized parallel Latin column for Apostolic Fathers where Latin manuscript witnesses are preserved (e.g., Shepherd of Hermas).
- **Interactive Lemma & Morphology Inspection**:
  - Click any Greek word to inspect lemma, part of speech, and inflected forms.
  - Unabridged **STEPBible Tyndale Fellowship LSJ (Liddell-Scott-Jones)** Greek dictionary integration.
- **High-Performance Paginated Concordance**:
  - CTE pushdown pagination (50 items/page) with "Load More" controls.
  - Eliminates range-request freezes and memory bloat on ultra-high-frequency lemmas (e.g., `ὁ`, `καί`).
  - Monotonic transaction ID tracking prevents async race conditions.
- **Corpus-Specific Scholarly Apparatuses**:
  - **Philo**: Embedded Scripture Citations & Allusions Explorer tab (Genesis through the Prophets and Writings), plus Cohn-Wendland and Mangey milestone citations.
  - **Josephus**: Benedikt Niese sectioning and William Whiston reference cross-mapping.
  - **Apostolic Fathers**: Kirsopp Lake Loeb Greek/English alignment and Latin fragments.
- **Academic Citation Generator**:
  - Formats standard scholarly citations in one click for papers and bibliographies.
- **Contrast-Invariant Adaptive Themes**:
  - Powered by `@polyglot/theme` with smooth piecewise color-stop interpolation across Light, Dark, and Sepia palettes with continuous warmth tuning.
- **Zero-Backend Static Architecture**:
  - Powered by `@polyglot/db-vfs` (`sql.js-httpvfs`) querying range-requested SQLite database chunks in WebAssembly.
  - Multi-VFS database architecture: each corpus maintains a distinct modular database chunk pool in `static/db/{af,philo,josephus}/`, loading zero bytes until a corpus is viewed.

---

## Corpora & Text Editions

| Corpus | Extant Scope | Greek Critical Text | English / Latin Translation | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Apostolic Fathers** | 15 canonical works | Kirsopp Lake (Loeb Classical Library, 1912–1913) | Kirsopp Lake English; Latin manuscript witnesses | Multi-column trilingual layout |
| **Philo of Alexandria** | 31 Greek treatises | Leopold Cohn & Paul Wendland (*Editio Maior*, 1896–1915) | Charles Duke Yonge (1854–1855) | Mangey citations & Scripture index |
| **Flavius Josephus** | 4 complete works | Benedikt Niese (*Flavii Iosephi Opera*, 1885–1890) | William Whiston (1737 / 1856) | Niese sections & Whiston mapping |

---

## Project Architecture

```
apps/ancient-corpora-reader/
├── docs/                        # Architecture specs, performance audits, and optimization plans
│   ├── ancient_corpora_reader_implementation_plan.md
│   ├── concordance_performance_audit.md
│   ├── database-design.md
│   ├── tier1_performance_optimization_plan.md
│   ├── tier2_performance_optimization_plan.md
│   ├── tier2_6_schema_normalization_plan.md
│   └── tier3_performance_optimization_plan.md
├── pipeline/                    # Offline Python database compilation & chunking pipeline
│   ├── build.py                 # CLI entry point for building and chunking SQLite databases
│   ├── config.py                # Corpus source paths and normalization rules
│   ├── db_builder.py            # SQLite schema builder and indexing
│   └── snippet_builder.py       # Concordance snippet generator
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte 5 UI components (Reader, Columns, Headers, Modals)
│   │   ├── config/              # Canonical works registry, aliases, and citation metadata
│   │   ├── services/            # Multi-VFS DB client & Web Worker management
│   │   └── stores/              # Reactive reader & highlight stores ($state runes)
│   └── routes/                  # Dynamic SvelteKit routing (/[corpus]/[work]/[division])
├── static/
│   ├── db/                      # HTTP-VFS database chunks and config.json per corpus
│   │   ├── af/
│   │   ├── josephus/
│   │   └── philo/
│   └── sqlite/                  # sql.js WASM binaries and worker scripts
└── tests/                       # Vitest unit & integration test suites
```

---

## Developer Guide

### Prerequisites

- **Node.js**: `v20+`
- **npm**: `v10+` (Workspace mode)
- **Python**: `3.10+` (only needed if running the offline database pipeline in `pipeline/`)

### Setup & Local Development

Run commands from the repository root:

```bash
# Install workspace dependencies
npm install

# Start development server for Ancient Corpora Reader
npm run dev:corpora
# or:
npm --workspace=ancient-corpora-reader run dev
```

The application runs locally with Vite hot-module reload at `http://localhost:5173`.

### Diagnostics & Testing

```bash
# Run Svelte and TypeScript type checking
npm run check:corpora

# Run unit tests (Vitest)
npm run test:corpora
```

### Static Build & Suite Integration

```bash
# Build standalone static site (output in apps/ancient-corpora-reader/build/www)
npm --workspace=ancient-corpora-reader run build:www

# Build suite distribution (output in dist/corpora with /polyglot-suite/corpora base path)
npm run build:www:corpora

# Preview static distribution
npm run preview:corpora
```

---

## Data Pipeline (`pipeline/`)

The offline Python pipeline builds and normalizes SQLite databases from upstream XML/JSON sources, pre-generates concordance snippet indexes, and splits databases into 5MB chunks for HTTP-VFS:

```bash
cd apps/ancient-corpora-reader

# Build SQLite databases
python3 pipeline/build.py --build

# Split databases into HTTP-VFS chunks
python3 pipeline/build.py --chunk
```

---

## Licensing & Scholarly Use

- **Source Code**: Dual-licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** as part of the Polyglot Suite monorepo.
- **Texts & Linguistic Data**: Derived from public-domain critical editions and CC BY-SA 4.0 open datasets (Perseus Digital Library, First1KGreek, Giuseppe Celano Lemmatized Ancient Greek XML, STEPBible TFLSJ).
- **Academic Citation**: While texts are curated from critical editions, automated tokenization and lemmatization may contain occasional discrepancies. Check quotations against standard printed critical editions for published academic work.
