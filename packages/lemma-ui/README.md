# Lexical UI Components (`@polyglot/lemma-ui`)

Reusable Svelte 5 lexical inspection sidepanels, scholarly dictionary cards (LSJ, BDB, SEDRA), and paginated concordance views.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

`@polyglot/lemma-ui` provides shared Svelte 5 components for lexical analysis across the Polyglot Suite readers (Polyglot Bible Reader, Biblical Lexeme Explorer, and Ancient Corpora Reader).

When a user clicks any word in a text column, these components handle:
- Displaying grammatical analysis (part of speech, inflected forms).
- Rendering unabridged dictionary entries with academic typography.
- Visualizing corpus frequency distributions using Chart.js.
- Browsing paginated concordance occurrences with Keyword-in-Context (KWIC) snippets.

---

## Components

### 1. `LexemeSidePanel.svelte`
The main dockable sidepanel container. Slides in from the edge of the viewport or docks alongside parallel reading columns. Manages tab switching between Dictionary, Word Statistics, Attested Forms, and Concordance Occurrences.

### 2. Dictionary Entry Renderers
- **`LSJEntry.svelte`**: Formats Greek lexical entries from the Liddell-Scott-Jones lexicon, parsing abbreviations, citation references, and sub-definitions.
- **`BDBEntry.svelte`**: Formats Hebrew and Aramaic entries from Brown-Driver-Briggs, preserving consonantal keys, root relationships, and Strong's numbers.
- **`SEDRAEntry.svelte`**: Formats Classical Syriac lexical entries from the Beth Mardutho SEDRA database.

### 3. `LemmaInfo.svelte`
Word overview card presenting:
- Standard lemma headword with phonetic transliteration.
- Primary English gloss and Strong's ID badge.
- Occurrence counts across the active book and entire corpus.
- Interactive Chart.js frequency distribution histograms.

### 4. `TextsDisplay.svelte`
High-performance paginated concordance viewer. Displays contextual verses and sections where a lemma occurs, with highlighted search terms and jump links that navigate the active reader to the target passage.

---

## Usage

```svelte
<script lang="ts">
  import { LexemeSidePanel } from '@polyglot/lemma-ui';

  let activeLemma = $state('λόγος');
  let isOpen = $state(true);
</script>

<LexemeSidePanel
  bind:open={isOpen}
  lemma={activeLemma}
  corpusId="swete_lxx"
  onClose={() => isOpen = false}
/>
```
