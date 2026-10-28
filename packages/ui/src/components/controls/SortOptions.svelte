<script>
    /**
     * This UI component allows user to select from various, parent-provided, sorting options.
     * properties:
     * - data: Object[] // to be sorted
     * - sortMethods: {name: string, sortFunction: (a: any, b: any) => number}[]
     * - title: string
     * - currentMethodIndex: number
    */

    let {
        data = $bindable(),
        sortMethods,
        title = 'Sort by:',
        currentMethodIndex = $bindable(0)
    } = $props();

    $effect(() => {
        if (data && sortMethods?.[currentMethodIndex]?.sortFunction) {
            data.sort((a, b) => sortMethods[currentMethodIndex].sortFunction(a, b));
        }
    });

    export function clear() {
        currentMethodIndex = 0;
    }
</script>

<label for="sortBy">{title}</label>
<select name="sortBy" id="groupSelect" bind:value={currentMethodIndex} class="inline-block align-top text-center self-center" >
{#each sortMethods as { name }, index}	
    <option value={index}>{name}</option>
{/each}
</select>
