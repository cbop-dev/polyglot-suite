<script lang="ts">
	import { SectionPickerModal, type SubBookItem } from '@polyglot/ui';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let searchQuery = $state<string>('');

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);

	let allBooks = $derived.by<SubBookItem[]>(() => {
		if (!isMultiBook) return [];
		const list: SubBookItem[] = [];
		for (let i = 1; i <= currentWork.totalBooks; i++) {
			const secCount = currentWork.sectionsByBook?.[i] || currentWork.totalSections;
			list.push({
				book: i,
				label: `Book ${i}`,
				sections: secCount,
				isSelected: i === readerState.currentChapter
			});
		}
		return list;
	});

	let maxSectionInBook = $derived.by(() => {
		if (currentWork.sectionsByBook && currentWork.sectionsByBook[readerState.currentChapter]) {
			return currentWork.sectionsByBook[readerState.currentChapter];
		}
		return currentWork.totalSections;
	});

	let quickJumpSections = $derived.by(() => {
		const steps = [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500];
		return steps.filter((s) => s <= maxSectionInBook);
	});

	function selectBook(b: number) {
		readerState.setChapter(b);
		onClose();
	}

	function jumpToSection(secNum: number, bookNum?: number) {
		if (bookNum !== undefined && isMultiBook) {
			const clampedBook = Math.max(1, Math.min(bookNum, currentWork.totalBooks));
			readerState.setChapter(clampedBook, secNum);
		} else {
			const clamped = Math.max(1, Math.min(secNum, maxSectionInBook));
			readerState.currentSection = clamped;
		}
		onClose();
		setTimeout(() => {
			const el = document.getElementById(`section-${secNum}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}
</script>

<SectionPickerModal
	bind:open
	placeholder={isMultiBook ? `Jump to section (e.g. '15' or '2.110')...` : `Jump to section (1..${maxSectionInBook})...`}
	bind:searchQuery
	subBooks={allBooks}
	onSelectSubBook={selectBook}
	{quickJumpSections}
	currentValue={readerState.currentSection ?? undefined}
	onSelect={jumpToSection}
	{onClose}
/>
