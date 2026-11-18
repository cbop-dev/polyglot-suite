# Reading Theme Engine (`@polyglot/theme`)

Continuous, piecewise contrast-invariant theme engine and UI controls adapted from OpenScriptorium.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

`@polyglot/theme` provides color calculation algorithms and UI components for comfortable long-form reading of ancient texts. 

Rather than relying on discrete light and dark mode toggles, it implements continuous color stop interpolation. As the user moves the theme slider, colors transition smoothly between pure paper white, warm sepia, dim parchment, and dark OLED black, while mathematical contrast invariant curves guarantee legible text contrast ratios across all slider positions.

---

## Features & Modules

### 1. Mathematical Contrast Engine (`core.ts`)
- Interpolates background and foreground colors along perceptual lightness curves.
- Enforces minimum WCAG AAA contrast ratios (7:1 for body text) across every fractional slider position.
- Manages color temperature adjustments (warmth / cool tinting).

### 2. DOM & CSS Variable Injection (`dom.ts`)
Injects computed HSL and hex color values directly into `:root` CSS variables:
- `--theme-bg`: Primary reader background.
- `--theme-text`: Primary body typography.
- `--theme-border`: Card and column borders.
- `--theme-surface`: Elevated toolbars and modal backdrops.
- Automatically persists user theme preferences to browser `localStorage`.

### 3. Svelte 5 UI Components (`components/`)
- **`ThemeSlider.svelte`**: Interactive slider control allowing readers to drag between Light, Warm/Sepia, and Dark reading modes, with integrated font size scaling buttons.
- **`VersionPill.svelte`**: Compact header pill displaying the active application and database version tags.

---

## Usage

```svelte
<script lang="ts">
  import { ThemeSlider, VersionPill } from '@polyglot/theme';
</script>

<header class="flex items-center justify-between p-4">
  <VersionPill appVersion="v0.6.26" dbVersion="bible-data-v0.3.6" />
  <ThemeSlider />
</header>
```
