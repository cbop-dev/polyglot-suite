# Josephus Reader — Comprehensive Project State & Architecture

**Document Path**: `docs/ai/ag/project_state.md`  
**Last Updated**: 2026-09-15  
**Target Repository**: `josephus-reader`

---

## 1. Project Overview & Scope

The **Josephus Bilingual Reader** is an interactive, high-performance web application designed for reading, studying, searching, and analyzing the complete corpus of Flavius Josephus in parallel Polytonic Greek (Niese/Naber critical text) and English (William Whiston translation).

### Corpus Details (30 Books across 4 Works)
1. **Antiquities of the Jews** (*Antiquitates Judaicae*, `Antiquities`): 20 Books (§ 1–historical end)
2. **The Jewish War** (*Bellum Judaicum*, `War`): 7 Books
3. **The Life of Flavius Josephus** (*Vita*, `Life`): 1 Book
4. **Against Apion** (*Contra Apionem*, `Apion`): 2 Books

### Technology Stack
* **Frontend Framework**: [Astro](https://astro.build/) (Static Site Generation / MPA Shell)
* **UI & Component Layer**: [Svelte 5](https://svelte.dev/) (Client interactivity, runes `$state`, `$derived`, `$effect`)
* **Styling**: Vanilla modern CSS with design tokens, CSS variables, and light/dark/sepia themes
* **Data Processing Pipeline**: Python 3 (TEI XML extraction, morphological analysis, lemma aggregation, concordance index generation)
* **PDF Engine**: Client-side `jsPDF` + `html2canvas` (Zero server dependencies, full polytonic Greek support)
* **Hosting / Delivery**: Dual build paths for GitHub Pages and VPS (Stack-based releases with rollback capability)

---

## 2. Directory & Component Architecture

```
josephus-reader/
├── app/                                 # Astro Frontend Application
│   ├── astro.config.mjs                 # Astro configuration (base path, Vite outDir)
│   ├── package.json                     # App-specific dependencies
│   ├── public/
│   │   └── data/                        # Processed corpus datasets
│   │       ├── lemmata/                 # Partitioned lemma occurrence shards (alpha.json, etc.)
│   │       ├── lemmata_index.json       # Master index of sanitized dictionary headwords
│   │       └── search/                  # Full-text and metadata search indices
│   └── src/
│       ├── components/
│       │   └── ReaderShell.astro        # Base reader layout, navigation bars, mobile drawer
│       └── pages/
│           ├── index.astro              # Landing / Work selection page
│           ├── [work]/book/[book].astro # Dynamic bilingual book reader page
│           ├── lemma/index.astro        # Lemma concordance fallback view
│           └── search/index.astro       # Corpus search view
├── docs/
│   └── ai/
│       └── ag/                          # AI agent instructions, state, and handover docs
│           └── project_state.md         # This document
├── pipeline/                            # Python Data Processing & Indexing Pipeline
│   └── josephus_pipeline/
│       ├── stage1_extract.py            # TEI XML parser for Greek & English sections
│       ├── stage2_align.py              # Section-level and sentence alignment
│       ├── stage3_morph.py              # Greek morphological analysis & LSJ lemmatization
│       ├── stage6_search.py             # Full-text search and lemma norm extraction
│       └── stage7_emit.py               # Dataset emission, sharding & multi-work merging
├── raw_xml/                             # Upstream Perseus TEI XML source files
├── scripts/                             # Deployment and release management scripts
│   ├── deploy_vps.sh                    # Direct VPS synchronization script
│   └── release_www.sh                   # Versioned release generator with stack history
├── shared/                              # Shared Svelte 5 Components & TS Libraries
│   ├── components/
│   │   ├── LemmaModal.svelte            # Overlay modal for corpus-wide lemma occurrences
│   │   ├── Reader.svelte                # Core interactive reading canvas & synchronized scroll
│   │   ├── SearchModal.svelte           # Full-text and lemma search overlay modal
│   │   └── WordPopup.svelte             # Word inspection popup: morph, LSJ def, highlights, attested forms
│   ├── lib/
│   │   ├── highlights.ts                # Highlight engine (multi-lemma, multi-form, HSL palette)
│   │   ├── palette.ts                   # Color generation & golden-ratio HSL expansion
│   │   └── types.ts                     # TypeScript definitions for words, lemmas, occurrences
│   └── styles/
│       └── global.css                   # Global CSS tokens, typography, and highlight classes
├── package.json                         # Root build and orchestration scripts
└── tsconfig.json                        # Root TypeScript configuration
```

---

## 3. Major Implemented Subsystems & Features

### 3.1 Corpus Search & Lemma Sanitization
* **Problem Solved**: Unparsed inflected word forms (`ἔμελλον`, `μέλλουσιν`, `μέλλον`) were previously contaminating `lemmata_index.json` as standalone headwords, resulting in duplicate search results.
* **Pipeline Sanitization (`stage6_search.py`, `stage7_emit.py`)**:
  * Corrected `lemma_norm` fallback from `strip_accents(w)` (inflected word) to `strip_accents(lemma)` (dictionary headword).
  * Filtered `lemmata_index.json` during emission against master recognized dictionary entries. Index reduced from 37,520 entries to ~16,700 true dictionary headwords.
* **Attested Forms in `WordPopup.svelte`**:
  * Added a collapsible `<details class="dict-details">` section: *"Attested Forms of [Lemma] in Josephus ([Count])"*.
  * Fetches unique inflected forms of the current word's parent lemma on demand via `fetchLemmaData()`.
  * Displays forms as interactive chip buttons with one-click exact-form highlight toggles across the corpus.
* **Collapsible Occurrence Groups**:
  * In both `SearchModal.svelte` and `LemmaModal.svelte`, passage occurrences are grouped into `<details open>` disclosures by Work (*Antiquities*, *War*, *Life*, *Apion*) and Book, allowing quick navigation and collapsible browsing.

### 3.2 Multi-Work Lemma Concordance Engine
* **Emission Merging (`stage7_emit.py`)**:
  * Implemented `save_merged_lemmata_json()` to cleanly merge occurrence lists across all 4 works when generating shards in `app/public/data/lemmata/{bucket}.json`, ensuring no work overwrites another.
* **`LemmaModal.svelte`**:
  * Built as a native Svelte 5 overlay modal component.
  * Replaced full-page navigations when clicking *"See occurrences across Josephus →"* in `WordPopup.svelte`, maintaining reader position and scroll context.

### 3.3 Multi-Lemma & Multi-Form Highlighting Engine
* **Highlight Architecture (`shared/lib/highlights.ts`)**:
  * Manages two coexisting highlight layers:
    1. **Lemma Highlights**: Softer HSL tint applied to all inflected forms of a lemma.
    2. **Form Highlights**: Saturated, bold HSL glow applied strictly to an exact surface form.
  * Form and Lemma highlights for the same root word share the same HSL color family.
  * Persists across all books via `localStorage` under key `josephus_reader_highlights`.
  * Broadcasts window events (`reader-highlights-changed`) to synchronize reader text, menu badges, and popup buttons.
* **Dynamic Inflection Matching (`ensureLemmaFormSet`)**:
  * Dynamically fetches `/data/lemmata/{bucket}.json` to build an in-memory `Set<string>` of all attested inflections for an active lemma.
  * Enables $O(1)$ lookup matching irregular verbs (e.g. `λέγω` -> `εἶπον`), augment variations, and dialectal forms without client-side parsing overhead.
* **Tactile UI Controls**:
  * Interactive toggle pills directly inside `WordPopup.svelte` with live `--btn-hue` styling and checkmark badges.
  * Dedicated **Highlights (N)** counter badge in the mobile slide-out drawer (`Reader.svelte` / `ReaderShell.astro`) with a modal to review or clear active highlights.

### 3.4 Direct Client-Side PDF Generator
* **Engine**: Pure client-side `jsPDF` combined with high-resolution `html2canvas` (2.5x device pixel ratio).
* **Direct Download**: Completely bypasses browser `window.print()` dialogs; 100% compatible with mobile browsers (iOS Safari and Android Chrome).
* **Layout Modes**:
  1. **Facing Pages**: Generates multi-page PDF spreads where Page 1 is Greek and Page 2 is Whiston English.
  2. **2-Column Parallel**: Renders Greek and English in synchronized side-by-side columns on the same page.
* **Polytonic Greek Glyph Accuracy**: Uses `await document.fonts.ready` prior to canvas capture to prevent font substitution or character corruption of Greek diacritics.

### 3.5 Deployment & Release Pipeline
* **Dual Target Architecture**:
  * `npm run build:app`: Fast static compile (~2s) targeting `build/app/` for direct VPS synchronization (`npm run deploy:vps`).
  * `npm run build:www:app`: Target for versioned staging and live releases (`build/www/`).
* **Stack-Based Live History Workflow**:
  * Release folders stored under `releases/YYYYMMDD_HHMMSS/`.
  * Automatic pruning maintains the 5 newest releases while strictly protecting targets in `staging`, `live`, or `live_history.txt`.
  * Rollback command (`npm run rollback:www`) pops the top of the history stack and repoints the `live` symlink.
* **Repository Optimization**:
  * Untracked ~209 MB of build artifacts (`build/`, `static/data/`, `sources/`) from Git tracking.
  * Configured GitHub Actions (`.github/workflows/deploy.yml`) to automatically compile and deploy to GitHub Pages on push to `v1.0`.

---

## 4. Key Workflows & CLI Commands

### Development
```bash
# Start Astro development server
npm run dev

# Run development server with base path
npm run dev:gh
```

### Data Pipeline (Python)
```bash
# Run full ingestion, lemmatization, and emission pipeline
PYTHONPATH=pipeline python3 -m josephus_pipeline all

# Re-run specific pipeline stages
PYTHONPATH=pipeline python3 -m josephus_pipeline extract
PYTHONPATH=pipeline python3 -m josephus_pipeline align
PYTHONPATH=pipeline python3 -m josephus_pipeline search
PYTHONPATH=pipeline python3 -m josephus_pipeline emit
```

### Building
```bash
# Standard local/VPS frontend build (outputs to build/app)
npm run build:app

# Versioned release build (outputs to build/www)
npm run build:www:app

# Full pipeline rebuild + frontend build
npm run build
```

### Deployment & Release Management (`:www` Stack)
```bash
# Deploy to staging (creates timestamped release, auto-cleans old releases)
npm run deploy:www

# Quick deploy to staging (syncs existing build/www without rebuild)
npm run deploy:www:quick

# Promote staging release to live
npm run deploy:www:promote

# Rollback live site to previous release
npm run rollback:www

# View active release targets and live_history.txt stack
npm run deploy:www:history

# Manually clean unreferenced old releases
npm run deploy:www:clean

# Deploy directly to VPS
npm run deploy:vps
```

---

## 5. Coding Standards & Implementation Rules

1. **Greek Diacritic Handling**:
   * Stored keys in search indices and highlight maps strip diacritics/accents.
   * **Always use `normalizeKey()`** from `shared/lib/highlights.ts` when indexing, querying, or comparing Greek words to prevent accented/unaccented lookup mismatches.
2. **Svelte 5 Runes**:
   * All shared components use Svelte 5 syntax:
     * Use `$state()` for reactive variables.
     * Use `$derived()` for computed properties.
     * Use `$effect()` for DOM/window side effects.
     * Do **not** use legacy Svelte 3/4 `let` reactivity or `$:`.
3. **Modal & Overlay Conventions**:
   * Modals (`LemmaModal.svelte`, `SearchModal.svelte`) must provide an `Escape` key listener, a backdrop click-to-dismiss handler, and clean z-index separation (`z-index: 1000+`).
4. **Data Output Paths**:
   * Active runtime datasets are output to `app/public/data/` (e.g. `app/public/data/lemmata/` and `app/public/data/lemmata_index.json`).
   * The `static/data/` directory is legacy/deprecated and ignored by Git. Do not emit files there.
5. **PDF Layout Sizing**:
   * Keep print/PDF generation isolated to the active section/chapter (§ 1–4) to prevent memory exhaustion when compiling long books.
