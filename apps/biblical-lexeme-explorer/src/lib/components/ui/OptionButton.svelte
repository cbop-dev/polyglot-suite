<script>
  import pino from 'pino';
  const log = pino();
  const mylog = log.info;

  import { onMount } from 'svelte';

  let {
    buttonText = 'Reusable Button',
    buttonStyle = '',
    buttonSize = 'm-0 ml-1 mb-1 px-2.5 py-1',
    buttonColors = '',
    textSize = 'text-xs sm:text-sm',
    selected = $bindable(),
    ready = true,
    customClickHandler = () => {},
    disableToggle = false,
    tooltip = '',
    miscStyle = '',
    children = null
  } = $props();

  let isSelected = $derived(Boolean(selected));
  let activeClass = $derived(
    isSelected
      ? 'bg-ink text-page border-ink font-bold shadow-xs'
      : 'bg-page/70 text-ink border-ink/80 hover:bg-ink/15  hover:border-ink'
  );

  let theButton;

  export function deselect() {
    if (!disableToggle) selected = false;
  }

  export function select() {
    if (!disableToggle) selected = true;
  }

  export function toggle() {
    if (!disableToggle) {
      if (isSelected) {
        deselect();
      } else {
        select();
      }
    }
    customClickHandler();
  }

  onMount(() => {
    if (isSelected) select();
  });
</script>
<style>
    
</style>
<button
  type="button"
  disabled={!ready}
  onclick={toggle}
  bind:this={theButton}
  title={tooltip}
  class="btn inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-150 cursor-pointer {textSize} {buttonSize} {activeClass} {buttonStyle} {buttonColors} {miscStyle} {!ready ? 'opacity-40 cursor-not-allowed' : ''}"
>
  {#if buttonText}{buttonText}{/if}
  {#if children}{@render children?.()}{/if}
</button>

