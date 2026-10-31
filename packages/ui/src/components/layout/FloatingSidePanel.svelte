<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    children?: any;
    isOpen?: boolean;
    onClose?: () => void;
    isMobile?: boolean;
    showDefaultCloseButton?: boolean;
    noPadding?: boolean;
    class?: string;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    top?: string;
    ariaLabel?: string;
  }

  let {
    children,
    isOpen = false,
    onClose = () => {},
    isMobile = false,
    showDefaultCloseButton = true,
    noPadding = false,
    class: className = '',
    width = 440,
    minWidth = 300,
    maxWidth = 100,
    top,
    ariaLabel = 'Side Panel'
  }: Props = $props();
  
  let panelWidth = $state(width);
  let isDragging = false;

  function startDrag(e: MouseEvent) {
    isDragging = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }

  function doDrag(e: MouseEvent) {
    if (!isDragging) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > minWidth && newWidth < window.innerWidth - maxWidth) {
      panelWidth = newWidth;
    }
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  }

  onMount(() => {
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', doDrag);
    window.removeEventListener('mouseup', stopDrag);
  });
</script>

{#if isOpen}
  <!-- Panel -->
  <aside 
    class="fixed right-0 bg-page shadow-2xl border-l border-rule z-40 flex animate-slide-in text-ink {className}"
    style="{top !== undefined ? `top: ${top}; height: calc(100vh - ${top});` : 'top: 0; height: 100%;'} {isMobile ? '' : 'width: min(100vw, ' + panelWidth + 'px);'}"
    aria-label={ariaLabel}
  >
    <!-- Resize Handle -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div 
      role="separator"
      aria-orientation="vertical"
      tabindex="0"
      class="w-2 cursor-ew-resize hover:bg-blue-500/50 bg-rule transition-colors h-full flex items-center justify-center shrink-0 z-50"
      onmousedown={startDrag}
      title="Drag to resize panel"
    >
      <div class="w-1 h-8 bg-ink/20 rounded"></div>
    </div>
    
    <!-- Content Area -->
    <div class="flex-1 h-full min-w-0 flex flex-col relative {noPadding ? 'overflow-hidden' : 'overflow-y-auto'}">
      {#if showDefaultCloseButton}
        <button 
          class="absolute top-4 right-4 text-ink-soft hover:text-ink z-10 p-2 bg-page/80 backdrop-blur rounded-full shadow-sm border border-rule cursor-pointer" 
          onclick={onClose}
          aria-label="Close Panel"
        >
          ✕
        </button>
      {/if}
      
      {#if noPadding}
        {@render children?.()}
      {:else}
        <div class="p-6">
          {@render children?.()}
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slideIn 0.2s ease-out forwards;
  }
</style>
