<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { currentWork, currentBook } from '$lib/stores/readerStore';
  import HeaderNav from '$lib/components/HeaderNav.svelte';
  import ReaderView from '$lib/components/ReaderView.svelte';
  import LexiconModal from '$lib/components/LexiconModal.svelte';
  import PdfExporter from '$lib/components/PdfExporter.svelte';
  import AttributionModal from '$lib/components/AttributionModal.svelte';

  let manifest = $state<any[]>([]);
  let morphMap = $state<Record<string, { lemma: string; parse: string; desc: string }>>({});
  let dict = $state<Record<string, { def: string; pos?: string }>>({});
  let bookData = $state<any>(null);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const [mRes, morphRes, dictRes] = await Promise.all([
        fetch(`${base}/data/manifest.json`),
        fetch(`${base}/data/morph_map.json`),
        fetch(`${base}/data/dictionary.json`)
      ]);

      if (mRes.ok) manifest = await mRes.json();
      if (morphRes.ok) morphMap = await morphRes.json();
      if (dictRes.ok) dict = await dictRes.json();

      await loadBookData($currentWork, $currentBook);
    } catch (err) {
      console.error('Error initializing Josephus Reader:', err);
    } finally {
      isLoading = false;
    }
  });

  async function loadBookData(work: string, book: number) {
    isLoading = true;
    try {
      const res = await fetch(`${base}/data/${work}/book-${book}.json`);
      if (res.ok) {
        bookData = await res.json();
      } else {
        const fullRes = await fetch(`${base}/data/${work}.json`);
        if (fullRes.ok) {
          const fullData = await fullRes.json();
          bookData = fullData.books.find((b: any) => b.book === book) || fullData.books[0];
        }
      }
    } catch (e) {
      console.error('Error loading book data:', e);
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (manifest.length > 0 && ($currentWork || $currentBook)) {
      loadBookData($currentWork, $currentBook);
    }
  });
</script>

<svelte:head>
  <title>Flavius Josephus Greek & English Reader</title>
  <meta name="description" content="Parallel Greek & English Reader for the complete works of Flavius Josephus (Antiquities, Jewish War, Life, Against Apion) with morphological parsing and facing-page PDF generator." />
</svelte:head>

<div class="app">
  <HeaderNav {manifest} />

  <main class="main-content">
    {#if isLoading && !bookData}
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Loading text dataset...</p>
      </div>
    {:else}
      <ReaderView {bookData} {morphMap} {dict} />
    {/if}
  </main>

  <LexiconModal />
  <PdfExporter {manifest} currentBookData={bookData} />
  <AttributionModal />
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
  }

  .loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    color: var(--text-muted);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
