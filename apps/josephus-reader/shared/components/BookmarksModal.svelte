<script lang="ts">
  import { onMount } from 'svelte';
  import { getBookmarks, removeBookmark, clearAllBookmarks, type BookmarkItem } from '../lib/bookmarks';
  import { getWork, workPath } from '../lib/works';
  import { getBase } from '../lib/data';

  let {
    onClose = () => {}
  }: {
    onClose?: () => void;
  } = $props();

  let bookmarks = $state<BookmarkItem[]>([]);
  const base = getBase();

  function refresh() {
    bookmarks = getBookmarks();
  }

  function handleRemove(id: string) {
    removeBookmark(id);
    refresh();
  }

  function handleClearAll() {
    clearAllBookmarks();
    refresh();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  onMount(() => {
    refresh();
    const handleChanged = () => refresh();
    window.addEventListener('reader-bookmarks-changed', handleChanged);
    return () => {
      window.removeEventListener('reader-bookmarks-changed', handleChanged);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="bm-backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="bm-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Bookmarks Manager" tabindex="-1">
    <div class="bm-header">
      <div class="bm-title-group">
        <h2>Bookmarks ({bookmarks.length})</h2>
        <span class="bm-sub font-small">Saved passages across Josephus corpus</span>
      </div>
      <button class="bm-close-btn" onclick={onClose} aria-label="Close modal">×</button>
    </div>

    <div class="bm-body">
      {#if bookmarks.length === 0}
        <div class="bm-empty-state">
          <span class="bm-empty-icon">🔖</span>
          <p>No saved bookmarks yet.</p>
          <span class="bm-empty-sub">Click the bookmark icon (🔖) on any section header to save passages for quick access.</span>
        </div>
      {:else}
        <div class="bm-list">
          {#each bookmarks as bm (bm.id)}
            {@const wMeta = getWork(bm.work)}
            <div class="bm-item">
              <a
                href={`${base}${workPath(bm.work, bm.bookNum)}#niese-${bm.nieseSec}`}
                class="bm-item-link"
                onclick={onClose}
              >
                <div class="bm-item-title">
                  {wMeta?.englishTitle || bm.work} — Book {bm.bookNum} § {bm.nieseSec}
                </div>
                {#if bm.snippet}
                  <div class="bm-item-snippet">"{bm.snippet}..."</div>
                {/if}
              </a>
              <button
                class="bm-remove-btn"
                onclick={() => handleRemove(bm.id)}
                title="Remove bookmark"
                aria-label={`Remove bookmark for ${bm.work} Book ${bm.bookNum} section ${bm.nieseSec}`}
              >
                ×
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if bookmarks.length > 0}
      <div class="bm-footer">
        <button class="bm-clear-btn" onclick={handleClearAll}>
          Clear All Bookmarks
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .bm-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    z-index: 15000 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .bm-card {
    background-color: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--popup-shadow, 0 15px 35px rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }

  .bm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
  }

  .bm-title-group h2 {
    margin: 0 0 0.15rem 0;
    font-size: 1.2rem;
    color: var(--accent, #1f6f7a);
    font-family: var(--font-english, "EB Garamond", serif);
  }

  .bm-sub {
    font-size: 0.82rem;
    color: var(--text-mid, #545b5c);
  }

  .bm-close-btn {
    background: transparent;
    border: none;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    padding: 0 0.4rem;
    border-radius: 4px;
  }

  .bm-close-btn:hover {
    color: var(--text, #171a1c);
    background: var(--border, #d4d8d3);
  }

  .bm-body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
  }

  .bm-empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    color: var(--text-mid, #545b5c);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .bm-empty-icon {
    font-size: 2.2rem;
  }

  .bm-empty-sub {
    font-size: 0.82rem;
    max-width: 320px;
    color: var(--text-mid, #616d6e);
  }

  .bm-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .bm-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    padding: 0.65rem 0.85rem;
    transition: all 0.15s ease;
  }

  .bm-item:hover {
    border-color: var(--accent, #1f6f7a);
    background: var(--col-bg, #ffffff);
  }

  .bm-item-link {
    flex: 1;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .bm-item-title {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--accent, #1f6f7a);
  }

  .bm-item-snippet {
    font-size: 0.82rem;
    color: var(--text-mid, #545b5c);
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }

  .bm-remove-btn {
    background: transparent;
    border: none;
    font-size: 1.3rem;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .bm-remove-btn:hover {
    color: #c53030;
    background: #fff5f5;
  }

  .bm-footer {
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
    display: flex;
    justify-content: flex-end;
  }

  .bm-clear-btn {
    background: transparent;
    border: 1px solid #feb2b2;
    color: #c53030;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .bm-clear-btn:hover {
    background: #fff5f5;
  }
</style>
