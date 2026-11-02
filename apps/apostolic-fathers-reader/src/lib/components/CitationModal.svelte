<script lang="ts">
	import { AcademicCitationModal } from '@polyglot/ui';
	import {
		generateAcademicCitations,
		formatLocus
	} from '$lib/services/citationService';
	import { WORKS_BY_CODE } from '$lib/config/canonicalWorks.generated';

	interface Props {
		workCode: string;
		chapter: number;
		section?: number | null;
		onClose: () => void;
	}

	let { workCode, chapter, section = null, onClose }: Props = $props();

	let isOpen = $state(true);
	let activeEditionIndex = $state(0);
	let activeEdition = $derived<'grc' | 'eng' | 'lat'>(
		activeEditionIndex === 0 ? 'grc' : activeEditionIndex === 1 ? 'eng' : 'lat'
	);

	let work = $derived(WORKS_BY_CODE[workCode]);
	let locus = $derived(formatLocus(workCode, chapter, section));
	let citations = $derived(generateAcademicCitations(workCode, chapter, section, activeEdition));
	let subtitle = $derived(`${work?.titleEnglish || workCode} • Chapter ${chapter}${section ? `, Section ${section}` : ''}`);

	const tabHeadings = ['Greek Edition (Lake 1912)', 'English Translation', 'Latin Edition'];
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
