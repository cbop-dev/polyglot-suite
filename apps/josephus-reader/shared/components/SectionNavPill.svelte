<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Section } from '../lib/data';

  let {
    sections = [],
    viewMode = 'parallel',
    isZenMode = false
  }: {
    sections?: Section[];
    viewMode?: 'parallel' | 'greek' | 'english' | 'stacked';
    isZenMode?: boolean;
  } = $props();

  let currentSecIdx = $state(0);
  let activeSectionLabel = $state('1');
  let dropdownOpen = $state(false);
  let isCollapsed = $state(true);

  $effect(() => {
    if (isZenMode) {
      isCollapsed = true;
    } else {
      isCollapsed = false;
    }
  });

  let observer: IntersectionObserver | null = null;
  let pillContainerEl: HTMLElement | null = null;

  onMount(() => {
    setupObserver();

    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('josephus-navpill-collapsed');
      if (saved === 'false') {
        isCollapsed = false;
      } else {
        isCollapsed = true;
      }
    }

    const handleNext = () => goNext();
    const handlePrev = () => goPrev();
    const handleFirst = () => goFirst();
    const handleLast = () => goLast();
    const handleLangSwitch = () => switchLanguageInCurrentSection();

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownOpen && pillContainerEl && !pillContainerEl.contains(e.target as Node)) {
        dropdownOpen = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) {
          dropdownOpen = false;
        }
      }
    };

    window.addEventListener('reader-nav-next', handleNext);
    window.addEventListener('reader-nav-prev', handlePrev);
    window.addEventListener('reader-nav-first', handleFirst);
    window.addEventListener('reader-nav-last', handleLast);
    window.addEventListener('reader-nav-lang-switch', handleLangSwitch);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('reader-nav-next', handleNext);
      window.removeEventListener('reader-nav-prev', handlePrev);
      window.removeEventListener('reader-nav-first', handleFirst);
      window.removeEventListener('reader-nav-last', handleLast);
      window.removeEventListener('reader-nav-lang-switch', handleLangSwitch);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });

  $effect(() => {
    if (sections && sections.length > 0) {
      if (typeof window !== 'undefined') {
        setTimeout(() => setupObserver(), 100);
      }
    }
  });

  function setupObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const idx = sections.findIndex(s => `niese-${s.section_num || s.niese}` === id);
            if (idx !== -1) {
              currentSecIdx = idx;
              activeSectionLabel = String(sections[idx].section_num || sections[idx].niese);
            }
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0.05 }
    );

    sections.forEach(s => {
      const el = document.getElementById(`niese-${s.section_num || s.niese}`);
      if (el && observer) observer.observe(el);
    });
  }

  function scrollToSection(idx: number) {
    if (idx < 0 || idx >= sections.length) return;
    currentSecIdx = idx;
    dropdownOpen = false;
    const sec = sections[idx];
    activeSectionLabel = String(sec.section_num || sec.niese);
    const el = document.getElementById(`niese-${sec.section_num || sec.niese}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function switchLanguageInCurrentSection() {
    if (currentSecIdx < 0 || currentSecIdx >= sections.length) return;
    const sec = sections[currentSecIdx];
    const sectionEl = document.getElementById(`niese-${sec.section_num || sec.niese}`);
    if (!sectionEl) return;

    const greekCol = sectionEl.querySelector('.greek-col') as HTMLElement | null;
    const englishCol = sectionEl.querySelector('.english-col') as HTMLElement | null;

    if (!greekCol || !englishCol) return;

    const greekRect = greekCol.getBoundingClientRect();
    const englishRect = englishCol.getBoundingClientRect();

    const greekDist = Math.abs(greekRect.top - 80);
    const englishDist = Math.abs(englishRect.top - 80);

    const targetEl = (greekDist <= englishDist) ? englishCol : greekCol;
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goFirst() { scrollToSection(0); }
  function goPrev() { scrollToSection(Math.max(0, currentSecIdx - 1)); }
  function goNext() { scrollToSection(Math.min(sections.length - 1, currentSecIdx + 1)); }
  function goLast() { scrollToSection(sections.length - 1); }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      dropdownOpen = false;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('josephus-navpill-collapsed', String(isCollapsed));
    }
  }
</script>

{#if sections && sections.length > 0}
  <div
    class="nav-pill-container"
    class:collapsed={isCollapsed}
    bind:this={pillContainerEl}
    role="navigation"
    aria-label="Section navigation"
  >
    {#if isCollapsed}
      <button
        type="button"
        class="pill-expand-btn"
        onclick={toggleCollapse}
        title="Show section navigation bar"
        aria-label="Show section navigation bar"
        aria-expanded="false"
      >
        <svg class="hamburger-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
    {:else}
      {#if dropdownOpen}
        <div class="section-dropdown-popup" role="menu" aria-label="Select section block">
          <div class="section-popup-header">
            <span>Jump to Section</span>
            <button type="button" class="popup-close-btn" onclick={() => (dropdownOpen = false)} aria-label="Close">✕</button>
          </div>
          <div class="section-grid">
            {#each sections as sec, sIdx (sIdx)}
              <button
                type="button"
                class="section-item-btn"
                class:active={sIdx === currentSecIdx}
                onclick={() => scrollToSection(sIdx)}
                title={`Jump to Section § ${sec.section_num || sec.niese}`}
              >
                § {sec.section_num || sec.niese}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <button
        class="pill-btn"
        onclick={goFirst}
        disabled={currentSecIdx <= 0}
        title="First Section (§ 1)"
        aria-label="First Section"
      >
        ⏮
      </button>

      <button
        class="pill-btn"
        onclick={goPrev}
        disabled={currentSecIdx <= 0}
        title="Previous Section"
        aria-label="Previous Section"
      >
        ◀
      </button>

      <button
        type="button"
        class="pill-badge"
        onclick={() => (dropdownOpen = !dropdownOpen)}
        title={`Current Section: § ${activeSectionLabel}. Click to select section.`}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span>§ {activeSectionLabel}</span><span class="pill-badge-arrow"> ▾</span>
      </button>

      <button
        class="pill-btn"
        onclick={goNext}
        disabled={currentSecIdx >= sections.length - 1}
        title="Next Section"
        aria-label="Next Section"
      >
        ▶
      </button>

      <button
        class="pill-btn"
        onclick={goLast}
        disabled={currentSecIdx >= sections.length - 1}
        title={`Last Section (§ ${sections[sections.length - 1]?.section_num || sections[sections.length - 1]?.niese})`}
        aria-label="Last Section"
      >
        ⏭
      </button>

      <div class="pill-divider" aria-hidden="true"></div>

      <button
        type="button"
        class="pill-btn pill-toggle-btn"
        onclick={toggleCollapse}
        title="Hide section navigation bar"
        aria-label="Hide section navigation bar"
        aria-expanded="true"
      >
        <svg class="caret-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .nav-pill-container {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1200;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 30px;
    padding: 0.35rem 0.6rem;
    box-shadow: var(--popup-shadow, 0 8px 24px rgba(0, 0, 0, 0.2));
    backdrop-filter: blur(8px);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .nav-pill-container.collapsed {
    bottom: 0.85rem;
    padding: 0.2rem;
    border-radius: 50%;
    gap: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }

  .pill-expand-btn {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
    color: var(--accent, #1f6f7a);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.15s ease;
  }

  .pill-expand-btn:hover {
    color: #ffffff;
    background: var(--accent, #1f6f7a);
  }

  .pill-arrow-icon {
    font-size: 0.75rem;
    display: inline-block;
    line-height: 1;
  }

  .caret-icon,
  .hamburger-icon {
    display: block;
    pointer-events: none;
  }

  .pill-divider {
    width: 1px;
    height: 16px;
    background: var(--border, #d4d8d3);
    margin: 0 0.1rem;
  }

  .pill-toggle-btn {
    font-size: 0.7rem;
    line-height: 1;
  }

  .pill-btn {
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pill-btn:hover:not(:disabled) {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
  }

  .pill-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pill-badge {
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--accent, #1f6f7a);
    padding: 0.25rem 0.65rem;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    min-width: 50px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    justify-content: center;
    white-space: nowrap;
  }

  .pill-badge:hover {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }

  @media (max-width: 600px) {
    .pill-badge-arrow {
      display: none;
    }
  }

  .section-dropdown-popup {
    position: absolute;
    bottom: calc(100% + 0.6rem);
    left: 50%;
    transform: translateX(-50%);
    background: var(--col-bg, #f5f6f2);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    width: 280px;
    max-width: 90vw;
    z-index: 1300;
  }

  .section-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-mid, #545b5c);
    padding-bottom: 0.4rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #d4d8d3);
  }

  .popup-close-btn {
    background: none;
    border: none;
    font-size: 0.95rem;
    cursor: pointer;
    color: var(--text-mid, #545b5c);
    padding: 0 0.2rem;
  }

  .section-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 0.2rem;
  }

  .section-item-btn {
    padding: 0.35rem 0.2rem;
    background: var(--page-bg, #eceee7);
    border: 1px solid var(--border, #d4d8d3);
    border-radius: 6px;
    font-family: var(--font-ui, system-ui, sans-serif);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-mid, #545b5c);
    cursor: pointer;
    text-align: center;
    transition: all 0.12s ease;
  }

  .section-item-btn:hover {
    color: var(--accent, #1f6f7a);
    border-color: var(--accent, #1f6f7a);
  }

  .section-item-btn.active {
    background: var(--accent, #1f6f7a);
    color: #ffffff;
    border-color: var(--accent, #1f6f7a);
  }
</style>
