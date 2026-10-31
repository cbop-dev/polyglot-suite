<script lang="ts">
	import Modal2 from '../controls/Modal2.svelte';
	import Tabs2 from '../controls/Tabs2.svelte';
	import CopyText from '../controls/CopyText.svelte';

	export interface AcademicCitationStyle {
		id: string;
		name: string;
		description: string;
		citationText: string;
	}

	interface Props {
		open?: boolean;
		title?: string;
		locus: string;
		subtitle?: string;
		tabHeadings?: string[];
		activeEditionIndex?: number;
		citations: AcademicCitationStyle[];
		onClose: () => void;
	}

	let {
		open = $bindable(true),
		title = 'Academic Citation',
		locus,
		subtitle = '',
		tabHeadings = [],
		activeEditionIndex = $bindable(0),
		citations = [],
		onClose
	}: Props = $props();
</script>

<Modal2 bind:showModal={open} onclose={onClose} showFooter={false} showMaximize={false} maxWidth="max-w-xl">
	<!-- Header -->
	<div class="border-b border-rule/50 p-4 pr-12">
		<h2 class="text-lg font-bold text-ink flex items-center gap-2 flex-wrap">
			<span>{title}</span>
			{#if locus}
				<span class="rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs font-semibold">
					{locus}
				</span>
			{/if}
		</h2>
		{#if subtitle}
			<p class="text-xs text-ink-soft mt-0.5">
				{subtitle}
			</p>
		{/if}
	</div>

	<!-- Edition Selector Tabs -->
	{#if tabHeadings && tabHeadings.length > 0}
		<div class="border-b border-rule/50 px-4 py-2 bg-rule/10">
			<Tabs2
				headings={tabHeadings}
				bind:selectedTabIndex={activeEditionIndex}
			/>
		</div>
	{/if}

	<!-- List of Citations -->
	<div class="flex-1 overflow-y-auto p-4 space-y-3">
		{#each citations as style (style.id)}
			<div class="rounded-xl border border-rule/50 p-3 bg-page hover:border-rule transition-colors">
				<div class="flex items-center justify-between mb-1.5">
					<div>
						<span class="text-xs font-bold text-ink">{style.name}</span>
						<p class="text-[11px] text-ink-soft">{style.description}</p>
					</div>
					<CopyText
						copyText={style.citationText}
						linkText="Copy"
						btnSizeCssClass="px-2.5 py-1 text-xs font-semibold"
						copiedCssClass="bg-emerald-600 text-white"
					/>
				</div>

				{#if style.id.startsWith('bibtex')}
					<pre class="mt-2 rounded-lg bg-slate-900 text-slate-100 p-2.5 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto selection:bg-blue-600 selection:text-white">{style.citationText}</pre>
				{:else}
					<div class="mt-1 text-xs font-serif text-ink bg-page p-2 rounded-lg border border-rule/50 select-all">
						{style.citationText}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</Modal2>
