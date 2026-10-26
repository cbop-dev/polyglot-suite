<script>
  /** 
   * Like SelectButtonsPanel, but allows each button to have its own modal popup of selections!
   * 
  */
    import OptionButton from "./ui/OptionButton.svelte";
    import SelectButtonsPanel from "./SelectButtonsPanel.svelte";
	import Modal2 from "./ui/Modal2.svelte";
    //let selectedParents;
    
/**
 * // not correct yet:
 * @typedef {Object} Props
 * @property {Object[]} itemData
 */
    let {
        selectedItems = $bindable(), //
        title, 

    /**
    * @type {{id: number, text: string, children: {id: number, text: string}[]}[]} itemData
    **/
        itemData,  //array of items with their children: {id:, text:, children: {id: , text: }[] } []    
        description = '',
        allowChildrenAllToggle=true
    } = $props();
  
    //let selectedChildren = $state(selectedItems);
    
    let selectedParentID=$state(null);
    let selectedParent=$derived.by(()=>{
      let parent = null;
      if (selectedParentID)
        parent = itemData.filter((i)=>i.id==selectedParentID)[0];
      return parent;
    });
    //let theParentButtons = {}
    /**
     * @type {Object.<number,OptionButton>}
     */
    let allButtons = $state({});
    //let childButtons = {}
    
    /**
     * @type {boolean} showModal
     */
    //let childModals = $state({})
    let showModal=$state(false);
    
    let selectedChildren = $derived.by(()=>{
      /**
       * @type {Object.<string|number,boolean>}
       */
      let ret = {}
      for (const item of (itemData || [])){
        const children = item.children ?? item.options ?? [];
        if (children.filter((child)=> selectedItems && selectedItems[child.id] == true).length > 0){
          ret[item.id] = true;
        }

      }
      return  ret;
    })
    //key: parentButton id; value: true if some child is selected, false o/w.


    //dont' want this for all books in chapter selection mode
  /*
    function selectAll(){
		deselect();
		invert();
	}
  */
	function deselect(){
		
		//mylog("deselecting all " + Object.keys(buttons).length + "buttons");
		//wrong approach, this deselects everything, even whole chapters:
    /*
    for (const id of Object.keys(selectedItems)) {
			selectedItems[id] = false;
			
		}*/

    for (const item of (itemData || [])){
      const children = item.children ?? item.options ?? [];
      for (const child of children) {
        if (child.id && selectedItems && Object.keys(selectedItems).includes(child.id))
          selectedItems[child.id] = false;
      }
    }
	
	};

  //dont' want this for all books in chapter selection mode
/*
	function invert(){
    for (const [id,selectedBool] of Object.entries(selectedItems)) {
			if (selectedBool) 
        selectedItems[id] = false;
      else
      selectedItems[id] = true;
			
		}
	}
*/
////console.debug("Renddering 2D buttons panel...")
</script>
<h2>{title}</h2>
{description}
<div >{#each (itemData || []) as item}
        <!-- format of each obj: '623694': { abbrev: 'Gen', syn: [ 'Genesis', 'Gen', 'Ge' ], long: 'Genesis' } -->
         <OptionButton disableToggle={true} buttonText={item.text ?? item.label ?? item.abbrev} selected={selectedChildren[item.id]} 
         bind:this={allButtons[item.id]} customClickHandler={()=>{selectedParentID=item.id; showModal = true}}/>
    {/each}
    
    <button  class="btn" onclick={deselect}>Deselect All</button>
    
</div>
       
{#if selectedParent}
<Modal2 bind:showModal={showModal} title='Select Chapters {selectedParent ? " of " + (selectedParent.text ?? selectedParent.label ?? selectedParent.abbrev) : ""}'>

          
          <SelectButtonsPanel description='' title={selectedParent.text ?? selectedParent.label ?? selectedParent.abbrev} bind:selectedItems={selectedItems} 
            itemData={selectedParent.children ?? selectedParent.options ?? []} />   
          
            
    
</Modal2>
{/if}