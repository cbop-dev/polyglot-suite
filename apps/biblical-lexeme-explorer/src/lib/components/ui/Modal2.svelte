<script>
let {
    showModal = $bindable(),
    title='',
    onclose=()=>{}, 
    children,
    max = $bindable(false)
} = $props();

// 1. Create a reference to the dialog element
let dialog;

// 2. React to showModal changes and use the native API
$effect(() => {
    if (dialog) {
        if (showModal && !dialog.open) {
            dialog.showModal();
        } else if (!showModal && dialog.open) {
            dialog.close();
        }
    }
});
</script>

<!-- 3. Remove class:modal-open, add bind:this and oncancel -->
<dialog class="modal" 
    bind:this={dialog}
    onclose={() => { showModal = false; onclose(); }}
    oncancel={() => (showModal = false)} >
    {#key max && showModal}
        <div class="modal-box fixed {max ? 'w-11/12 max-h-full' : 'md:max-w-3/4 w-auto'} max-w-full bg-base-100 text-base-content border border-base-300 shadow-2xl">
        <form method="dialog" class="float-right flex items-center gap-1.5">
            <!-- Maximize / Minimize Button -->
            <button
                type="button"
                class="btn btn-sm btn-circle bg-base-200 hover:bg-base-300 text-base-content border border-base-300 shadow-xs transition-colors"
                onclick={() => { max = !max; }}
                title={max ? "Restore window size" : "Maximize window"}
                aria-label={max ? "Restore window size" : "Maximize window"}
            >
                {#if max}
                    <!-- Minimize / Restore icon: inward arrows -->
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="4 14 10 14 10 20" />
                        <polyline points="20 10 14 10 14 4" />
                        <line x1="14" y1="10" x2="21" y2="3" />
                        <line x1="10" y1="14" x2="3" y2="21" />
                    </svg>
                {:else}
                    <!-- Maximize icon: outward arrows -->
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                {/if}
            </button>

            <!-- Close Button -->
            <button
                type="button"
                class="btn btn-sm btn-circle bg-base-200 hover:bg-base-300 text-base-content border border-base-300 shadow-xs transition-colors"
                onclick={() => { showModal = false; }}
                title="Close"
                aria-label="Close"
            >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </form>
        <div class="block items-center text-center">
            {#if title}<h1 class="text-xl font-bold mb-2">{title}</h1>
        
            <hr class="border-base-300 my-2" />
            {/if}
        </div>
            {@render children()}
            
        <hr class="border-base-300 my-4" />
            <form method="dialog" class="text-center">
                <button class="btn btn-sm btn-outline px-6" onclick={()=>{showModal=false}}>Close</button>
            </form>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-xs">
            <button onclick={()=>{showModal=false}}>close</button>
        </form>
    {/key}
</dialog>
