<script lang="ts">
	import { HIGHLIGHT_PALETTE, type PaletteColor } from '@polyglot/ancient-languages';

	interface Props {
		selectedColorIndex: number;
		onselect: (index: number) => void;
		size?: 'sm' | 'md';
		class?: string;
	}

	let {
		selectedColorIndex,
		onselect,
		size = 'sm',
		class: className = ''
	}: Props = $props();
</script>

<div
	class="flex items-center gap-1.5 flex-wrap {className}"
	role="radiogroup"
	aria-label="Highlight color selection"
>
	{#each HIGHLIGHT_PALETTE as p}
		{@const isSelected = selectedColorIndex === p.id}
		<button
			type="button"
			role="radio"
			aria-checked={isSelected}
			class="{size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} rounded-full cursor-pointer transition-transform hover:scale-130 focus:outline-hidden {isSelected ? 'ring-2 ring-offset-1 ring-blue-500 scale-115 shadow-xs' : 'opacity-70 hover:opacity-100'}"
			style="background-color: {p.hex};"
			onclick={() => onselect(p.id)}
			title="{p.name} (#{p.id + 1})"
			aria-label="{p.name}"
		></button>
	{/each}
</div>
