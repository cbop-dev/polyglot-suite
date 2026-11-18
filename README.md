# Polyglot Suite

Monorepo workspace for ancient language text readers, linguistic research tools, and biblical study applications.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `Passed initial human review`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

> 📖 **Technical Architecture**: For details on the WebAssembly database engine, shared packages, and build workflows, see [**Monorepo Architecture & Technical Design**](docs/monorepo-architecture.md).

---

## Applications

| Application                  | Path                                                             | Technology                                            | Description                                                                                                                                                                                                                                                                                       | Status                                                    |
|:---------------------------- |:---------------------------------------------------------------- |:----------------------------------------------------- |:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |:--------------------------------------------------------- |
| **Polyglot Bible Reader**    | [`apps/polyglot-bible-reader`](apps/polyglot-bible-reader)       | SvelteKit 2, Svelte 5, Tailwind CSS, `sql.js-httpvfs` | Multi-version parallel biblical reader (Hebrew WLC, Greek LXX & SBLGNT, Open Greek NT, Syriac Peshitta, Latin Vulgate, English KJV/WEB/Brenton/Douay-Rheims, Luther 1912 German, Vamvas Modern Greek) with versification alignment, LSJ/BDB lexicons, and concordance search.                     | **Active**                                                |
| **Biblical Lexeme Explorer** | [`apps/biblical-lexeme-explorer`](apps/biblical-lexeme-explorer) | SvelteKit 2, Svelte 5, Tailwind CSS, D3, Chart.js     | Vocabulary acquisition tool with frequency distributions, concordance lookups, word clouds, and unabridged LSJ and BDB lexicons for LXX, BHS, and SBLGNT.                                                                                                                                         | **Active**                                                |
| **Ancient Corpora Reader**   | [`apps/ancient-corpora-reader`](apps/ancient-corpora-reader)     | SvelteKit 2, Svelte 5, `sql.js-httpvfs`               | Consolidated reader for **Apostolic Fathers**, **Philo of Alexandria**, and **Flavius Josephus** with parallel English/Greek/Latin views, paginated concordances, Mangey citations, and Scripture indexes.                                                                                        | **Active**                                                |
| **Suite Portal**             | [`apps/portal`](apps/portal)                                     | SvelteKit 2, Svelte 5                                 | Landing page and navigation directory for all apps across local and production deployment environments.                                                                                                                                                                                           | **Active**                                                |
| **Synoptic Viewer**          | [`apps/synoptic-viewer`](apps/synoptic-viewer)                   | SvelteKit 2, Svelte 5                                 | NT Gospel synoptic comparison based on Kurt Aland's *Synopsis Quattuor Evangeliorum*. Maintained as a submodule but currently deployed as [an external app from external GH pages deployment](https://synopsis.texts.faith), of [remote repository](https://github.com/cbop-dev/synoptic-viewer). | **Active** ([External App](https://synopsis.texts.faith)) |

---

## Workspace Structure

```
polyglot-suite/
├── apps/
│   ├── ancient-corpora-reader/     # Consolidated AF, Philo, and Josephus reader
│   ├── biblical-lexeme-explorer/   # Analytical vocabulary explorer & lexical charts
│   ├── polyglot-bible-reader/      # Multi-version parallel biblical reader
│   ├── portal/                     # Suite landing portal & navigation hub
│   └── synoptic-viewer/            # Gospel synoptic comparison (submodule / external app)
├── packages/                       # Shared monorepo packages
│   ├── ancient-languages/          # Language utilities, diacritic cleaners, highlight stores
│   ├── biblical-data/              # Standardized biblical schemas & client readers
│   ├── data-pipeline/              # Bible data ingestion, TVTMS alignment & SQLite compilation
│   ├── db-vfs/                     # WebAssembly SQLite HTTP-VFS client worker & row parser
│   ├── greek-morphology/           # Ancient Greek lemmatizer, Stanza NLP bridge & solver
│   ├── lemma-ui/                   # Lexeme sidepanel, LSJ/BDB cards, paginated concordance
│   ├── pipeline-core/              # Shared database chunkers, LSJ adapters & cache fetchers
│   ├── theme/                      # Contrast-invariant theme engine & UI controls
│   └── ui/                         # Shared UI buttons, modals, toolbars, reader headers
└── package.json                    # Root npm workspace configuration
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

To initialize submodules (such as `apps/synoptic-viewer`):

```bash
git submodule update --init --recursive
```

### 2. Development

Run individual apps:

```bash
# Start Suite Portal (port 5170)
npm run dev:portal

# Start Polyglot Bible Reader (port 5171)
npm run dev:bible

# Start Biblical Lexeme Explorer (port 5172)
npm run dev:lexeme

# Start Ancient Corpora Reader (port 5173)
npm run dev:corpora
```

Or start all local development servers simultaneously:

```bash
npm run dev
```

### 3. Testing & Type Checks

```bash
# Run unit tests across shared packages
npm run test:packages

# Type-check applications
npm run check:bible
npm run check:corpora
npm run check:lexeme
npm run check:portal
```

---

## Database Management & Releases

Applications query pre-computed SQLite databases in the browser using HTTP range requests (`sql.js-httpvfs`). Large database files are split into small chunks (`.db.00`, `.db.01`, etc.) so users only download the specific pages they view:

- **Polyglot Bible Reader & BLE**: 5MB chunks (`polyglot.db.*`).
- **Ancient Corpora Reader**: 1MB chunks (`af.db.*`, `philo.db.*`, `josephus.db.*`).

Database chunks are not committed to Git. Instead, they are hosted on GitHub Releases and tracked locally via `config.json` in each app's `static/db/` directory.

### 1. Check Database Status

Compare local database versions and chunk availability against GitHub Releases:

```bash
# Check all databases (Bible and Ancient Corpora)
npm run status:db:gh

# Check a specific database
npm run status:db:gh bible       # Polyglot Bible & BLE
npm run status:db:gh corpora     # All Ancient Corpora databases
npm run status:db:gh philo       # Philo of Alexandria (alias for corpora-philo)
npm run status:db:gh fathers     # Apostolic Fathers (alias for corpora-af)
npm run status:db:gh josephus    # Flavius Josephus (alias for corpora-josephus)
```

Status reports:

- **`✅ UP_TO_DATE`**: Local version matches GitHub Releases and chunks are present.
- **`⚠️ LOCAL_AHEAD_UNRELEASED`**: Local `config.json` specifies a newer version not yet published.
- **`📥 RELEASED_CHUNKS_MISSING`**: Release exists on GitHub, but chunks need to be downloaded locally.
- **`⬇️ LOCAL_BEHIND`**: GitHub has a newer release than local `config.json`.

### 2. Download Database Chunks

If chunks are missing locally or after cloning:

```bash
# Download chunks for all databases
npm run pull:db

# Download for specific apps
npm run pull:db:bible
npm run pull:db:corpora

# Or download individual Ancient Corpora databases
npm run pull:db:corpora:af
npm run pull:db:corpora:philo
npm run pull:db:corpora:josephus
```

### 3. Release a New Database Version

> [!NOTE]
> Database releases are only necessary when text sources, morphology, or lexicon data change. Frontend UI updates do not require database releases.

```bash
# Preview release actions without modifying files or uploading:
node scripts/release_db.js bible --dry-run

# Publish a new database version to GitHub Releases:
npm run release:db:bible                  # Bumps patch version
npm run release:db:corpora:af             # Apostolic Fathers
npm run release:db:corpora:philo          # Philo of Alexandria
npm run release:db:corpora:josephus       # Flavius Josephus
```

### 4. Compiling Databases from Source

To compile the master Bible database from raw source texts:

```bash
# Download raw texts and lexicons into cache/
npm run fetch:db

# Compile master SQLite database and generate BLE manifests
npm run build:db

# Slice the database into HTTP-VFS static chunks
npm run chunk:db

# Or run the full pipeline in one command
npm run data:all
```

To compile Ancient Corpora databases (AF, Philo, Josephus):

```bash
python3 apps/ancient-corpora-reader/pipeline/build.py --all
```
