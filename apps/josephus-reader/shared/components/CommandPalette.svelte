<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WORKS, workPath } from '../lib/works';
  import { getBase } from '../lib/data';

  export let work: string = 'Antiquities';
  let open = false;
  let query = '';
  const base = getBase();

  $: filtered = query.trim() === ''
    ? WORKS
    : WORKS.filter(w =>
        w.title.toLowerCase().includes(query.toLowerCase()) ||
        w.englishTitle.toLowerCase().includes(query.toLowerCase()) ||
        w.abbrev.toLowerCase().includes(query.toLowerCase())
      );

  function close() {
    open = false;
    query = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open = !open;
    } else if (e.key === 'Escape' && open) {
      close();
    }
  }

  function handleOpenEvent() {
    open = true;
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('open-command-palette', handleOpenEvent);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('open-command-palette', handleOpenEvent);
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="cp-backdrop" onclick={close} role="presentation">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="cp-card" onclick={(e) => e.stopPropagation()} role="dialog" aria-label="Command Palette">
      <div class="cp-header">
        <span class="cp-icon">🔍</span>
        <input
          type="text"
          class="cp-input"
          placeholder="Search works or books (e.g. Antiquities, War, Life)..."
          bind:value={query}
          autofocus
        />
        <button class="cp-close" onclick={close}>Esc</button>
      </div>

      <div class="cp-results">
        {#each filtered as w}
          <a class="cp-item" href={`${base}${workPath(w.id, 1)}`} onclick={close}>
            <div class="cp-item-title">{w.englishTitle} ({w.title})</div>
            <div class="cp-item-sub">{w.booksCount} {w.booksCount === 1 ? 'book' : 'books'}</div>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .cp-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 15000 !important;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
  }

  .cp-card {
    background-color: var(--popup-bg, #ffffff);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    width: 90%;
    max-width: 580px;
    box-shadow: var(--popup-shadow, 0 15px 35px rgba(0, 0, 0, 0.25));
    overflow: hidden;
  }

  .cp-header {
    display: flex;
    align-items: center;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
    gap: 0.75rem;
  }

  .cp-icon {
    font-size: 1.1rem;
  }

  .cp-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text, #171a1c);
    font-size: 1rem;
    font-family: var(--font-ui, system-ui, sans-serif);
  }

  .cp-close {
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    color: var(--text-mid, #545b5c);
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .cp-results {
    max-height: 350px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .cp-item {
    display: flex;
    flex-direction: column;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    text-decoration: none;
    color: var(--text, #171a1c);
    transition: background-color 0.15s ease;
  }

  .cp-item:hover {
    background-color: var(--accent, #1f6f7a);
    color: #ffffff;
  }
  .cp-item:hover .cp-item-sub {
    color: rgba(255, 255, 255, 0.8);
  }

  .cp-item-title {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .cp-item-sub {
    font-size: 0.82rem;
    color: var(--text-mid, #545b5c);
  }
</style>
