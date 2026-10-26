<script>
import Button from "./Button.svelte";
let {
        /**
        * @type {string[]} itemsList
        */
        itemsList,
        max=10,
        labelText="Input:",
        tooltip='',

        /**
         * @param {string} input
        */
        filter= (input)=>{return [input.trim()];}, //optionally used to filter input; should return an *array* of strings to check as the input text.

        /**
         * @type {number[]} index (of itemsList) for partially matching strings
        */
        theMatches = $bindable(),

    } = $props();
   let inputText = $state('');
   
   $effect(()=>{filterItems(inputText)}) ;
   
    /**
    * 
    * @param {string} input
    */
   function filterItems(input=inputText){
        //console.debug("filtering based on " + input);
        //1. find indexes of matches in filter
        // 2. return greek from greek!
        /**
         * @type {number[]} matches
         */
        let matches = []
        
        if (input.length > 0) {
            const inputsToCheck = filter(input);
           // let theMatches = [];
            //console.debug("Resetting matches...")
            for (const inputToCheck of inputsToCheck) {
                if (inputToCheck.length > 0) {
                    //const max = 50;
                    let count = 0;

                    for (const k of itemsList.keys()){
                        if (itemsList[k].includes(inputToCheck)
                        && !matches.includes(k)) {
                            matches.push(k);
                            count+=1;
                            //console.debug("count = " + count)
                            
                        }

                        if (max > 0 && count > max)
                            break;
                    }
                }
            
            }
        }
        ////console.debug("found matchess: " + theMatches.join(','));
        //return theMatches;
        //bestMatches = beginMatches.sort()
       theMatches = matches;
       
    }
    
    export function clear(){
        inputText=''; 
       //console.debug("cleared text input...")
    }
</script>
<div>
<label for="inputfilter">{labelText}</label> 
<ModalButton title="Text Filter Help" buttonText="(?)" > 
                    <div class="block text-left">

                        Enter Latin characters, which will convert automatically to Greek/Hebrew!
                </div>
</ModalButton>
<br/>
<input aria-label="Input"  type="search" size="15" name="inputfilter" bind:value={inputText} placeholder="Type here" class="input input-bordered w-full max-w-xs" />
<Button buttonStyle="btn btn-ghost" buttonColors="text-base-content" style="font-light" toggled={()=>{inputText=''}} buttonText="Clear" />
</div>