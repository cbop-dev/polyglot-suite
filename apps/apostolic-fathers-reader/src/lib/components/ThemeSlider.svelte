<script lang="ts">
	import { onMount } from 'svelte';
	import {
		applyReadingTheme,
		initReadingTheme,
		initReadingWarmth,
		saveReadingTheme,
		saveReadingWarmth,
		getThemeLabel
	} from '$lib/theme/readingTheme';

	let isOpen = $state<boolean>(false);
	let sliderValue = $state<number>(25);
	let warmthValue = $state<number>(50);
	let rafPending = false;

	onMount(() => {
		sliderValue = initReadingTheme();
		warmthValue = initReadingWarmth();
	});

	function handleInput(e: Event) {
		sliderValue = parseInt((e.target as HTMLInputElement).value, 10);
		scheduleCommit();
	}

	function handleWarmthInput(e: Event) {
		warmthValue = parseInt((e.target as HTMLInputElement).value, 10);
		scheduleCommit();
	}

	function scheduleCommit() {
		if (rafPending) return;
		rafPending = true;
		requestAnimationFrame(() => {
			rafPending = false;
			applyReadingTheme(sliderValue, warmthValue);
			saveReadingTheme(sliderValue);
			saveReadingWarmth(warmthValue);
		});
	}

	function setPreset(theme: number, warmth: number) {
		sliderValue = theme;
		warmthValue = warmth;
		scheduleCommit();
	}

	let isDark = $derived(sliderValue >= 50);
</script>

<div class="relative">
	<!-- Trigger button -->
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="inline-flex items-center justify-center rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] p-1.5 text-xs font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
		title="Adjust reading theme and warmth ({getThemeLabel(sliderValue)})"
		aria-label="Adjust reading theme and warmth"
		aria-expanded={isOpen}
	>
		{#if isDark}
			<!-- Moon / Night icon -->
			<svg class="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{:else}
			<!-- Sun / Day icon -->
			<svg class="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
			</svg>
		{/if}
	</button>

	{#if isOpen}
		<!-- Backdrop for closing -->
		<button
			type="button"
			class="fixed inset-0 z-30 cursor-default"
			onclick={() => (isOpen = false)}
			aria-label="Close theme slider popover"
		></button>

		<!-- Popover Panel -->
		<div class="absolute right-0 mt-2 z-40 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
			<div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
				<span class="text-xs font-bold text-slate-800 dark:text-slate-200">Reading Comfort</span>
				<span class="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{getThemeLabel(sliderValue)}</span>
			</div>

			<!-- Brightness / Contrast Slider -->
			<div class="mt-3 space-y-1.5">
				<div class="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
					<span>Light</span>
					<span>Dark</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={sliderValue}
					oninput={handleInput}
					class="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
				/>
			</div>

			<!-- Warmth / Temperature Slider -->
			<div class="mt-3 space-y-1.5">
				<div class="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
					<span>Cool Slate</span>
					<span>Warm Sepia</span>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={warmthValue}
					oninput={handleWarmthInput}
					class="w-full accent-amber-500 cursor-pointer h-1.5 bg-gradient-to-r from-blue-200 via-slate-200 to-amber-200 rounded-lg appearance-none"
				/>
			</div>

			<!-- Quick Presets -->
			<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-1">
				<button
					type="button"
					onclick={() => setPreset(20, 100)}
					class="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer"
				>
					Parchment
				</button>
				<button
					type="button"
					onclick={() => setPreset(0, 0)}
					class="px-2 py-1 text-[11px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
				>
					Pure Light
				</button>
				<button
					type="button"
					onclick={() => setPreset(75, 50)}
					class="px-2 py-1 text-[11px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 cursor-pointer"
				>
					Midnight
				</button>
			</div>
		</div>
	{/if}
</div>
