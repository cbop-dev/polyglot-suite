# Polyglot Suite

Monorepo workspace for ancient language readers, lexical engines, and comparative textual tooling.

## Apps

| Application | Path | Technology | Description |
| :--- | :--- | :--- | :--- |
| **Polyglot Bible Reader** | [`apps/polyglot-bible-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/polyglot-bible-reader) | SvelteKit 5, Tailwind CSS, `sql.js-httpvfs` | Multi-corpus biblical reader (Hebrew MT, Greek LXX, Greek SBLGNT, Latin Vulgate, English KJV/NET/Brenton) with TVTMS alignment, LSJ/BDB lexicons, and concordance search. |
| **Biblical Lexeme Explorer** | [`apps/biblical-lexeme-explorer`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/biblical-lexeme-explorer) | SvelteKit 5, Tailwind CSS, D3, Chart.js | Vocabulary acquisition, section-by-section frequency distributions, concordance lookups, word clouds, and unabridged LSJ &amp; BDB lexicons for LXX, BHS, and SBLGNT. |
| **Josephus Reader** | [`apps/josephus-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/josephus-reader) | Astro, Svelte 5, SQLite | Parallel Greek and English reader for Flavius Josephus (*Jewish War*, *Antiquities*, *Life*, *Against Apion*). |
| **Apostolic Fathers Reader** | [`apps/apostolic-fathers-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/apostolic-fathers-reader) | SvelteKit 5, `sql.js-httpvfs` | Trilingual Greek, Latin, and English reader for the 15 Apostolic Fathers works, with LSJ definitions, lemma search, and multi-color highlighting. |
| **Philo Reader** | [`apps/philo-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/philo-reader) | SvelteKit 5, `@polyglot/db-vfs` | Complete 31-treatise critical reader for Philo of Alexandria with Cohn-Wendland Greek, Yonge English, Mangey 1742 milestones, full LSJ lexicon, and Biblical Citation Explorer (1,595 Septuagint references). |

## Workspace Structure

```
polyglot-suite/
├── apps/
│   ├── polyglot-bible-reader/      # Multi-corpus biblical reader & pipeline
│   ├── biblical-lexeme-explorer/   # Analytical vocabulary explorer & Swete pipeline
│   ├── josephus-reader/            # Astro + Svelte parallel Josephus reader
│   ├── apostolic-fathers-reader/   # SvelteKit 5 + VFS Apostolic Fathers reader & pipeline
│   └── philo-reader/               # SvelteKit 5 + VFS Philo reader with Scripture Explorer
├── packages/                       # Shared monorepo packages
│   ├── ancient-languages/          # Morphology decoders, diacritic cleaners, inflection filters
│   ├── biblical-data/              # Standardized biblical corpora schemas & client readers
│   ├── db-vfs/                     # WASM SQLite HTTP-VFS client worker & row parser
│   ├── greek-morphology/           # Ancient Greek lemmatizer, Stanza NLP bridge & solver
│   ├── pipeline-core/              # Python database chunkers, LSJ adapters & cache fetchers
│   └── theme/                      # Contrast-invariant continuous theme engine & UI sliders
└── package.json                    # Root npm workspace configuration
```

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development
```bash
# Start Polyglot Bible Reader
npm run dev:bible

# Start Biblical Lexeme Explorer
npm run dev:lexeme

# Start Josephus Reader
npm run dev:josephus

# Start Apostolic Fathers Reader
npm run dev:fathers

# Start Philo Reader
npm run dev:philo
```

### Git Subtree Maintenance

The applications in `apps/` retain their upstream commit histories. To sync changes to/from upstream remotes:

```bash
# Pull changes from upstream polyglot-bible-reader
git subtree pull --prefix=apps/polyglot-bible-reader polyglot-bible-reader main

# Pull changes from upstream josephus-reader
git subtree pull --prefix=apps/josephus-reader josephus-reader v1.0
```

## Database Management & Releases

Each reader app (`polyglot-bible-reader` / `biblical-lexeme-explorer`, `philo-reader`, `apostolic-fathers-reader`) reads pre-computed SQLite databases served as 5MB chunks via HTTP-VFS. Database releases are hosted on GitHub Releases and tracked locally in each app's `static/db/config.json`.

### 1. Check Database Status (Local vs. GitHub Releases)
Compare the database version in local `config.json` against the latest published version on GitHub Releases:

```bash
# Compare all databases (Bible, Philo, Apostolic Fathers)
npm run status:db:gh

# Compare a specific app database
npm run status:db:gh bible       # Polyglot Bible Reader & BLE (alias: lex, data)
npm run status:db:gh philo       # Philo Reader
npm run status:db:gh fathers     # Apostolic Fathers Reader (alias: af)
```

The status command will report:
- **`✅ UP_TO_DATE`**: Local version matches the latest release on GitHub, and chunks exist locally.
- **`⚠️ LOCAL_AHEAD_UNRELEASED`**: Local `config.json` specifies a version that has not yet been published to GitHub Releases (run `npm run release:db <app>`).
- **`📥 RELEASED_CHUNKS_MISSING`**: Release exists on GitHub, but chunks are not downloaded locally (run `npm run pull:db <app>`).
- **`⬇️ LOCAL_BEHIND`**: GitHub has a newer release than local `config.json`.

### 2. Download Database Chunks from GitHub Releases
If chunks are missing locally or after cloning a fresh repository:

```bash
# Download chunks for all databases
npm run pull:db

# Download chunks for a specific app
npm run pull:db:bible
npm run pull:db:philo
npm run pull:db:fathers
```

### 3. Release a New Database Version
> [!NOTE]
> You **only** need to run `release:db` when you modified ancient texts, morphology, or lexicon data and compiled new chunks. Frontend/UI changes do **not** require a database release.

```bash
# Preview what release will do without modifying files or uploading:
node scripts/release_db.js bible --dry-run

# Publish a new database version (bumps version, creates GH release, and uploads chunks):
npm run release:db:bible         # Bumps patch (e.g. 0.2.0 -> 0.2.1)
npm run release:db:philo minor   # Bumps minor (e.g. 0.0.5 -> 0.1.0)
npm run release:db bible 1.0.0   # Explicit version

# Automatically push git commit after release:
npm run release:db:bible -- --push
```

### 4. Compiling & Building Databases from Source (Data Pipeline)
To compile the master SQLite database from upstream source files:

```bash
# Download upstream raw texts and lexicons into cache/
npm run fetch:db

# Compile pre-aligned SQLite database and export BLE manifests
npm run build:db

# Slice the database into 5MB HTTP-VFS static chunks
npm run chunk:db

# Run full end-to-end pipeline (fetch -> compile -> validate -> chunk -> manifests)
npm run data:all
```

