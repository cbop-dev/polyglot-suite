# Project Licenses & Data Attribution

This repository follows a dual-licensing model to clearly delineate between the **application source code** and the **underlying historical texts, translations, lexica, and static data transformations**.

---

## 1. Summary of Licenses

| Component | License | Description |
|---|---|---|
| **Application Software** | **GNU AGPL v3.0** | Covers all frontend UI components, navigation logic, SvelteKit stores, build scripts, and Python pipeline code. |
| **Data & Static Assets** |
| Cohn-Wendland Greek Critical Edition (1896–1915) | **Public Domain** | Primary Greek text of the 31 extant treatises of Philo. Published 1896–1915; fully in the Public Domain worldwide. |
| C. D. Yonge English Translation (1854–1855) | **Public Domain** | English translation of Philo's treatises. Published 1854–1855; fully in the Public Domain worldwide. |
| Celano Lemmatized Ancient Greek XML | **CC BY-SA 4.0** | Morphological parses, lemma annotations, and XML structure prepared by Giuseppe Celano. |
| First1KGreek Aligned TEI XML | **CC BY-SA 4.0** | TEI XML digital transcription and section-level alignment of Yonge's translation prepared by the Open Greek and Latin Project. |
| STEPBible TFLSJ Greek Lexicon | **CC BY-NC 4.0** | STEPBible Tyndale Fellowship LSJ lexicon definitions and glosses derived from Liddell-Scott-Jones. |
| Static SQLite Database & Search Indexes | **CC BY-SA 4.0** | Pre-computed database chunks (`static/db/`), concordance indexes, and scripture citation tables. |

---

## 2. Scope of Application

### Software Code ([GNU AGPL v3.0](https://www.gnu.org/licenses/agpl-3.0.html))
The GNU Affero General Public License v3.0 applies to all original source code, styling, and build pipelines in this project, including:
- `src/` — SvelteKit application routes, components, reading viewports, search panels, and reactive stores.
- `pipeline/` — Python extraction, validation, SQLite compilation, and chunking scripts.
- `scripts/` — Deployment and utility scripts.
- Build configurations (`svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `package.json`).

### Data Assets & Derived Database ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/))
The Creative Commons Attribution-ShareAlike 4.0 International License applies to the compiled static assets and transformations:
- `static/db/` — Sliced HTTP-VFS SQLite database (`philo.db.*`) containing indexed verses, lemmas, concordance statistics, and biblical citations.
- `src/lib/config/canonicalWorks.generated.ts` — Synchronized catalog of treatises and section boundaries.

---

## 3. Upstream Data Provenance & Attribution

We gratefully acknowledge the scholars and digital humanities projects whose open datasets make this reader possible:

### Cohn-Wendland Greek Critical Edition
- **Edition**: Leopold Cohn and Paul Wendland, eds., *Philonis Alexandrini Opera Quae Supersunt* (Berlin: Georg Reimer, 6 vols., 1896–1915; index volumes by J. Leisegang, 1926–1930).
- **Status**: **Public Domain worldwide** (published >95 years ago; editors deceased >70 years ago).
- **Coverage**: The definitive scholarly critical edition of Philo's extant Greek corpus, establishing the standard book and section divisions used in modern classical scholarship.

### Celano Lemmatized Ancient Greek XML
- **Curator**: Giuseppe G. A. Celano.
- **Repository**: [gcelano/LemmatizedAncientGreekXML on GitHub](https://github.com/gcelano/LemmatizedAncientGreekXML).
- **CTS URN**: `urn:cts:greekLit:tlg0018` (Philo of Alexandria, treatises `tlg001` through `tlg031`).
- **License**: [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
- **Description**: Machine-actionable XML editions providing token-by-token normalized forms, lemmas, and part-of-speech tags based on Cohn-Wendland.

### C. D. Yonge English Translation
- **Edition**: Charles Duke Yonge, *The Works of Philo Judaeus, the Contemporary of Josephus, Translated from the Greek* (London: H. G. Bohn, 4 vols., 1854–1855).
- **Status**: **Public Domain worldwide**.
- **Digital TEI XML**: Curated by the Open Greek and Latin Project under the [First1KGreek project](https://github.com/OpenGreekAndLatin/First1KGreek) ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), aligning Yonge's translation chapters to Cohn-Wendland sections.

### STEPBible Tyndale Fellowship LSJ Lexicon (TFLSJ)
- **Source**: STEPBible.org and Tyndale House, Cambridge ([STEPBible-Data on GitHub](https://github.com/STEPBible/STEPBible-Data)).
- **Base Work**: H. G. Liddell, R. Scott, H. S. Jones, *A Greek-English Lexicon* (Oxford: Clarendon Press, 1940; Public Domain / CC BY-NC 4.0).
- **License**: [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).
- **Usage**: Provides contextual English glosses, definitions, and headword linking for Greek lemmas encountered in Philo's text.

### UI & Reading Theme Engine
- **Engine**: Continuous contrast-invariant theme engine in `@polyglot/theme`.
- **Inspiration**: Concept and piecewise interpolation algorithms adapted from OpenScriptorium ([OpenScriptorium.org](https://openscriptorium.org), ISC License).

### AI Engineering & Development Tools
- Developed with Google DeepMind's Antigravity, employing Gemini and Claude models as collaborative pair-programming assistants.

---

## 4. Third-Party Code & Libraries

Third-party open-source libraries incorporated into this project through `package.json` remain governed by their respective licenses:
- **Svelte & SvelteKit**: [MIT License](https://github.com/sveltejs/svelte/blob/main/LICENSE.md)
- **Vite & @tailwindcss/vite**: [MIT License](https://github.com/vitejs/vite/blob/main/LICENSE)
- **sql.js-httpvfs**: [MIT License](https://github.com/phiresky/sql.js-httpvfs/blob/master/LICENSE)
- **Chart.js & svelte-chartjs**: [MIT License](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md)
- **Showdown**: [MIT License](https://github.com/showdownjs/showdown/blob/master/LICENSE)
