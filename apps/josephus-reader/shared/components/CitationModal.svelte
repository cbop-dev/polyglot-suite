<script lang="ts">
  import { onMount } from 'svelte';
  import { generateCitations, type AcademicCitationStyle } from '../lib/citation';
  import { getWork } from '../lib/works';

  let {
    work = 'Antiquities',
    bookNum = 1,
    nieseSec = '1',
    onClose = () => {}
  }: {
    work?: string;
    bookNum?: number;
    nieseSec?: string;
    onClose?: () => void;
  } = $props();

  let activeTab = $state<'grc' | 'eng'>('grc');
  let copiedId = $state<string | null>(null);
  let workMeta = $derived(getWork(work));
  let styles = $derived(generateCitations(work, bookNum, nieseSec, activeTab));

  async function copyStyle(style: AcademicCitationStyle) {
    try {
      await navigator.clipboard.writeText(style.citationText);
      copiedId = style.id;
      setTimeout(() => {
        if (copiedId === style.id) copiedId = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="cite-backdrop" onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="cite-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Citation Generator" tabindex="-1">
    <div class="cite-header">
      <div class="cite-title-group">
        <h2>Generate Citation</h2>
        <span class="cite-loc-badge">{workMeta?.englishTitle || work} • Book {bookNum} § {nieseSec}</span>
      </div>
      <button class="cite-close-btn" onclick={onClose} aria-label="Close modal">×</button>
    </div>

    <div class="cite-body">
      <!-- Tabs for Edition -->
      <div class="cite-tabs-strip">
        <button
          class="cite-tab-btn"
          class:active={activeTab === 'grc'}
          onclick={() => (activeTab = 'grc')}
        >
          🏛️ Greek Edition (ed. Niese)
        </button>
        <button
          class="cite-tab-btn"
          class:active={activeTab === 'eng'}
          onclick={() => (activeTab = 'eng')}
        >
          📖 English Edition (trans. Whiston)
        </button>
      </div>

      <p class="cite-instructions">
        Click any citation style below to copy it directly to your clipboard:
      </p>

      <div class="cite-styles-list">
        {#each styles as style (style.id)}
          <button
            class="cite-style-item"
            class:copied={copiedId === style.id}
            onclick={() => copyStyle(style)}
          >
            <div class="cite-style-top">
              <span class="cite-style-name">{style.name}</span>
              <span class="copy-badge">
                {#if copiedId === style.id}
                  ✓ Copied to clipboard!
                {:else}
                  📋 Copy
                {/if}
              </span>
            </div>
            <div class="cite-style-desc">{style.description}</div>
            <pre class="cite-text-preview">{style.citationText}</pre>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.cite-backdrop) {
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

  :global(.cite-card) {
    background-color: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    width: 100%;
    max-width: 640px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--popup-shadow, 0 15px 35px rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }

  :global(.cite-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
    background-color: var(--col-bg, #f5f6f2);
  }

  :global(.cite-title-group h2) {
    margin: 0 0 0.2rem 0;
    font-size: 1.2rem;
    color: var(--accent, #1f6f7a);
    font-family: var(--font-english, "EB Garamond", serif);
  }

  :global(.cite-loc-badge) {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
  }

  :global(.cite-close-btn) {
    background: transparent;
    border: none;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    padding: 0 0.4rem;
    border-radius: 4px;
  }

  :global(.cite-close-btn:hover) {
    color: var(--text, #171a1c);
    background: var(--border, #d4d8d3);
  }

  :global(.cite-body) {
    padding: 1.25rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  :global(.cite-tabs-strip) {
    display: flex;
    gap: 0.4rem;
    background: var(--page-bg, #eceee7);
    padding: 4px;
    border-radius: 8px;
    border: 1px solid var(--border, #d4d8d3);
  }

  :global(.cite-tab-btn) {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0.45rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  :global(.cite-tab-btn:hover) {
    color: var(--text, #171a1c);
    background: var(--col-bg, #ffffff);
  }

  :global(.cite-tab-btn.active) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(31, 111, 122, 0.25);
  }

  :global(.cite-instructions) {
    margin: 0;
    font-size: 0.88rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.cite-styles-list) {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  :global(.cite-style-item) {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    text-align: left;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
  }

  :global(.cite-style-item:hover) {
    border-color: var(--accent, #1f6f7a);
    background: var(--col-bg, #ffffff);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  }

  :global(.cite-style-item.copied) {
    border-color: #2e7d32;
    background-color: #e8f5e9;
  }

  :global(.cite-style-top) {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  :global(.cite-style-name) {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--accent, #1f6f7a);
  }

  :global(.copy-badge) {
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: var(--col-bg, #ffffff);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
  }

  :global(.cite-style-item.copied .copy-badge) {
    background: #2e7d32;
    color: #ffffff;
    border-color: #2e7d32;
  }

  :global(.cite-style-desc) {
    font-size: 0.78rem;
    color: var(--text-mid, #545b5c);
  }

  :global(.cite-text-preview) {
    margin: 0.2rem 0 0 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-english, "EB Garamond", Georgia, serif);
    font-size: 0.95rem;
    line-height: 1.4;
    color: var(--text, #171a1c);
    background: var(--col-bg, #ffffff);
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    border: 1px solid var(--border, #e2e8f0);
  }
</style>
