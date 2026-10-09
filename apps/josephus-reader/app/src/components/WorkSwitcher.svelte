<script lang="ts">
  import { WORKS, HOUSE_AUTHOR, workPath } from '@shared/lib/works';

  export let work: string = '';
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  function go(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    if (id === work) return;
    let book = '1';
    let loc = '';
    try {
      book = localStorage.getItem(`reader-book-${id}`) || '1';
      loc = localStorage.getItem(`reader-loc-${id}`) || '';
    } catch {}
    window.location.href = `${base}${workPath(id, Number(book))}${loc ? `#${loc}` : ''}`;
  }
</script>

<select class="work-switcher" value={work} onchange={go} aria-label="Choose a work">
  {#each WORKS as w}
    <option value={w.id}>{w.abbrev}</option>
  {/each}
</select>

<style>
  .work-switcher {
    background: var(--page-bg, #eceee7);
    color: var(--text, #171a1c);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 4px;
    padding: 0.35rem 0.6rem;
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    max-width: 280px;
  }
  .work-switcher:focus {
    outline: 2px solid var(--accent, #1f6f7a);
    border-color: transparent;
  }
</style>
