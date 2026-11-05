<script lang="ts">
	import { AcademicCitationModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { formatAncientCorpusCitation, buildBibtexIncollection } from '@polyglot/ancient-languages';

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
		const cfg = readerState.currentCorpusConfig;
		const corpusName = cfg.name;
		const citationCfg = cfg.citation;
		const author = citationCfg?.author || cfg.author || corpusName;
		const seriesTitle = citationCfg?.seriesTitle || `The Works of ${corpusName}`;
		const year = citationCfg?.defaultYear || '1912';

		const divSec = `${readerState.currentDivision}${readerState.currentSection ? `.${readerState.currentSection}` : ''}`;
		const chicago = `${author}, *${work.titleEnglish}*, ${divSec}.`;
		const sbl = `${work.abbrev} ${divSec}`;
		const bibtex = buildBibtexIncollection({
			key: `${cfg.id}_${work.code}_${readerState.currentDivision}`,
			author,
			title: work.titleEnglish,
			booktitle: seriesTitle,
			year,
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
