<script lang="ts" generics="T extends Record<string, any>">
	import Modal2 from '../controls/Modal2.svelte';
	import ItemPicker from '../controls/ItemPicker.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		items: T[];
		searchQuery?: string;
		placeholder?: string;
		emptyMessage?: string;
		selectedIndex?: number;
		maxWidth?: string;
		maxHeightClass?: string;
		showSearchIcon?: boolean;
		showEscBadge?: boolean;
		class?: string;
		onSelect: (item: T) => void;
		onClose: () => void;
		headerExtra?: Snippet;
		item?: Snippet<[{ item: T; index: number; isHighlighted: boolean }]>;
		footer?: Snippet;
	}

	let {
		open = $bindable(false),
		items = [],
		searchQuery = $bindable(''),
		placeholder = 'Type to filter...',
		emptyMessage = 'No matching items found.',
		selectedIndex = $bindable(0),
		maxWidth = 'max-w-xl',
		maxHeightClass = 'max-h-80',
		showSearchIcon = true,
		showEscBadge = true,
		class: className = '',
		onSelect,
		onClose,
		headerExtra,
		item: itemSnippet,
		footer: footerSnippet
	}: Props = $props();

	$effect(() => {
		if (open) {
			searchQuery = '';
			selectedIndex = 0;
		}
	});
</script>

<Modal2
	bind:showModal={open}
	onclose={onClose}
	showFooter={false}
	showMaximize={false}
	showClose={false}
	{maxWidth}
>
	<ItemPicker
		{items}
		bind:searchQuery
		bind:selectedIndex
		active={open}
		{placeholder}
		{emptyMessage}
		{maxHeightClass}
		{showSearchIcon}
		{showEscBadge}
		class={className}
		{onSelect}
		{onClose}
		{headerExtra}
		item={itemSnippet}
		footer={footerSnippet}
	/>
</Modal2>
