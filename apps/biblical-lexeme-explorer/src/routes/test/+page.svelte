<script>
    /** @type {{ data: import('./$types').PageData }} */
    let { data } = $props();
    import Button from '$lib/components/ui/Button.svelte';
    import { LexQuery } from '$lib/components/LexQuery.svelte.js';
    function p(){
        alert('yes')
    }

    let x = $state({ready: false})
    let q = new LexQuery();

    function doStuff(){
        x.ready = true;
    }

    function makeQueryReady() {
        q.ready= true;
    }
    function triggeredStuff(){

    }
</script>

<Button toggled={makeQueryReady} buttonText="Hello world!" />
    <button onclick={doStuff}>test</button>
<hr/>
    {#if x.ready}
        READY!
    {:else}
    Not ready
    {/if}

    {#if q.ready}
        QUERY READY!
    {:else}
    Query not ready
    {/if}

    