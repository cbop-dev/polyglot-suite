<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchMorphForWord, fetchDictionaryForWord, type MorphEntry, type LsjEntry } from '../lib/data';
  import {
    getHighlights,
    toggleLemmaHighlight,
    normalizeKey,
    normalizeLemmaAccents,
    type HighlightStore
  } from '../lib/highlights';

  let {
    lemmaNorm = '',
    lemmaDisplay = '',
    count = 0,
    gloss = '',
    showHighlightBtn = true
  }: {
    lemmaNorm: string;
    lemmaDisplay: string;
    count?: number;
    gloss?: string;
    showHighlightBtn?: boolean;
  } = $props();

  let info = $state<MorphEntry | null>(null);
  let dictEntry = $state<LsjEntry | null>(null);
  let loading = $state(true);
  let highlightsStore = $state<HighlightStore>({ lemmas: [], forms: [], phrases: [] });

  function refreshHighlights() {
    highlightsStore = getHighlights();
  }

  let normKey = $derived(normalizeKey(lemmaNorm || lemmaDisplay));

  let isHl = $derived.by(() => {
    if (!normKey) return false;
    return highlightsStore.lemmas.some(l => normalizeKey(l.lemma) === normKey);
  });

  function handleToggleHighlight() {
    toggleLemmaHighlight(lemmaDisplay, normKey);
    refreshHighlights();
  }

  function stripAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');
  }

  function findMorph(map: Record<string, MorphEntry>, target: string): MorphEntry | null {
    if (!target || !map) return null;
    const clean = target.replace(/[.,·;:!?"'»«()\[\]]/g, '').trim();
    const nfc = clean.normalize('NFC');
    const lower = nfc.toLowerCase();
    const stripped = stripAccents(clean);
    return map[clean] || map[nfc] || map[lower] || map[stripped] || map[target] || null;
  }

  function findDict(map: Record<string, LsjEntry>, key: string): LsjEntry | null {
    if (!key || !map) return null;
    const clean = key.replace(/[.,·;:!?"'»«()\[\]]/g, '').trim();
    const nfc = clean.normalize('NFC');
    const lower = nfc.toLowerCase();
    const stripped = stripAccents(clean);
    return map[clean] || map[nfc] || map[lower] || map[stripped] || map[key] || null;
  }

  async function loadDetails(word: string) {
    if (!word) return;
    loading = true;
    info = null;
    dictEntry = null;
    try {
      const [morphMap, dictMap] = await Promise.all([
        fetchMorphForWord(word),
        fetchDictionaryForWord(word)
      ]);
      info = findMorph(morphMap, word);
      const lemmaKey = lemmaNorm || info?.lemma_norm || info?.lemma || word;
      dictEntry = findDict(dictMap, lemmaKey);
    } catch (err) {
      console.error('Failed to load lemma info:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    refreshHighlights();
    loadDetails(lemmaDisplay || lemmaNorm);
  });

  $effect(() => {
    const target = lemmaDisplay || lemmaNorm;
    if (target) {
      loadDetails(target);
    }
  });

  let displayGloss = $derived(
    dictEntry?.gloss
      ? dictEntry.gloss.replace(/,\s*,+/g, ', ').replace(/^[\s,;:]+|[\s,;:]+$/g, '')
      : gloss
  );

  let posText = $derived(info?.pos || dictEntry?.pos || '');
</script>

<div class="lemma-info-card">
  <div class="lemma-info-header">
    <div class="lemma-title-row">
      <span class="selected-lemma-word">{normalizeLemmaAccents(lemmaDisplay || lemmaNorm)}</span>
      {#if posText}
        <span class="pos-badge">{posText}</span>
      {/if}
      {#if count > 0}
        <span class="lemma-count-badge" title="Total occurrences in Josephus">{count} occurrences</span>
      {/if}
    </div>

    {#if displayGloss}
      <div class="selected-lemma-gloss">{displayGloss}</div>
    {/if}
  </div>

  {#if showHighlightBtn}
    <div class="lemma-info-actions">
      <button
        class="phrase-hl-toggle-btn"
        class:active={isHl}
        onclick={handleToggleHighlight}
      >
        {isHl ? '✓ Lemma Highlighted Corpus-Wide' : '+ Highlight Lemma Corpus-Wide'}
      </button>
    </div>
  {/if}
</div>

{#if dictEntry?.def}
  <details class="lemma-details-section lsj-section">
    <summary class="lemma-section-summary">
      <span>LSJ Full Definition</span>
      <span class="lsj-badge">Lexicon</span>
    </summary>
    <div class="lsj-def-content">{dictEntry.def}</div>
  </details>
{/if}

<style>
  :global(.lemma-info-card) {
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  :global(.lemma-info-header) {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  :global(.lemma-title-row) {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  :global(.selected-lemma-word) {
    font-family: var(--font-greek, "Cardo", Georgia, serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
  }

  :global(.pos-badge) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  :global(.lemma-count-badge) {
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
  }

  :global(.selected-lemma-gloss) {
    font-size: 0.95rem;
    font-style: italic;
    color: var(--text-mid, #545b5c);
  }

  :global(.lemma-info-actions) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.lsj-section) {
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  :global(.lsj-badge) {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    background: rgba(0, 0, 0, 0.06);
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }

  :global(.lsj-def-content) {
    padding: 0.85rem 1rem;
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--text, #171a1c);
    white-space: pre-wrap;
    max-height: 250px;
    overflow-y: auto;
    background: var(--col-bg, #ffffff);
  }
</style>
