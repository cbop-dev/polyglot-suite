<script lang="ts">
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
		{ id: 'all', label: 'All Treatises (31)' },
		{ id: 'allegorical', label: 'Allegorical Commentary (18)' },
		{ id: 'exposition', label: 'Exposition of the Law (9)' },
		{ id: 'historical', label: 'Historical & Apologetic (2)' },
		{ id: 'philosophical', label: 'Philosophical (2)' }
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
				w.code.toLowerCase().includes(q) ||
				w.tlgId.toLowerCase().includes(q)
			);
		});
	});

	function selectWork(work: CanonicalWork) {
		readerState.setWork(work.code, 1);
		onClose();
	}
</script>

<WorkPickerModal
	bind:open
	placeholder="Filter Philo's treatises (e.g. 'Creation', 'Opif.', 'Moses', 'Cherubim', 'Spec. Leg.')..."
	categories={CATEGORY_LIST}
	bind:selectedCategory
	bind:searchQuery
	works={filteredWorks}
	currentWorkCode={readerState.currentWorkCode}
	onSelectWork={selectWork}
	{onClose}
/>
