<script lang="ts">
	import { base } from '$app/paths';
	import { ReaderHeader, type ViewMode } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';
	import { CORPUS_TITLES } from '../config/corpora.js';
	let {
		test='',
		suiteHref="/"
	} = $props();
</script>

<ReaderHeader
	title="Ancient Corpora"
	titleShort="Corpora"
	homeHref="{base}/"
	suiteHref={suiteHref}
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
	{#snippet afterTitle()}
		<!-- Corpus Selector Trigger -->
		<button
			type="button"
			onclick={() => (readerState.isCorpusModalOpen = true)}
			class="corpus-picker-trigger max-w-[120px] sm:max-w-[180px] md:max-w-[220px] truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink-0"
			title="Choose corpus (Hot key: 'g')"
		>
			<!--<span class="text-[var(--color-ink-soft)] text-[10px] uppercase font-bold tracking-wider hidden lg:inline">Corpus:</span>-->
			<span class="text-blue-600 dark:text-blue-400 font-bold truncate">
				{CORPUS_TITLES[readerState.currentCorpus]?.name || readerState.currentCorpus}
			</span>
			<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
		</button>
	{/snippet}
</ReaderHeader>
