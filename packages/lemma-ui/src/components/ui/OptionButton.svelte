<script>
  import { onMount } from "svelte";

  let {
    buttonText = "Button",
    buttonSize = "gap-1.5 px-3.5 py-1.5 rounded-lg b",
    buttonColors = "",
    textSize = "text-sm shadow-xs",
    selected = $bindable(),
    ready = true,
    customClickHandler = () => {},
    disableToggle = false,
    tooltip = '',
    miscStyle = '',
    children = null
  } = $props();

  let isSelected = $derived(Boolean(selected));
  let theButton;

  export function deselect() {
    if (!disableToggle) selected = false;
  }
  export function select() {
    if (!disableToggle) selected = true;
  }
  export function toggle() {
    if (!disableToggle) {
      selected = !isSelected;
    }
    customClickHandler();
  }

  onMount(() => {
    if (isSelected) select();
  });
</script>

<button
  type="button"
  disabled={!ready}
  onclick={toggle}
  bind:this={theButton}
  title={tooltip}
  class="inline-flex items-center justify-center border
   font-semibold transition-all duration-150 cursor-pointer 
   {buttonSize} {textSize} {miscStyle} {isSelected 
    ? 'bg-link text-white border-link shadow-md ring-2 ring-link/30 font-bold' 
    : 'bg-page text-ink border-rule hover:bg-rule/50 hover:border-link/60'} {!ready ? 'opacity-50 cursor-not-allowed' : ''} {buttonColors}"
>
  {#if buttonText}
    <span>{buttonText}</span>
  {/if}
  {#if children}
    {@render children?.()}
  {/if}
</button>