<script>
    /**
     * @type {{
     *   title?: string,
     *   message?: string[],
     *   inline?: boolean,
     *   size?: "xs" | "sm" | "md" | "lg",
     *   classes?: string
     * }}
     */
    let {
        title = "",
        message = [],
        inline = false,
        size = "md",
        classes = ""
    } = $props();

    const sizeClasses = {
        xs: "w-3 h-3 border-2",
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-4",
        lg: "w-12 h-12 border-4"
    };

    let spinnerClass = $derived(sizeClasses[size] || sizeClasses.md);
</script>

{#if inline}
    <span class="inline-block border-link border-t-transparent rounded-full animate-spin {spinnerClass} {classes}" title={title || "Loading..."}></span>
{:else}
    <div class="flex flex-col items-center justify-center p-3 text-center {classes}">
        <div class="flex justify-center my-2">
            <span class="inline-block border-link border-t-transparent rounded-full animate-spin {spinnerClass}"></span>
        </div>
        {#if title}
            <div class="text-xs text-ink-soft font-medium">{title}</div>
        {/if}
        {#if message && message.length > 0}
            <div class="flex flex-col gap-1 mt-2">
                {#each message as line}   
                    <div class="text-ink-soft text-xs">{line}</div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
