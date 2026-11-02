<script lang="ts">
	import { AcademicCitationModal } from '@polyglot/ui';
	import { generateAcademicCitations, formatLocus } from '$lib/services/citationService';
	import { getWork } from '$lib/config/canonicalWorks.generated';

	interface Props {
		workCode: string;
		book: number;
		section?: string | number | null;
		onClose: () => void;
	}

	let { workCode, book, section = null, onClose }: Props = $props();

	let isOpen = $state(true);
	let activeEditionIndex = $state(0);
	let activeEdition = $derived<'grc' | 'eng'>(activeEditionIndex === 0 ? 'grc' : 'eng');

	let work = $derived(getWork(workCode));
	let locus = $derived(formatLocus(workCode, book, section));
	let citations = $derived(generateAcademicCitations(workCode, book, section, activeEdition));
	let subtitle = $derived(`${work?.titleEnglish || workCode} • ${work?.titleLatin || ''}`);

	let tabHeadings = $derived([
		'Greek Critical Edition (Benedikt Niese)',
		'English Translation (William Whiston)'
	]);
</script>

<AcademicCitationModal
	bind:open={isOpen}
	{locus}
	{subtitle}
	{tabHeadings}
	bind:activeEditionIndex
	{citations}
	{onClose}
/>
