<script lang="ts">
  import { versionGroups, formatVersionLabel } from '$lib/config/versions';
  import { readerState } from '$lib/stores/readerState.svelte';
  import { size } from '@polyglot/theme';

  let openFontPopoverKey = $state<string | null>(null);

  function toggleFontPopover(key: string, e: MouseEvent) {
    e.stopPropagation();
    openFontPopoverKey = openFontPopoverKey === key ? null : key;
  }

  function handleWindowPointerDown(e: PointerEvent) {
    if (!openFontPopoverKey) return;
    const target = e.target as HTMLElement | null;
    if (!target?.closest('[data-cell-font-popover]')) {
      openFontPopoverKey = null;
    }
  }

  function handleWindowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && openFontPopoverKey) {
      openFontPopoverKey = null;
    }
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeyDown} />
{#snippet notBase(text:string)}
{#if size.current!='base'}
{text}
{/if}
{/snippet}

<div id="grid-header"
class="{readerState.gridHeaderExpanded ? 'flex pt-5' : 'hidden pt-2'} flex-col gap-2 mb-4 sticky top-10 sm:top-20 md:top-25 lg:top-27
pb-2.5 border-b border-rule z-20 shadow-xs">
  <div class="flex items-center justify-between px-4 sm:px-5 text-xs font-semibold text-ink-soft">
    <span class="flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-link inline-block"></span>
      {@render notBase('Verse Grid ')}Layout: <strong class="text-ink">{readerState.versionGrid.length} 
        {size.current != 'base' ? (readerState.versionGrid.length === 1 ? ('Row') : ('Rows')): ''} × 
        {readerState.versionGrid[0]?.length || 0} {size.current!='base' ? (readerState.versionGrid[0]?.length === 1 ? 'Col' : 'Cols') : '' }</strong>
    </span>
    <div class="flex items-center gap-2">
      <button 
        type="button"
        class="px-2.5 py-1 rounded border border-rule hover:bg-rule active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-medium text-ink transition-transform"
        onclick={() => readerState.addColumn()}
        title="Add a parallel column"
      >
        <span class="font-bold">+</span>{@render notBase('Add')} Col{@render notBase('umn')}
      </button>
      <button 
        type="button"
        class="px-2.5 py-1 rounded border border-rule hover:bg-rule active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-medium text-ink transition-transform"
        onclick={() => readerState.addRow()}
        title="Add a parallel row"
      >
        <span class="font-bold">+</span>{@render notBase('Add')} Row
      </button>
    </div>
  </div>

  {#if readerState.versionGrid[0].length > 1}
    {@const row1 = readerState.versionGrid[0]}
     <div class="grid gap-6" style="grid-template-columns: repeat({row1.length > 0 ? (size.current == 'base' ? 3 : row1.length) : 1}, minmax(0, 1fr))">
        {#each row1 as colVersion, cIdx}
        <div class="relative flex gap-0">
              <button 
                type="button"
                class="text-ink-soft self-center center text-center
                 hover:text-red-500 text-xs group-hover:opacity-100 
                 transition-opacity m-auto p-0.5 rounded hover:bg-red-50 my-0 dark:hover:bg-red-950/30"
                onclick={() => readerState.removeColumn(cIdx)}
                title="Remove column {cIdx + 1}"
                aria-label="Remove column {cIdx + 1}"
              >✕<span class="hidden sm:inline">&nbsp; Remove </span>  Col<span class="hidden sm:inline">umn</span> {cIdx+1}</button>
            </div>
        {/each}
     </div>     
        {/if}
  {#each readerState.versionGrid as row, rIdx}
    <div class="px-4 sm:px-5 border-x border-transparent">
      {#if readerState.versionGrid.length > 1}
      
        <div class="flex items-center justify-between text-[11px] font-semibold text-ink-soft mb-1 px-0.5">
        
          <span>Row {rIdx + 1}</span>
          <button 
            type="button"
            class="text-ink-soft hover:text-red-500 text-xs cursor-pointer flex items-center gap-1 hover:underline font-normal"
            onclick={() => readerState.removeRow(rIdx)}
            title="Remove row {rIdx + 1}"
            aria-label="Remove row {rIdx + 1}"
          >
            ✕<span class="hidden sm:inline"> Remove</span> Row {rIdx+1}
          </button>
        </div>
      {/if}
      <div class="grid gap-6 verse-grid" style="grid-template-columns: repeat({row.length > 0 ? row.length : 1}, minmax(0, 1fr))">
        
        {#each row as cellVersion, cIdx}
          {@const align = readerState.getCellAlign(rIdx, cIdx)}
          {@const cellScale = readerState.getCellFontScale(rIdx, cIdx)}
          {@const cellScalePct = Math.round(cellScale * 100)}
          {@const popoverKey = `${rIdx}-${cIdx}`}
          {@const isPopoverOpen = openFontPopoverKey === popoverKey}
          
          <div class="relative flex items-center justify-center gap-1.5 bg-page border border-rule/60 rounded-md px-3 py-1.5 
          group hover:border-link transition-colors shadow-xs">
           
            <select 
              class="font-bold text-sm bg-page text-ink cursor-pointer appearance-none text-center focus:outline-none text-ink truncate w-full min-w-0 truncate "
              value={cellVersion}
              onchange={(e) => readerState.updateCell(rIdx, cIdx, e.currentTarget.value)}
              aria-label="Select translation for Row {rIdx + 1}, Column {cIdx + 1}"
            >
              {#each versionGroups as group}
                <optgroup label={group.language} class="underline text-left">
                  {#each group.versions as opt}
                    <option class="text-left " value={opt}>{formatVersionLabel(opt, size.current=='base')}</option>
                  {/each}
                </optgroup>
              {/each}
            </select>
            <div class="relative shrink-0" data-cell-font-popover>
              <button
                type="button"
                class="h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer shrink-0 shadow-2xs {cellScalePct !== 100 ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-page text-ink-soft border-rule hover:bg-rule hover:text-ink'}"
                onclick={(e) => toggleFontPopover(popoverKey, e)}
                title="Cell text size: {cellScalePct}% (click to adjust)"
                aria-label="Adjust text size for Row {rIdx + 1}, Column {cIdx + 1}"
                aria-expanded={isPopoverOpen}
              >
                {cellScalePct === 100 ? 'Aa' : `${cellScalePct}%`}
              </button>

              {#if isPopoverOpen}
                <div
                  class="absolute right-0 top-7 z-40 w-48 rounded-lg border border-rule bg-page p-2.5 shadow-lg text-ink flex flex-col gap-2"
                >
                  <div class="flex items-center justify-between text-[11px] font-semibold">
                    <span>Column Size</span>
                    <button
                      type="button"
                      class="font-mono text-link hover:underline cursor-pointer"
                      onclick={() => readerState.resetCellFontScale(rIdx, cIdx)}
                      title="Reset to 100%"
                    >
                      {cellScalePct}% (Reset)
                    </button>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="px-1.5 py-0.5 rounded border border-rule text-xs font-serif font-bold hover:bg-rule cursor-pointer"
                      onclick={() => readerState.stepCellFontScale(rIdx, cIdx, -0.1)}
                      title="Decrease text size"
                      aria-label="Decrease text size"
                    >
                      A-
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={cellScalePct}
                      oninput={(e) => readerState.setCellFontScale(rIdx, cIdx, parseInt(e.currentTarget.value, 10) / 100)}
                      class="w-full cursor-pointer accent-blue-600"
                      aria-label="Text size percentage for Row {rIdx + 1}, Column {cIdx + 1}"
                    />
                    <button
                      type="button"
                      class="px-1.5 py-0.5 rounded border border-rule text-sm font-serif font-bold hover:bg-rule cursor-pointer"
                      onclick={() => readerState.stepCellFontScale(rIdx, cIdx, 0.1)}
                      title="Increase text size"
                      aria-label="Increase text size"
                    >
                      A+
                    </button>
                  </div>
                </div>
              {/if}
            </div>
            <button
              type="button"
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer shrink-0 shadow-2xs {align === 'right' ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-page text-ink-soft border-rule hover:bg-rule hover:text-ink'}"
              onclick={() => readerState.toggleCellAlign(rIdx, cIdx)}
              title="Text alignment: {align === 'right' ? 'Right-aligned' : 'Left-aligned'} (click to toggle)"
              aria-label="Toggle text alignment for Row {rIdx + 1}, Column {cIdx + 1}"
            >
              {align === 'right' ? 'R' : 'L'}
            </button>
            
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
<style>


  :root[data-theme='light'] {
      --bgblend: black;
  }

  :root[data-theme='dark'] {
      --bgblend: white;
  }
   #grid-header{ 
    background-color: color-mix(in srgb, var(--bg-content, white) 90%, 
          color-mix(in srgb, var(--bgblend) 75%, transparent 20%) 10%); 
    box-shadow: 2px 2px 10px color-mix(in srgb, var(--bgblend) 30%, transparent 80%);
    
  }
  
  
</style>