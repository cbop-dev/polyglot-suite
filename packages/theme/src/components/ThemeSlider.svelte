<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getThemeLabel,
		getNextPreset,
		THEME_PRESETS
	} from '../core.ts';
	import {
		applyReadingTheme,
		initReadingTheme,
		initReadingWarmth,
		saveReadingTheme,
		saveReadingWarmth,
		type ThemeDomOptions
	} from '../dom.ts';

	interface Props {
		storageKey?: string;
		warmthStorageKey?: string;
		legacyKey?: string;
		profile?: 'standard' | 'josephus' | 'all';
		align?: 'left' | 'right';
	}

	const {
		storageKey = 'ne-reading-theme',
		warmthStorageKey = 'ne-reading-warmth',
		legacyKey = 'ne-theme',
		profile = 'all',
		align = 'right'
	}: Props = $props();

	let isOpen = $state<boolean>(false);
	let sliderValue = $state<number>(25);
	let warmthValue = $state<number>(50);
	let rafPending = false;

	const options: ThemeDomOptions = {
		storageKey,
		warmthStorageKey,
		legacyKey,
		profile
	};

	onMount(() => {
		sliderValue = initReadingTheme(options);
		warmthValue = initReadingWarmth(options);

		function handleCycleTheme() {
			const next = getNextPreset(sliderValue, warmthValue);
			setPreset(next.theme, next.warmth);
		}

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && isOpen) {
				isOpen = false;
			}
		}

		window.addEventListener('cycle-theme', handleCycleTheme);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('cycle-theme', handleCycleTheme);
			window.removeEventListener('keydown', handleKeyDown);
		};
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
			applyReadingTheme(sliderValue, warmthValue, options);
			saveReadingTheme(sliderValue, storageKey);
			saveReadingWarmth(warmthValue, warmthStorageKey);
		});
	}

	function setPreset(theme: number, warmth: number) {
		sliderValue = theme;
		warmthValue = warmth;
		scheduleCommit();
	}

	function setExtreme(val: number) {
		sliderValue = val;
		scheduleCommit();
	}

	function setWarmthExtreme(val: number) {
		warmthValue = val;
		scheduleCommit();
	}

	let isDark = $derived(sliderValue >= 50);
</script>

<div class="theme-slider-container">
	<!-- Trigger Button -->
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="theme-slider-btn"
		title="Adjust reading theme and warmth ({getThemeLabel(sliderValue)})"
		aria-label="Adjust reading theme and warmth"
		aria-expanded={isOpen}
	>
		{#if isDark}
			<!-- Moon / Night icon -->
			<svg class="theme-icon moon-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{:else}
			<!-- Sun / Day icon -->
			<svg class="theme-icon sun-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
				<path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
			</svg>
		{/if}
	</button>

	{#if isOpen}
		<!-- Backdrop to close on click outside -->
		<button
			type="button"
			class="theme-slider-backdrop"
			onclick={() => (isOpen = false)}
			aria-label="Close theme slider popover"
		></button>

		<!-- Popover Panel -->
		<div class="theme-slider-panel {align === 'left' ? 'align-left' : 'align-right'}">
			<div class="panel-header">
				<span class="panel-title">Reading Comfort</span>
				<span class="panel-label">{getThemeLabel(sliderValue)}</span>
			</div>

			<!-- Brightness / Contrast Slider -->
			<div class="slider-group">
				<div class="slider-labels">
					<button
						type="button"
						class="slider-label-btn"
						onclick={() => setExtreme(0)}
						title="Set to minimum darkness (Light)"
					>
						Light
					</button>
					<button
						type="button"
						class="slider-label-btn"
						onclick={() => setExtreme(100)}
						title="Set to maximum darkness (Dark)"
					>
						Dark
					</button>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={sliderValue}
					oninput={handleInput}
					class="theme-range-input brightness-slider"
					aria-label="Brightness slider"
				/>
			</div>

			<!-- Warmth / Temperature Slider -->
			<div class="slider-group">
				<div class="slider-labels">
					<button
						type="button"
						class="slider-label-btn"
						onclick={() => setWarmthExtreme(0)}
						title="Set to minimum warmth (Cool Slate)"
					>
						Cool Slate
					</button>
					<button
						type="button"
						class="slider-label-btn"
						onclick={() => setWarmthExtreme(100)}
						title="Set to maximum warmth (Warm Sepia)"
					>
						Warm Sepia
					</button>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					value={warmthValue}
					oninput={handleWarmthInput}
					class="theme-range-input warmth-slider"
					aria-label="Warmth slider"
				/>
			</div>

			<!-- Quick Presets -->
			<div class="presets-row">
				<button
					type="button"
					onclick={() => setPreset(THEME_PRESETS.parchment.theme, THEME_PRESETS.parchment.warmth)}
					class="preset-btn parchment-btn"
				>
					Parchment
				</button>
				<button
					type="button"
					onclick={() => setPreset(THEME_PRESETS.pureLight.theme, THEME_PRESETS.pureLight.warmth)}
					class="preset-btn light-btn"
				>
					Pure Light
				</button>
				<button
					type="button"
					onclick={() => setPreset(THEME_PRESETS.midnight.theme, THEME_PRESETS.midnight.warmth)}
					class="preset-btn dark-btn"
				>
					Midnight
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.theme-slider-container {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.theme-slider-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--page-bg, var(--color-page, #eceee7));
		color: var(--text, var(--color-ink, #171a1c));
		border: 1px solid var(--border, var(--color-rule, #d4d8d3));
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.theme-slider-btn:hover {
		border-color: var(--accent, var(--color-accent, #1f6f7a));
		background: var(--col-bg, var(--color-card-bg, #f5f6f2));
	}

	.theme-icon {
		width: 1.1rem;
		height: 1.1rem;
		display: block;
	}

	.moon-icon {
		color: #60a5fa;
	}

	.sun-icon {
		color: #f59e0b;
	}

	.theme-slider-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1050;
		background: transparent;
		border: none;
		cursor: default;
		padding: 0;
		margin: 0;
	}

	.theme-slider-panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		z-index: 1060;
		width: 280px;
		max-width: 90vw;
		background: var(--col-bg, var(--color-card-bg, #ffffff));
		color: var(--text, var(--color-ink, #171a1c));
		border: 1px solid var(--border, var(--color-card-border, #d4d8d3));
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.22);
		font-family: var(--font-ui, system-ui, -apple-system, sans-serif);
		box-sizing: border-box;
	}

	.theme-slider-panel.align-right {
		right: 0;
	}

	.theme-slider-panel.align-left {
		left: 0;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border, var(--color-rule, #d4d8d3));
	}

	.panel-title {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.panel-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent, var(--color-link, #1f6f7a));
	}

	.slider-group {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-mid, var(--color-ink-soft, #545b5c));
	}

	.slider-label-btn {
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-mid, var(--color-ink-soft, #545b5c));
		cursor: pointer;
		transition: color 0.15s ease, opacity 0.15s ease;
		user-select: none;
	}

	.slider-label-btn:hover {
		color: var(--accent, var(--color-accent, #1f6f7a));
		text-decoration: underline;
	}

	.slider-label-btn:active {
		opacity: 0.7;
	}

	.theme-range-input {
		width: 100%;
		height: 6px;
		border-radius: 4px;
		cursor: pointer;
		appearance: none;
		outline: none;
	}

	.brightness-slider {
		background: #94a3b8;
		accent-color: var(--accent, #1f6f7a);
	}

	.warmth-slider {
		background: linear-gradient(to right, #93c5fd, #cbd5e1, #fed7aa);
		accent-color: #d97706;
	}

	.presets-row {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border, var(--color-rule, #d4d8d3));
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
	}

	.preset-btn {
		flex: 1;
		padding: 0.3rem 0.4rem;
		font-size: 0.72rem;
		font-weight: 600;
		border-radius: 5px;
		border: 1px solid var(--border, #d4d8d3);
		cursor: pointer;
		text-align: center;
		transition: filter 0.15s ease, transform 0.1s ease;
	}

	.preset-btn:hover {
		filter: brightness(0.95);
		transform: translateY(-1px);
	}

	.parchment-btn {
		background: #fef3c7;
		color: #78350f;
		border-color: #fde68a;
	}

	.light-btn {
		background: #ffffff;
		color: #1e293b;
		border-color: #cbd5e1;
	}

	.dark-btn {
		background: #1e293b;
		color: #f8fafc;
		border-color: #334155;
	}
</style>
