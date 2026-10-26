<script lang="ts">
    import * as bibleUtils from '$lib/utils/bible-utils.js';
    import Modal2 from "./ui/Modal2.svelte";
    import CopyText from "./ui/CopyText.svelte";
    import ArrowUp from "./ui/icons/arrow-up.svelte";
    import { jumpToDiv } from "$lib/utils/ui-utils";
    import { getVerseText, getBatchVerseTexts, getVerseDetail, type BatchVerseItem } from "$lib/services/dbClient";
    import { readerState } from "$lib/stores/readerState.svelte";
    import { formatDisplayReference, formatBookAbbreviation, getBookCanonicalIndex } from "$lib/config/bookMapping.js";
    import { myDataSets } from "$lib/config/versions";
    import KwicSnippet from "@polyglot/ancient-languages/KwicSnippet.svelte";
    import { findMatchInText, findAllMatchesInText } from "@polyglot/ancient-languages";

    let {
        title = '',
        description = '',
        occurrences = [],
        refs = [],
        sectionIDs = [],
        lang = 'greek',
        dbAbbrev = 'lxx',
        lemma = '',
        strongs = '',
        lookupKey = '',
        clickedWord = ''
    } = $props();

    let showText = $state(false);
    let chosenRefIdx = $state(-1);
    let textsFetched = $state<Record<number, BatchVerseItem>>({});

    // Display mode: 'refs' (default) | 'texts' | 'kwic'
    let displayMode = $state<'refs' | 'texts' | 'kwic'>('refs');
    let pageSize = $state<number>(25);
    let currentPage = $state<number>(1);
    let isLoadingBatch = $state<boolean>(false);

    // Target version for canonical sequence sorting (e.g. BHS, LXX, Peshitta, KJV)
    const activeVersionName = $derived.by(() => {
        const selected = readerState.selectedVersion;
        if (selected) return selected;
        const low = (dbAbbrev || '').toLowerCase();
        if (low === 'bhs' || low === 'wlc') return 'BHS';
        if (low === 'peshitta') return 'Peshitta';
        if (low === 'opengnt' || low === 'ognt') return 'OpenGNT';
        return 'LXX';
    });

    const versionObj = $derived(
        myDataSets.lookup(activeVersionName) || myDataSets.lookup(dbAbbrev)
    );
    const textDirection = $derived(versionObj?.direction ?? 'ltr');
    const isRtl = $derived(textDirection === 'rtl');
    const textAlignClass = $derived(versionObj?.direction === 'rtl' ? 'text-right' : 'text-left');

    // Normalize input into unified list of { ref: string, workUnitId: number }
    let normalizedOccurrences = $derived.by(() => {
        const activeVer = activeVersionName;
        if (occurrences && occurrences.length > 0) {
            return occurrences.map((occ, idx) => {
                const rawRef = occ.display_label || occ.ref_label || (refs && refs[idx]) || '';
                return {
                    ref: formatDisplayReference(rawRef, activeVer),
                    workUnitId: occ.work_unit_id || (sectionIDs && sectionIDs[idx]) || 0
                };
            });
        }
        if (refs && refs.length > 0) {
            return refs.map((ref, idx) => ({
                ref: formatDisplayReference(ref, activeVer),
                workUnitId: (sectionIDs && sectionIDs[idx]) || 0
            }));
        }
        return [];
    });

    /**
     * Precompute grouped books, index offsets, and combined range strings in authentic canonical order
     */
    let groupedBookEntries = $derived.by(() => {
        let currentBook = '';
        const bookMap = new Map();

        for (let i = 0; i < normalizedOccurrences.length; i++) {
            const item = normalizedOccurrences[i];
            const bCv = bibleUtils.getBookChapVerseFromRef(item.ref);
            if (bCv.book) {
                currentBook = bCv.book;
            } else {
                bCv.book = currentBook;
            }

            let list = bookMap.get(bCv.book);
            if (!list) {
                list = [];
                bookMap.set(bCv.book, list);
            }
            list.push({ bCv, origIndex: i, item });
        }

        // Sort books by authentic version canonical index
        const sortedBookKeys = Array.from(bookMap.keys()).sort((a, b) => {
            const ordA = getBookCanonicalIndex(a, activeVersionName);
            const ordB = getBookCanonicalIndex(b, activeVersionName);
            if (ordA !== ordB) return ordA - ordB;
            return a.localeCompare(b);
        });

        let offset = 0;
        const result = [];
        for (const book of sortedBookKeys) {
            const bookRefs = bookMap.get(book)!;
            // Ensure refs within each book are ordered by chapter then verse
            bookRefs.sort((a: any, b: any) => {
                const chA = parseInt(a.bCv?.chap, 10) || 0;
                const chB = parseInt(b.bCv?.chap, 10) || 0;
                if (chA !== chB) return chA - chB;
                const vA = parseInt(a.bCv?.v, 10) || 0;
                const vB = parseInt(b.bCv?.v, 10) || 0;
                return vA - vB;
            });

            const currentOffset = offset;
            offset += bookRefs.length;
            const refStrings = bookRefs.map((r: any) => bCvToString(r.bCv));
            result.push({
                book,
                bookRefs,
                indexOffset: currentOffset,
                combinedRefs: bibleUtils.combineRefs(refStrings) || refStrings.join('; ')
            });
        }
        return result;
    });

    let books = $derived(groupedBookEntries.map((e) => e.book));

    // Flat, canonically ordered occurrences across all books
    let sortedOccurrences = $derived.by(() => {
        const list: Array<{ ref: string; workUnitId: number; book: string; bCv: any; origIndex: number }> = [];
        for (const group of groupedBookEntries) {
            for (const r of group.bookRefs) {
                list.push({
                    ref: r.item.ref,
                    workUnitId: r.item.workUnitId,
                    book: group.book,
                    bCv: r.bCv,
                    origIndex: r.origIndex
                });
            }
        }
        return list;
    });

    let totalItems = $derived(sortedOccurrences.length);
    let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));

    let activePageOccurrences = $derived.by(() => {
        if (displayMode === 'refs') return [];
        const start = (currentPage - 1) * pageSize;
        return sortedOccurrences.slice(start, start + pageSize);
    });

    // Lazy batch-fetch verse texts for active page when in 'texts' or 'kwic' mode
    $effect(() => {
        if (displayMode === 'refs') return;
        const pageItems = activePageOccurrences;
        const idsToFetch = pageItems
            .map((o) => o.workUnitId)
            .filter((id) => id > 0 && !textsFetched[id]);

        if (idsToFetch.length > 0) {
            loadBatchTexts(idsToFetch);
        }
    });

    async function loadBatchTexts(ids: number[]) {
        isLoadingBatch = true;
        try {
            const batch = await getBatchVerseTexts(ids, {
                lemma,
                strongs,
                lookupKey,
                lang,
                clickedWord
            });
            textsFetched = { ...textsFetched, ...batch };
        } catch (e) {
            console.error('[TextsDisplay] Failed to fetch batch verse texts:', e);
        } finally {
            isLoadingBatch = false;
        }
    }

    function handlePageSizeChange(newSize: number) {
        const currentFirstIdx = (currentPage - 1) * pageSize;
        pageSize = newSize;
        currentPage = Math.max(1, Math.min(Math.floor(currentFirstIdx / newSize) + 1, Math.ceil(totalItems / newSize)));
    }

    function handleBookJump(book: string) {
        if (displayMode === 'refs') {
            const targetEl = document.getElementById(book.replaceAll(" ", "_"));
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                jumpToDiv(book.replaceAll(" ", "_"));
            }
        } else {
            const targetIdx = sortedOccurrences.findIndex((o) => o.book === book);
            if (targetIdx !== -1) {
                const targetPage = Math.floor(targetIdx / pageSize) + 1;
                currentPage = targetPage;
                setTimeout(() => {
                    const headingId = "book-heading-" + book.replaceAll(" ", "_");
                    const el = document.getElementById(headingId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        const topEl = document.getElementById('concordance-content-top');
                        topEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 60);
            }
        }
    }

    function bCvToString(bcv: any, omitBook = false) {
        if (!bcv) return '';
        let ret = (bcv.chap || '1') + ":" + (bcv.v || '1');
        if (!omitBook) {
            ret = (bcv.book ? formatBookAbbreviation(bcv.book) + " " : '') + ret;
        }
        return ret;
    }

    async function fetchText() {
        if (chosenRefIdx >= 0) {
            const item = normalizedOccurrences[chosenRefIdx];
            if (item && item.workUnitId) {
                if (!textsFetched[item.workUnitId]) {
                    const detail = await getVerseDetail(item.workUnitId, {
                        lemma,
                        strongs,
                        lookupKey,
                        lang,
                        clickedWord
                    });
                    if (detail) {
                        textsFetched[item.workUnitId] = detail;
                    }
                }
            }
        }
    }

    function escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function highlightMatchedWords(text: string, words: string[] = []): string {
        if (!text) return '';
        const searchWords = words && words.length > 0
            ? words
            : [lemma, lookupKey, clickedWord].filter(Boolean).map(w => w.replace(/[,;·].*$/g, '').trim());

        if (searchWords.length === 0) return escapeHtml(text);

        const ranges: Array<{ start: number; end: number }> = [];
        for (const w of searchWords) {
            if (!w) continue;
            const matches = findAllMatchesInText(text, w, undefined, lang);
            for (const m of matches) {
                ranges.push(m);
            }
        }

        if (ranges.length === 0) return escapeHtml(text);

        ranges.sort((a, b) => a.start - b.start || a.end - b.end);

        const merged: Array<{ start: number; end: number }> = [];
        for (const r of ranges) {
            if (merged.length === 0) {
                merged.push({ ...r });
            } else {
                const last = merged[merged.length - 1];
                if (r.start <= last.end) {
                    last.end = Math.max(last.end, r.end);
                } else {
                    merged.push({ ...r });
                }
            }
        }

        let html = '';
        let curr = 0;
        for (const m of merged) {
            if (m.start > curr) {
                html += escapeHtml(text.slice(curr, m.start));
            }
            html += `<mark class="kwic-mark">${escapeHtml(text.slice(m.start, m.end))}</mark>`;
            curr = m.end;
        }
        if (curr < text.length) {
            html += escapeHtml(text.slice(curr));
        }
        return html;
    }

    async function navigateToOccurrence(displayLabel: string) {
        if (!displayLabel) return;
        const parts = displayLabel.trim().split(' ');
        if (parts.length >= 2) {
            const bookPart = parts.slice(0, -1).join(' ');
            const cvPart = parts[parts.length - 1];
            const [ch, v] = cvPart.split(':');
            showText = false;
            await readerState.navigateToReference(bookPart, ch || '1', v);
        }
    }
</script>

<div class="inline" id="refs-top"></div>
{#if title && title.length}
    <h1 class="text-xl font-bold text-ink mb-1">{title}</h1>
{/if}
{#if description}
    <h2 class="text-sm text-ink-soft mb-3">{description}</h2>
{/if}

<!-- Sub-header: Occurrences Count + Display Mode Buttons + Page Size -->
<div class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-rule/50">
    <div class="text-xs font-semibold text-ink-soft">
        {totalItems} {totalItems === 1 ? 'occurrence' : 'occurrences'} loaded
    </div>

    <div class="flex items-center gap-2">
        {#if displayMode !== 'refs'}
            <div class="flex items-center gap-1 text-xs text-ink-soft">
                <label for="page-size-select" class="text-[11px] font-medium">Per page:</label>
                <select
                    id="page-size-select"
                    value={pageSize}
                    onchange={(e) => handlePageSizeChange(parseInt(e.currentTarget.value, 10))}
                    class="rounded-md border border-rule bg-page px-2 py-0.5 text-xs text-ink font-semibold focus:outline-hidden cursor-pointer"
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        {/if}

        <div class="inline-flex rounded-lg bg-rule/30 p-0.5 text-xs font-semibold">
            <button
                type="button"
                onclick={() => (displayMode = 'refs')}
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {displayMode === 'refs'
                    ? 'bg-page shadow-2xs text-link font-bold'
                    : 'text-ink-soft hover:text-ink'}"
            >
                Refs
            </button>
            <button
                type="button"
                onclick={() => (displayMode = 'texts')}
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {displayMode === 'texts'
                    ? 'bg-page shadow-2xs text-link font-bold'
                    : 'text-ink-soft hover:text-ink'}"
            >
                Texts
            </button>
            <button
                type="button"
                onclick={() => (displayMode = 'kwic')}
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {displayMode === 'kwic'
                    ? 'bg-page shadow-2xs text-link font-bold'
                    : 'text-ink-soft hover:text-ink'}"
            >
                KWIC
            </button>
        </div>
    </div>
</div>

<!-- Book Jump Bar -->
<div class="mb-4 p-3 rounded-lg bg-page border border-rule text-center shadow-xs">
    <div class="italic text-sm font-semibold text-ink-soft mb-2">
        {#if displayMode === 'refs'}
            💡 Click on a verse to see the text!
        {:else}
            💡 Jump to any biblical book in the list below:
        {/if}
    </div>
    <div class="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
        Jump to book:
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1.5">
        {#each books as book}
            <button
                type="button"
                class="book-jump-btn"
                onclick={() => handleBookJump(book)}
            >
                {formatBookAbbreviation(book)}
            </button>
        {/each}
    </div>
</div>

<div class="inline" id="concordance-content-top"></div>

<!-- MODE 1: REFS (Default Grouped Chips) -->
{#if displayMode === 'refs'}
    <div class="w-full">
        {#each groupedBookEntries as { book, bookRefs, combinedRefs }}
            <div id={book.replaceAll(" ","_")} class="relative bg-rule/30 text-ink font-bold px-3 py-1.5 rounded-lg my-2 flex items-center justify-center border border-rule/50">
                <span class="text-center font-bold tracking-wide">{formatBookAbbreviation(book)}</span>
                <div class="absolute right-2 flex items-center gap-1.5">
                    <a href="#refs-top" onclick={()=>jumpToDiv("refs-top")} class="text-ink/70 hover:text-ink transition-colors p-1" title="Jump to top"><ArrowUp width={15} height={15}/></a>
                    <CopyText copyText={combinedRefs}
                        btnSizeCssClass="btn-xs font-bold"
                        btnCssClass="bg-page hover:bg-rule text-ink border border-rule" 
                        tooltip="Copy {formatBookAbbreviation(book)} references"
                        width={15}
                        height={15}
                    />
                </div>
            </div>        
            <div class="text-center py-1">
                {#each bookRefs as refObj}
                    <button 
                        type="button" 
                        class="inline-block px-2.5 py-1 m-0.5 text-xs font-mono rounded-md bg-page text-ink hover:bg-link hover:text-white border border-rule hover:border-link transition-all cursor-pointer shadow-2xs"
                        onclick={() => { chosenRefIdx = refObj.origIndex; fetchText(); showText = true; }}
                    >
                        {bCvToString(refObj.bCv, true)}
                    </button>
                {/each}
            </div>
        {/each}
    </div>

<!-- MODES 2 & 3: TEXTS (Full Verses) & KWIC (Snippets) -->
{:else}
    <!-- Top Pagination Bar -->
    <div class="flex items-center justify-between py-2 px-3 my-2 rounded-lg bg-base-200/40 border border-rule/50 text-xs text-ink-soft">
        <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
        <div class="flex items-center gap-1.5">
            <button
                type="button"
                disabled={currentPage === 1}
                onclick={() => { currentPage--; jumpToDiv('concordance-content-top'); }}
                class="px-2.5 py-1 rounded border border-rule bg-page text-ink hover:bg-rule/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
                Prev
            </button>
            <span class="px-2 font-medium text-ink">{currentPage} / {totalPages}</span>
            <button
                type="button"
                disabled={currentPage === totalPages}
                onclick={() => { currentPage++; jumpToDiv('concordance-content-top'); }}
                class="px-2.5 py-1 rounded border border-rule bg-page text-ink hover:bg-rule/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
                Next
            </button>
        </div>
    </div>

    <!-- Occurrences List -->
    <div class="space-y-2.5 my-3">
        {#if isLoadingBatch && Object.keys(textsFetched).length === 0}
            <div class="py-12 text-center text-xs text-ink-soft space-y-2">
                <span class="inline-block w-6 h-6 border-2 border-link border-t-transparent rounded-full animate-spin"></span>
                <p>Loading verses from database...</p>
            </div>
        {:else}
            {#each activePageOccurrences as occ, idx}
                {@const verseData = textsFetched[occ.workUnitId]}
                {@const theText = verseData?.text}
                {@const matchedWords = verseData?.matchedWords || []}

                {#if idx === 0 || activePageOccurrences[idx - 1].book !== occ.book}
                    <div
                        id={"book-heading-" + occ.book.replaceAll(" ", "_")}
                        class="flex items-center gap-2 pt-3 pb-1.5 my-2 border-b border-rule/60 text-ink font-bold text-sm tracking-wide uppercase scroll-mt-4"
                    >
                        <span class="w-2 h-2 rounded-full bg-link"></span>
                        <span>{formatBookAbbreviation(occ.book)}</span>
                        <span class="text-xs font-normal text-ink-soft">({occ.book})</span>
                    </div>
                {/if}

                <div class="p-3 rounded-xl border border-rule bg-page hover:border-link/40 transition-colors shadow-2xs group">
                    <div class="flex items-center justify-between mb-1.5 pb-1 border-b border-rule/40">
                        <span class="font-bold text-xs text-link font-mono">
                            {occ.ref}
                        </span>
                        <button
                            type="button"
                            onclick={() => navigateToOccurrence(occ.ref)}
                            class="text-[11px] font-semibold text-ink-soft hover:text-link flex items-center gap-1 cursor-pointer transition-colors"
                            title="Jump to verse in reader"
                        >
                            Go to Verse &rarr;
                        </button>
                    </div>

                    {#if !theText}
                        <div class="py-2 text-xs text-ink-soft italic">Loading verse...</div>
                    {:else if displayMode === 'kwic'}
                        <div class="text-sm {textAlignClass} {lang === 'syriac' ? 'font-syriac' : (lang === 'hebrew' ? 'font-hebrew' : 'font-greek')}" dir={textDirection}>
                            <KwicSnippet
                                text={theText}
                                matchWord={matchedWords[0] || lemma || lookupKey}
                                lang={lang}
                                direction={textDirection}
                                radius={55}
                                class="w-full text-sm"
                            />
                        </div>
                    {:else}
                        <div class="text-sm leading-relaxed text-ink {textAlignClass} {lang === 'syriac' ? 'font-syriac text-lg' : (lang === 'hebrew' ? 'font-hebrew text-lg' : 'font-greek')}" dir={textDirection}>
                            {@html highlightMatchedWords(theText, matchedWords)}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    <!-- Bottom Pagination Bar -->
    {#if totalPages > 1}
        <div class="flex items-center justify-between py-2 px-3 my-2 rounded-lg bg-base-200/40 border border-rule/50 text-xs text-ink-soft">
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <div class="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onclick={() => { currentPage--; jumpToDiv('concordance-content-top'); }}
                    class="px-2.5 py-1 rounded border border-rule bg-page text-ink hover:bg-rule/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    Prev
                </button>
                <span class="px-2 font-medium text-ink">{currentPage} / {totalPages}</span>
                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onclick={() => { currentPage++; jumpToDiv('concordance-content-top'); }}
                    class="px-2.5 py-1 rounded border border-rule bg-page text-ink hover:bg-rule/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    {/if}
{/if}

<!-- Modal for single-verse inspection in Refs mode -->
<Modal2 bind:showModal={showText} max={true}>
    {#if chosenRefIdx >= 0}
        {@const currentItem = normalizedOccurrences[chosenRefIdx]}
        {@const theRef = currentItem?.ref || ''}
        {@const verseData = currentItem?.workUnitId ? textsFetched[currentItem.workUnitId] : null}
        {@const theText = verseData?.text || ''}
        {@const matchedWords = verseData?.matchedWords || []}

        {#if !theText}
            <div class="py-12 text-center flex flex-col items-center justify-center gap-3">
                <span class="inline-block w-8 h-8 border-4 border-link border-t-transparent rounded-full animate-spin"></span>
                <p class="text-sm font-semibold text-ink">Loading verse text...</p>
            </div>
        {:else}
            <div class="block text-center py-2">
                <h2 class="text-xl font-bold text-ink mb-2">{theRef}</h2>
                <p class="{lang === 'syriac' || dbAbbrev === 'peshitta' ? 'syriac font-syriac text-3xl' : (lang === 'hebrew' || dbAbbrev === 'bhs' ? 'hebrew font-hebrew text-3xl' : 'greek font-greek text-2xl')} py-4 text-ink leading-relaxed max-w-2xl mx-auto {textAlignClass}" dir={textDirection}>
                    {@html highlightMatchedWords(theText, matchedWords)}
                </p>
                <div class="mt-4 flex items-center justify-center gap-3">
                    <CopyText copyText={theRef + ": " + theText} tooltip="Copy verse reference and text" linkText="Copy Verse" />
                    <button
                        type="button"
                        class="px-3 py-1 text-xs font-bold text-ink bg-page border border-rule hover:bg-rule rounded-md shadow-xs cursor-pointer transition-colors"
                        onclick={() => navigateToOccurrence(theRef)}
                    >
                        Go to Verse
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</Modal2>

<style>
    .book-jump-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem 0.65rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 0.375rem;
        border: 1px solid var(--color-rule, rgba(128, 128, 128, 0.3));
        background-color: var(--color-page, #ffffff);
        color: var(--color-ink, #000000);
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .book-jump-btn:hover {
        background-color: var(--color-link, #2563eb);
        color: #ffffff;
        border-color: var(--color-link, #2563eb);
        transform: translateY(-1px);
    }

    .book-jump-btn:active {
        transform: translateY(0);
    }

    :global(.kwic-mark) {
        background-color: #fef08a;
        color: #854d0e;
        font-weight: 700;
        padding: 0.05rem 0.35rem;
        border-radius: 0.25rem;
        margin: 0 0.15rem;
        display: inline;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
    }

    :global(.dark) :global(.kwic-mark),
    :global([data-theme="dark"]) :global(.kwic-mark) {
        background-color: #854d0e;
        color: #fef08a;
    }
</style>
