<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getHighlights,
    toggleFormHighlight,
    normalizeKey,
    type HighlightStore
  } from '../lib/highlights';

  let {
    attestedForms = [],
    selectedFormFilter = null,
    lemmaNorm = '',
    lemmaDisplay = '',
    onToggleFilter = () => {},
    loading = false,
    initialOpen = false
  }: {
    attestedForms: string[];
    selectedFormFilter?: string | null;
    lemmaNorm: string;
    lemmaDisplay?: string;
    onToggleFilter?: (fWord: string) => void;
    loading?: boolean;
    initialOpen?: boolean;
  } = $props();

  let isOpen = $state(initialOpen);
  let justLoaded = $state(false);
  let prevLoading = $state(loading);

  $effect(() => {
    if (prevLoading && !loading && attestedForms.length > 0) {
      justLoaded = true;
      const t = setTimeout(() => {
        justLoaded = false;
      }, 1200);
      return () => clearTimeout(t);
    }
    prevLoading = loading;
  });

  let highlightsStore = $state<HighlightStore>({ lemmas: [], forms: [], phrases: [] });

  function refreshHighlights() {
    highlightsStore = getHighlights();
  }

  onMount(() => {
    refreshHighlights();
    const handleHighlightsChanged = () => refreshHighlights();
    if (typeof window !== 'undefined') {
      window.addEventListener('reader-highlights-changed', handleHighlightsChanged);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('reader-highlights-changed', handleHighlightsChanged);
      }
    };
  });

  function handleBadgeClick(e: MouseEvent, fWord: string) {
    e.stopPropagation();
    toggleFormHighlight(fWord, lemmaNorm);
    refreshHighlights();
  }
</script>

<details bind:open={isOpen} class="lemma-details-section">
  <summary class="lemma-section-summary">
    <div class="summary-title-group">
      <span>Attested Forms of "{lemmaDisplay || lemmaNorm}" in Josephus</span>
      {#if loading}
        <span class="inline-spinner" title="Loading attested forms..."></span>
      {/if}
      <span class="section-count-badge" class:ready-glow={justLoaded}>{attestedForms.length}</span>
    </div>
  </summary>
  <div class="forms-chips-wrapper">
    {#if loading}
      <div class="forms-loading">Loading attested forms...</div>
    {:else if attestedForms.length === 0}
      <div class="forms-empty">No attested forms recorded.</div>
    {:else}
      <div class="forms-chips-grid">
        {#each attestedForms as fWord (fWord)}
          {@const isFActive = highlightsStore.forms.some(f => f.word === normalizeKey(fWord))}
          {@const isFiltered = selectedFormFilter === fWord}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="form-chip-pill"
            class:filter-active={isFiltered}
            class:hl-active={isFActive}
            onclick={() => onToggleFilter(fWord)}
            title={`Click to filter passages by exact form "${fWord}"`}
            role="button"
            tabindex="0"
          >
            <span class="chip-word-text">{fWord}</span>
            <button
              class="chip-hl-badge"
              class:active={isFActive}
              onclick={(e) => handleBadgeClick(e, fWord)}
              title={`Toggle corpus-wide highlight for form "${fWord}"`}
              aria-label={`Highlight form ${fWord}`}
            >
              {isFActive ? '✓' : '+'}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</details>

<style>
  :global(.lemma-details-section) {
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    background: var(--popup-bg, #ffffff);
    margin-bottom: 0.75rem;
    overflow: hidden;
  }

  :global(.lemma-section-summary) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.85rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    background: var(--col-bg, #f5f6f2);
    cursor: pointer;
    user-select: none;
  }

  :global(.lemma-section-summary:hover) {
    background: var(--page-bg, #eceee7);
  }

  :global(.summary-title-group) {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  :global(.section-count-badge) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.1rem 0.5rem;
    border-radius: 12px;
    margin-left: 0.2rem;
    transition: all 0.2s ease;
  }

  :global(.section-count-badge.ready-glow) {
    animation: badge-glow-flash 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes badge-glow-flash {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(31, 111, 122, 0);
    }
    30% {
      transform: scale(1.25);
      background-color: #10b981;
      color: #ffffff;
      box-shadow: 0 0 12px 4px rgba(16, 185, 129, 0.65);
    }
    60% {
      transform: scale(1.1);
      box-shadow: 0 0 8px 2px rgba(16, 185, 129, 0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(31, 111, 122, 0);
    }
  }

  :global(.inline-spinner) {
    display: inline-block;
    width: 13px;
    height: 13px;
    border: 2px solid rgba(31, 111, 122, 0.25);
    border-top-color: var(--accent, #1f6f7a);
    border-radius: 50%;
    animation: inline-spin 0.75s linear infinite;
    vertical-align: middle;
  }

  @keyframes inline-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .forms-chips-wrapper {
    padding: 0.75rem;
  }

  .forms-loading, .forms-empty {
    font-size: 0.85rem;
    color: var(--text-mid, #545b5c);
    padding: 0.5rem 0;
  }

  .forms-chips-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 180px;
    overflow-y: auto;
    padding: 0.1rem;
  }

  :global(.form-chip-pill) {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 16px;
    padding: 0.15rem 0.45rem 0.15rem 0.6rem;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  :global(.form-chip-pill:hover) {
    border-color: var(--accent, #1f6f7a);
    background: var(--col-bg, #ffffff);
  }

  :global(.form-chip-pill.filter-active) {
    background-color: var(--accent, #1f6f7a) !important;
    border-color: var(--accent, #1f6f7a) !important;
  }

  :global(.form-chip-pill.filter-active .chip-word-text) {
    color: #ffffff !important;
    font-weight: 700;
  }

  :global(.chip-word-text) {
    font-family: var(--font-greek, "Cardo", Georgia, serif);
    font-size: 0.95rem;
    color: var(--text, #171a1c);
  }

  :global(.chip-hl-badge) {
    appearance: none;
    background: rgba(0, 0, 0, 0.08);
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-mid, #545b5c);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    transition: all 0.15s ease;
  }

  :global(.chip-hl-badge:hover) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
  }

  :global(.chip-hl-badge.active) {
    background: #10b981 !important;
    color: #ffffff !important;
  }
</style>
