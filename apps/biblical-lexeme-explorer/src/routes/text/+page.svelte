<script>
    import TextDisplay from "$lib/components/TextDisplay.svelte";
    import { LxxVocabDataset } from "$lib/lxx/lxxDataset.js";
    import Button from "$lib/components/ui/Button.svelte";

    /** @type {{ data: import('./$types').PageData }} */
    let { data } = $props();
    
    const vocabData = new LxxVocabDataset();
    
    /**
     * @type {string[]} refs
     */
    let refs = $derived.by(() => {
        if (data?.refs && data.refs.length > 0)
            return data.refs;
        else 
            return ["Gen 1"];
    });

    let sectionIDs = $derived.by(() => {
        if (data?.sections && data.sections.length > 0) {
            return data.sections.map(Number);
        } else {
            return [623751];
        }
    });

    let loadSectionTexts = $state({});

    function loadText(secID) {
        if (!loadSectionTexts[secID]) {
            loadSectionTexts[secID] = true;
        }
    }
</script>

<h1>{vocabData.abbrev} Texts</h1>

{#each sectionIDs as section, i}
<details class="group my-2 rounded-xl border border-rule/50 bg-page/70 overflow-hidden shadow-xs" ontoggle={(e) => { if (e.currentTarget.open) loadText(section); }}>
    <summary class="flex items-center justify-between p-3 font-semibold text-lg cursor-pointer hover:bg-rule/10 transition-colors select-none">
        <span>{refs[i]}</span>
        <span class="text-xs transition-transform group-open:rotate-180">▼</span>
    </summary>
    <div class="p-3 border-t border-rule/30">
        {#if loadSectionTexts[section]}
            <TextDisplay tfData={vocabData} sectionID={section} ref={refs[i]} showRefTitle={false}/>
        {:else}
            (Click to load)
        {/if}
    </div>
</details>
{/each}
