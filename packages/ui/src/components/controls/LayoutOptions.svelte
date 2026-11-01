<script lang="ts">
	export type ViewMode = 'parallel' | 'stacked' | 'greek' | 'english';

	interface Props {
		viewMode?: ViewMode;
		onchange?: (mode: ViewMode) => void;
		class?: string;
	}

	let {
		viewMode = $bindable('parallel'),
		onchange = () => {},
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);

	const options: { id: ViewMode; label: string; icon: string; shortcut: string; desc: string }[] = [
		{
			id: 'parallel',
			label: 'Parallel',
			icon: '◧',
			shortcut: 'd',
			desc: 'Side-by-side Greek & English'
		},
		{
			id: 'stacked',
			label: 'Stacked',
			icon: '⬓',
			shortcut: 'd',
			desc: 'Vertical Greek & English'
		},
		{
			id: 'greek',
			label: 'Greek Only',
			icon: 'Ω',
			shortcut: 'g',
			desc: 'Greek critical text only'
		},
		{
			id: 'english',
			label: 'English Only',
			icon: 'EN',
			shortcut: 'e',
			desc: 'English translation only'
		}
	];

	let currentOption = $derived(options.find((o) => o.id === viewMode) || options[0]);

	function selectMode(mode: ViewMode) {
		viewMode = mode;
		onchange(mode);
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isOpen && e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			isOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative inline-block text-left controls-group view-modes {className}">
	<!-- Dropdown Trigger Button -->
	<button
		type="button"
		class="layout-options-btn flex items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer transition-colors"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="true"
		aria-expanded={isOpen}
		title="Layout View Mode: {currentOption.label}"
	>
		<span class="font-mono text-sm leading-none">{currentOption.icon}</span>
		<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
	</button>

	<!-- Backdrop for closing dropdown on outside click -->
	{#if isOpen}
		<div
			class="fixed inset-0 z-40 bg-transparent"
			onclick={() => (isOpen = false)}
			role="presentation"
		></div>

		<!-- Dropdown Menu -->
		<div
			class="layout-dropdown-menu absolute right-0 mt-1.5 w-56 rounded-xl border border-[var(--color-rule)] bg-[var(--color-page)] p-1.5 shadow-xl z-50 text-[var(--color-ink)] animate-in fade-in zoom-in-95 duration-100"
			role="menu"
			aria-orientation="vertical"
			style="background-color: var(--color-page, #ffffff); color: var(--color-ink, #0f172a); border-color: var(--color-rule, #e2e8f0);"
		>
			<div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-rule)] mb-1">
				Layout Options
			</div>
			{#each options as opt (opt.id)}
				{@const isSelected = opt.id === viewMode}
				<button
					type="button"
					role="menuitem"
					class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer {isSelected ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold' : 'hover:bg-[var(--color-rule)]/60 text-[var(--color-ink)]'}"
					onclick={() => selectMode(opt.id)}
				>
					<div class="flex items-center gap-2">
						<span class="font-mono text-sm w-4 text-center">{opt.icon}</span>
						<div>
							<div>{opt.label}</div>
							<div class="text-[10px] text-[var(--color-ink-soft)] font-normal">{opt.desc}</div>
						</div>
					</div>
					<div class="flex items-center gap-1.5">
						<kbd class="text-[10px] font-mono text-[var(--color-ink-soft)] bg-[var(--color-rule)]/50 px-1 rounded">{opt.shortcut}</kbd>
						{#if isSelected}
							<span class="text-blue-600 dark:text-blue-400 font-bold">✓</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
