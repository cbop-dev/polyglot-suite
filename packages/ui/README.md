> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

# Polyglot UI (`@polyglot/ui`)

Shared Svelte 5 component and widget library for the Polyglot Suite. Provides layout wrappers, navigation modals, command palette execution, chart widgets, form controls, and keyboard navigation.

---

## Installation

Within the monorepo, import directly:

```bash
npm install @polyglot/ui
```

Dependencies:
- `svelte`: `^5.0.0`
- [`@polyglot/theme`](../theme): Contrast-invariant theme variables and CSS tokens
- `chart.js`: `^4.4.0` (for statistics and lexicon distribution charts)

---

## Component Catalog

### 1. Layout & Reading
- **`ReaderHeader`**: Top application bar supporting breadcrumb navigation, search trigger, theme toggle, settings modals, and custom action slots.
- **`FloatingSidePanel`**: Collapsible floating drawer for dictionaries, morphology details, and parallel notes.
- **`ParallelColumnView`**: Virtualized or responsive multi-column alignment display for synchronized multi-text comparison.
- **Scroll Buttons**: `BackToTopButton`, `ToBottomButton`, and `DownButton` for smooth page navigation.

### 2. Modals & Pickers
- **`CommandPaletteModal`**: Quick-action command launcher (`Mod+K`) with fuzzy search across actions, navigation targets, and preferences.
- **`AcademicCitationModal`**: Formats copy-pasteable scholarly citations (SBL, Chicago, Turabian) for the current passage.
- **`CorpusPickerModal`**, **`WorkPickerModal`**, **`SectionPickerModal`**, **`ItemPickerModal`**: Modal dialogs for jumping between corpora, authors, works, and book chapters.
- **`Modal2`** / **`Modal`**: Accessible, keyboard-trappable modal container.

### 3. Controls & Inputs
- **`Button`**, **`OptionButton`**, **`ModalButton`**: Standardized suite buttons adhering to theme tokens.
- **`Tabs2`** / **`Tabs`**: Tabbed content switcher.
- **`SearchBox`**: Debounced search input with clear trigger and loading indicators.
- **`FilterInput`**, **`FilterInputUnsorted`**: Quick filtering inputs for tables and token lists.
- **`SortOptions`**, **`LayoutOptions`**: Toggle controls for sorting and view density (`ViewMode`).
- **`CopyText`**: One-click clipboard copy utility with confirmation feedback.
- **`Loading`**: Animated loader spinner.

### 4. Charts & Visualizations
- **`BarChart`**: Frequency distribution charts for word counts and grammatical categories.
- **`PieChart`**: Proportional composition charts (e.g. part-of-speech distributions).
- **`BubbleChart`**: Multi-dimensional token distribution charts.
- **`chartUtils`**: Theme-aware color palette generators matching `@polyglot/theme`.

### 5. Keyboard Navigation & Hotkeys
`@polyglot/ui/hotkeys` provides a global keyboard manager:

```typescript
import { HotkeyManager, formatKey } from '@polyglot/ui';

const manager = new HotkeyManager([
  {
    key: 'k',
    modifiers: ['mod'], // Cmd on macOS, Ctrl on Linux/Windows
    category: 'Navigation',
    description: 'Open Command Palette',
    action: () => toggleCommandPalette()
  },
  {
    key: 'ArrowRight',
    category: 'Reading',
    description: 'Next Chapter',
    action: () => nextChapter()
  }
]);

// Attach event listener
window.addEventListener('keydown', (e) => manager.handleKeyDown(e));
```

---

## Usage Example

```svelte
<script lang="ts">
  import { ReaderHeader, Button, FloatingSidePanel } from '@polyglot/ui';

  let showPanel = $state(false);
</script>

<ReaderHeader title="Ancient Corpora Reader">
  {#snippet actions()}
    <Button variant="secondary" onclick={() => (showPanel = !showPanel)}>
      Toggle Lexicon
    </Button>
  {/snippet}
</ReaderHeader>

{#if showPanel}
  <FloatingSidePanel onClose={() => (showPanel = false)}>
    <h3>Lexicon & Details</h3>
  </FloatingSidePanel>
{/if}
```

---

## Testing

Run unit tests via Vitest:

```bash
npm run test:packages
# or directly in package:
npx vitest packages/ui --run
```
