<script>
    import Button from "./ui/Button.svelte";
    import SelectBooksChaps from "./SelectBooksChaps.svelte";
    import { LexQuery, LexQueryFilter } from "./LexQuery.svelte.js";
    import { staticDatasetProvider } from "$lib/engine/StaticDatasetProvider.js";
    import { onMount } from "svelte";

    let {
        vocabData,
        tfData, // backward compatibility
        highlightInputField = $bindable(false)
    } = $props();

    const dataset = $derived(vocabData || tfData);

    let filterOptions = new LexQueryFilter();
    let selectedSections = $state({});
    let queryReady = $state(false);
    let queryLoading = $state(false);
    let cloudWords = $state([]);
    let renderedSvg = $state('');

    const width = 850;
    const height = 500;

    const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#2b5c8f', '#d95f02', '#7570b3', '#e7298a', '#66a61e',
        '#e6ab02', '#a6761d', '#666666'
    ];

    $effect(() => {
        if (getSelectedSections().length > 0) {
            highlightInputField = false;
        }
    });

    function getSelectedSections() {
        return Object.entries(selectedSections || {})
            .filter(([_, selected]) => selected === true)
            .map(([id]) => Number(id));
    }

    async function generateWordCloud() {
        const sections = getSelectedSections();
        if (sections.length === 0) {
            highlightInputField = true;
            return;
        }

        highlightInputField = false;
        queryLoading = true;
        queryReady = false;

        const maxWords = Number(filterOptions.maxWords) > 0 ? Number(filterOptions.maxWords) : 100;
        const dbAbbrev = dataset?.dbAbbrev || 'lxx';

        const result = await staticDatasetProvider.querySections(dbAbbrev, {
            sections: sections,
            excludePos: filterOptions.getExcluded(),
            restrictPos: filterOptions.getRestricted(),
            maxWords: maxWords,
            posDict: dataset?.posDict
        });

        const lexList = Object.values(result.lexemes || {});
        if (lexList.length === 0) {
            cloudWords = [];
            queryLoading = false;
            queryReady = true;
            return;
        }

        const counts = lexList.map(l => l.count);
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);

        const minFontSize = 14;
        const maxFontSize = 64;

        const rawWords = lexList.map(lex => {
            let size = minFontSize;
            if (maxCount > minCount) {
                // Logarithmic / square root scale for pleasing word cloud distribution
                const ratio = Math.sqrt(lex.count - minCount) / Math.sqrt(maxCount - minCount || 1);
                size = minFontSize + ratio * (maxFontSize - minFontSize);
            } else {
                size = (minFontSize + maxFontSize) / 2;
            }

            const displayText = filterOptions.englishOnly && lex.gloss ? lex.gloss : lex.lemma;
            return {
                text: displayText,
                lemma: lex.lemma,
                gloss: lex.gloss,
                count: lex.count,
                size: Math.round(size)
            };
        });

        try {
            const d3CloudModule = await import('d3-cloud');
            const d3Cloud = d3CloudModule.default || d3CloudModule;

            const layout = d3Cloud()
                .size([width, height])
                .words(rawWords)
                .padding(4)
                .rotate(() => (Math.random() > 0.85 ? 90 : 0))
                .font('system-ui, sans-serif')
                .fontSize(d => d.size)
                .on('end', (outputWords) => {
                    cloudWords = outputWords;
                    queryLoading = false;
                    queryReady = true;
                });

            layout.start();
        } catch (err) {
            console.error("Error generating word cloud:", err);
            // Fallback: simple grid arrangement
            cloudWords = rawWords.slice(0, 50).map((w, i) => ({
                ...w,
                x: ((i % 10) - 5) * 70,
                y: (Math.floor(i / 10) - 2.5) * 50,
                rotate: 0
            }));
            queryLoading = false;
            queryReady = true;
        }
    }
</script>

<style>
    svg {
        margin: auto !important;
    }
</style>

<div class="pb-3">
    <SelectBooksChaps
        vocabData={dataset}
        bind:filterOptions
        bind:selectedSections
        bind:highlightInputField
        enableEnglishOnly={true}
        enableMaxWords={true}
    />

    <Button
        toggled={generateWordCloud}
        buttonText="Generate WordCloud!"
    />
</div>
<hr />

<div class="block self-center text-center pt-3">
    {#if !queryReady}
        {#if !queryLoading}
            Word Cloud SVG will show up here.
            <p>Select some book/chapters above and then click "Generate Word Cloud"</p>
        {:else}
            Generating word cloud...<br />
            <span class="loading loading-spinner loading-lg"></span>
        {/if}
    {:else}
        <h1>
            Word Cloud for [
            {dataset?.booksDict?.combineRefs(
                getSelectedSections().map((id) => dataset.booksDict.getRef(id))
            )}
            ]
        </h1>
        {#if filterOptions.getExcluded().length > 0}
            <p class="text-sm text-base-content/70">
                Excluding: [{filterOptions.getExcluded().map((id) => dataset?.posDict[id]?.desc || id).join(', ')}]
            </p>
        {/if}
        {#if filterOptions.getRestricted().length > 0}
            <p class="text-sm text-base-content/70">
                Restricted to: [{filterOptions.getRestricted().map((id) => dataset?.posDict[id]?.desc || id).join(', ')}]
            </p>
        {/if}

        <div class="block self-center m-auto max-w-4xl p-4 bg-base-100 rounded-box shadow-md">
            {#if cloudWords.length === 0}
                <p>No matching words found for the selected sections and filters.</p>
            {:else}
                <svg
                    {width}
                    {height}
                    viewBox="{-width / 2} {-height / 2} {width} {height}"
                    class="max-w-full h-auto mx-auto"
                >
                    {#each cloudWords as w, i}
                        <text
                            text-anchor="middle"
                            transform="translate({w.x},{w.y}) rotate({w.rotate})"
                            font-size="{w.size}px"
                            font-family="{w.font || 'system-ui, sans-serif'}"
                            fill="{colors[i % colors.length]}"
                            class="cursor-default select-none transition-all duration-200 hover:opacity-75"
                        >
                            <title>{w.text} ({w.gloss}): {w.count} times</title>
                            {w.text}
                        </text>
                    {/each}
                </svg>
            {/if}
        </div>
    {/if}
</div>
