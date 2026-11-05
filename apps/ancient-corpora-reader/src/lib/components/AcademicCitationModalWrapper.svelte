<script lang="ts">
	import { AcademicCitationModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { formatAncientCorpusCitation } from '@polyglot/ancient-languages';
	import { buildBibtexIncollection } from '@polyglot/ancient-languages';

	let locus = $derived.by(() => {
		const work = readerState.currentWork;
		return formatAncientCorpusCitation({
			corpusId: readerState.currentCorpus,
			work,
			division: readerState.currentDivision,
			section: readerState.currentSection ?? undefined
		});
	});

	let citations = $derived.by(() => {
		const work = readerState.currentWork;
		const corpusName = readerState.currentCorpus === 'af' ? 'Apostolic Fathers' : (readerState.currentCorpus === 'philo' ? 'Philo' : 'Josephus');
		const shortRef = locus;

		const chicago = `${corpusName}, *${work.titleEnglish}*, ${readerState.currentDivision}${readerState.currentSection ? `.${readerState.currentSection}` : ''}.`;
		const sbl = `${work.abbrev} ${readerState.currentDivision}${readerState.currentSection ? `.${readerState.currentSection}` : ''}`;
		const bibtex = buildBibtexIncollection({
			key: `${readerState.currentCorpus}_${work.code}_${readerState.currentDivision}`,
			author: corpusName,
			title: work.titleEnglish,
			booktitle: `The Works of ${corpusName}`,
			year: '1912',
			chapter: String(readerState.currentDivision)
		});

		return [
			{
				id: 'sbl',
				name: 'SBL Handbook',
				description: 'Standard academic citation for biblical and ancient Near Eastern studies',
				citationText: sbl
			},
			{
				id: 'chicago',
				name: 'Chicago Manual of Style',
				description: 'Standard humanities notes and bibliography citation',
				citationText: chicago
			},
			{
				id: 'bibtex',
				name: 'BibTeX Entry',
				description: 'Machine-readable BibTeX reference for LaTeX documents',
				citationText: bibtex
			}
		];
	});
</script>

<AcademicCitationModal
	open={readerState.showCitationModal}
	title="Academic Citation"
	{locus}
	subtitle="{readerState.currentWork.titleEnglish} — {readerState.currentWork.divisionLabel} {readerState.currentDivision}"
	{citations}
	onClose={() => (readerState.showCitationModal = false)}
/>
