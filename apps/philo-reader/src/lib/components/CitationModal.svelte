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
		mangeyRef?: string | null;
		isSupplement?: boolean;
		onClose: () => void;
	}

	let { workCode, chapter, section = null, mangeyRef = null, isSupplement = false, onClose }: Props = $props();

	let isOpen = $state(true);
	let activeEditionIndex = $state(0);
	let activeEdition = $derived<'grc' | 'eng'>(activeEditionIndex === 0 ? 'grc' : 'eng');

	let work = $derived(WORKS_BY_CODE[workCode]);
	let locus = $derived(formatLocus(workCode, chapter, section, mangeyRef));
	let citations = $derived(generateAcademicCitations(workCode, chapter, section, activeEdition, mangeyRef, isSupplement));
	let subtitle = $derived(`${work?.titleEnglish || workCode} • ${work?.titleLatin || ''}`);

	let tabHeadings = $derived([
		'Greek Critical Edition (Cohn-Wendland)',
		`English Translation ${isSupplement ? '(Supplement)' : '(Yonge 1854)'}`
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
