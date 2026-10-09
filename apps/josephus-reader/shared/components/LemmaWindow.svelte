<script lang="ts">
  import { onMount } from 'svelte';
  import { transliterateLatinToGreek, normalizeGreekSearch, getKwicSnippet } from '../lib/transliterate';
  import { getWork } from '../lib/works';
  import {
    getBase,
    fetchLemmaData,
    fetchMorphForWord,
    fetchDictionaryForWord,
    type LemmaEntryData,
    type LemmaOccurrence,
    type MorphEntry,
    type LsjEntry
  } from '../lib/data';
  import {
    getHighlights,
    togglePhraseHighlight,
    isPhraseHighlighted,
    toggleLemmaHighlight,
    isLemmaHighlighted,
    toggleFormHighlight,
    isFormHighlighted,
    removeLemmaHighlight,
    removeFormHighlight,
    removePhraseHighlight,
    clearAllHighlights,
    normalizeKey,
    normalizeLemmaAccents,
    getCanonicalAttestedForms,
    type HighlightStore
  } from '../lib/highlights';

  import AttestedFormsGrid from './AttestedFormsGrid.svelte';
  import OccurrenceTree from './OccurrenceTree.svelte';

  export interface SearchSectionItem {
    w: string;
    b: number;
    s: string;
    g: string;
    n: string;
    e: string;
  }

  export interface LemmaIndexItem {
    l: string;
    n: string;
    c: number;
    g: string;
  }

  let {
    work = 'Antiquities',
    bookNum = 1,
    initialTab = 'search',
    initialSearchSubTab = 'lemma',
    initialWord = '',
    initialLemmaNorm = '',
    initialLemmaDisplay = '',
    onClose = () => {}
  }: {
    work?: string;
    bookNum?: number;
    initialTab?: 'search' | 'info' | 'highlights';
    initialSearchSubTab?: 'lemma' | 'custom';
    initialWord?: string;
    initialLemmaNorm?: string;
    initialLemmaDisplay?: string;
    onClose?: () => void;
  } = $props();

  let mainTab = $state<'search' | 'info' | 'highlights'>(initialTab);
  let searchSubTab = $state<'lemma' | 'custom'>(initialSearchSubTab);

  let selectedWord = $state(initialWord);
  let lemmaInputText = $state('');
  let customInputText = $state('');
  let caseSensitive = $state(false);
  let loadingIndexData = $state(true);

  let searchIndex = $state<SearchSectionItem[]>([]);
  let lemmataIndex = $state<LemmaIndexItem[]>([]);

  let selectedLemma = $state<LemmaIndexItem | null>(null);
  let lemmaData = $state<LemmaEntryData | null>(null);
  let loadingLemmaData = $state(false);
  let selectedFormFilter = $state<string | null>(null);

  // Word Morph & Dict State
  let info = $state<MorphEntry | null>(null);
  let dictEntry = $state<LsjEntry | null>(null);
  let loadingWordInfo = $state(false);

  let highlightsStore = $state<HighlightStore>({ lemmas: [], forms: [], phrases: [] });

  let totalActiveHighlights = $derived(
    highlightsStore.lemmas.length +
      highlightsStore.forms.length +
      (highlightsStore.phrases?.length || 0)
  );

  let hasActiveInfo = $derived(!!(selectedWord || selectedLemma || info || lemmaData));

  let currentLemmaNorm = $derived(
    selectedLemma?.n || normalizeKey(info?.lemma_norm || info?.lemma || selectedWord)
  );
  let currentLemmaDisplay = $derived(
    normalizeLemmaAccents(selectedLemma?.l || info?.lemma || selectedWord)
  );

  let activeLemmaObj = $derived(highlightsStore.lemmas.find(l => l.lemma === currentLemmaNorm));
  let activeFormObj = $derived(highlightsStore.forms.find(f => f.word === normalizeKey(selectedWord)));
  let lemmaIsActive = $derived(!!activeLemmaObj);
  let formIsActive = $derived(!!activeFormObj);

  function refreshHighlights() {
    highlightsStore = getHighlights();
  }

  function notifyHighlightsChanged() {
    refreshHighlights();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reader-highlights-changed', { detail: highlightsStore }));
    }
  }

  function handleToggleLemma() {
    if (!currentLemmaNorm) return;
    toggleLemmaHighlight(currentLemmaDisplay, currentLemmaNorm);
    notifyHighlightsChanged();
  }

  function handleToggleForm() {
    if (!selectedWord) return;
    toggleFormHighlight(selectedWord, currentLemmaNorm);
    notifyHighlightsChanged();
  }

  function handleRemoveLemmaHighlight(lemma: string) {
    removeLemmaHighlight(lemma);
    notifyHighlightsChanged();
  }

  function handleRemoveFormHighlight(word: string) {
    removeFormHighlight(word);
    notifyHighlightsChanged();
  }

  function handleRemovePhraseHighlight(phrase: string) {
    removePhraseHighlight(phrase);
    notifyHighlightsChanged();
  }

  function handleClearAllHighlights() {
    clearAllHighlights();
    notifyHighlightsChanged();
  }

  let rawInput = $derived(searchSubTab === 'lemma' ? lemmaInputText : customInputText);
  let normQuery = $derived(normalizeGreekSearch(rawInput));

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const val = target.value;
    const transformed = transliterateLatinToGreek(val);
    if (searchSubTab === 'lemma') {
      lemmaInputText = transformed;
    } else {
      customInputText = transformed;
    }
    target.value = transformed;
  }

  function clearInput() {
    if (searchSubTab === 'lemma') {
      lemmaInputText = '';
    } else {
      customInputText = '';
    }
  }

  function toggleFormFilter(fWord: string) {
    if (selectedFormFilter === fWord) {
      selectedFormFilter = null;
    } else {
      selectedFormFilter = fWord;
    }
  }

  function handleHighlightsChanged() {
    refreshHighlights();
  }

  onMount(() => {
    refreshHighlights();
    loadIndexes();

    if (initialWord) {
      inspectWord(initialWord);
    } else if (initialLemmaNorm || initialLemmaDisplay) {
      const norm = normalizeKey(initialLemmaNorm || initialLemmaDisplay);
      const display = initialLemmaDisplay || initialLemmaNorm;
      selectLemma({ l: display, n: norm, c: 0, g: '' });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('reader-highlights-changed', handleHighlightsChanged);
      return () => {
        window.removeEventListener('reader-highlights-changed', handleHighlightsChanged);
      };
    }
  });

  let lastInitialWord = $state(initialWord);
  let lastInitialLemmaNorm = $state(initialLemmaNorm);
  let lastInitialLemmaDisplay = $state(initialLemmaDisplay);

  $effect(() => {
    const curWord = initialWord;
    if (curWord && curWord !== lastInitialWord) {
      lastInitialWord = curWord;
      inspectWord(curWord);
    }
  });

  $effect(() => {
    const curNorm = initialLemmaNorm || initialLemmaDisplay;
    const lastNorm = lastInitialLemmaNorm || lastInitialLemmaDisplay;
    if (curNorm && curNorm !== lastNorm) {
      lastInitialLemmaNorm = initialLemmaNorm;
      lastInitialLemmaDisplay = initialLemmaDisplay;
      selectLemma({ l: initialLemmaDisplay || initialLemmaNorm, n: normalizeKey(curNorm), c: 0, g: '' });
    }
  });

  async function loadIndexes() {
    loadingIndexData = true;
    const base = getBase();
    try {
      const [searchRes, lemmataRes] = await Promise.all([
        fetch(`${base}/data/search_index.json`).then(r => r.ok ? r.json() : []),
        fetch(`${base}/data/lemmata_index.json`).then(r => r.ok ? r.json() : [])
      ]);
      searchIndex = Array.isArray(searchRes) ? searchRes : [];
      lemmataIndex = Array.isArray(lemmataRes) ? lemmataRes : [];
    } catch (err) {
      console.error('Failed to load search indexes:', err);
    } finally {
      loadingIndexData = false;
    }
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

  async function fetchWordInfo(w: string) {
    loadingWordInfo = true;
    info = null;
    dictEntry = null;
    try {
      const [morphMap, dictMap] = await Promise.all([
        fetchMorphForWord(w),
        fetchDictionaryForWord(w)
      ]);
      info = findMorph(morphMap, w);
      const lemmaKey = info?.lemma_norm || info?.lemma || w.toLowerCase();
      dictEntry = findDict(dictMap, lemmaKey);
      loadLemmaData(lemmaKey);
    } catch (err) {
      console.error('Error fetching word morph info:', err);
    } finally {
      loadingWordInfo = false;
    }
  }

  async function loadLemmaData(lemmaNorm: string) {
    if (!lemmaNorm) return;
    loadingLemmaData = true;
    try {
      const data = await fetchLemmaData(lemmaNorm);
      lemmaData = data;
      if (data && data.lemma && selectedLemma) {
        selectedLemma.l = normalizeLemmaAccents(data.lemma);
        if (data.count) selectedLemma.c = data.count;
      }
    } catch (err) {
      console.error('Failed to fetch lemma occurrence data:', err);
    } finally {
      loadingLemmaData = false;
    }
  }

  async function inspectWord(w: string) {
    selectedWord = w;
    selectedFormFilter = null;
    mainTab = 'info';
    await fetchWordInfo(w);
  }

  async function selectLemma(item: LemmaIndexItem) {
    selectedLemma = { ...item, l: normalizeLemmaAccents(item.l) };
    selectedWord = '';
    selectedFormFilter = null;
    info = null;
    dictEntry = null;
    lemmaData = null;
    mainTab = 'info';

    loadingWordInfo = true;
    loadingLemmaData = true;

    try {
      const searchKey = item.l || item.n;
      const [morphMap, dictMap, occurrenceData] = await Promise.all([
        fetchMorphForWord(searchKey),
        fetchDictionaryForWord(searchKey),
        fetchLemmaData(item.n)
      ]);

      info = findMorph(morphMap, searchKey) || findMorph(morphMap, item.n);
      const lemmaKey = info?.lemma_norm || info?.lemma || item.n;
      dictEntry = findDict(dictMap, lemmaKey) || findDict(dictMap, item.l) || findDict(dictMap, item.n);

      if (!dictEntry && item.g) {
        dictEntry = { pos: '', gloss: item.g, def: '' };
      }

      lemmaData = occurrenceData;
      if (occurrenceData && occurrenceData.lemma && selectedLemma) {
        selectedLemma = {
          ...selectedLemma,
          l: normalizeLemmaAccents(occurrenceData.lemma),
          c: occurrenceData.count || selectedLemma.c
        };
      }
    } catch (err) {
      console.error('Failed to select lemma:', err);
    } finally {
      loadingWordInfo = false;
      loadingLemmaData = false;
    }
  }

  function clearSelectedLemma() {
    selectedLemma = null;
    lemmaData = null;
    selectedFormFilter = null;
    info = null;
    dictEntry = null;
    selectedWord = '';
  }

  let filteredLemmata = $derived.by(() => {
    if (!normQuery) return lemmataIndex.slice(0, 150);
    return lemmataIndex.filter(item => {
      if (caseSensitive) {
        return item.l.includes(rawInput);
      }
      return item.n.includes(normQuery) || item.l.includes(rawInput);
    }).slice(0, 200);
  });

  let filteredCustomResults = $derived.by(() => {
    if (!normQuery || normQuery.length < 2) return [];
    
    return searchIndex.filter(item => {
      if (caseSensitive) {
        return item.g.includes(rawInput) || item.e.includes(rawInput);
      }
      return item.n.includes(normQuery) || item.e.toLowerCase().includes(rawInput.toLowerCase());
    });
  });

  let groupedResults = $derived.by(() => {
    const groups: Record<string, Record<number, SearchSectionItem[]>> = {};
    for (const item of filteredCustomResults) {
      if (!groups[item.w]) groups[item.w] = {};
      if (!groups[item.w][item.b]) groups[item.w][item.b] = [];
      groups[item.w][item.b].push(item);
    }
    return groups;
  });

  let selectedLemmaAttestedForms = $derived.by(() => {
    if (!lemmaData || !Array.isArray(lemmaData.occurrences)) return [];
    return getCanonicalAttestedForms(lemmaData.occurrences);
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

  let isPhraseHl = $derived.by(() => {
    if (!rawInput) return false;
    const norm = normalizeKey(rawInput);
    return highlightsStore.phrases?.some(p => p.phrase === norm) || false;
  });

  function getKwic(text: string, q: string, nQ: string) {
    return getKwicSnippet(text, q, nQ);
  }

  let areCustomGroupsExpanded = $state(true);

  function toggleCollapseCustomGroups(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    areCustomGroupsExpanded = !areCustomGroupsExpanded;
    if (typeof document !== 'undefined') {
      const tree = document.querySelector('.custom-results-tree');
      if (tree) {
        const detailsList = tree.querySelectorAll<HTMLDetailsElement>('details');
        detailsList.forEach(d => {
          d.open = areCustomGroupsExpanded;
        });
      }
    }
  }

  function handleTogglePhraseHighlight(phrase: string) {
    togglePhraseHighlight(phrase);
    notifyHighlightsChanged();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  function navigateToSection(w: string, b: number, s: string) {
    onClose();
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
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="lemma-backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="lemma-card"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-label="Lemma & Corpus Search"
    tabindex="-1"
  >
    <!-- Modal Header -->
    <div class="lemma-header">
      <div class="lemma-header-title">
        <h2>Josephus Lexicon & Corpus Search</h2>
        <span class="lemma-sub font-small">Search lemmata, phrase occurrences, word morphology, and active highlights</span>
      </div>
      <button class="lemma-close-btn" onclick={onClose} aria-label="Close modal">×</button>
    </div>

    <!-- Main Tabs Navigation Bar -->
    <div class="main-tabs-strip" role="tablist" aria-label="Main Navigation Tabs">
      <button
        role="tab"
        aria-selected={mainTab === 'search'}
        class="main-tab-btn"
        class:active={mainTab === 'search'}
        onclick={() => (mainTab = 'search')}
      >
        <span class="tab-icon">🔍</span>
        <span>Search</span>
      </button>

      <button
        role="tab"
        aria-selected={mainTab === 'info'}
        class="main-tab-btn"
        class:active={mainTab === 'info'}
        disabled={!hasActiveInfo}
        onclick={() => { if (hasActiveInfo) mainTab = 'info'; }}
        title={hasActiveInfo ? "View word info & occurrences" : "Select a word in text or lemma search to view info"}
      >
        <span class="tab-icon">📖</span>
        <span>Lemma Info</span>
        {#if selectedWord}
          <span class="active-word-badge">{selectedWord}</span>
        {:else if selectedLemma}
          <span class="active-word-badge">{selectedLemma.l}</span>
        {/if}
      </button>

      <button
        role="tab"
        aria-selected={mainTab === 'highlights'}
        class="main-tab-btn"
        class:active={mainTab === 'highlights'}
        onclick={() => (mainTab = 'highlights')}
      >
        <span class="tab-icon">🎨</span>
        <span>Highlights</span>
        {#if totalActiveHighlights > 0}
          <span class="tab-hl-badge">{totalActiveHighlights}</span>
        {/if}
      </button>
    </div>

    <!-- Sub-tabs strip (Only displayed when Search main tab is active) -->
    {#if mainTab === 'search'}
      <div class="sub-tabs-strip" role="tablist" aria-label="Search Sub-tabs">
        <button
          role="tab"
          aria-selected={searchSubTab === 'lemma'}
          class="sub-tab-btn"
          class:active={searchSubTab === 'lemma'}
          onclick={() => (searchSubTab = 'lemma')}
        >
          🏛️ Lemma Search
        </button>
        <button
          role="tab"
          aria-selected={searchSubTab === 'custom'}
          class="sub-tab-btn"
          class:active={searchSubTab === 'custom'}
          onclick={() => (searchSubTab = 'custom')}
        >
          📖 Custom Text / Phrase Search
        </button>
      </div>

      <!-- Transliteration Search Input -->
      <div class="search-input-wrapper">
        <div class="input-row">
          <input
            type="text"
            class="search-input"
            placeholder={searchSubTab === 'lemma' ? 'Type in Latin/Betacode (e.g. arche, iosephos) or Greek...' : 'Type custom word/phrase (e.g. ioudaion archontes)...'}
            value={rawInput}
            oninput={handleInput}
            autofocus
          />
          {#if rawInput}
            <button class="clear-input-btn" onclick={clearInput} aria-label="Clear input">✕</button>
          {/if}
        </div>

        <div class="search-options-row">
          <label class="case-sensitive-label">
            <input type="checkbox" bind:checked={caseSensitive} />
            <span>Case sensitive</span>
          </label>
        </div>
      </div>
    {/if}

    <!-- Body Content Area -->
    <div class="lemma-body">
      {#if mainTab === 'search'}
        {#if loadingIndexData}
          <div class="lemma-loading">Loading corpus search index dataset...</div>
        {:else if searchSubTab === 'lemma'}
          <!-- Lemma Search List View -->
          <div class="lemma-results-list">
            {#if filteredLemmata.length === 0}
              <div class="lemma-empty-msg">No matching lemmata found.</div>
            {:else}
              {#each filteredLemmata as item (item.n)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="lemma-item-card" onclick={() => selectLemma(item)}>
                  <div class="lemma-item-left">
                    <span class="lemma-word-text">{normalizeLemmaAccents(item.l)}</span>
                    <span class="lemma-count-badge" title="Total occurrences in Josephus">{item.c} occ</span>
                  </div>
                  {#if item.g}
                    <div class="lemma-gloss-text">{item.g}</div>
                  {/if}
                  <div class="lemma-item-actions">
                    <button class="lemma-inspect-btn" onclick={(e) => { e.stopPropagation(); selectLemma(item); }}>
                      View Info & Occurrences →
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else}
          <!-- Custom Phrase Search Subtab -->
          {#if !normQuery || normQuery.length < 2}
            <div class="lemma-prompt-msg">
              Type at least 2 characters to search across all 30 books of Josephus.
            </div>
          {:else if filteredCustomResults.length === 0}
            <div class="lemma-empty-msg">
              No sections found matching "{rawInput}".
            </div>
          {:else}
            <div class="custom-results-summary">
              <span>Found <strong>{filteredCustomResults.length}</strong> matching section{filteredCustomResults.length === 1 ? '' : 's'}:</span>
              <div class="custom-results-actions">
                <button
                  class="btn-collapse-all"
                  onclick={toggleCollapseCustomGroups}
                  title={areCustomGroupsExpanded ? "Collapse all work and book sections" : "Expand all work and book sections"}
                >
                  {areCustomGroupsExpanded ? '⊟ Collapse All' : '⊞ Expand All'}
                </button>
                {#if rawInput}
                  <button
                    class="phrase-hl-toggle-btn"
                    class:active={isPhraseHl}
                    onclick={() => handleTogglePhraseHighlight(rawInput)}
                  >
                    {isPhraseHl ? '✓ Phrase Highlighted' : '+ Highlight Phrase Corpus-Wide'}
                  </button>
                {/if}
              </div>
            </div>

            <div class="custom-results-tree">
              {#each Object.entries(groupedResults) as [workId, bookGroup] (workId)}
                {@const workMeta = getWork(workId)}
                {@const totalWorkOccs = Object.values(bookGroup).reduce((acc, secs) => acc + secs.length, 0)}
                <details open class="work-results-group">
                  <summary class="work-results-title">{workMeta?.englishTitle || workId} ({totalWorkOccs})</summary>
                  {#each Object.entries(bookGroup) as [bNumStr, sections] (bNumStr)}
                    {@const bNum = Number(bNumStr)}
                    <details open class="book-results-group">
                      <summary class="book-results-title">Book {bNum} ({sections.length})</summary>
                      <div class="sections-results-list">
                        {#each sections as sec (sec.s)}
                          {@const kwic = getKwic(sec.g || sec.e, rawInput, normQuery)}
                          <!-- svelte-ignore a11y_click_events_have_key_events -->
                          <!-- svelte-ignore a11y_no_static_element_interactions -->
                          <div
                            class="sec-result-card"
                            onclick={() => navigateToSection(sec.w, sec.b, sec.s)}
                            title={`Jump to ${workMeta?.abbrev || sec.w} ${sec.b}.${sec.s}`}
                          >
                            <span class="sec-badge">{workMeta?.abbrev || sec.w} {sec.b}.{sec.s}</span>
                            <span class="sec-kwic-snippet">
                              {kwic.before}<mark class="kwic-mark">{kwic.match}</mark>{kwic.after}
                            </span>
                            <span class="sec-jump-hint">Jump →</span>
                          </div>
                        {/each}
                      </div>
                    </details>
                  {/each}
                </details>
              {/each}
            </div>
          {/if}
        {/if}
      {:else if mainTab === 'info'}
        <!-- Lemma Info Tab -->
        {#if !hasActiveInfo}
          <div class="lemma-prompt-msg">
            No active word or lemma selected. Click on any Greek word in the text or select a lemma from Search to view morphological parse, dictionary definitions, and corpus occurrences.
          </div>
        {:else}
          <div class="lemma-info-panel">
            <!-- Word / Lemma Header Title -->
            <div class="info-header-block">
              <div class="info-word-display">
                <span class="word-primary-text">{selectedWord || currentLemmaDisplay}</span>
                {#if selectedWord && currentLemmaDisplay && selectedWord !== currentLemmaDisplay}
                  <span class="word-lemma-sub">({currentLemmaDisplay})</span>
                {/if}
              </div>
              {#if info || dictEntry}
                <div class="info-tags">
                  {#if info?.pos || dictEntry?.pos}
                    <span class="pos-badge">{info?.pos || dictEntry?.pos}</span>
                  {/if}
                  {#if info?.parse && info.parse !== 'Form'}
                    <span class="parse-tag" title={info.desc || info.parse}>{info.parse}</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Morph & Dictionary Section -->
            {#if loadingWordInfo}
              <div class="lemma-loading">Analyzing word form...</div>
            {:else if info || dictEntry || selectedLemma}
              <div class="morph-section">
                {#if info?.lemma || selectedLemma?.l}
                  <div class="lemma-line">
                    <span class="label">Lemma:</span>
                    <span class="lemma-value">{info?.lemma || selectedLemma?.l || currentLemmaDisplay}</span>
                  </div>
                {/if}
                {#if dictEntry?.gloss || selectedLemma?.g}
                  <div class="gloss-line">
                    <span class="label">Gloss:</span>
                    <span class="gloss-value">{(dictEntry?.gloss || selectedLemma?.g || '').replace(/,\s*,+/g, ', ').replace(/^[\s,;:]+|[\s,;:]+$/g, '')}</span>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Highlight Control Bar -->
            <div class="popup-hl-bar">
              <span class="hl-label">Highlight:</span>
              <button
                class={`hl-toggle-btn ${lemmaIsActive ? 'active' : ''}`}
                style={lemmaIsActive && activeLemmaObj ? `--btn-hue: ${activeLemmaObj.hue}` : ''}
                onclick={handleToggleLemma}
                aria-pressed={lemmaIsActive}
                title={`Toggle highlight for all forms of lemma "${currentLemmaDisplay}"`}
              >
                <span class="hl-btn-icon">{lemmaIsActive ? '✓' : '+'}</span>
                <span>Lemma</span>
              </button>

              {#if selectedWord}
                <button
                  class={`hl-toggle-btn form-btn ${formIsActive ? 'active' : ''}`}
                  style={formIsActive ? `--btn-hue: ${activeFormObj?.hue ?? activeLemmaObj?.hue ?? 160}` : ''}
                  onclick={handleToggleForm}
                  aria-pressed={formIsActive}
                  title={`Toggle highlight for exact form "${selectedWord}"`}
                >
                  <span class="hl-btn-icon">{formIsActive ? '✓' : '+'}</span>
                  <span>Form</span>
                </button>
              {/if}

              <button
                class="hl-view-btn"
                onclick={() => (mainTab = 'highlights')}
                title="Open Active Highlights tab"
              >
                Highlights ({totalActiveHighlights}) →
              </button>

              {#if totalActiveHighlights > 0}
                <button
                  class="hl-clear-btn"
                  onclick={handleClearAllHighlights}
                  title="Clear all active highlights"
                >
                  Clear All
                </button>
              {/if}
            </div>

            {#if dictEntry?.def}
              <details class="dict-details">
                <summary class="dict-summary">LSJ Full Definition</summary>
                <div class="dict-def">{dictEntry.def}</div>
              </details>
            {/if}

            <!-- Attested Word Forms Section -->
            {#if selectedLemmaAttestedForms.length > 0}
              <AttestedFormsGrid
                attestedForms={selectedLemmaAttestedForms}
                selectedFormFilter={selectedFormFilter}
                lemmaNorm={currentLemmaNorm}
                lemmaDisplay={currentLemmaDisplay}
                onToggleFilter={toggleFormFilter}
                loading={loadingLemmaData}
              />
            {/if}

            <!-- Occurrence Tree Section -->
            <OccurrenceTree
              lemmaDisplay={currentLemmaDisplay}
              lemmaData={lemmaData}
              selectedFormFilter={selectedFormFilter}
              onClearFormFilter={() => (selectedFormFilter = null)}
              onNavigate={navigateToSection}
              loading={loadingLemmaData}
            />
          </div>
        {/if}
      {:else if mainTab === 'highlights'}
        <!-- Active Highlights Tab -->
        <div class="active-highlights-panel">
          {#if totalActiveHighlights === 0}
            <div class="lemma-empty-msg">
              No active highlights. Click on any word in the reader text or search modal to highlight its lemma, exact form, or custom phrase.
            </div>
          {:else}
            {#if highlightsStore.lemmas.length > 0}
              <div class="hl-modal-section">
                <h3>(1) Lemma Highlights</h3>
                <div class="hl-chips-grid">
                  {#each highlightsStore.lemmas as l (l.lemma)}
                    <div class="hl-chip lemma-chip" style={`--chip-hue: ${l.hue}`}>
                      <span class="chip-color-dot"></span>
                      <span class="chip-text">{normalizeLemmaAccents(l.displayLemma)}</span>
                      <button
                        class="chip-remove-btn"
                        onclick={() => handleRemoveLemmaHighlight(l.lemma)}
                        aria-label={`Remove ${l.displayLemma} highlight`}
                      >×</button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if highlightsStore.forms.length > 0}
              <div class="hl-modal-section">
                <h3>(2) Exact Form Highlights</h3>
                <div class="hl-chips-grid">
                  {#each highlightsStore.forms as f (f.word)}
                    <div class="hl-chip form-chip" style={`--chip-hue: ${f.hue}`}>
                      <span class="chip-color-dot"></span>
                      <span class="chip-text">{f.displayWord}</span>
                      <button
                        class="chip-remove-btn"
                        onclick={() => handleRemoveFormHighlight(f.word)}
                        aria-label={`Remove ${f.displayWord} highlight`}
                      >×</button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if highlightsStore.phrases && highlightsStore.phrases.length > 0}
              <div class="hl-modal-section">
                <h3>(3) Custom Phrase Highlights</h3>
                <div class="hl-chips-grid">
                  {#each highlightsStore.phrases as p (p.phrase)}
                    <div class="hl-chip phrase-chip" style={`--chip-hue: ${p.hue}`}>
                      <span class="chip-color-dot"></span>
                      <span class="chip-text">{p.displayPhrase}</span>
                      <button
                        class="chip-remove-btn"
                        onclick={() => handleRemovePhraseHighlight(p.displayPhrase)}
                        aria-label={`Remove ${p.displayPhrase} highlight`}
                      >×</button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <div class="hl-modal-footer">
              <button class="hl-clear-all-btn" onclick={handleClearAllHighlights}>
                Clear All Highlights
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(.lemma-backdrop) {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background-color: rgba(0, 0, 0, 0.45) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
    z-index: 10000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 1rem !important;
    box-sizing: border-box !important;
  }

  :global(.lemma-card) {
    position: relative !important;
    z-index: 10001 !important;
    background-color: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    width: 100%;
    max-width: 760px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--popup-shadow, 0 15px 35px rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }

  :global(.lemma-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
  }

  :global(.lemma-header-title h2) {
    margin: 0 0 0.15rem 0;
    font-size: 1.15rem;
    color: var(--accent, #1f6f7a);
    font-family: var(--font-english, "EB Garamond", serif);
  }

  :global(.lemma-sub) {
    font-size: 0.8rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.lemma-close-btn) {
    background: transparent;
    border: none;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    padding: 0 0.4rem;
    border-radius: 4px;
  }

  :global(.lemma-close-btn:hover) {
    color: var(--text, #171a1c);
    background: var(--border, #d4d8d3);
  }

  :global(.main-tabs-strip) {
    display: flex;
    gap: 0.4rem;
    background: var(--page-bg, #eceee7);
    padding: 6px;
    border-bottom: 1px solid var(--border, #d4d8d3);
  }

  :global(.main-tab-btn) {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background: transparent;
    border: none;
    padding: 0.55rem 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  :global(.main-tab-btn:hover:not(:disabled)) {
    color: var(--text, #171a1c);
    background: var(--col-bg, #ffffff);
  }

  :global(.main-tab-btn.active) {
    background: var(--accent, #1f6f7a) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(31, 111, 122, 0.25);
  }

  :global(.main-tab-btn:disabled) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  :global(.active-word-badge) {
    background: rgba(0, 0, 0, 0.12);
    color: inherit;
    font-family: var(--font-greek, serif);
    font-size: 0.8rem;
    padding: 0.1rem 0.45rem;
    border-radius: 8px;
    margin-left: 0.2rem;
  }

  :global(.sub-tabs-strip) {
    display: flex;
    gap: 0.35rem;
    background: var(--col-bg, #f5f6f2);
    padding: 4px 1.25rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
  }

  :global(.sub-tab-btn) {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    padding: 0.38rem 0.65rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  :global(.sub-tab-btn:hover:not(.active)) {
    background: var(--page-bg, #eceee7);
    color: var(--text, #171a1c);
  }

  :global(.sub-tab-btn.active) {
    background: var(--popup-bg, #ffffff);
    color: var(--accent, #1f6f7a);
    border-color: var(--border, #d4d8d3);
    font-weight: 700;
  }

  :global(.search-input-wrapper) {
    padding: 0.85rem 1.25rem 0.6rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--col-bg, #f5f6f2);
    border-bottom: 1px solid var(--border, #d4d8d3);
  }

  :global(.input-row) {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.search-input) {
    width: 100%;
    padding: 0.6rem 2.2rem 0.6rem 0.85rem;
    font-size: 1.15rem;
    font-family: var(--font-greek, "Cardo", "EB Garamond", serif);
    background: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 6px;
  }

  :global(.clear-input-btn) {
    position: absolute;
    right: 0.6rem;
    background: transparent;
    border: none;
    color: var(--text-mid, #545b5c);
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem;
  }

  :global(.search-options-row) {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.case-sensitive-label) {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }

  :global(.lemma-body) {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
  }

  :global(.lemma-loading), :global(.lemma-prompt-msg), :global(.lemma-empty-msg) {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-mid, #545b5c);
    font-size: 0.95rem;
  }

  :global(.lemma-results-list) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  :global(.lemma-item-card) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--popup-bg, #ffffff);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  :global(.lemma-item-card:hover) {
    border-color: var(--accent, #1f6f7a);
    background: var(--page-bg, #f8f9f6);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  :global(.lemma-item-left) {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  :global(.lemma-word-text) {
    font-family: var(--font-greek, serif);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
  }

  :global(.lemma-count-badge) {
    font-size: 0.78rem;
    font-weight: 600;
    background: var(--page-bg, #eceee7);
    color: var(--text-mid, #545b5c);
    padding: 0.15rem 0.45rem;
    border-radius: 10px;
    border: 1px solid var(--border, #d4d8d3);
  }

  :global(.lemma-gloss-text) {
    font-size: 0.88rem;
    color: var(--text, #171a1c);
    font-style: italic;
    flex: 1;
    margin: 0 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.lemma-inspect-btn) {
    background: transparent;
    border: none;
    color: var(--accent, #1f6f7a);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  :global(.info-header-block) {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-bottom: 1px solid var(--border, #d4d8d3);
    padding-bottom: 0.6rem;
    margin-bottom: 0.8rem;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  :global(.word-primary-text) {
    font-family: var(--font-greek, serif);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
  }

  :global(.word-lemma-sub) {
    font-family: var(--font-greek, serif);
    font-size: 1.1rem;
    color: var(--text-mid, #545b5c);
    margin-left: 0.4rem;
  }

  :global(.info-tags) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  :global(.pos-badge) {
    background-color: var(--page-bg, #eceee7);
    color: var(--accent, #1f6f7a);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    border: 1px solid var(--border, #d4d8d3);
  }

  :global(.parse-tag) {
    background-color: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--accent, #1f6f7a);
  }

  :global(.morph-section) {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.8rem;
  }

  :global(.lemma-line), :global(.gloss-line) {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }

  :global(.label) {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-mid, #545b5c);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    min-width: 3.5rem;
  }

  :global(.lemma-value) {
    font-family: var(--font-greek, serif);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--accent, #1f6f7a);
  }

  :global(.gloss-value) {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text, #171a1c);
  }

  :global(.popup-hl-bar) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    margin: 0.75rem 0 1rem 0;
    background-color: var(--page-bg, #f2f4ef);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 24px;
    flex-wrap: wrap;
  }

  :global(.hl-label) {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-mid, #545b5c);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 0.2rem;
  }

  :global(.hl-toggle-btn) {
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background-color: var(--col-bg, #f4f6f0);
    border: 1px solid var(--border, #c5cac0);
    border-radius: 16px;
    padding: 0.22rem 0.65rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  :global(.hl-btn-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    font-size: 0.68rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.08);
    color: var(--text-mid, #545b5c);
  }

  :global(.hl-toggle-btn:hover) {
    background-color: var(--popup-bg, #ffffff);
    border-color: var(--accent, #1f6f7a);
    color: var(--accent, #1f6f7a);
  }

  :global(.hl-toggle-btn.active) {
    background-color: hsl(var(--btn-hue, 160), 65%, 42%) !important;
    border-color: hsl(var(--btn-hue, 160), 75%, 32%) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
  }

  :global(.hl-toggle-btn.active .hl-btn-icon) {
    background-color: #ffffff !important;
    color: hsl(var(--btn-hue, 160), 80%, 25%) !important;
  }

  :global(.hl-view-btn) {
    background: transparent;
    border: 1px solid var(--accent, #1f6f7a);
    color: var(--accent, #1f6f7a);
    border-radius: 16px;
    padding: 0.22rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-left: auto;
  }

  :global(.hl-view-btn:hover) {
    background-color: var(--accent, #1f6f7a);
    color: #ffffff;
  }

  :global(.hl-clear-btn) {
    background: transparent;
    border: 1px dashed var(--error, #b22323);
    color: var(--error, #b22323);
    border-radius: 16px;
    padding: 0.22rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-left: 0.25rem;
  }

  :global(.hl-clear-btn:hover) {
    background-color: var(--error, #b22323);
    color: #ffffff;
    border-style: solid;
  }

  :global(.dict-details) {
    margin-top: 0.8rem;
    border-top: 1px solid var(--border, #d4d8d3);
    padding-top: 0.6rem;
    margin-bottom: 1rem;
  }

  :global(.dict-summary) {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    cursor: pointer;
    user-select: none;
    padding: 0.3rem 0;
  }

  :global(.dict-def) {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.55;
    background-color: var(--page-bg, #f8f9f6);
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text, #171a1c);
    max-height: 250px;
    overflow-y: auto;
    font-family: serif;
  }

  :global(.custom-results-summary) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
    font-size: 0.88rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.custom-results-actions) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  :global(.btn-collapse-all) {
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    padding: 0.25rem 0.6rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    border-radius: 4px;
    cursor: pointer;
  }

  :global(.phrase-hl-toggle-btn) {
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    padding: 0.25rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--accent, #1f6f7a);
    border-radius: 4px;
    cursor: pointer;
  }

  :global(.phrase-hl-toggle-btn.active) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }

  :global(.custom-results-tree) {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  :global(.work-results-group), :global(.book-results-group) {
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 6px;
    background: var(--popup-bg, #ffffff);
    padding: 0.5rem 0.75rem;
  }

  :global(.work-results-title), :global(.book-results-title) {
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    cursor: pointer;
  }

  :global(.sections-results-list) {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  :global(.sec-result-card) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: var(--page-bg, #f8f9f6);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.88rem;
  }

  :global(.sec-result-card:hover) {
    border-color: var(--accent, #1f6f7a);
    background: var(--popup-bg, #ffffff);
  }

  :global(.sec-badge) {
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    font-size: 0.8rem;
    min-width: 5.5rem;
  }

  :global(.sec-kwic-snippet) {
    flex: 1;
    font-family: var(--font-greek, serif);
    font-size: 0.95rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.kwic-mark) {
    background-color: #ffe066;
    color: #171a1c;
    border-radius: 2px;
    padding: 0 0.15rem;
    font-weight: 700;
  }

  :global(.sec-jump-hint) {
    font-size: 0.78rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.hl-modal-section) {
    margin-bottom: 1.2rem;
  }

  :global(.hl-modal-section h3) {
    font-size: 0.9rem;
    color: var(--text-mid, #545b5c);
    margin: 0 0 0.5rem 0;
  }

  :global(.hl-chips-grid) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  :global(.hl-chip) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    border-radius: 16px;
    font-size: 0.85rem;
    background: hsl(var(--chip-hue, 160), 65%, 92%);
    border: 1px solid hsl(var(--chip-hue, 160), 50%, 75%);
    color: hsl(var(--chip-hue, 160), 80%, 25%);
  }

  :global(.chip-color-dot) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: hsl(var(--chip-hue, 160), 75%, 45%);
  }

  :global(.chip-text) {
    font-family: var(--font-greek, serif);
    font-weight: 600;
  }

  :global(.chip-remove-btn) {
    background: transparent;
    border: none;
    font-size: 1rem;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    padding: 0 0.2rem;
  }

  :global(.hl-modal-footer) {
    margin-top: 1.5rem;
    text-align: right;
  }

  :global(.hl-clear-all-btn) {
    background: transparent;
    border: 1px dashed var(--error, #b22323);
    color: var(--error, #b22323);
    padding: 0.4rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
  }

  :global(.hl-clear-all-btn:hover) {
    background: var(--error, #b22323);
    color: #ffffff;
    border-style: solid;
  }
</style>
