# Project Licenses & Data Attribution

This repository follows a dual-licensing model to distinguish between the **application source code** and the **underlying biblical datasets, lexica, and static data transformations**.

---

## 1. Summary of Licenses

| Component | License | License File | Description |
|---|---|---|---|
| **Application Software** | **GNU AGPL v3.0** | [LICENSE](LICENSE) | Covers all frontend UI code, engine logic, extraction scripts, and test suites. |
| **Data & Static Assets** |
|Everything except BHS | **CC BY-SA 4.0** | [LICENSE-DATA](LICENSE-DATA) | Covers all static Bible text data except the BHS data|
|BHS text, lemma and morphology data|[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)||Commercial use prohibited.|

---

## 2. Scope of Application

### Software Code ([GNU AGPL v3.0](LICENSE))
The GNU Affero General Public License v3.0 governs all executable source code, scripts, build configurations, and tests in this project, including:
- `src/` — SvelteKit application routes, components, state stores, and client engines (`VocabEngine.js`, `StaticDatasetProvider.js`, `LsjProvider.js`).
- `pipeline/` — Autonomous Swete Septuagint morphology ingestion, neural parsing, gazetteer, and data emission pipeline.
- `scripts/` — Dictionary build scripts (`build_lsj_dictionary.js`).
- `tests/` — Vitest unit and integration test suites.
- Root configuration files (`package.json`, `svelte.config.js`, `vite.config.js`).


### Data Transformations & Static Assets ([CC BY-SA 4.0](LICENSE-DATA))
The Creative Commons Attribution-ShareAlike 4.0 International License governs the processed static data assets and indexes generated for runtime search and visualization, including:
- `static/data/lxx/` — Septuagint static datasets (`lexemes.json`, `sections.json`, `concordance.json`, `books.json`, `verses.json`, and `books/*.json`).
- `src/lib/lxx/lxxLexes6.json` — Pre-compiled client-side search index for fast lemma lookup.
- `static/data/dictionary/` — Sharded LSJ Greek-English dictionary files.
- `static/data/bhs/` — Hebrew Bible dataset files.
- `static/data/sblgnt/` — Greek New Testament dataset files.

---

## 3. Upstream Data Provenance & Attribution

The developer(s) is(are) grateful to the digital humanities projects whose open licensed datasets make this work possible:

### Septuagint (LXX)
1. **Henry Barclay Swete Septuagint Edition (1887–1912, reprint 1930)**
   - **License**: **Public Domain worldwide** (published 1887–1912, reprint 1930, author Henry Barclay Swete died 1917; fully unencumbered public domain under US, EU, and international copyright).
   - **Source**: Henry Barclay Swete, *The Old Testament in Greek according to the Septuagint* (Cambridge University Press, 3 vols., 1887–1912, reprint 1930).
   - **Digital Transcription**: Digitized by Eliran Wong and collaborators ([eliranwong/LXX-Swete-1930](https://github.com/eliranwong/LXX-Swete-1930)), dedicated to the public domain.
   - **Lemmatization & Morphology Pipeline**: Built with an open-source neural NLP and constraint-satisfaction pipeline (`pipeline/swete_morphology`) using Stanza Ancient Greek (PROIEL model), proper-name gazetteer heuristics, and lexical normalization rules.
   - **Benchmarking & Validation**: During pipeline development, predictions were evaluated and benchmarked against the [OpenScriptorium/lxx-morph](https://github.com/OpenScriptorium/lxx-morph) dataset (CC BY 4.0), but no data from OpenScriptorium was incorporated into this application's dataset.

2. **Open Scriptures Project**
   - **License**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
   - **Repository**: [https://github.com/openscriptures/GreekResources](https://github.com/openscriptures/GreekResources)
   - **Components**: `GreekWordList.js` and `gwl2AsLookups.js`.
   - **Attribution Statement**: Lexeme gloss alignments and Strong's Concordance mappings provided by the Open Scriptures Septuagint Project.

3. **Abbott-Smith Manual Greek Lexicon (1922)**
   - **License**: **Public Domain**
   - **Source**: G. Abbott-Smith, *A Manual Greek Lexicon of the New Testament* (New York: Scribner's, 1922).
   - **Digital Edition**: TEI XML edition by [translatable-exegetical-tools/Abbott-Smith](https://github.com/translatable-exegetical-tools/Abbott-Smith).

4. **Liddell-Scott-Jones (LSJ) & Middle Liddell**
   - **License**: **Public Domain**
   - **Source**: H.G. Liddell, R. Scott, H.S. Jones, *A Greek-English Lexicon* (Oxford: Clarendon Press, 1940) and *A Lexicon: Abridged from Liddell and Scott's Greek-English Lexicon* (1889).
   - **Digital Editions**: Perseus Digital Library (Tufts University) and Logeion / University of Chicago CEX edition (Giuseppe Celano).
      - NB: Although the version used by the Chicago CEX edition is that of 1940, [the University of Chicago *Logeion* treats this source data as public domain](https://logeion.uchicago.edu/about), likely because it is so treated in the UK:
      > For full-text searches of the dictionaries (where in LSJ do we find reference to Xenophon's Anabasis, where is λόγος used in any entry, not just in the entry for λόγος), use the links in the list of sources below. Full-text search is only possible for the reference works that are fully in the public domain.


### Hebrew Bible (BHS)
1. **ETCBC / Text-Fabric**: Hebrew morphological dataset developed by the Eep Talstra Centre for Bible and Computer (Vrije Universiteit Amsterdam).
   - **Source**: The Eep Talstra Centre for Bible and Computer's [Biblia Hebraica Stuttgartensia (Amstelodamensis) project on github](https://github.com/ETCBC/bhsa)
   - **License**: [Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

### Greek New Testament (SBLGNT)
1. **SBL Greek New Testament**: Edited by Michael W. Holmes, Copyright 2010 Society of Biblical Literature and Logos Bible Software ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).
2.  **MorphGNT**: Morphological parsing by James Tauber ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)).

### UI & Ergonomic Tools
1. **OpenScriptorium Reading Theme Architecture**:
  - **License**: [ISC License](https://opensource.org/licenses/ISC)
  - **Source**: [https://openscriptorium.org](https://openscriptorium.org)
  - **Description**: Contrast-invariant piecewise color stop interpolation algorithm and sliding scale reading theme selector concept.

### AI Engineering & Development Tools
1. **Google DeepMind Antigravity 2.0 & Gemini**:
  - The application developer used Google DeepMind's Antigravity 2.0 and Gemini models in the development of this project.

---

## 4. Third-Party Code & Dependencies

Third-party software libraries consumed via `package.json` (such as Svelte, SvelteKit, Vite, Chart.js, Grid.js, D3, and related plugins) remain subject to their respective open-source licenses (typically MIT, Apache-2.0, or BSD). Consult `package.json` and the corresponding node package documentation for individual dependency licenses.
