<script lang="ts">
  import { onMount } from "svelte";
  import LemmaWindow from "./LemmaWindow.svelte";
  import SectionNavPill from "./SectionNavPill.svelte";
  import CitationModal from "./CitationModal.svelte";
  import BookmarksModal from "./BookmarksModal.svelte";
  import { fetchBook, type BookData, type Section } from "../lib/data";
  import { getWork } from "../lib/works";
  import { formatSourceReference } from "../lib/citation";
  import {
    getBookmarks,
    toggleBookmark,
    isBookmarked,
    type BookmarkItem,
  } from "../lib/bookmarks";
  import {
    getHighlights,
    getWordHighlightInfo,
    preloadActiveLemmaFormSets,
    removeLemmaHighlight,
    removeFormHighlight,
    removePhraseHighlight,
    clearAllHighlights,
    type HighlightStore,
  } from "../lib/highlights";

  let {
    work = "Antiquities",
    bookNum = 1,
    bookData = null,
  }: {
    work?: string;
    bookNum?: number;
    bookData?: BookData | null;
  } = $props();

  let sections = $state<Section[]>([]);
  let loading = $state(true);
  let viewMode = $state<"parallel" | "greek" | "english" | "stacked">(
    "parallel",
  );
  let lastDualMode = $state<"parallel" | "stacked">("parallel");

  $effect(() => {
    if (viewMode === "parallel" || viewMode === "stacked") {
      lastDualMode = viewMode;
    }
  });
  let fontSize = $state(18);
  let morphEnabled = $state(true);
  let selectedWord = $state<string | null>(null);
  let highlightsStore = $state<HighlightStore>({ lemmas: [], forms: [] });

  let isZenMode = $state(false);
  let zenExpanded = $state(false);
  let showBookmarksModal = $state(false);

  let showLemmaWindow = $state(false);
  let lemmaWindowTab = $state<"search" | "info" | "highlights">("search");
  let lemmaWindowSubTab = $state<"lemma" | "custom">("lemma");
  let lemmaWindowWord = $state("");
  let lemmaWindowLemmaNorm = $state("");
  let lemmaWindowLemmaDisplay = $state("");

  let citationSecNum = $state<string | null>(null);
  let bookmarksList = $state<BookmarkItem[]>([]);
  let copiedBlockId = $state<string | null>(null);

  let workMeta = $derived(getWork(work));
  let totalActiveHighlights = $derived(
    highlightsStore.lemmas.length +
      highlightsStore.forms.length +
      (highlightsStore.phrases?.length || 0),
  );
  let totalBookmarks = $derived(bookmarksList.length);

  function refreshHighlights() {
    highlightsStore = getHighlights();
  }

  function refreshBookmarks() {
    bookmarksList = getBookmarks();
  }

  function toggleZenMode() {
    isZenMode = !isZenMode;
    if (isZenMode) {
      zenExpanded = false;
    }
  }

  function handleToggleBookmark(secNum: string, snippet: string) {
    toggleBookmark(work, bookNum, secNum, snippet);
    refreshBookmarks();
  }

  $effect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("reader-state-changed", {
          detail: { viewMode, fontSize, morphEnabled },
        }),
      );
    }
  });

  let targetWord = $state<string | null>(null);
  let targetLemma = $state<string | null>(null);

  function readHighlightParams() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      targetWord = params.get("hl") || null;
      targetLemma = params.get("lemma") || null;
    }
  }

  function cleanWordText(text: string): string {
    if (!text) return "";
    return text.replace(/[.,·;:!?"'»«()\[\]]/g, "").trim();
  }

  function stripAccents(text: string): string {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ς/g, "σ");
  }

  function getHighlightInfo(word: string): {
    className: string;
    style: string;
  } {
    const hlInfo = getWordHighlightInfo(word, highlightsStore);
    if (hlInfo.isForm) {
      return { className: "word-hl-form", style: hlInfo.style || "" };
    }
    if (hlInfo.isLemma) {
      return { className: "word-hl-lemma", style: hlInfo.style || "" };
    }
    if (hlInfo.isPhrase) {
      return { className: "word-hl-phrase", style: hlInfo.style || "" };
    }

    if (targetWord || targetLemma) {
      const cleanW = cleanWordText(word);
      if (cleanW) {
        if (targetWord) {
          const cleanT = cleanWordText(targetWord);
          if (
            cleanW === cleanT ||
            stripAccents(cleanW) === stripAccents(cleanT)
          ) {
            return { className: "word-hl-primary", style: "" };
          }
        }
        if (targetLemma) {
          const normW = stripAccents(cleanW);
          const normL = stripAccents(cleanWordText(targetLemma));
          if (
            normW === normL ||
            (normL.length >= 3 &&
              normW.startsWith(normL.slice(0, Math.min(normL.length, 5))))
          ) {
            return { className: "word-hl-secondary", style: "" };
          }
        }
      }
    }

    return { className: "", style: "" };
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const isInput =
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable);

    if (e.key === "Escape") {
      if (isZenMode) isZenMode = false;
      if (showLemmaWindow) showLemmaWindow = false;
      if (showBookmarksModal) showBookmarksModal = false;
      if (citationSecNum !== null) citationSecNum = null;
      return;
    }
  }

  async function copyBlockText(
    secNum: string,
    text: string,
    lang: "grc" | "eng",
  ) {
    if (!text) return;
    const citeRef = formatSourceReference(work, bookNum, secNum, lang);
    const formattedOutput = `${text.trim()}\n\n${citeRef}`;
    const blockId = `niese-${secNum}-${lang}`;
    try {
      await navigator.clipboard.writeText(formattedOutput);
      copiedBlockId = blockId;
      setTimeout(() => {
        if (copiedBlockId === blockId) copiedBlockId = null;
      }, 1500);
    } catch (err) {
      console.error("Failed to copy section text:", err);
    }
  }

  onMount(() => {
    readHighlightParams();
    refreshHighlights();
    refreshBookmarks();
    preloadActiveLemmaFormSets();

    const handleSetViewMode = (e: Event) => {
      const mode = (e as CustomEvent).detail;
      if (
        mode === "parallel" ||
        mode === "stacked" ||
        mode === "greek" ||
        mode === "english"
      ) {
        viewMode = mode;
      }
    };
    const handleSetFontSize = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === "inc") increaseFontSize();
      if (action === "dec") decreaseFontSize();
    };
    const handleToggleMorph = () => {
      morphEnabled = !morphEnabled;
    };
    const handleToggleZen = () => {
      toggleZenMode();
    };
    const handleToggleDualMode = () => {
      if (viewMode === "parallel") {
        viewMode = "stacked";
      } else if (viewMode === "stacked") {
        viewMode = "parallel";
      } else {
        viewMode = lastDualMode;
      }
    };
    const handleHighlightsChanged = () => {
      refreshHighlights();
    };
    const handleBookmarksChanged = () => {
      refreshBookmarks();
    };
    const handleToggleBookmarksModal = () => {
      showBookmarksModal = !showBookmarksModal;
    };
    const handleToggleHighlightsModal = () => {
      lemmaWindowTab = "highlights";
      showLemmaWindow = true;
    };
    const handleToggleSearchModal = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        if (detail.tab === "custom" || detail.tab === "lemma") {
          lemmaWindowTab = "search";
          lemmaWindowSubTab = detail.tab;
        } else if (detail.tab === "highlights") {
          lemmaWindowTab = "highlights";
        } else if (detail.tab === "info") {
          lemmaWindowTab = "info";
        } else {
          lemmaWindowTab = "search";
        }
        lemmaWindowLemmaNorm = detail.lemmaNorm || "";
        lemmaWindowLemmaDisplay = detail.lemmaDisplay || "";
      } else {
        lemmaWindowTab = "search";
        lemmaWindowSubTab = "lemma";
      }
      showLemmaWindow = true;
    };

    window.addEventListener("reader-set-viewmode", handleSetViewMode);
    window.addEventListener("reader-set-fontsize", handleSetFontSize);
    window.addEventListener("reader-toggle-morph", handleToggleMorph);
    window.addEventListener("reader-toggle-zen", handleToggleZen);
    window.addEventListener("reader-toggle-dualmode", handleToggleDualMode);
    window.addEventListener(
      "reader-highlights-changed",
      handleHighlightsChanged,
    );
    window.addEventListener("reader-bookmarks-changed", handleBookmarksChanged);
    window.addEventListener("reader-toggle-bookmarks", handleToggleBookmarksModal);
    window.addEventListener(
      "reader-toggle-highlights",
      handleToggleHighlightsModal,
    );
    window.addEventListener("reader-toggle-search", handleToggleSearchModal);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.removeEventListener("reader-set-viewmode", handleSetViewMode);
      window.removeEventListener("reader-set-fontsize", handleSetFontSize);
      window.removeEventListener("reader-toggle-morph", handleToggleMorph);
      window.removeEventListener("reader-toggle-zen", handleToggleZen);
      window.removeEventListener("reader-toggle-dualmode", handleToggleDualMode);
      window.removeEventListener(
        "reader-highlights-changed",
        handleHighlightsChanged,
      );
      window.removeEventListener(
        "reader-bookmarks-changed",
        handleBookmarksChanged,
      );
      window.removeEventListener(
        "reader-toggle-bookmarks",
        handleToggleBookmarksModal,
      );
      window.removeEventListener(
        "reader-toggle-highlights",
        handleToggleHighlightsModal,
      );
      window.removeEventListener(
        "reader-toggle-search",
        handleToggleSearchModal,
      );
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("hashchange", scrollToHash);
    };
  });

  function findSectionElement(hash: string): HTMLElement | null {
    if (typeof window === "undefined" || !hash) return null;
    const raw = hash.replace(/^#/, "");
    const decoded = decodeURIComponent(raw);

    let el = document.getElementById(raw) || document.getElementById(decoded);
    if (el) return el;

    const cleanSec = decoded.replace(/^niese-/, "").trim();

    el =
      (document.querySelector(
        `[data-niese="${cleanSec}"]`,
      ) as HTMLElement | null) ||
      (document.querySelector(
        `[data-section="${cleanSec}"]`,
      ) as HTMLElement | null);
    if (el) return el;

    const numMatch = cleanSec.match(/^\d+/);
    if (numMatch) {
      const num = numMatch[0];
      el =
        document.getElementById(`niese-${num}`) ||
        (document.querySelector(
          `[data-section="${num}"]`,
        ) as HTMLElement | null) ||
        (document.querySelector(
          `[data-niese^="${num}"]`,
        ) as HTMLElement | null);
      if (el) return el;
    }

    return null;
  }

  function scrollToHash() {
    if (typeof window === "undefined" || !window.location.hash) return;
    const hash = window.location.hash;

    const attemptScroll = (attemptsLeft: number) => {
      const el = findSectionElement(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attemptsLeft > 0) {
        setTimeout(() => attemptScroll(attemptsLeft - 1), 80);
      }
    };

    setTimeout(() => attemptScroll(8), 50);
  }

  $effect(() => {
    if (bookData && bookData.sections) {
      sections = bookData.sections;
      loading = false;
      scrollToHash();
    } else {
      sections = [];
      loading = true;
      loadBookData(work, bookNum);
    }
  });

  function loadBookData(w: string, b: number) {
    loading = true;
    fetchBook(w, b)
      .then((data) => {
        sections = data.sections || [];
        loading = false;
        scrollToHash();
      })
      .catch((err) => {
        console.error("Failed to load book data:", err);
        loading = false;
      });
  }

  function handleWordClick(w: string) {
    if (!morphEnabled) return;
    const cleanWord = w.replace(/[.,·;:!?"'»«]+$/, "").replace(/^[«»"']/, "");
    if (cleanWord) {
      selectedWord = cleanWord;
      lemmaWindowWord = cleanWord;
      lemmaWindowTab = "info";
      showLemmaWindow = true;
    }
  }

  function decreaseFontSize() {
    fontSize = Math.max(14, fontSize - 2);
  }

  function increaseFontSize() {
    fontSize = Math.min(28, fontSize + 2);
  }

  function getWords(text: string): string[] {
    if (!text) return [];
    return text.trim().split(/\s+/);
  }
</script>

<div
  class="reader-container"
  class:is-zen={isZenMode}
  style={`--reader-font-size: ${fontSize}px`}
>
  <!-- Sticky Reader Controls Strip -->
  <div
    class="controls-strip"
    class:zen-strip={isZenMode}
    class:zen-expanded={zenExpanded}
  >
    {#if !isZenMode}
      <!-- Standard Bar Layout in Normal Mode -->
      <div class="controls-group view-modes">
        <button
          class="ctrl-btn icon-btn"
          class:active={viewMode === "parallel"}
          onclick={() => (viewMode = "parallel")}
          title="Side-by-side (Greek & English)"
          aria-label="Side-by-side view"
        >
          ◧
        </button>
        <button
          class="ctrl-btn icon-btn"
          class:active={viewMode === "stacked"}
          onclick={() => (viewMode = "stacked")}
          title="Stacked section text"
          aria-label="Stacked view"
        >
          ⬓
        </button>
        <button
          class="ctrl-btn icon-btn"
          class:active={viewMode === "greek"}
          onclick={() => (viewMode = "greek")}
          title="Greek text only"
          aria-label="Greek view"
        >
          Ω
        </button>
        <button
          class="ctrl-btn icon-btn"
          class:active={viewMode === "english"}
          onclick={() => (viewMode = "english")}
          title="English text only"
          aria-label="English view"
        >
          A
        </button>
      </div>

      <h1 class="work-title-heading">
        {workMeta?.englishTitle ||
          work}{#if workMeta && workMeta.booksCount > 1}
          — Book {bookNum}{/if}
      </h1>

      <div class="right-controls">
        <button
          class="ctrl-btn bm-modal-toggle"
          class:has-bookmarks={totalBookmarks > 0}
          onclick={(e) => {
            e.stopPropagation();
            showBookmarksModal = !showBookmarksModal;
          }}
          title="View saved bookmarks"
          aria-label="Bookmarks"
        >
          🔖{#if totalBookmarks > 0}
            <span class="bm-badge">{totalBookmarks}</span>{/if}
        </button>

        <div class="controls-group font-controls">
          <button
            class="ctrl-btn font-btn"
            onclick={decreaseFontSize}
            disabled={fontSize <= 14}
            title="Decrease text size"
          >
            A<sup>-</sup>
          </button>

          <button
            class="ctrl-btn font-btn"
            onclick={increaseFontSize}
            disabled={fontSize >= 28}
            title="Increase text size"
          >
            A<sup>+</sup>
          </button>
        </div>

        <div class="controls-group morph-controls">
          <button
            class="ctrl-btn morph-toggle"
            class:active={morphEnabled}
            onclick={(e) => {
              e.stopPropagation();
              morphEnabled = !morphEnabled;
            }}
            title="Toggle Word Info / Click-to-view [W]"
          >
            W
          </button>

          <button
            class="ctrl-btn search-toggle-btn"
            class:active={showLemmaWindow && lemmaWindowTab === "search"}
            onclick={(e) => {
              e.stopPropagation();
              lemmaWindowTab = "search";
              lemmaWindowSubTab = "lemma";
              showLemmaWindow = true;
            }}
            title="Open Corpus Search [S]"
          >
            <span class="search-icon">🔍</span>S
          </button>

          <button
            class="ctrl-btn hl-modal-toggle"
            class:has-highlights={totalActiveHighlights > 0}
            class:active={showLemmaWindow && lemmaWindowTab === "highlights"}
            onclick={(e) => {
              e.stopPropagation();
              lemmaWindowTab = "highlights";
              showLemmaWindow = true;
            }}
            title="Open Active Highlights [H]"
          >
            <span class="hl-letter">H</span>{#if totalActiveHighlights > 0}
              <span class="hl-badge">{totalActiveHighlights}</span>{/if}
          </button>
        </div>

        <!-- Zen Mode Button -->
        <button
          class="ctrl-btn zen-toggle-btn"
          class:active={isZenMode}
          onclick={toggleZenMode}
          title="Toggle Zen Mode [Z]"
          aria-label="Toggle Zen Mode"
        >
          Z
        </button>
      </div>
    {:else}
      <!-- Minimal Zen Mode Header & Slide-down Drawer -->
      <div class="zen-header-row">
        <h1 class="work-title-heading zen-title">
          {workMeta?.englishTitle ||
            work}{#if workMeta && workMeta.booksCount > 1}
            — Book {bookNum}{/if}
        </h1>

        <div class="zen-header-actions">
          <button
            class="ctrl-btn zen-caret-btn"
            class:expanded={zenExpanded}
            onclick={() => (zenExpanded = !zenExpanded)}
            title={zenExpanded
              ? "Collapse controls drawer"
              : "Expand controls drawer"}
            aria-label={zenExpanded ? "Collapse controls" : "Expand controls"}
            aria-expanded={zenExpanded}
          >
            {zenExpanded ? "▴" : "▾"}
          </button>

          <button
            class="ctrl-btn zen-toggle-btn active"
            onclick={toggleZenMode}
            title="Exit Zen Mode [Z]"
            aria-label="Exit Zen Mode"
          >
            Z
          </button>
        </div>
      </div>

      <!-- Slide-down Drawer for Controls -->
      <div class="zen-controls-drawer" class:open={zenExpanded}>
        <div class="controls-group view-modes">
          <button
            class="ctrl-btn icon-btn"
            class:active={viewMode === "parallel"}
            onclick={() => (viewMode = "parallel")}
            title="Side-by-side (Greek & English)"
            aria-label="Side-by-side view"
          >
            ◧
          </button>
          <button
            class="ctrl-btn icon-btn"
            class:active={viewMode === "stacked"}
            onclick={() => (viewMode = "stacked")}
            title="Stacked section text"
            aria-label="Stacked view"
          >
            ⬓
          </button>
          <button
            class="ctrl-btn icon-btn"
            class:active={viewMode === "greek"}
            onclick={() => (viewMode = "greek")}
            title="Greek text only"
            aria-label="Greek view"
          >
            Ω
          </button>
          <button
            class="ctrl-btn icon-btn"
            class:active={viewMode === "english"}
            onclick={() => (viewMode = "english")}
            title="English text only"
            aria-label="English view"
          >
            A
          </button>
        </div>

        <div class="controls-group font-controls">
          <button
            class="ctrl-btn font-btn"
            onclick={decreaseFontSize}
            disabled={fontSize <= 14}
            title="Decrease text size"
          >
            A<sup>-</sup>
          </button>

          <button
            class="ctrl-btn font-btn"
            onclick={increaseFontSize}
            disabled={fontSize >= 28}
            title="Increase text size"
          >
            A<sup>+</sup>
          </button>
        </div>

        <div class="controls-group morph-controls">
          <button
            class="ctrl-btn morph-toggle"
            class:active={morphEnabled}
            onclick={(e) => {
              e.stopPropagation();
              morphEnabled = !morphEnabled;
            }}
            title="Toggle Word Info / Click-to-view [W]"
          >
            W
          </button>

          <button
            class="ctrl-btn search-toggle-btn"
            class:active={showLemmaWindow && lemmaWindowTab === "search"}
            onclick={() => {
              lemmaWindowTab = "search";
              lemmaWindowSubTab = "lemma";
              showLemmaWindow = true;
            }}
            title="Open Corpus Search (S)"
          >
            <span class="search-icon">🔍</span>S
          </button>

          <button
            class="ctrl-btn hl-modal-toggle"
            class:has-highlights={totalActiveHighlights > 0}
            class:active={showLemmaWindow && lemmaWindowTab === "highlights"}
            onclick={() => {
              lemmaWindowTab = "highlights";
              showLemmaWindow = true;
            }}
            title="Open Active Highlights (H)"
          >
            <span class="hl-letter">H</span>{#if totalActiveHighlights > 0}
              <span class="hl-badge">{totalActiveHighlights}</span>{/if}
          </button>
        </div>

        <button
          class="ctrl-btn bm-modal-toggle"
          class:has-bookmarks={totalBookmarks > 0}
          onclick={() => (showBookmarksModal = !showBookmarksModal)}
          title="View saved bookmarks"
          aria-label="Bookmarks"
        >
          🔖{#if totalBookmarks > 0}
            <span class="bm-badge">{totalBookmarks}</span>{/if}
        </button>
      </div>
    {/if}
  </div>

  <main class="reader-content">
    {#if loading}
      <div class="loading-state">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span>Loading text data for {workMeta?.englishTitle || work} Book {bookNum}...</span>
      </div>
    {:else if sections.length === 0}
      <div class="empty-state">
        No section data available for {workMeta?.englishTitle || work} Book {bookNum}.
      </div>
    {:else}
      <div class={`text-grid view-${viewMode}`}>
        {#each sections as sec, sIdx (sIdx)}
          {@const nieseSecStr = String(sec.niese || sec.section_num)}
          {@const secNumStr = String(sec.section_num || sec.niese)}
          {@const isBm = bookmarksList.some(
            (bm) => bm.id === `${work}-${bookNum}-${secNumStr}`,
          )}
          <div
            class="section-row"
            id={`niese-${sec.section_num || sec.niese}`}
            data-niese={sec.niese}
            data-section={sec.section_num}
          >
            <div class="section-row-header">
              <div class="section-badge" title={`Niese Section ${sec.niese}`}>
                § {sec.niese}
              </div>
              <div class="section-header-actions">
                <button
                  class="sec-action-btn bm-star-btn"
                  class:is-bookmarked={isBm}
                  onclick={(e) => {
                    e.stopPropagation();
                    handleToggleBookmark(secNumStr, sec.eng || sec.grc);
                  }}
                  title={isBm ? "Remove bookmark" : "Bookmark section"}
                  aria-label="Bookmark section"
                >
                  {isBm ? "★" : "☆"}
                </button>
                <button
                  class="sec-action-btn cite-trigger-btn"
                  onclick={(e) => {
                    e.stopPropagation();
                    citationSecNum = nieseSecStr;
                  }}
                  title="Generate academic citation for this section"
                  aria-label="Cite section"
                >
                  Cite
                </button>
              </div>
            </div>

            <div class="columns-wrapper">
              {#if viewMode === "parallel" || viewMode === "greek" || viewMode === "stacked"}
                <div class="greek-col">
                  <div class="text-content">
                    {#each getWords(sec.grc) as word, wIdx (wIdx)}
                      {@const hl = getHighlightInfo(word)}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <span
                        class={`greek-word ${hl.className}`.trim()}
                        style={hl.style}
                        class:interactive={morphEnabled}
                        onclick={() => handleWordClick(word)}>{word}</span
                      >{" "}
                    {/each}
                  </div>
                  <button
                    class="block-copy-btn"
                    class:copied={copiedBlockId === `niese-${secNumStr}-grc`}
                    onclick={(e) => {
                      e.stopPropagation();
                      copyBlockText(nieseSecStr, sec.grc, "grc");
                    }}
                    title="Copy Greek text with reference"
                    aria-label="Copy Greek text"
                  >
                    {#if copiedBlockId === `niese-${secNumStr}-grc`}
                      ✓
                    {:else}
                      📋
                    {/if}
                  </button>
                </div>
              {/if}

              {#if viewMode === "parallel" || viewMode === "english" || viewMode === "stacked"}
                <div class="english-col">
                  <div class="text-content">
                    {sec.eng}
                  </div>
                  <button
                    class="block-copy-btn"
                    class:copied={copiedBlockId === `niese-${secNumStr}-eng`}
                    onclick={(e) => {
                      e.stopPropagation();
                      copyBlockText(nieseSecStr, sec.eng, "eng");
                    }}
                    title="Copy English text with reference"
                    aria-label="Copy English text"
                  >
                    {#if copiedBlockId === `niese-${secNumStr}-eng`}
                      ✓
                    {:else}
                      📋
                    {/if}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <SectionNavPill {sections} {work} {bookNum} {isZenMode} />
  </main>

  {#if citationSecNum}
    <CitationModal
      {work}
      {bookNum}
      nieseSec={citationSecNum}
      onClose={() => (citationSecNum = null)}
    />
  {/if}

  {#if showBookmarksModal}
    <BookmarksModal onClose={() => (showBookmarksModal = false)} />
  {/if}

  {#if showLemmaWindow}
    <LemmaWindow
      {work}
      {bookNum}
      initialTab={lemmaWindowTab}
      initialSearchSubTab={lemmaWindowSubTab}
      initialWord={lemmaWindowWord}
      initialLemmaNorm={lemmaWindowLemmaNorm}
      initialLemmaDisplay={lemmaWindowLemmaDisplay}
      onClose={() => {
        showLemmaWindow = false;
        lemmaWindowWord = "";
        lemmaWindowLemmaNorm = "";
        lemmaWindowLemmaDisplay = "";
      }}
    />
  {/if}
</div>

<style>
  .reader-container {
    max-width: 1300px;
    margin: 0 auto;
    padding: 1rem 1.5rem 5.5rem 1.5rem;
    font-size: var(--reader-font-size, 18px);
    transition: all 0.25s ease;
  }

  /* Zen Mode Styling */
  .reader-container.is-zen {
    max-width: 900px;
    padding-top: 0;
  }

  :global(body:has(.reader-container.is-zen) header),
  :global(body:has(.reader-container.is-zen) footer) {
    display: none !important;
  }

  .work-title-heading {
    font-family: var(--font-english, "EB Garamond", Georgia, serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text, #171a1c);
    margin: 0;
    text-align: center;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 0.5rem;
  }

  .right-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .controls-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 6px;
    margin-bottom: 1.5rem;
    position: sticky;
    top: 60px;
    z-index: 50;
    transition: all 0.2s ease;
  }

  .reader-container.is-zen .controls-strip {
    background: var(--popup-bg, #ffffff);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    opacity: 0.92;
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem 0.85rem;
    gap: 0;
    top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .reader-container.is-zen .controls-strip:hover {
    opacity: 1;
  }

  .zen-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5rem;
  }

  .zen-title {
    text-align: center;
    flex: 1;
    margin: 0;
  }

  .zen-header-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .zen-caret-btn {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    background: var(--page-bg, #eceee7);
    color: var(--accent, #1f6f7a);
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .zen-caret-btn:hover {
    background: var(--col-bg, #ffffff);
    border-color: var(--accent, #1f6f7a);
  }

  .zen-caret-btn.expanded {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }

  /* Slide-down Drawer */
  .zen-controls-drawer {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    width: 100%;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition:
      max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.2s ease,
      padding 0.2s ease,
      margin 0.2s ease;
    border-top: 1px solid transparent;
    padding-top: 0;
    margin-top: 0;
  }

  .zen-controls-drawer.open {
    max-height: 140px;
    opacity: 1;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top-color: var(--border, #d4d8d3);
  }

  .controls-group {
    display: flex;
    gap: 0.25rem;
    background: var(--page-bg, #eceee7);
    padding: 2px;
    border-radius: 4px;
    border: 1px solid var(--border, #d4d8d3);
  }

  .ctrl-btn {
    background: transparent;
    border: none;
    color: var(--text-mid, #545b5c);
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.25rem 0.55rem;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .ctrl-btn:hover:not(:disabled) {
    background: var(--col-bg, #ffffff);
    color: var(--text, #171a1c);
  }

  .ctrl-btn.active {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
  }

  .zen-toggle-btn {
    font-family: var(--font-english, "EB Garamond", serif);
    font-weight: 800;
    font-size: 1.05rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    background: var(--page-bg, #eceee7);
  }

  .zen-toggle-btn.active {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }

  .bm-modal-toggle {
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    background: var(--page-bg, #eceee7);
    font-size: 0.85rem;
  }

  .bm-badge {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.05rem 0.4rem;
    border-radius: 10px;
  }

  .icon-btn {
    font-size: 1rem;
    width: 2rem;
    height: 1.8rem;
    justify-content: center;
    padding: 0;
  }

  .font-btn {
    font-family: var(--font-english, Georgia, serif);
    font-size: 0.95rem;
  }

  .font-btn sup {
    font-size: 0.7rem;
    font-weight: 700;
  }

  .font-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .search-toggle-btn {
    gap: 0.25rem;
    padding-left: 0.4rem;
    padding-right: 0.5rem;
  }

  .search-icon {
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0.85;
  }

  .hl-modal-toggle {
    position: relative;
    border-radius: 3px;
  }

  .hl-letter {
    position: relative;
    display: inline-block;
    padding-bottom: 3px;
  }

  .hl-letter::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    min-width: 10px;
    height: 3px;
    border-radius: 2px;
    background-color: var(--hl-underscore-color, #d97706);
    transition: background-color 0.2s ease;
  }

  :global([data-theme="light"]) .hl-modal-toggle,
  .hl-modal-toggle {
    --hl-underscore-color: #d97706;
  }

  :global([data-theme="dark"]) .hl-modal-toggle {
    --hl-underscore-color: #fbbf24;
  }

  :global([data-theme="sepia"]) .hl-modal-toggle {
    --hl-underscore-color: #c2410c;
  }

  .hl-modal-toggle.has-highlights {
    border: 1px solid var(--accent, #1f6f7a);
    color: var(--accent, #1f6f7a);
    background: rgba(31, 111, 122, 0.08);
    --hl-underscore-color: #ea580c;
  }

  .hl-modal-toggle.active {
    --hl-underscore-color: #fef08a !important;
  }

  .hl-badge {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.05rem 0.4rem;
    border-radius: 10px;
    margin-left: 0.2rem;
  }

  /* Reader Grid & Section Styling */
  .reader-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 4rem 1rem;
    color: var(--text-mid, #545b5c);
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border, #d4d8d3);
    border-top-color: var(--accent, #1f6f7a);
    border-radius: 50%;
    animation: reader-spin 0.8s linear infinite;
  }

  @keyframes reader-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .text-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-row {
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    scroll-margin-top: 110px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .section-row:target {
    border-color: var(--accent, #1f6f7a);
    box-shadow: 0 0 0 2px rgba(31, 111, 122, 0.2);
  }

  .section-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .section-badge {
    display: inline-block;
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    letter-spacing: 0.03em;
  }

  .section-header-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .sec-action-btn {
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sec-action-btn:hover {
    color: var(--accent, #1f6f7a);
    border-color: var(--accent, #1f6f7a);
    background: var(--col-bg, #ffffff);
  }

  .bm-star-btn {
    font-size: 0.95rem;
    line-height: 1;
    padding: 0.15rem 0.45rem;
  }

  .bm-star-btn.is-bookmarked {
    color: #b45309;
    border-color: #d97706;
    background: #fef3c7;
    font-weight: 700;
    box-shadow: 0 0 6px rgba(217, 119, 6, 0.4);
  }

  .columns-wrapper {
    display: flex;
    gap: 1.5rem;
    width: 100%;
  }

  .view-parallel .columns-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .view-stacked .columns-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .view-greek .columns-wrapper,
  .view-english .columns-wrapper {
    display: block;
  }

  .greek-col,
  .english-col {
    position: relative;
    padding-bottom: 2rem; /* space for bottom-right copy button */
  }

  .greek-col {
    font-family: var(--font-greek, "Cardo", "Gentium Plus", Georgia, serif);
    line-height: 1.65;
    color: var(--text, #171a1c);
  }

  .english-col {
    font-family: var(--font-english, "EB Garamond", Georgia, serif);
    line-height: 1.6;
    color: var(--text, #171a1c);
  }

  .greek-word {
    display: inline;
    border-radius: 2px;
    transition: background-color 0.15s ease;
  }

  .greek-word.interactive {
    cursor: pointer;
  }

  .greek-word.interactive:hover {
    background-color: rgba(31, 111, 122, 0.18);
    color: var(--accent, #1f6f7a);
  }

  .word-hl-form {
    background-color: hsl(var(--hl-hue, 45), 85%, 82%);
    color: #171a1c;
    font-weight: 600;
  }

  .word-hl-lemma {
    background-color: hsl(var(--hl-hue, 190), 80%, 85%);
    color: #171a1c;
    border-bottom: 2px solid hsl(var(--hl-hue, 190), 70%, 45%);
  }

  .word-hl-phrase {
    background-color: hsl(var(--hl-hue, 270), 80%, 85%);
    color: #171a1c;
    border-bottom: 2px dashed hsl(var(--hl-hue, 270), 70%, 45%);
    font-weight: 600;
  }

  .word-hl-primary {
    background-color: #fef08a;
    color: #171a1c;
    font-weight: 600;
  }

  .word-hl-secondary {
    background-color: #e0f2fe;
    color: #0369a1;
  }

  /* Block Copy Icon Button */
  .block-copy-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
    font-size: 0.78rem;
    cursor: pointer;
    opacity: 0.65;
    transition: all 0.15s ease;
  }

  .greek-col:hover .block-copy-btn,
  .english-col:hover .block-copy-btn,
  .block-copy-btn:hover {
    opacity: 1;
    background: var(--col-bg, #ffffff);
    border-color: var(--accent, #1f6f7a);
    color: var(--accent, #1f6f7a);
  }

  .block-copy-btn.copied {
    opacity: 1;
    background: #2e7d32;
    color: #ffffff;
    border-color: #2e7d32;
  }

  /* Highlights Modal Styling */
  .hl-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .hl-modal-card {
    background-color: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    width: 100%;
    max-width: 540px;
    box-shadow: var(--popup-shadow, 0 15px 35px rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }

  .hl-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.2rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
  }

  .hl-modal-header h2 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--accent, #1f6f7a);
  }

  .action-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
  }

  .hl-modal-body {
    padding: 1.2rem;
    max-height: 380px;
    overflow-y: auto;
  }

  .hl-empty-msg {
    color: var(--text-mid, #545b5c);
    font-size: 0.9rem;
    text-align: center;
    padding: 1.5rem 0;
  }

  .hl-modal-section {
    margin-bottom: 1rem;
  }

  .hl-modal-section h3 {
    font-size: 0.88rem;
    color: var(--text-mid, #545b5c);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hl-chips-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .hl-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
    font-size: 0.88rem;
    font-weight: 600;
    border: 1px solid var(--border, #d4d8d3);
  }

  .lemma-chip {
    background-color: hsl(var(--chip-hue, 190), 80%, 92%);
    border-color: hsl(var(--chip-hue, 190), 60%, 75%);
  }

  .form-chip {
    background-color: hsl(var(--chip-hue, 45), 85%, 90%);
    border-color: hsl(var(--chip-hue, 45), 70%, 75%);
  }

  .phrase-chip {
    background-color: hsl(var(--chip-hue, 270), 80%, 92%);
    border-color: hsl(var(--chip-hue, 270), 60%, 75%);
  }

  .chip-color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: hsl(var(--chip-hue, 190), 80%, 45%);
  }

  .chip-remove-btn {
    background: transparent;
    border: none;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0 0.1rem;
  }

  .chip-remove-btn:hover {
    color: #c53030;
  }

  .hl-modal-footer {
    padding: 0.75rem 1.2rem;
    border-top: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
    display: flex;
    justify-content: flex-end;
  }

  .hl-clear-all-btn {
    background: transparent;
    border: 1px solid #feb2b2;
    color: #c53030;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .hl-clear-all-btn:hover {
    background: #fff5f5;
  }
</style>
