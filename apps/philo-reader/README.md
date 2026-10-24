# Philo Reader

An interactive, high-performance web application—deployable as a static HTML/JavaScript site—for parallel reading, comparative analysis, and morphological study of the complete extant Greek treatises of **Philo of Alexandria (Philo Judaeus, c. 20 BCE – c. 50 CE)** alongside the classic English translation of C. D. Yonge.

The application features synchronized Greek/English columns, Cohn-Wendland section-level navigation, instant lemma and morphological inspection, an interactive biblical citation explorer, full-text and lexical search, and continuous contrast-invariant reading themes.

> [!IMPORTANT]
> *This is an active digital humanities project. While texts and morphological parses are curated from scholarly editions, automated lemmatization may contain occasional discrepancies.* **Always check with reliable critical editions when conducting scholarly research.**

---

## Features

- **Bilingual Parallel Reading**: Synchronized parallel display of Greek text and English translation with independent column toggling.
- **Complete Extant Greek Corpus (31 Treatises)**: In the standard scholarship following **Léopold Massebiau (1889)** and **Leopold Cohn (1899)**, Philo's literary output is categorized into **five principal groups**. Because Category 3 (*Questions and Answers on Genesis and Exodus*) and portions of the others survived only in ancient Armenian translation, our application presents the complete **31 continuous Greek treatises** preserved in direct manuscript transmission and edited in the classic Cohn-Wendland edition (TLG `tlg0018.001`–`031`):
  1. **Allegorical Commentaries on Genesis (19 Greek treatises extant)**: Philo's monumental verse-by-verse philosophical-allegorical exposition of Genesis: *De Opificio Mundi* (Opif.), *Legum Allegoriae I–III* (Leg.), *De Cherubim* (Cher.), *De Sacrificiis Abelis et Caini* (Sacr.), *Quod Deterius Potiori Insidiari Soleat* (Det.), *De Posteritate Caini* (Post.), *De Gigantibus* (Gig.), *Quod Deus Sit Immutabilis* (Deus), *De Agricultura* (Agr.), *De Plantatione* (Plant.), *De Ebrietate* (Ebr.), *De Sobrietate* (Sobr.), *De Confusione Linguarum* (Conf.), *De Migratione Abrahami* (Migr.), *Quis Rerum Divinarum Heres Sit* (Her.), *De Congressu Eruditionis Gratia* (Congr.), *De Fuga et Inventione* (Fug.), *De Mutatione Nominum* (Mut.), *De Somniis I–II* (Somn.).
  2. **Exposition of the Law (7 Greek treatises extant)**: Systematic presentation of the Mosaic legislation for a broader audience, treating the patriarchs as living laws (unwritten nomos) and detailing the commandments: *De Abrahamo* (Abr.), *De Josepho* (Ios.), *De Vita Mosis I–II* (Mos.), *De Decalogo* (Decal.), *De Specialibus Legibus I–IV* (Spec.), *De Virtutibus* (Virt.), *De Praemiis et Poenis* (Praem.). (Note: *De Isaac* and *De Jacob* are lost).
  3. **Questions and Answers on *Genesis* and *Exodus***: *Quaestiones et Solutiones in Genesim et in Exodum* (QG / QE, originally 6 treatises). Preserved **only in ancient Armenian translation** with scattered Greek catena fragments; hence not part of the continuous Greek textual tradition in Cohn-Wendland or this reader.
  4. **Historical and Apologetic Treatises (3 Greek treatises extant)**: Defenses of Jewish religion, history, and community against Hellenistic and Roman persecution: *De Vita Contemplativa* (Contempl. — on the ascetic Therapeutae), *In Flaccum* (Flacc. — against the Roman prefect Flaccus in Alexandria), and *Legatio ad Gaium* (Legat. — the embassy to Emperor Caligula). (Note: the *Hypothetica* / *Apologia pro Judaeis* survives only in excerpts quoted by Eusebius).
  5. **Philosophical Treatises (2 Greek treatises extant)**: Rigorous philosophical treatises engaging Stoic, Platonist, and Peripatetic dialogues: *Quod Omnis Probus Liber Sit* (Prob.) and *De Aeternitate Mundi* (Aet.). (Note: *De Providentia I–II* and *De Animalibus* survived in Armenian).
- **Deep Lexical & Morphological Inspection**: Interactive word clicking with modal display of lemmas, glosses, parts of speech, and comprehensive lexical definitions powered by STEPBible LSJ.
- **Scripture Citation Explorer**: Interactive side panel indexing direct biblical citations and allusions embedded within Philo's writings (Genesis through the Prophets and Writings), linking directly to Philo's text and scriptural references.
- **Fast Search & Concordance**: Instant client-side lemma frequency distributions, occurrences, and full-text search across all 31 treatises.
- **Navigation & Hotkeys**: Searchable treatise and chapter modals, quick-jump command palette (`⌘K`), and intuitive hotkeys (`b` for treatise, `c` for chapter/section, `[` / `]` or arrow keys for navigation).
- **Adaptive Reading Themes**: Smooth, contrast-invariant piecewise color stop interpolation theme engine (`@polyglot/theme`) with light, dark, and sepia palettes plus continuous warmth adjustment.
- **Zero-Backend Static Performance**: Slices a compact SQLite database into 5MB chunks loaded via HTTP Range requests in WebAssembly (`sql.js-httpvfs`), requiring no server runtime or database daemon.

---

## Data Provenance & Upstream Sources

All data assets are derived from open datasets allowing academic, educational, and non-commercial study. For complete legal notices, see [LICENSES.md](LICENSES.md).

### Upstream Sources & Credits

- **Greek Critical Text**:
  - Base edition: Leopold Cohn and Paul Wendland, eds., *Philonis Alexandrini Opera Quae Supersunt* (Berlin: Georg Reimer, 6 vols., 1896–1915; index vols. by J. Leisegang, 1926–1930; Public Domain worldwide).
  - Lemmatized XML transcription: Prepared and morphologically tagged by Giuseppe Celano ([LemmatizedAncientGreekXML on GitHub](https://github.com/gcelano/LemmatizedAncientGreekXML), CC BY-SA 4.0).
- **English Translation**:
  - Translator: Charles Duke Yonge, *The Works of Philo Judaeus, the Contemporary of Josephus, Translated from the Greek* (London: H. G. Bohn, 4 vols., 1854–1855; Public Domain worldwide).
  - Digital transcription & alignment: Digitized in TEI XML and aligned to Cohn-Wendland section numbers by the Open Greek and Latin Project / First1KGreek ([First1KGreek on GitHub](https://github.com/OpenGreekAndLatin/First1KGreek), CC BY-SA 4.0).
- **Lexica & Dictionaries**:
  - STEPBible Tyndale Fellowship LSJ Greek Lexicon (TFLSJ) based on Liddell-Scott-Jones (*A Greek-English Lexicon*, Oxford: Clarendon Press, 1940; Public Domain / CC BY-NC 4.0).
- **UI & Reading Theme Engine**:
  - Contrast-invariant piecewise color stop interpolation theme engine from `@polyglot/theme` (adapted from OpenScriptorium, ISC License).
- **AI Engineering & Tooling**:
  - Built with Google DeepMind's Antigravity, leveraging Gemini and Claude foundation models for rapid full-stack iteration.

---

## Licensing Terms

This project employs a dual-licensing structure to clearly separate software code from scholarly texts and derived data:

- **Application Software**: Licensed under the **[GNU Affero General Public License v3.0 (AGPL-3.0)](../../apps/polyglot-bible-reader/LICENSE)**. Covers all SvelteKit UI components, client-side store logic, search services, build scripts, and pipeline tooling.
- **Data Assets & Derived SQLite Database**:
  - Historical Greek text and English translation are in the **Public Domain**.
  - Lemmatization, morphological alignments, TEI XML structures, and derived database indexes are licensed under **[Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)**.

For complete details, see [LICENSES.md](LICENSES.md).

---

## Development & Building

The project consists of two components:
1. **Data Pipeline (`pipeline/`)**: Offline Python build system that downloads upstream XMLs, validates alignment, compiles the SQLite database, and creates HTTP-VFS chunks in `static/db/`.
2. **Web Application (`src/`)**: SvelteKit client-side application loading the database chunks through WebAssembly.

> Note: The compiled database chunks in `static/db/` are checked into the repository or release assets, so running the Python pipeline is only necessary if updating or rebuilding the source data.

### 1. Web Application (SvelteKit)

```bash
# From repository root or apps/philo-reader:
npm install

# Start local development server with hot-module reload
npm --workspace=philo-reader run dev

# Run TypeScript and Svelte diagnostics
npm --workspace=philo-reader run check

# Build production bundle (Node adapter)
npm --workspace=philo-reader run build

# Build static bundle for web hosting / GitHub Pages
npm --workspace=philo-reader run build:www

# Preview the static build locally
npm --workspace=philo-reader run preview:www
```

### 2. Data Pipeline (`pipeline/`)

The Python pipeline processes the 31 treatises, resolves Celano XML tags and Yonge section numbers, indexes lemmas and scripture citations, and outputs `static/db/philo.db.*` with `config.json`.

```bash
# Prerequisites: Python 3.10+
cd apps/philo-reader

# Fetch upstream XML texts and lexicons:
python3 -m pipeline.fetcher

# Build the working SQLite database, chunk it, and export canonical TypeScript config:
python3 -m pipeline.build --all

# Or run individual pipeline steps:
python3 -m pipeline.build --build-db   # Compile pipeline/build/philo-working.sqlite3
python3 -m pipeline.build --chunk      # Slice SQLite DB into 5MB chunks in static/db/
python3 -m pipeline.build --export-ts  # Synchronize src/lib/config/canonicalWorks.generated.ts
```

---

## Disclaimer

- This application is provided for educational and research purposes.
- Lemmatization, morphological analyses, and alignment data are derived from automated and semi-automated academic corpora; verify all citations against printed critical editions before citing in publication.
