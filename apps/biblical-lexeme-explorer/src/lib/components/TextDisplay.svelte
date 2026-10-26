<script>
    import { onMount } from "svelte";
    import { VocabDataset } from "$lib/data/VocabDataset.js";
    import Button from "./ui/Button.svelte";
    import { Utils } from "$lib/utils/utils";
    import { VocabEngine } from "$lib/engine/VocabEngine.js";
    import { getReaderVerseUrl } from "$lib/utils/navigation.js";

    let {
        /**
         * @type {VocabDataset} tfData
         */
        tfData,
        /**
         * @type {number} sectionID
         */
        sectionID,
        ref,
        showRefTitle = true,
    } = $props();
    let ready = $state(false);

    let responseObj = $state('');

    onMount(async () => {
        responseObj = await VocabEngine.fetchText(sectionID, tfData.dbAbbrev);
        ready = true;
    });

</script>

{#if !ready}
Loading...<span class="loading loading-spinner loading-lg"></span>
{:else}
    <div class="block">
    {#if showRefTitle} 
        <h2>{ref}</h2>
    {/if}

    <p class="greek text-2xl text-center">{responseObj.text}</p>
    <div class="flex items-center justify-center gap-2 mt-2 flex-wrap">
        <Button
            buttonColors="btn btn-secondary"
            buttonStyle="m-1 p-1 mt-0 mb-0 p-0" 
            toggled={() => { Utils.copyToClipboard(ref + ": " + responseObj.text); }}
            buttonText="Copy"
        /> 
        <a
            href={getReaderVerseUrl(ref, tfData?.dbAbbrev)}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-outline btn-primary inline-flex items-center gap-1.5"
            title="Read {ref} in Polyglot Bible Reader"
        >
            <span>Read in Reader ↗</span>
        </a>
    </div>
    </div>

{/if}
