<script lang="ts">
  import { onMount, tick } from "svelte";
  import { getWork, workPath } from "../lib/works";

  export let work: string = "Antiquities";
  export let inputId = "niese-input";

  let open = false;
  let value = "";
  let error = "";
  let inputEl: HTMLInputElement | undefined;

  onMount(() => {
    const handleJumpFocus = () => {
      openBox();
    };
    window.addEventListener("open-niese-jump", handleJumpFocus);
    return () => {
      window.removeEventListener("open-niese-jump", handleJumpFocus);
    };
  });

  async function openBox() {
    open = true;
    error = "";
    await tick();
    inputEl?.focus();
  }

  function closeBox() {
    open = false;
    error = "";
    value = "";
  }

  function go() {
    error = "";
    const clean = value.trim();
    if (!clean) {
      error = "Enter a section number (e.g. 15 or 1.15)";
      return;
    }

    // Parse input e.g. "1.15" (book 1, section 15) or "15" (section 15 in current book)
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const parts = clean.split(".");
    if (parts.length === 2) {
      const b = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(b) && !isNaN(s)) {
        window.location.href = `${base}${workPath(work, b)}#niese-${s}`;
        closeBox();
        return;
      }
    }

    const sec = parseInt(clean, 10);
    if (!isNaN(sec)) {
      window.location.hash = `niese-${sec}`;
      closeBox();
      return;
    }

    error = "Invalid section format";
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeBox();
    }
  }
</script>

{#if !open}
  <button
    class="bekker-toggle"
    onclick={openBox}
    title="Go to Section (Niese numbering)"
  >
    Jump to §
  </button>
{:else}
  <form class="bekker-jump" onsubmit={(e) => { e.preventDefault(); go(); }} role="search">
    <label class="bekker-label" for={inputId}>Niese §</label>
    <input
      id={inputId}
      type="text"
      bind:this={inputEl}
      bind:value
      onkeydown={onKey}
      oninput={() => (error = "")}
      placeholder="e.g. 15 or 1.15"
      aria-label="Jump to Niese Section"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
    />
    <button type="submit">Go</button>
    <button
      type="button"
      class="bekker-close"
      onclick={closeBox}
      aria-label="Close">✕</button
    >
    {#if error}<span class="bekker-err" role="alert">{error}</span>{/if}
  </form>
{/if}

<style>
  .bekker-toggle {
    background: none;
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    padding: 0.35rem 0.65rem;
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 0.85rem;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
  }
  .bekker-toggle:hover {
    color: var(--accent, #1f6f7a);
    border-color: var(--accent, #1f6f7a);
  }
  .bekker-jump {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    position: relative;
  }
  .bekker-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
  }
  .bekker-jump input {
    background: var(--page-bg, #eceee7);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    width: 100px;
  }
  .bekker-jump button[type="submit"] {
    background: var(--accent, #1f6f7a);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.6rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }
  .bekker-close {
    background: none;
    border: none;
    font-size: 0.9rem;
    color: var(--text-light, #616d6e);
    cursor: pointer;
    padding: 0 0.2rem;
  }
  .bekker-err {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--error, #b22323);
    color: #fff;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    white-space: nowrap;
    margin-top: 0.2rem;
    z-index: 10;
  }
</style>
