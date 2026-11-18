# Ancient Languages Toolkit (`@polyglot/ancient-languages`)

Shared linguistic utilities, orthographic normalizers, citation builders, and reactive highlight stores for ancient Greek, Hebrew, Aramaic, Syriac, and Latin.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

`@polyglot/ancient-languages` is the shared language processing library used across all readers in the Polyglot Suite. It provides orthographic normalizers, citation generators, font configurations, and Svelte 5 reactive stores for highlighting parallel texts.

---

## Features & Modules

### 1. Greek Utilities (`greek-utils.js`)
- **Polytonic Diacritic Stripping**: Strips accents, breathings, and iota subscripts for fast search and sorting.
- **Oxia-to-Tonos Conversion**: Normalizes legacy polytonic Greek characters to standardized Modern Greek Tonos Unicode equivalents.
- **Beta Code Translation**: Bidirectional conversion between Greek polytonic script and standard ASCII Beta Code.

### 2. Hebrew Utilities (`hebrew-utils.js`)
- **Consonantal Normalization**: Strips Niqqud (vowel points) and Cantillation (Te'amim / accents).
- **Sof Pasuq & Punctuation**: Cleans verse-ending markers and punctuation for uniform string matching.
- **Transliteration**: Phonetic transliteration into readable Latin characters.

### 3. Academic Citation Services (`citations/`)
Standardized citation builders for scholarly referencing:
- **Biblical**: Formats canonical references (e.g., `Gen 1:1`, `Matt 5:3`).
- **Philo of Alexandria**: Formats Cohn-Wendland treatise and section citations, Mangey volume/page references, and critical apparatus citations.
- **Flavius Josephus**: Formats Benedikt Niese sections and William Whiston volume/book/chapter references.
- **Apostolic Fathers**: Formats Kirsopp Lake Loeb Classical Library and J.B. Lightfoot citations.

### 4. Reactive Highlight Store (`stores/highlightStore.svelte.ts`)
A Svelte 5 rune-based store (`$state`) managing parallel text highlighting:
- Maps lemmas to 16 distinct contrast-invariant palette colors.
- Automatically synchronizes word highlights across parallel columns when clicking words in any reader.
- Provides accent-insensitive matching so inflected and unaccented variants highlight simultaneously.

### 5. UI Components (`components/`)
- `HighlightColorPicker.svelte`: Color palette selector for custom word highlights.
- `InflectionFilterBar.svelte`: Filter chips for attested grammatical forms.
- `AttestedFormsSection.svelte`: Grid view of attested surface forms for a lemma.
- `KwicSnippet.svelte`: Keyword-in-Context (KWIC) concordance snippet renderer.

---

## Usage

```typescript
import { GreekUtils, HebrewUtils } from '@polyglot/ancient-languages';
import { highlightStore } from '@polyglot/ancient-languages/highlightStore';

// Normalize Greek search strings
const plain = GreekUtils.removeDiacritics('λόγος'); // 'λογος'

// Strip Hebrew vowels and cantillation
const consonants = HebrewUtils.stripNiqqud('בְּרֵאשִׁ֖ית'); // 'בראשית'

// Toggle word highlighting
highlightStore.toggleHighlight('λόγος');
```

---

## Testing

Run unit tests via the repository root:
```bash
npm run test:packages
```
