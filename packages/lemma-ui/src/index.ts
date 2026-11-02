// Lexical / Dictionary Components
export { default as LSJEntry } from './components/LSJEntry.svelte';
export { default as BDBEntry } from './components/BDBEntry.svelte';
export { default as SEDRAEntry } from './components/SEDRAEntry.svelte';
export { default as TextsDisplay } from './components/TextsDisplay.svelte';
export { default as LexemeSidePanel } from './components/LexemeSidePanel.svelte';
export type {
  TokenInfo,
  LexiconEntry,
  LemmaStat,
  ConcordanceRef,
  PaginatedConcordance,
  LemmaSearchResult,
  ExtraTab
} from './components/LexemeSidePanel.svelte';
export type { AttestedForm } from '@polyglot/ancient-languages';

// Re-export general UI controls, charts, icons, and layout from @polyglot/ui
export {
  Button,
  OptionButton,
  Modal2,
  CopyText,
  Tabs2,
  Loading,
  BarChart,
  PieChart,
  BubbleChart,
  Icon,
  LinkIcon,
  ArrowUp,
  ChevronDown,
  ChevronUp
} from '@polyglot/ui';

export * from './types.js';


