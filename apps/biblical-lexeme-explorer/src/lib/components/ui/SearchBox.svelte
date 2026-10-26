<script>
    import Button from "./Button.svelte";
    
    let {
        searchText = $bindable(''),
        casesensitive=$bindable(false),
        
        transform=(input)=>{return input}
    } = $props();
    $effect(()=>{searchText=transform(searchText)});
</script>
<input aria-label="Input"  type="search" size="15" name="inputfilter" bind:value={searchText} 
            placeholder="Type here" class="input input-bordered w-full max-w-xs" />
            <Button buttonStyle="btn btn-ghost" buttonColors="text-base-content" style="font-light" 
            toggled={()=>{searchText=''}} buttonText="Clear" /><br/>
            <label class="label cursor-pointer inline">
                <span class="label-text">Case sensitive</span>
                <input type="checkbox" bind:checked={casesensitive} class="checkbox" />
              </label>
        