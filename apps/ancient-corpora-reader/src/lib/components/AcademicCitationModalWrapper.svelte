<script lang="ts">
	import { AcademicCitationModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { formatAncientCorpusCitation, formatVersionAcademicCitations } from '@polyglot/ancient-languages';

	let activeEditionIndex = $state(0);

	let work = $derived(readerState.currentWork);
	let cfg = $derived(readerState.currentCorpusConfig);

	// Filter available versions for the current work (e.g. Latin witness only in HER / POL_PHI)
	let availableVersions = $derived.by(() => {
		const versions = cfg?.textVersions || [];
		if (!work?.code) return versions;
		return versions.filter((v) => {
			if (!v.applicableWorks || v.applicableWorks.length === 0) return true;
			return v.applicableWorks.includes(work.code);
		});
	});

	// Reset or clamp activeEditionIndex if current work changes
	$effect(() => {
		if (activeEditionIndex >= availableVersions.length) {
			activeEditionIndex = 0;
		}
	});

	let tabHeadings = $derived(
		availableVersions.length > 1
			? availableVersions.map((v) => v.shortTitle || v.title)
			: undefined
	);

	let activeVersion = $derived(availableVersions[activeEditionIndex] || availableVersions[0]);

	let locus = $derived.by(() => {
		if (!work) return '';
		return formatAncientCorpusCitation({
			corpusId: readerState.currentCorpus,
			work,
			division: readerState.currentDivision,
			section: readerState.currentSection ?? undefined
		});
	});

	let citations = $derived.by(() => {
		if (!activeVersion || !work) return [];
		return formatVersionAcademicCitations({
			corpusConfig: cfg,
			work,
			version: activeVersion,
			division: readerState.currentDivision,
			section: readerState.currentSection ?? undefined
		});
	});
</script>

<AcademicCitationModal
	open={readerState.showCitationModal}
	title="Academic Citation"
	{locus}
	subtitle="{work?.titleEnglish || ''} — {work?.divisionLabel || 'Chapter'} {readerState.currentDivision}"
	{citations}
	{tabHeadings}
	bind:activeEditionIndex
	onClose={() => (readerState.showCitationModal = false)}
/>
