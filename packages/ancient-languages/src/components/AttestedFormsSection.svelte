<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		type AttestedForm,
		type AttestedFormSort,
		type InflectionFilterCriteria,
		extractAvailableInflections,
		filterAttestedForms,
		sortAttestedForms,
		isCriteriaActive
	} from '../morphology.js';
	import InflectionFilterBar from './InflectionFilterBar.svelte';

	let {
		attestedForms = [],
		selectedFormFilter = null,
		lemmaDisplay = '',
		corpusTitle = '',
		loading = false,
		isOpen = $bindable(false),
		error = null,
		lang = 'greek',
		fontClass = '',
		onToggleFilter = () => {},
		onResetFilter = () => {},
		onToggleOpen = () => {},
		onRetry = () => {},
		showHighlightAction = false,
		isFormHighlighted = () => false,
		onToggleFormHighlight = () => {},
		enableInflectionFilter = false,
		totalCount = 0,
		inflectionCriteria = $bindable({} as InflectionFilterCriteria),
		isInflectionFilterOpen = $bindable(false),
		onInflectionChange = () => {},
		sortMode = $bindable<'count' | 'alpha'>('count'),
		filterBar,
		class: className = ''
	}: {
		attestedForms?: AttestedForm[];
		selectedFormFilter?: string | null;
		lemmaDisplay?: string;
		corpusTitle?: string;
		loading?: boolean;
		isOpen?: boolean;
		error?: string | null;
		lang?: string;
		fontClass?: string;
		onToggleFilter?: (form: string) => void;
		onResetFilter?: () => void;
		onToggleOpen?: (open: boolean) => void;
		onRetry?: () => void;
		showHighlightAction?: boolean;
		isFormHighlighted?: (form: string) => boolean;
		onToggleFormHighlight?: (form: string) => void;
		enableInflectionFilter?: boolean;
		totalCount?: number;
		inflectionCriteria?: InflectionFilterCriteria;
		isInflectionFilterOpen?: boolean;
		onInflectionChange?: (criteria: InflectionFilterCriteria, matchingForms: string[]) => void;
		sortMode?: AttestedFormSort;
		filterBar?: Snippet;
		class?: string;
	} = $props();

	let availableInflections = $derived(extractAvailableInflections(attestedForms));
	let isInflectionActive = $derived(isCriteriaActive(inflectionCriteria));
	let hasInflectionOptions = $derived(
		availableInflections.moods.length > 0 ||
		availableInflections.tenses.length > 0 ||
		availableInflections.voices.length > 0 ||
		availableInflections.cases.length > 0 ||
		availableInflections.genders.length > 0 ||
		availableInflections.degrees.length > 0
	);
	let filteredForms = $derived(
		enableInflectionFilter && isInflectionActive
			? filterAttestedForms(attestedForms, inflectionCriteria)
			: attestedForms
	);

	let collationLocale = $derived.by(() => {
		switch (lang?.toLowerCase()) {
			case 'greek':
			case 'grc':
			case 'el':
				return 'el';
			case 'hebrew':
			case 'hbo':
			case 'he':
				return 'he';
			case 'syriac':
			case 'syr':
				return 'syr';
			case 'latin':
			case 'lat':
			case 'la':
				return 'la';
			default:
				return undefined;
		}
	});

	let sortedForms = $derived(sortAttestedForms(filteredForms, sortMode, collationLocale));

	let justLoaded = $state(false);
	let prevLoading = false;

	$effect(() => {
		const cur = loading;
		if (prevLoading && !cur && attestedForms.length > 0) {
			justLoaded = true;
			const t = setTimeout(() => {
				justLoaded = false;
			}, 1200);
			prevLoading = cur;
			return () => clearTimeout(t);
		}
		prevLoading = cur;
	});

	function handleBadgeClick(e: MouseEvent, fWord: string) {
		e.stopPropagation();
		onToggleFormHighlight(fWord);
	}

	function getFormTitle(f: AttestedForm): string {
		const parts: string[] = [`Form: "${f.form}" (${f.count} ${f.count === 1 ? 'occurrence' : 'occurrences'})`];
		if (f.analyses && f.analyses.length > 0) {
			const summaries = f.analyses
				.map((a) => a.summary)
				.filter(Boolean)
				.slice(0, 3);
			if (summaries.length > 0) {
				parts.push(summaries.join(' | '));
			}
		}
		parts.push('Click to filter passages');
		return parts.join('\n');
	}
</script>

<details
	bind:open={isOpen}
	ontoggle={(e) => onToggleOpen((e.currentTarget as HTMLDetailsElement).open)}
	class="attested-forms-section {className}"
>
	<summary class="attested-summary">
		<div class="summary-left">
			<span class="summary-title">
				Attested Forms
				{#if lemmaDisplay}
					of <span class="lemma-quote {lang}">{lemmaDisplay}</span>
				{/if}
				{#if corpusTitle}
					<span class="corpus-tag">in {corpusTitle}</span>
				{/if}
			</span>
			{#if loading}
				<span class="inline-spinner" title="Loading attested forms..."></span>
			{/if}
			{#if !loading && (attestedForms.length > 0 || totalCount > 0)}
				<span class="count-badge" class:ready-glow={justLoaded}>
					{#if totalCount > 0 && totalCount !== attestedForms.length}
						{attestedForms.length} / {totalCount}
					{:else if enableInflectionFilter && isInflectionActive}
						{filteredForms.length} / {attestedForms.length}
					{:else}
						{attestedForms.length}
					{/if}
				</span>
			{/if}
		</div>

		<div class="summary-right">
			{#if selectedFormFilter}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					class="filter-reset-btn"
					onclick={(e) => {
						e.stopPropagation();
						onResetFilter();
					}}
					title="Clear active form filter"
					role="button"
					tabindex="0"
				>
					Reset filter
				</span>
			{/if}
			<svg class="chevron-icon" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</summary>

	<div class="attested-body">
		<!-- Sibling slot for inflection filters (Goal 2) -->
		{#if filterBar}
			{@render filterBar()}
		{:else if enableInflectionFilter && attestedForms.length > 0 && hasInflectionOptions}
			<InflectionFilterBar
				available={availableInflections}
				bind:criteria={inflectionCriteria}
				bind:isOpen={isInflectionFilterOpen}
				totalFormsCount={attestedForms.length}
				filteredFormsCount={filteredForms.length}
				onCriteriaChange={(crit) => {
					const matching = filterAttestedForms(attestedForms, crit).map((f) => f.form);
					onInflectionChange(crit, matching);
				}}
			/>
		{/if}

		{#if loading}
			<div class="state-msg loading-msg">
				<span class="inline-spinner"></span>
				<span>Loading attested forms...</span>
			</div>
		{:else if error}
			<div class="state-msg error-msg">
				<span>{error}</span>
				<button type="button" class="retry-btn" onclick={onRetry}>Retry</button>
			</div>
		{:else if attestedForms.length === 0}
			<div class="state-msg empty-msg">No attested forms recorded.</div>
		{:else if filteredForms.length === 0}
			<div class="state-msg empty-msg">No forms match the active inflection filter.</div>
		{:else}
			{#if filteredForms.length > 1}
				<div class="attested-toolbar">
					<span class="toolbar-count">
						{filteredForms.length} {filteredForms.length === 1 ? 'form' : 'forms'}
					</span>
					<div class="sort-toggle-group" role="group" aria-label="Sort forms">
						<button
							type="button"
							class="sort-btn"
							class:active={sortMode === 'count'}
							onclick={() => (sortMode = 'count')}
							title="Sort by number of occurrences (highest first)"
						>
							Count
						</button>
						<button
							type="button"
							class="sort-btn"
							class:active={sortMode === 'alpha'}
							onclick={() => (sortMode = 'alpha')}
							title="Sort alphabetically"
						>
							A–Z
						</button>
					</div>
				</div>
			{/if}

			<div class="chips-grid">
				{#each sortedForms as f (f.form)}
					{@const isFActive = showHighlightAction && isFormHighlighted(f.form)}
					{@const isFiltered = selectedFormFilter === f.form}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="chip-pill"
						class:filter-active={isFiltered}
						class:hl-active={isFActive}
						onclick={() => onToggleFilter(f.form)}
						title={getFormTitle(f)}
						role="button"
						tabindex="0"
					>
						<span class="chip-text {fontClass} {lang}">{f.form}</span>
						<span class="chip-count">({f.count})</span>

						{#if showHighlightAction}
							<button
								type="button"
								class="chip-hl-badge"
								class:active={isFActive}
								onclick={(e) => handleBadgeClick(e, f.form)}
								title={`Toggle highlight for form "${f.form}"`}
								aria-label={`Highlight form ${f.form}`}
							>
								{isFActive ? '✓' : '+'}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</details>

<style>
	.attested-forms-section {
		border: 1px solid var(--color-rule, var(--border, #d4d8d3));
		border-radius: 1rem;
		background: var(--color-card-bg, var(--popup-bg, #ffffff));
		margin-bottom: 0;
		overflow: hidden;
		flex-shrink: 0;
		transition: border-color 0.15s ease;
	}

	.attested-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		min-height: 44px;
		box-sizing: border-box;
		font-size: 0.875rem;
		line-height: 1.4;
		color: var(--color-ink, var(--text, #171a1c));
		background: var(--color-page-soft, var(--col-bg, #f5f6f2));
		cursor: pointer;
		user-select: none;
		list-style: none;
		flex-shrink: 0;
	}

	.attested-summary::-webkit-details-marker {
		display: none;
	}

	.attested-summary:hover {
		background: var(--color-rule, var(--page-bg, #eceee7));
	}

	.summary-left {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
		min-width: 0;
		line-height: 1.35;
	}

	.summary-title {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		line-height: 1.35;
	}

	.lemma-quote {
		font-weight: 600;
		font-style: italic;
		opacity: 0.9;
	}

	.corpus-tag {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.75;
	}

	.summary-right {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-reset-btn {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-link, var(--accent, #1f4d8a));
		cursor: pointer;
		text-decoration: underline;
		padding: 0.1rem 0.25rem;
	}

	.filter-reset-btn:hover {
		opacity: 0.8;
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0.6;
		color: var(--color-ink-soft, #64748b);
		transition: transform 0.2s ease;
	}

	.chevron-icon.open {
		transform: rotate(180deg);
	}

	.count-badge {
		background: var(--color-link, var(--accent, #1f4d8a));
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.1rem 0.45rem;
		border-radius: 12px;
		line-height: 1.2;
		transition: all 0.2s ease;
	}

	.count-badge.ready-glow {
		animation: badge-glow 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes badge-glow {
		0% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(31, 111, 122, 0);
		}
		30% {
			transform: scale(1.25);
			background-color: #10b981;
			box-shadow: 0 0 10px 3px rgba(16, 185, 129, 0.65);
		}
		100% {
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(31, 111, 122, 0);
		}
	}

	.inline-spinner {
		display: inline-block;
		width: 13px;
		height: 13px;
		border: 2px solid rgba(31, 77, 138, 0.25);
		border-top-color: var(--color-link, var(--accent, #1f4d8a));
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
		vertical-align: middle;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.attested-body {
		padding: 0.75rem;
		background: var(--color-card-bg, var(--popup-bg, #ffffff));
	}

	.attested-body > :global(.inflection-filter-section) {
		margin-bottom: 0.65rem;
	}

	.attested-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		padding: 0 0.15rem;
	}

	.toolbar-count {
		font-size: 0.72rem;
		color: var(--color-ink-soft, var(--text-mid, #545b5c));
		font-weight: 500;
	}

	.sort-toggle-group {
		display: inline-flex;
		background: var(--color-page-soft, var(--page-bg, #eceee7));
		border: 1px solid var(--color-rule, var(--border, #d4d8d3));
		border-radius: 6px;
		padding: 1px;
		gap: 1px;
	}

	.sort-btn {
		appearance: none;
		border: none;
		background: transparent;
		padding: 0.15rem 0.45rem;
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--color-ink-soft, var(--text-mid, #545b5c));
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.12s ease;
		line-height: 1.3;
	}

	.sort-btn:hover {
		color: var(--color-ink, var(--text, #171a1c));
	}

	.sort-btn.active {
		background: var(--color-link, var(--accent, #1f4d8a));
		color: #ffffff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.state-msg {
		font-size: 0.85rem;
		color: var(--color-ink-soft, var(--text-mid, #545b5c));
		padding: 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.retry-btn {
		appearance: none;
		background: var(--color-page-soft, var(--page-bg, #eceee7));
		border: 1px solid var(--color-rule, var(--border, #d4d8d3));
		border-radius: 4px;
		padding: 0.15rem 0.45rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-link, var(--accent, #1f4d8a));
		cursor: pointer;
	}

	.retry-btn:hover {
		background: var(--color-card-bg, var(--col-bg, #ffffff));
	}

	.chips-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		max-height: 200px;
		overflow-y: auto;
		padding: 0.1rem;
	}

	.chip-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--color-page-soft, var(--page-bg, #eceee7));
		border: 1px solid var(--color-rule, var(--border, #d4d8d3));
		border-radius: 16px;
		padding: 0.15rem 0.5rem 0.15rem 0.65rem;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.chip-pill:hover {
		border-color: var(--color-link, var(--accent, #1f4d8a));
		background: var(--color-card-bg, var(--col-bg, #ffffff));
	}

	.chip-pill.filter-active {
		background-color: var(--color-link, var(--accent, #1f4d8a)) !important;
		border-color: var(--color-link, var(--accent, #1f4d8a)) !important;
	}

	.chip-pill.filter-active .chip-text,
	.chip-pill.filter-active .chip-count {
		color: #ffffff !important;
		font-weight: 700;
	}

	.chip-text {
		font-size: 0.95rem;
		color: var(--color-ink, var(--text, #171a1c));
	}

	.chip-count {
		font-size: 0.72rem;
		font-family: monospace;
		opacity: 0.75;
		color: var(--color-ink-soft, var(--text-mid, #545b5c));
	}

	.chip-hl-badge {
		appearance: none;
		background: rgba(0, 0, 0, 0.08);
		border: none;
		border-radius: 50%;
		width: 17px;
		height: 17px;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-ink-soft, var(--text-mid, #545b5c));
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		margin-left: 0.1rem;
		transition: all 0.15s ease;
	}

	.chip-hl-badge:hover {
		background: var(--color-link, var(--accent, #1f4d8a));
		color: #ffffff;
	}

	.chip-hl-badge.active {
		background: #10b981 !important;
		color: #ffffff !important;
	}

	:global(.dark) .attested-forms-section,
	:global([data-theme="dark"]) .attested-forms-section {
		border-color: var(--color-rule, #334155);
		background: var(--color-card-bg, #1e293b);
	}

	:global(.dark) .attested-summary,
	:global([data-theme="dark"]) .attested-summary {
		background: var(--color-page-soft, #1e293b);
		color: var(--color-ink, #f8fafc);
	}

	:global(.dark) .attested-summary:hover,
	:global([data-theme="dark"]) .attested-summary:hover {
		background: var(--color-rule, #334155);
	}

	:global(.dark) .attested-body,
	:global([data-theme="dark"]) .attested-body {
		background: var(--color-card-bg, #1e293b);
	}

	:global(.dark) .chip-pill,
	:global([data-theme="dark"]) .chip-pill {
		background: var(--color-page-soft, #1e293b);
		border-color: var(--color-rule, #334155);
	}

	:global(.dark) .chip-pill:hover,
	:global([data-theme="dark"]) .chip-pill:hover {
		background: var(--color-rule, #334155);
		border-color: var(--color-link, #7ab0e8);
	}

	:global(.dark) .chip-text,
	:global([data-theme="dark"]) .chip-text {
		color: var(--color-ink, #f8fafc);
	}

	:global(.dark) .chip-count,
	:global([data-theme="dark"]) .chip-count {
		color: var(--color-ink-soft, #94a3b8);
	}

	:global(.dark) .toolbar-count,
	:global([data-theme="dark"]) .toolbar-count {
		color: var(--color-ink-soft, #94a3b8);
	}

	:global(.dark) .sort-toggle-group,
	:global([data-theme="dark"]) .sort-toggle-group {
		background: var(--color-page-soft, #1e293b);
		border-color: var(--color-rule, #334155);
	}

	:global(.dark) .sort-btn,
	:global([data-theme="dark"]) .sort-btn {
		color: var(--color-ink-soft, #94a3b8);
	}

	:global(.dark) .sort-btn:hover,
	:global([data-theme="dark"]) .sort-btn:hover {
		color: var(--color-ink, #f8fafc);
	}

	:global(.dark) .sort-btn.active,
	:global([data-theme="dark"]) .sort-btn.active {
		background: var(--color-link, #7ab0e8);
		color: #ffffff;
	}

	:global(.dark) .chip-hl-badge,
	:global([data-theme="dark"]) .chip-hl-badge {
		background: rgba(255, 255, 255, 0.12);
		color: var(--color-ink-soft, #94a3b8);
	}
</style>
