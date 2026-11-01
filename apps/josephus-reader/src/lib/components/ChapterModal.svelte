<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
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
			const secCount = currentWork.sectionsByBook?.[i] || 50;
			list.push({
				book: i,
				label: `Book ${i}`,
				sections: secCount,
				isSelected: i === readerState.currentBook
			});
		}
		return list;
	});

	let maxSectionInBook = $derived.by(() => {
		if (currentWork.sectionsByBook && currentWork.sectionsByBook[readerState.currentBook]) {
			return currentWork.sectionsByBook[readerState.currentBook];
		}
		return 80;
	});

	let quickJumpSections = $derived.by(() => {
		const steps = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 100, 150, 200];
		return steps.filter((s) => s <= maxSectionInBook);
	});

	function selectBook(b: number) {
		readerState.setBook(b);
		onClose();
		const targetUrl = `${base}/${currentWork.code}/book/${b}/`;
		goto(targetUrl).catch(() => {
			window.location.href = targetUrl;
		});
	}

	function jumpToSection(secNum: number, bookNum?: number) {
		const targetBook = bookNum !== undefined ? Math.min(Math.max(1, bookNum), currentWork.totalBooks) : readerState.currentBook;
		const isDifferentBook = targetBook !== readerState.currentBook;

		readerState.setBook(targetBook, secNum);
		window.location.hash = `niese-${secNum}`;
		onClose();

		if (isDifferentBook) {
			const targetUrl = `${base}/${currentWork.code}/book/${targetBook}/#niese-${secNum}`;
			goto(targetUrl).catch(() => {
				window.location.href = targetUrl;
			});
		} else {
			setTimeout(() => {
				const el = document.getElementById(`niese-${secNum}`) || document.getElementById(`section-${secNum}`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 100);
		}
	}
</script>

<SectionPickerModal
	bind:open
	placeholder={isMultiBook ? `Jump to section (e.g. '15' or '2.110')...` : `Jump to section (1..${maxSectionInBook})...`}
	bind:searchQuery
	subBooks={allBooks}
	onSelectSubBook={selectBook}
	{quickJumpSections}
	currentValue={typeof readerState.currentSection === 'number' ? readerState.currentSection : undefined}
	onSelect={jumpToSection}
	{onClose}
/>
