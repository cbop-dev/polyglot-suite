<script>
    import TextDisplay from "./TextDisplay.svelte";
    import { VocabDataset, TfDataset } from "$lib/data/VocabDataset.js";
	import { VocabEngine, TF } from "$lib/engine/VocabEngine.js";
    import * as bibleUtils from '$lib/utils/bible-utils.js';
    import Modal2 from "./ui/Modal2.svelte";
	import Button from "./ui/Button.svelte";
	import CopyText from "./ui/CopyText.svelte";
	import { Utils } from "$lib/utils/utils";
	import { mylog } from "$lib/env/env.js";
    import Icon from "./ui/icons/Icon.svelte";
    import ArrowUp from "./ui/icons/arrow-up.svelte";
    import { jumpToDiv } from "$lib/utils/ui-utils";
    import { getReaderVerseUrl } from "$lib/utils/navigation.js";

let {
        /**
         * @type {VocabDataset} tfData
         */
        tfData,
        title='',
        description='',
        sectionIDs,
        refs,
        lexID=0
    }=$props();


    let showText=$state(false);
    let chosenRefIdx=$state(-1);
   
    //console.debug("text.description = " + description);
    /**
     * @type {Object<number,boolean>}
     */
     let loadSectionTexts=$state({});

     
     /**
      * @type {Object<string,{book:string,chap:string,v:string}[]>} refsGroupedByBook
      */
     let refsGroupedByBook=$derived.by(()=>{
            
            let currentBook = '';
            
            /**
             * @type {Object<string,{book:string,chap:string,v:string}[]>} newRefs
             * @description key is book name/abbrev; value is book/chap/verse object array.
             */
            let newRefs={};

            refs.forEach((ref)=>{
                const bCv=bibleUtils.getBookChapVerseFromRef(ref);
                if (bCv.book){
                    currentBook = tfData.booksDict.lookupBookAbbrev(bCv.book);
                }
                else{
                    bCv.book=currentBook;
                }
                
                if (!Object.keys(newRefs).includes(bCv.book)){
                    newRefs[bCv.book]=[];
                }
                newRefs[bCv.book].push(bCv);

                
            });
            return newRefs;
     });
     let books=$derived(Object.keys(refsGroupedByBook));

    
     /**
      * 
      * @param bcv {{book:string, chap:string,v:string}}
      */
     function bCvToString(bcv, omitBook=false){

        let ret = bcv.chap + ":" +bcv.v;
        if (!omitBook){
            ret = (bcv.book ? bcv.book.replaceAll(" ","") + " ":'') + ret;
        }
//        mylog(`bCvToString(${JSON.stringify(bcv)},${omitBook}) --> ${ret}`,true);
        return ret;
     }

     
     /**
      * @type {Object<number,string>}
      * @description the biblical text of each reference, once fetched. Keyed by sectionIDs index.
      */
     let textsFetched=$state({});

     async function fetchText(){
//        mylog(`TextsDisplay.fetchText(): chosenRefIdx = ${chosenRefIdx}`, true);
        if (chosenRefIdx >=0){
            if(!textsFetched[chosenRefIdx]){ //need to actually fetch  from server!
                const responseObj= await TF.fetchText(sectionIDs[chosenRefIdx],tfData.dbAbbrev);
                if (responseObj?.text && typeof responseObj?.text == 'string'){
                    textsFetched[chosenRefIdx]=responseObj.text;   
//                    mylog("Got text!: " + textsFetched[chosenRefIdx], true);
                }
                else{
//                    mylog(`TextsDisplay.fetchText(): chosenRefIdx = ${chosenRefIdx}: responseObj.text is not a string`, true);
                }
                
                
            }
            
        

        }
        
    }
    /**
     * 
     * @param {number} secID
     */
    function loadText(secID){
        if (! loadSectionTexts[secID]) {
            loadSectionTexts[secID] = true;
        }
    }
    
    //$inspect("LXXTextsDisplay.sectionIDS:", sectionIDs)
    $inspect("TextsDisplay: textFetched:", textsFetched);
    $inspect("TextsDisplay: refsGroupedByBook:", refsGroupedByBook);
</script>
<div class="inline" id="refs-top"></div>
{#if title.length}
<h1>{title}</h1>


{/if}
{#if description}<h2>{description}</h2>{/if}
<div class="mb-4 p-3 rounded-lg bg-base-100 border border-base-300 text-center shadow-xs">
    <div class="italic text-sm font-semibold text-base-content/90 mb-2">
        💡 Click on a verse to see the text!
    </div>
    <div class="text-xs font-bold uppercase tracking-wider text-base-content/75 mb-2">
        Jump to book:
    </div>
    <div class="flex flex-wrap items-center justify-center gap-1.5">
        {#each books as book}
            <button
                type="button"
                class="btn-book-jump px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-rule/60 bg-page text-ink hover:bg-rule/20 cursor-pointer transition-colors shadow-xs"
                onclick={() => jumpToDiv(book.replaceAll(" ", "_"))}
            >
                {book}
            </button>
        {/each}
    </div>
</div>
<!---<div class="flex flex-wrap">-->

<div class="w-full">
{#each Object.entries(refsGroupedByBook) as [book,bookRefs],i}
    
    {@const combinedRefs =tfData.booksDict.combineRefs(bookRefs.map((ref)=>bCvToString(ref)))}
    <!--<b>{combinedRefs}</b>-->
    <!-- sum up total entries of all previous books from 0...i-1 -->
    {@const indexOffset = Object.values(refsGroupedByBook).map((bookRefs)=>bookRefs.length).slice(0,i).reduce((a,b)=>a+b,0)}
    <div id={book.replaceAll(" ","_")} class="relative bg-base-300 text-base-content font-bold px-2 py-1 rounded my-1 flex items-center justify-center">
            <span class="text-center font-bold tracking-wide">{book}</span>
            <div class="absolute right-2 flex items-center gap-1.5">
                <a href="#refs-top" onclick={()=>jumpToDiv("refs-top")} class="text-base-content/80 hover:text-base-content" title="Jump to top"><ArrowUp width={15} height={15}/></a>
                <CopyText copyText={combinedRefs}
                    btnSizeCssClass="btn-xs font-bold"
                    btnCssClass="bg-base-100 hover:bg-base-200 text-base-content" 
                    tooltip="Copy {book} references"
                    width={15}
                    height={15}
                />
            </div>
    </div>        
    <div class="text-center py-1">
    {#each bookRefs as ref,j}
        <Button buttonText={bCvToString(ref,true)} 
        buttonColors="btn-ghost" style="btn-sm p-0.5 m-0.5 hover:bg-base-300 text-base-content"
            toggled={()=>{chosenRefIdx=indexOffset+j; fetchText(); showText=true;}}

        />
    {/each}
    </div>
{/each}
</div>

<Modal2 bind:showModal={showText} max={true}>
    
    {#if !textsFetched[chosenRefIdx]}
    Loading...<span class="loading loading-spinner loading-lg"></span>
    {:else}
        {@const theText=textsFetched[chosenRefIdx]}
        {@const theRef = refs[chosenRefIdx]}

        <div class="block" >
        <h2>{theRef}</h2>
        <p class="greek text-2xl text-center">{theText}</p>
        
        <div class="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <CopyText copyText={theRef+": " +theText} />
            <a
                href={getReaderVerseUrl(theRef, tfData?.dbAbbrev)}
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-accent text-white hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-xs"
                title="Read {theRef} in Polyglot Bible Reader"
            >
                <span>Read in Polyglot Bible Reader ↗</span>
            </a>
        </div>
        
        </div>

    {/if}
</Modal2>

