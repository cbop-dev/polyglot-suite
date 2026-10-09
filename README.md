# Polyglot Suite

Monorepo workspace for ancient language readers, lexical engines, and comparative textual tooling.

## Apps

| Application | Path | Technology | Description |
| :--- | :--- | :--- | :--- |
| **Polyglot Bible Reader** | [`apps/polyglot-bible-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/polyglot-bible-reader) | SvelteKit 5, Tailwind CSS, `sql.js-httpvfs` | Multi-corpus biblical reader (Hebrew MT, Greek LXX, Greek SBLGNT, Latin Vulgate, English KJV/NET/Brenton) with TVTMS alignment, LSJ/BDB lexicons, and concordance search. |
| **Josephus Reader** | [`apps/josephus-reader`](file:///home/cbrannan/dev/2-tmp/polyglot-suite/apps/josephus-reader) | Astro, Svelte 5, SQLite | Parallel Greek and English reader for Flavius Josephus (*Jewish War*, *Antiquities*, *Life*, *Against Apion*). |
| **Apostolic Fathers Reader** *(Upcoming)* | `apps/apostolic-fathers-reader` | SvelteKit 5, `sql.js-httpvfs` | Trilingual Greek, Latin, and English reader for the 15 Apostolic Fathers works, with LSJ definitions, lemma search, and multi-color highlighting. |

## Workspace Structure

```
polyglot-suite/
├── apps/
│   ├── polyglot-bible-reader/    # Imported via git subtree from cbop-dev/polyglot-bible-reader
│   ├── josephus-reader/          # Imported via git subtree from cbop-dev/josephus-reader
│   └── apostolic-fathers-reader/ # Forthcoming
├── packages/                     # Shared packages (Phase 2 extraction)
│   ├── reader-core/              # WASM SQLite HTTP-VFS client & theme engine
│   ├── lemma-ui/                 # Lemma modals, lexicon viewers (LSJ, Lewis & Short, BDB)
│   ├── search-engine/            # Lemma search panel, transliteration, highlighting store
│   └── pipeline-toolkit/         # Python builders, chunkers, and concordance indexers
└── package.json                  # Root npm workspace configuration
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

# Start Josephus Reader
npm run dev:josephus
```

### Git Subtree Maintenance

The applications in `apps/` retain their upstream commit histories. To sync changes to/from upstream remotes:

```bash
# Pull changes from upstream polyglot-bible-reader
git subtree pull --prefix=apps/polyglot-bible-reader polyglot-bible-reader main

# Pull changes from upstream josephus-reader
git subtree pull --prefix=apps/josephus-reader josephus-reader v1.0
```
