<script>
    /**
     * This UI component allows user to select from various, parent-provided, sorting options.
     * inherited properties from parent:
     * - data: Object[] // to be sorted
     * - sortMethod: {name:, sortFunction:}[]
    */

let {
    data=$bindable(),
    sortMethods,
    title='Sort by:',
    currentMethodIndex=$bindable(0)
} = $props();


//let currentSortMethod = $state(defaultMethod)

$effect(()=>{
    data.sort((a,b)=>sortMethods[currentMethodIndex].sortFunction(a,b));
});
export function clear(){
    currentMethodIndex=0;
}
</script>
<label for="sortBy">{title}</label>
<select name="sortBy" id="groupSelect" bind:value={currentMethodIndex} class="inline-block align-top text-center self-center" >
{#each sortMethods as {name: name, sortFunction: func}, index }	
    <option value="{index}" >{name}</option>
{/each}

</select>


