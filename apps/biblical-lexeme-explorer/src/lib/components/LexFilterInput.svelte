<script>
    import FilterInput from "./ui/FilterInput.svelte";
    import {GreekUtils as GreekUtils} from "$lib/utils/greek-utils.js";
    import { HebrewUtils } from "$lib/utils/hebrew-utils.js";
    import * as StringUtils from "$lib/utils/string-utils.js";

    //import { Utils } from "$lib/utils/utils";
    let {
        /**
        * @type {string[]} itemsList
        */
        itemsList,
        lang="greek",
        max=100,
        labelText=`Type some ${StringUtils.capitalize(lang)} letters in betacode:`,
        casesensitive=$bindable(false),

        /**
         * @param {string} input
        */
        //filter= (input)=>{return [input.trim()];}, //optionally used to filter input; should return an *array* of strings to check as the input text.

        /**
         * @type {number[]} index (of itemsList) for partially matching strings
        */
        bestMatches = $bindable(),
        otherMatches = $bindable(),
        tooltip

    } = $props();
    let filterInput;
    export function clear(){
        filterInput.clear();
        //console.debug("called FilterInput.clear()");
    }
    /**
     * 
     * @param {string} input
     * @returns {string}
     */
    function transform(input){
        if (lang=="greek"){
            return GreekUtils.beta2Greek(input.trim());
        }
        else if(lang=="hebrew"){
            return HebrewUtils.removeNonHebrew(HebrewUtils.beta2Hebrew(input.trim()));
        }
    }
</script>

<FilterInput {transform}
    searchTerms={(input)=>{
        let ret = [input];
        if(lang=='greek'){
            if (input.includes('ς')) {   
                ret.push(input.replaceAll('ς','σ'));
            }
        }
        else if (lang=='hebrew'){
            ret.push(HebrewUtils.removeFinalConsonants(input));
        }
        
        
        return ret;
    }}
bind:this={filterInput} max={50} labelText={labelText} itemsList={itemsList} bind:bestMatches
bind:otherMatches {tooltip} bind:casesensitive={casesensitive}/>