<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { WorkPickerModal, type WorkCategory } from '@polyglot/ui';
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	let searchQuery = $state<string>('');
	let selectedCategory = $state<string>('all');

	const CATEGORY_LIST: WorkCategory[] = [
		{ id: 'all', label: 'All Works (4)' },
		{ id: 'history', label: 'Histories (2)' },
		{ id: 'autobiography', label: 'Autobiography (1)' },
		{ id: 'apology', label: 'Apologetics (1)' }
	];

	let filteredWorks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return CANONICAL_WORKS.filter((w) => {
			if (selectedCategory !== 'all' && w.category !== selectedCategory) {
				return false;
			}
			if (!q) return true;
			return (
				w.titleEnglish.toLowerCase().includes(q) ||
				w.titleLatin.toLowerCase().includes(q) ||
				w.titleGreek.toLowerCase().includes(q) ||
				w.abbrev.toLowerCase().includes(q) ||
				w.code.toLowerCase().includes(q)
			);
		});
	});

	function selectWork(work: CanonicalWork) {
		readerState.setWork(work.code, 1);
		onClose();
		const targetUrl = `${base}/${work.code}/book/1/`;
		goto(targetUrl).catch(() => {
			window.location.href = targetUrl;
		});
	}
</script>

<WorkPickerModal
	bind:open
	placeholder="Filter Josephus's works (e.g. 'Antiquities', 'War', 'Life', 'Apion')..."
	categories={CATEGORY_LIST}
	bind:selectedCategory
	bind:searchQuery
	works={filteredWorks}
	currentWorkCode={readerState.currentWorkCode}
	onSelectWork={selectWork}
	{onClose}
/>
