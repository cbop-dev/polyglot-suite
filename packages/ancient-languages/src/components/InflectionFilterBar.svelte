<script lang="ts">
	import {
		type InflectionFilterCriteria,
		type AvailableInflections,
		isCriteriaActive,
		countActiveFilters
	} from '../morphology.js';

	let {
		available = {
			isVerb: false,
			hasParticiple: false,
			moods: [],
			tenses: [],
			voices: [],
			persons: [],
			numbers: [],
			cases: [],
			genders: [],
			degrees: []
		},
		criteria = $bindable({}),
		totalFormsCount = 0,
		filteredFormsCount = 0,
		isOpen = $bindable(false),
		loading = false,
		error = null,
		onCriteriaChange = () => {},
		onToggleOpen = () => {},
		onRetry = () => {},
		class: className = ''
	}: {
		available?: AvailableInflections;
		criteria?: InflectionFilterCriteria;
		totalFormsCount?: number;
		filteredFormsCount?: number;
		isOpen?: boolean;
		loading?: boolean;
		error?: string | null;
		onCriteriaChange?: (criteria: InflectionFilterCriteria) => void;
		onToggleOpen?: (open: boolean) => void;
		onRetry?: () => void;
		class?: string;
	} = $props();

	let activeCount = $derived(countActiveFilters(criteria));
	let hasActive = $derived(isCriteriaActive(criteria));

	let hasAnyOptions = $derived(
		(available.isVerb && (available.moods.length > 0 || available.tenses.length > 0 || available.voices.length > 0)) ||
			showPerson ||
			available.numbers.length > 0 ||
			(showCaseAndGender && (available.cases.length > 0 || available.genders.length > 0)) ||
			available.degrees.length > 0
	);

	// Show Case and Gender if non-verb OR if Participle is currently selected in mood
	let showCaseAndGender = $derived.by(() => {
		if (!available.isVerb) return true;
		return criteria.mood?.includes('Participle') ?? false;
	});

	// For verbs, person is only applicable to finite verbs (not pure participles/infinitives)
	let showPerson = $derived.by(() => {
		if (!available.isVerb) return available.persons.length > 0;
		if (criteria.mood?.length === 1 && (criteria.mood.includes('Participle') || criteria.mood.includes('Infinitive'))) {
			return false;
		}
		return available.persons.length > 0;
	});

	function toggleOption(dim: keyof InflectionFilterCriteria, val: string) {
		const cur = criteria[dim] ? [...criteria[dim]!] : [];
		const idx = cur.indexOf(val);
		if (idx >= 0) {
			cur.splice(idx, 1);
		} else {
			cur.push(val);
		}
		criteria = { ...criteria, [dim]: cur };
		onCriteriaChange(criteria);
	}

	function clearAll(e?: MouseEvent) {
		if (e) e.stopPropagation();
		criteria = {};
		onCriteriaChange(criteria);
	}

	function isSelected(dim: keyof InflectionFilterCriteria, val: string): boolean {
		return criteria[dim]?.includes(val) ?? false;
	}
</script>

<details
	bind:open={isOpen}
	ontoggle={(e) => onToggleOpen((e.currentTarget as HTMLDetailsElement).open)}
	class="inflection-filter-section {className}"
>
	<summary class="filter-summary">
		<div class="summary-left">
			<svg class="filter-icon" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.972.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="summary-title">Inflection Filter</span>

			{#if loading}
				<span class="inline-spinner" title="Loading inflection options..."></span>
			{/if}

			{#if hasActive}
				<span class="active-badge">{activeCount} active</span>
				{#if totalFormsCount > 0}
					<span class="filtered-ratio">({filteredFormsCount} of {totalFormsCount} forms)</span>
				{/if}
			{/if}
		</div>

		<div class="summary-right">
			{#if hasActive}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					class="clear-all-btn"
					onclick={clearAll}
					title="Clear active inflection filters"
					role="button"
					tabindex="0"
				>
					Clear filters
				</span>
			{/if}
			<svg class="chevron-icon" class:open={isOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</summary>

	<div class="filter-panel-body">
		{#if loading}
			<div class="state-msg loading-msg">
				<span class="inline-spinner"></span>
				<span>Loading inflection options...</span>
			</div>
		{:else if error}
			<div class="state-msg error-msg">
				<span>{error}</span>
				<button type="button" class="retry-btn" onclick={onRetry}>Retry</button>
			</div>
		{:else if !hasAnyOptions}
			<div class="state-msg empty-msg">No inflection options recorded for this lemma.</div>
		{:else}
			<!-- Mood (Verbs) -->
			{#if available.isVerb && available.moods.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Mood:</span>
					<div class="pills-group">
						{#each available.moods as val}
							{@const active = isSelected('mood', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('mood', val)}
								title={`Toggle ${val} mood`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Tense (Verbs) -->
			{#if available.isVerb && available.tenses.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Tense:</span>
					<div class="pills-group">
						{#each available.tenses as val}
							{@const active = isSelected('tense', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('tense', val)}
								title={`Toggle ${val} tense`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Voice (Verbs) -->
			{#if available.isVerb && available.voices.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Voice:</span>
					<div class="pills-group">
						{#each available.voices as val}
							{@const active = isSelected('voice', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('voice', val)}
								title={`Toggle ${val} voice`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Person (Finite Verbs) -->
			{#if showPerson}
				<div class="dimension-row">
					<span class="dimension-label">Person:</span>
					<div class="pills-group">
						{#each available.persons as val}
							{@const active = isSelected('person', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('person', val)}
								title={`Toggle ${val} person`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Number -->
			{#if available.numbers.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Number:</span>
					<div class="pills-group">
						{#each available.numbers as val}
							{@const active = isSelected('number', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('number', val)}
								title={`Toggle ${val} number`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Case (Nouns/Adjectives or Participles) -->
			{#if showCaseAndGender && available.cases.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Case:</span>
					<div class="pills-group">
						{#each available.cases as val}
							{@const active = isSelected('case', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('case', val)}
								title={`Toggle ${val} case`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Gender (Nouns/Adjectives or Participles) -->
			{#if showCaseAndGender && available.genders.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Gender:</span>
					<div class="pills-group">
						{#each available.genders as val}
							{@const active = isSelected('gender', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('gender', val)}
								title={`Toggle ${val} gender`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Degree (Adjectives) -->
			{#if available.degrees.length > 0}
				<div class="dimension-row">
					<span class="dimension-label">Degree:</span>
					<div class="pills-group">
						{#each available.degrees as val}
							{@const active = isSelected('degree', val)}
							<button
								type="button"
								class="filter-pill"
								class:active
								onclick={() => toggleOption('degree', val)}
								title={`Toggle ${val} degree`}
							>
								{val}
								{#if active}<span class="check-mark">✓</span>{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Tip if verbs and participle not selected -->
			{#if available.isVerb && available.hasParticiple && !criteria.mood?.includes('Participle')}
				<div class="participle-hint">
					<span>Tip: Select <strong>Participle</strong> in Mood to filter by Case and Gender.</span>
				</div>
			{/if}
		{/if}
	</div>
</details>

<style>
	.inflection-filter-section {
		border: 1px solid var(--border, var(--color-rule, #d4d8d3));
		border-radius: 8px;
		background: var(--popup-bg, var(--color-page, #ffffff));
		margin-bottom: 0.75rem;
		overflow: hidden;
		transition: border-color 0.15s ease;
	}

	.filter-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.85rem;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--accent, var(--color-ink, #1f6f7a));
		background: var(--col-bg, var(--color-page-soft, #f5f6f2));
		cursor: pointer;
		user-select: none;
		list-style: none;
	}

	.filter-summary::-webkit-details-marker {
		display: none;
	}

	.filter-summary:hover {
		background: var(--page-bg, var(--color-rule, #eceee7));
	}

	.summary-left {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.filter-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0.8;
	}

	.summary-title {
		letter-spacing: 0.02em;
	}

	.summary-right {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.active-badge {
		background: var(--accent, #1f6f7a);
		color: #ffffff;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.08rem 0.4rem;
		border-radius: 10px;
		line-height: 1.2;
	}

	.filtered-ratio {
		font-size: 0.72rem;
		color: var(--text-mid, var(--color-ink-soft, #64748b));
		font-weight: 500;
	}

	.clear-all-btn {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent, #2563eb);
		cursor: pointer;
		text-decoration: underline;
		padding: 0.1rem 0.25rem;
	}

	.clear-all-btn:hover {
		opacity: 0.8;
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0.6;
		transition: transform 0.2s ease;
	}

	.chevron-icon.open {
		transform: rotate(180deg);
	}

	.inline-spinner {
		display: inline-block;
		width: 13px;
		height: 13px;
		border: 2px solid rgba(31, 111, 122, 0.25);
		border-top-color: var(--accent, #1f6f7a);
		border-radius: 50%;
		animation: spin 0.75s linear infinite;
		vertical-align: middle;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.filter-panel-body {
		padding: 0.75rem 0.85rem;
		background: var(--popup-bg, var(--color-page, #ffffff));
		border-top: 1px solid var(--border, var(--color-rule, #d4d8d3));
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.state-msg {
		font-size: 0.85rem;
		color: var(--text-mid, var(--color-ink-soft, #545b5c));
		padding: 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.retry-btn {
		appearance: none;
		background: var(--page-bg, #eceee7);
		border: 1px solid var(--border, #d4d8d3);
		border-radius: 4px;
		padding: 0.15rem 0.45rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent, #1f6f7a);
		cursor: pointer;
	}

	.retry-btn:hover {
		background: var(--col-bg, #ffffff);
	}

	.dimension-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.dimension-label {
		font-weight: 700;
		color: var(--text-mid, var(--color-ink-soft, #64748b));
		min-width: 58px;
		padding-top: 0.2rem;
		text-transform: uppercase;
		font-size: 0.65rem;
		letter-spacing: 0.03em;
	}

	.pills-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		flex: 1;
	}

	.filter-pill {
		appearance: none;
		background: var(--page-bg, var(--color-page-soft, #eceee7));
		border: 1px solid var(--border, var(--color-rule, #cbd5e1));
		border-radius: 14px;
		padding: 0.12rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text, var(--color-ink, #334155));
		cursor: pointer;
		transition: all 0.15s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		user-select: none;
	}

	.filter-pill:hover {
		border-color: var(--accent, #1f6f7a);
		background: var(--col-bg, #ffffff);
	}

	.filter-pill.active {
		background: var(--accent, #1f6f7a) !important;
		border-color: var(--accent, #1f6f7a) !important;
		color: #ffffff !important;
		font-weight: 700;
	}

	.check-mark {
		font-size: 0.68rem;
	}

	.participle-hint {
		font-size: 0.72rem;
		color: var(--text-mid, var(--color-ink-soft, #64748b));
		font-style: italic;
		padding-top: 0.3rem;
		border-top: 1px dotted var(--border, #e2e8f0);
	}

	:global(.dark) .inflection-filter-section,
	:global([data-theme="dark"]) .inflection-filter-section {
		border-color: var(--border, var(--color-rule, #334155));
		background: var(--popup-bg, var(--color-page, #0f172a));
	}

	:global(.dark) .filter-summary,
	:global([data-theme="dark"]) .filter-summary {
		background: var(--col-bg, var(--color-page-soft, #1e293b));
		color: var(--accent, var(--color-ink, #38bdf8));
	}

	:global(.dark) .filter-panel-body,
	:global([data-theme="dark"]) .filter-panel-body {
		background: var(--popup-bg, var(--color-page, #0f172a));
		border-top-color: var(--border, var(--color-rule, #334155));
	}

	:global(.dark) .filter-pill,
	:global([data-theme="dark"]) .filter-pill {
		background: var(--page-bg, #1e293b);
		border-color: var(--border, #334155);
		color: var(--text, #f1f5f9);
	}

	:global(.dark) .filter-pill:hover,
	:global([data-theme="dark"]) .filter-pill:hover {
		background: #334155;
		border-color: var(--accent, #38bdf8);
	}
</style>
