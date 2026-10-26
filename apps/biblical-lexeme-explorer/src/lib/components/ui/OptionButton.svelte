<script>
	//import { mylog } from "$lib/env";
  import pino from 'pino'
  const log= pino();
  const mylog=log.info
  
  import {onMount} from "svelte";
 // export let val;
  let  {
   buttonText = "Reusable Button",
   oldbuttonStyle = "bg-black hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 m-10",
   buttonStyle = "btn btn-outline btn-primary   ",
   buttonSize="m-0 ml-1 mb-1",
   buttonColors="",
   textSize = "base",
   selected = $bindable(),
   ready = true,
   customClickHandler = ()=>{},
   disableToggle = false,
   tooltip='',
   miscStyle='',
   children=null
   } = $props();

  
  
  let selectedStyle = $derived(selected ? "btn-neutral btn-active ": buttonStyle);
    //if (!ready) 
    //ready = false;
  

  let theButton;
  
  export function deselect() {
      if (!disableToggle)
        selected = false;
    //  mylog('selected = false');
      /*theButton.classList.replace("btn-neutral", "btn-primary");
      theButton.classList.replace("btn-active", "btn-outline");*/
      
  }
  export function select() {
    if (!disableToggle)
        selected = true;
     // mylog("selected = 'true'");
      /*
      theButton.classList.replace( "btn-primary", "btn-neutral");
      theButton.classList.replace("btn-outline", "btn-active"); */

  }

  
  export function toggle() {
    //mylog("option button ("+buttonText +") toggle. Select: " + selected)
    if (!disableToggle) {
      if (selected) {
          deselect();
          //if (selected) mylog("failed to deselect!");
      }
      else {
        select();
        //mylog("selected!")

      }
    }
    customClickHandler();
    //mylog("now selected: " + selected);
    
  }
  onMount(()=>{
    if (selected) select();
  })
</script>
  
  <style>
    .base {
      @apply text-white font-bold py-2 px-4 rounded cursor-pointer;
      
    }
  
    .sm {
      @apply text-sm;
    }
  
    .base {
      @apply text-base;
    }
  
    .lg {
      @apply text-lg;
    }
  </style>
  
  
    <button  disabled={!ready} onclick={toggle} bind:this={theButton} 
    class="{tooltip ? 'tooltip' : ''}   {buttonStyle} {buttonColors} {selectedStyle} {buttonSize} {miscStyle}" data-tip={tooltip}
    >{#if buttonText}{buttonText}
    {/if}{#if children}{@render children?.()}<hr/>
		{/if}
    </button>
  
  
  
  
  