<script lang="ts">
  import { onMount } from 'svelte';
  import { getWork } from '../lib/works';
  import { normalizeGreekSearch, getKwicSnippet } from '../lib/transliterate';
  import {
    getBase,
    fetchSearchIndex,
    type LemmaEntryData,
    type LemmaOccurrence,
  } from '../lib/data';
  import { isFormFilterMatch } from '../lib/highlights';

  let {
    lemmaDisplay = '',
    lemmaData = null,
    selectedFormFilter = null,
    onClearFormFilter = () => {},
    onNavigate = defaultNavigate,
    loading = false,
    initialOpen = false
  }: {
    lemmaDisplay?: string;
    lemmaData?: LemmaEntryData | null;
    selectedFormFilter?: string | null;
    onClearFormFilter?: () => void;
    onNavigate?: (work: string, book: number, sec: string) => void;
    loading?: boolean;
    initialOpen?: boolean;
  } = $props();

  let searchIndex = $state<SearchSectionItem[]>([]);
  let isSectionOpen = $state(initialOpen);
  let areGroupsExpanded = $state(false);
  let treeElement = $state<HTMLDivElement | null>(null);

  let justLoaded = $state(false);
  let prevLoading = $state(loading);

  $effect(() => {
    if (prevLoading && !loading && lemmaData?.occurrences?.length) {
      justLoaded = true;
      const t = setTimeout(() => {
        justLoaded = false;
      }, 1200);
      return () => clearTimeout(t);
    }
    prevLoading = loading;
  });

  // Pagination limit per book section to maintain 60fps rendering even for 70k occurrences (e.g. "ὁ")
  let limitPerBook = $state<Record<string, number>>({});

  function getBookLimit(key: string): number {
    return limitPerBook[key] || 100;
  }

  function showMoreInBook(key: string) {
    const current = getBookLimit(key);
    limitPerBook = {
      ...limitPerBook,
      [key]: current + 200
    };
  }

  function showAllInBook(key: string, total: number) {
    limitPerBook = {
      ...limitPerBook,
      [key]: total
    };
  }

  onMount(() => {
    if (isSectionOpen && searchIndex.length === 0) {
      loadSearchIndexAsync();
    }
  });

  async function loadSearchIndexAsync() {
    try {
      searchIndex = await fetchSearchIndex();
    } catch (err) {
      console.error('Failed to load search index in OccurrenceTree:', err);
    }
  }

  function handleToggleSection(e: Event) {
    const target = e.target as HTMLDetailsElement;
    isSectionOpen = target.open;
    if (isSectionOpen && searchIndex.length === 0) {
      loadSearchIndexAsync();
    }
  }

  function defaultNavigate(w: string, b: number, s: string) {
    const base = getBase();
    const workMeta = getWork(w);
    const targetUrl = `${base}/${workMeta?.id || w}/book/${b}/#niese-${s}`;
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const targetPath = `${base}/${workMeta?.id || w}/book/${b}/`;
      const isSamePage = currentPath.replace(/\/$/, '') === targetPath.replace(/\/$/, '');

      if (isSamePage) {
        window.location.hash = `niese-${s}`;
        const cleanSec = String(s).trim();
        const numMatch = cleanSec.match(/^\d+/);
        const secNum = numMatch ? numMatch[0] : cleanSec;
        setTimeout(() => {
          const el = document.getElementById(`niese-${secNum}`) ||
                     document.querySelector(`[data-section="${secNum}"]`) ||
                     document.querySelector(`[data-niese="${cleanSec}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      } else {
        window.location.href = targetUrl;
      }
    }
  }

  let filteredOccurrences = $derived.by(() => {
    if (!lemmaData || !lemmaData.occurrences) return [];
    if (!selectedFormFilter) return lemmaData.occurrences;
    return lemmaData.occurrences.filter(occ => isFormFilterMatch(occ.word, selectedFormFilter!));
  });

  let lemmaOccurrencesGrouped = $derived.by(() => {
    const list = filteredOccurrences;
    if (!list || list.length === 0) return {};
    const groups: Record<string, Record<number, LemmaOccurrence[]>> = {};
    for (const occ of list) {
      const w = occ.work || 'Antiquities';
      const b = occ.book || 1;
      if (!groups[w]) groups[w] = {};
      if (!groups[w][b]) groups[w][b] = [];
      groups[w][b].push(occ);
    }
    return groups;
  });

  let sectionGrcMap = $derived.by(() => {
    const map = new Map<string, string>();
    if (!searchIndex || !Array.isArray(searchIndex)) return map;
    for (const item of searchIndex) {
      const key = `${item.w}-${item.b}-${item.s}`;
      map.set(key, item.g);
    }
    return map;
  });

  function getLemmaOccKwic(occ: LemmaOccurrence): { before: string; match: string; after: string } {
    const key = `${occ.work}-${occ.book}-${occ.sec}`;
    const fullText = sectionGrcMap.get(key) || '';
    if (fullText) {
      const normQ = normalizeGreekSearch(occ.word);
      return getKwicSnippet(fullText, occ.word, normQ);
    }
    return { before: '', match: occ.word, after: '' };
  }

  function toggleCollapseGroups(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    areGroupsExpanded = !areGroupsExpanded;
    isSectionOpen = true;
    if (treeElement) {
      const detailsList = treeElement.querySelectorAll<HTMLDetailsElement>('details');
      detailsList.forEach(d => {
        d.open = areGroupsExpanded;
      });
    }
  }
</script>

<details class="lemma-details-section" bind:open={isSectionOpen} ontoggle={handleToggleSection}>
  <summary class="lemma-section-summary">
    <div class="summary-title-group">
      <span>Passages in Josephus</span>
      {#if loading}
        <span class="inline-spinner" title="Loading occurrences..."></span>
      {/if}
      <span class="section-count-badge" class:ready-glow={justLoaded}>
        {selectedFormFilter ? `${filteredOccurrences.length} / ${lemmaData?.occurrences?.length || 0}` : (lemmaData?.occurrences?.length || 0)}
      </span>
    </div>
    {#if lemmaData?.occurrences?.length}
      <button
        class="btn-collapse-all"
        onclick={toggleCollapseGroups}
        title={areGroupsExpanded ? "Collapse all work and book sections" : "Expand all work and book sections"}
      >
        {areGroupsExpanded ? '⊟ Collapse All' : '⊞ Expand All'}
      </button>
    {/if}
  </summary>

  <div class="lemma-occurrences-body" bind:this={treeElement}>
    {#if selectedFormFilter}
      <div class="form-filter-active-bar">
        <span class="filter-bar-text">
          Filtering passages for form: <strong>"{selectedFormFilter}"</strong> ({filteredOccurrences.length} occurrence{filteredOccurrences.length === 1 ? '' : 's'})
        </span>
        <button class="clear-form-filter-btn" onclick={onClearFormFilter}>
          Show All Forms ✕
        </button>
      </div>
    {/if}

    {#if loading}
      <div class="occ-loading">Loading occurrences across Josephus...</div>
    {:else if !lemmaData || !lemmaData.occurrences || lemmaData.occurrences.length === 0}
      <div class="occ-empty">No textual occurrences recorded for "{lemmaDisplay}".</div>
    {:else if filteredOccurrences.length === 0}
      <div class="occ-empty">No occurrences found for form "{selectedFormFilter}".</div>
    {:else}
      <div class="occurrences-tree">
        {#each Object.entries(lemmaOccurrencesGrouped) as [workId, bookGroup] (workId)}
          {@const workMeta = getWork(workId)}
          {@const totalWorkOccs = Object.values(bookGroup).reduce((acc, occs) => acc + occs.length, 0)}
          <details class="work-results-group">
            <summary class="work-results-title">{workMeta?.englishTitle || workId} ({totalWorkOccs})</summary>
            {#each Object.entries(bookGroup) as [bNumStr, occs] (bNumStr)}
              {@const bNum = Number(bNumStr)}
              {@const bookKey = `${workId}-${bNumStr}`}
              {@const currentLimit = getBookLimit(bookKey)}
              {@const visibleOccs = occs.slice(0, currentLimit)}
              <details class="book-results-group">
                <summary class="book-results-title">Book {bNum} ({occs.length})</summary>
                <div class="sections-results-list">
                  {#each visibleOccs as occ, oIdx (occ.sec + '-' + occ.word + '-' + oIdx)}
                    {@const kwic = getLemmaOccKwic(occ)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                      class="sec-result-card"
                      onclick={() => onNavigate(occ.work, occ.book, occ.sec)}
                      title={`Jump to ${workMeta?.abbrev || occ.work} ${occ.book}.${occ.sec}`}
                      role="button"
                      tabindex="0"
                    >
                      <span class="sec-badge">{workMeta?.abbrev || occ.work} {occ.book}.{occ.sec}</span>
                      <span class="sec-kwic-snippet">
                        {kwic.before}<mark class="kwic-mark">{kwic.match}</mark>{kwic.after}
                      </span>
                      <span class="sec-jump-hint">Jump →</span>
                    </div>
                  {/each}

                  {#if occs.length > visibleOccs.length}
                    <div class="load-more-bar">
                      <span class="load-more-text">Showing {visibleOccs.length} of {occs.length} passages</span>
                      <div class="load-more-btns">
                        <button class="btn-load-more" onclick={() => showMoreInBook(bookKey)}>
                          + Load 200 More
                        </button>
                        <button class="btn-load-all" onclick={() => showAllInBook(bookKey, occs.length)}>
                          Show All ({occs.length})
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              </details>
            {/each}
          </details>
        {/each}
      </div>
    {/if}
  </div>
</details>

<style>
  :global(.summary-title-group) {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  :global(.btn-collapse-all) {
    background: transparent;
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }

  :global(.btn-collapse-all:hover) {
    background: var(--page-bg, #eceee7);
    color: var(--accent, #1f6f7a);
    border-color: var(--accent, #1f6f7a);
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

  .lemma-occurrences-body {
    padding: 0.75rem;
  }

  :global(.form-filter-active-bar) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--col-bg, #f5f6f2);
    border: 1px solid var(--accent, #1f6f7a);
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
    color: var(--text, #171a1c);
  }

  :global(.clear-form-filter-btn) {
    background: transparent;
    border: none;
    color: var(--error, #b22323);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  :global(.clear-form-filter-btn:hover) {
    background: rgba(178, 35, 35, 0.1);
  }

  .occ-loading, .occ-empty {
    font-size: 0.88rem;
    color: var(--text-mid, #545b5c);
    padding: 0.75rem 0;
  }

  .occurrences-tree {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 420px;
    overflow-y: auto;
  }

  :global(.work-results-group) {
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 6px;
    background: var(--popup-bg, #ffffff);
    margin-bottom: 0.4rem;
  }

  :global(.work-results-title) {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    padding: 0.45rem 0.65rem;
    background: var(--col-bg, #f5f6f2);
    cursor: pointer;
    user-select: none;
  }

  :global(.book-results-group) {
    margin: 0.35rem 0.5rem 0.35rem 0.85rem;
    border-left: 2px solid var(--border, #d4d8d3);
    padding-left: 0.4rem;
  }

  :global(.book-results-title) {
    font-size: 0.83rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    padding: 0.2rem 0;
    user-select: none;
  }

  :global(.sections-results-list) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }

  :global(.sec-result-card) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.25rem 0.5rem;
    background: var(--page-bg, #f8f9f6);
    border: 1px solid var(--border, #e0e3dd);
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  :global(.sec-result-card:hover) {
    background: var(--col-bg, #ffffff);
    border-color: var(--accent, #1f6f7a);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  :global(.sec-badge) {
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    font-size: 0.76rem;
    white-space: nowrap;
    background: rgba(31, 111, 122, 0.08);
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  :global(.sec-kwic-snippet) {
    flex: 1;
    font-family: var(--font-greek, "Cardo", Georgia, serif);
    font-size: 0.92rem;
    color: var(--text, #171a1c);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.kwic-mark) {
    background-color: #fde047;
    color: #000000;
    font-weight: 700;
    padding: 0 0.15rem;
    border-radius: 2px;
  }

  :global(.sec-jump-hint) {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent, #1f6f7a);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  :global(.sec-result-card:hover .sec-jump-hint) {
    opacity: 1;
  }

  :global(.load-more-bar) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.6rem;
    background: var(--col-bg, #f5f6f2);
    border: 1px dashed var(--border, #d4d8d3);
    border-radius: 4px;
    margin-top: 0.35rem;
    font-size: 0.8rem;
  }

  :global(.load-more-text) {
    color: var(--text-mid, #545b5c);
    font-weight: 600;
  }

  :global(.load-more-btns) {
    display: flex;
    gap: 0.35rem;
  }

  :global(.btn-load-more), :global(.btn-load-all) {
    background: var(--popup-bg, #ffffff);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--accent, #1f6f7a);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  :global(.btn-load-more:hover), :global(.btn-load-all:hover) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }
</style>
