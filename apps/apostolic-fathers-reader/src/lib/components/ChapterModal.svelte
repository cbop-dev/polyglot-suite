<script lang="ts">
	import { SectionPickerModal, type SectionListItem } from '@polyglot/ui';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let searchQuery = $state<string>('');

	let allChapters = $derived.by(() => {
		const min = readerState.currentWork.minChapter ?? 1;
		const max = readerState.currentWork.totalChapters;
		const list: SectionListItem[] = [];
		for (let i = min; i <= max; i++) {
			list.push({
				value: i,
				label: i === 0 ? 'Salutation' : `Chapter ${i}`,
				badge: '§',
				isLatin: readerState.hasLatinInChapter(readerState.currentWorkCode, i),
				isSelected: i === readerState.currentChapter
			});
		}
		return list;
	});

	let filteredChapters = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return allChapters;

		return allChapters.filter((c) => {
			if (c.value.toString() === q || c.value.toString().startsWith(q)) return true;
			if (c.label.toLowerCase().includes(q)) return true;
			if (q === 'lat' || q === 'latin') return c.isLatin;
			return false;
		});
	});

	function selectChapter(ch: number) {
		readerState.setChapter(ch);
		onClose();
	}
</script>

<SectionPickerModal
	bind:open
	placeholder="Type chapter number (1, 2, 3...)..."
	bind:searchQuery
	items={filteredChapters}
	totalCount={allChapters.length}
	currentValue={readerState.currentChapter}
	onSelect={selectChapter}
	{onClose}
/>
