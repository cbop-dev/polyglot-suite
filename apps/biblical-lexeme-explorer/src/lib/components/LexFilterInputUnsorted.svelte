<script>
    import FilterInputUnsorted from "./ui/FilterInputUnsorted.svelte";
    import * as StringUtils from "$lib/utils/string-utils.js";

    let {
        /**
        * @type {string[]} itemsList
        */
        itemsList,
        lang="greek",
        max=40,
        labelText=`Type some ${StringUtils.capitalize(lang)} letters in betacode:`,

        /**
         * @param {string} input
        */
        //filter= (input)=>{return [input.trim()];}, //optionally used to filter input; should return an *array* of strings to check as the input text.

        /**
         * @type {number[]} index (of itemsList) for partially matching strings
        */
        matches = $bindable(),

    } = $props();
    let filterInput;
    
    export function clear(){
        filterInput.clear();
        //console.debug("called FilterInput.clear()");
    }
</script>

<FilterInputUnsorted bind:this={filterInput} 
tooltip="Types Latin characters which will convert automatically to Greek/Hebrew!" max={50} labelText={labelText} itemsList={itemsList} bind:theMatches={matches}
 />