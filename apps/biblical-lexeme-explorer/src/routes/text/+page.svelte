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
<div class="collapse bg-base-200 collapse-plus">
    <input type="checkbox" class="w-auto h-auto" onclick={() => { loadText(section); }} />
    <div class="collapse-title text-xl font-medium">
        <h2>{refs[i]}</h2>
    </div>
    <div class="collapse-content">
        {#if loadSectionTexts[section]}
            <TextDisplay tfData={vocabData} sectionID={section} ref={refs[i]} showRefTitle={false}/>
        {:else}
            (Click button to load)
        {/if}
    </div>
</div>
{/each}
