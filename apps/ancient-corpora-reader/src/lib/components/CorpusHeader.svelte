<script lang="ts">
	import { base } from '$app/paths';
	import { ReaderHeader, type ViewMode } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { CORPUS_TITLES } from '../config/canonicalWorks.js';
	import type { AncientCorpusId } from '@polyglot/ancient-languages';

	const corpora: { id: AncientCorpusId; label: string }[] = [
		{ id: 'af', label: 'Apostolic Fathers' },
		{ id: 'philo', label: 'Philo' },
		{ id: 'josephus', label: 'Josephus' }
	];

	function handleCorpusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const nextCorpus = target.value as AncientCorpusId;
		if (nextCorpus !== readerState.currentCorpus) {
			readerState.setCorpus(nextCorpus);
		}
	}
</script>

<ReaderHeader
	title="Ancient Corpora"
	titleShort="Corpora"
	homeHref="{base}/"
	suiteHref="{base}/"
	workTitle={readerState.currentWork.titleEnglish}
	workAbbrev={readerState.currentWork.abbrev}
	onOpenWorkPicker={() => (readerState.isWorkModalOpen = true)}
	locationLabel="{readerState.currentWork.divisionLabel} {readerState.currentDivision}"
	locationShort={String(readerState.currentDivision)}
	isMultiBook={readerState.currentWork.totalDivisions > 1}
	canPrevBook={readerState.currentDivision > readerState.currentWork.minDivision}
	canNextBook={readerState.currentDivision < readerState.currentWork.totalDivisions}
	onPrevBook={() => readerState.prevDivision()}
	onNextBook={() => readerState.nextDivision()}
	onOpenSectionPicker={() => (readerState.isDivisionModalOpen = true)}
	viewMode={readerState.viewMode as ViewMode}
	onViewModeChange={(m) => (readerState.viewMode = m as any)}
	showLayoutOptions={true}
	showSearch={true}
	onOpenSearch={() => readerState.toggleSidePanel('search')}
	showCitation={true}
	onOpenCitation={() => (readerState.showCitationModal = true)}
	showHelp={true}
	onOpenHelp={() => (readerState.showHotkeyHelp = true)}
>
	{#snippet extraDesktopControls()}
		<!-- Corpus Selector Pill -->
		<div class="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] text-xs font-semibold">
			<span class="text-[var(--color-ink-soft)] text-[10px] uppercase font-bold tracking-wider">Corpus:</span>
			<select
				value={readerState.currentCorpus}
				onchange={handleCorpusChange}
				class="bg-transparent font-bold text-blue-600 dark:text-blue-400 focus:outline-hidden cursor-pointer"
			>
				{#each corpora as c}
					<option value={c.id}>{c.label}</option>
				{/each}
			</select>
		</div>
	{/snippet}
</ReaderHeader>
