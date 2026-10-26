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
