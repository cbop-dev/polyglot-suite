<script>
    import OptionButton from "./ui/OptionButton.svelte";
    let {
        selectedItems = $bindable(), 
        title, 
        itemData, //array of items {id:, text:} 
        
        description ='',
        //theClick= (id)=>{},
        disableToggle=false,

    } = $props();

    /*export let title;
    export let itemData; //array of items {id:, text:}    
    export let description;*/

    let theButtons = $state({})
    function selectAll(){
		deselect();
		invert();
	}

	function deselect(){
		
		//mylog("deselecting all " + Object.keys(buttons).length + "buttons");
		for (const button of Object.values(theButtons)) {
			if (button)
                button.deselect();
			
		}
	
	};

	function invert(){
        for (const button of Object.values(theButtons)) {
			button.toggle();
			
		}
	}

</script>
<h2>{title}</h2>
{description}
<div >{#each Object.values(itemData || {}) as item}
        <!-- format of each obj: '623694': { abbrev: 'Gen', syn: [ 'Genesis', 'Gen', 'Ge' ], long: 'Genesis' } -->
         <OptionButton 
            buttonText={item.text ?? item.label ?? item.abbrev} 
            disableToggle={disableToggle}
            bind:selected={selectedItems[item.id]} 
            bind:this={theButtons[item.id]} 
            
        />
    {/each}
    <button type="button" class="btn px-3 py-1 text-xs font-semibold rounded-lg border border-rule/60 bg-page text-ink hover:bg-rule/20 cursor-pointer transition-colors shadow-xs" onclick={selectAll}>Select All</button>
    <button type="button" class="btn px-3 py-1 text-xs font-semibold rounded-lg border border-rule/60 bg-page text-ink hover:bg-rule/20 cursor-pointer transition-colors shadow-xs" onclick={deselect}>Deselect All</button>
    <button type="button" class="btn px-3 py-1 text-xs font-semibold rounded-lg border border-rule/60 bg-page text-ink hover:bg-rule/20 cursor-pointer transition-colors shadow-xs" onclick={invert}>Invert</button>
</div>
       
