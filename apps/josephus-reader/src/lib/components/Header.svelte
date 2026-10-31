<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';
	import { APP_VERSION, APP_REPO } from '$lib/config/version';
	import ThemeSlider from '@polyglot/theme/ThemeSlider.svelte';
	import VersionPill from '@polyglot/theme/VersionPill.svelte';

	let jumpValue = $state('');

	let currentWork = $derived(readerState.currentWork);
	let isMultiBook = $derived(currentWork.totalBooks > 1);

	function handleWorkSelectChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (target.value && target.value !== readerState.currentWorkCode) {
			readerState.setWork(target.value, 1);
			const targetUrl = `${base}/${target.value}/book/1/`;
			goto(targetUrl).catch(() => {
				window.location.href = targetUrl;
			});
		}
	}

	function handleJumpSubmit(e: SubmitEvent | KeyboardEvent) {
		e.preventDefault();
		const clean = jumpValue.trim();
		if (!clean) return;

		// Parse "1.15" (book 1, section 15) or "15" (section 15)
		const parts = clean.split('.');
		if (parts.length === 2) {
			const b = parseInt(parts[0], 10);
			const s = parts[1];
			if (!isNaN(b)) {
				readerState.setBook(b, s);
				jumpValue = '';
				window.location.hash = `niese-${s}`;
				setTimeout(() => {
					const el = document.getElementById(`niese-${s}`) || document.getElementById(`section-${s}`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}, 100);
				return;
			}
		}

		readerState.currentSection = clean;
		jumpValue = '';
		window.location.hash = `niese-${clean}`;
		setTimeout(() => {
			const el = document.getElementById(`niese-${clean}`) || document.getElementById(`section-${clean}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}
</script>

<header class="page-header sticky top-0 z-40 border-b border-[var(--color-rule)] bg-[var(--color-page)]/95 backdrop-blur shadow-xs">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2">
		<!-- Left: Suite link, Title & Version, Work Switcher, Book outline -->
		<div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
			<!-- Suite link -->
			<a
				href="{base}/"
				class="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] shrink-0"
				title="Back to Polyglot Suite"
			>
				&larr;<span class="hidden sm:inline">&nbsp;Suite</span>
			</a>
			<span class="text-slate-300 dark:text-slate-700">/</span>

			<!-- App Title & Version Pill -->
			<div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
				<a href="{base}/" class="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-ink)] hover:underline">
					<span class="hidden sm:inline">Josephus Reader</span>
					<span class="sm:hidden">Josephus</span>
				</a>
				<VersionPill
					version={APP_VERSION}
					href={APP_REPO}
					title="View Josephus Reader on GitHub"
				/>
			</div>

			<!-- Standard Work Switcher Select (for direct test automation compatibility) -->
			<select
				class="work-switcher hidden md:block rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer"
				value={readerState.currentWorkCode}
				onchange={handleWorkSelectChange}
				aria-label="Choose a work"
			>
				{#each CANONICAL_WORKS as w (w.code)}
					<option value={w.code}>{w.titleEnglish} ({w.abbrev})</option>
				{/each}
			</select>

			<!-- Treatise Selector Button (opens WorkPickerModal) -->
			<button
				type="button"
				onclick={() => readerState.openBookModal()}
				class="max-w-[120px] sm:max-w-[180px] md:hidden truncate rounded-lg border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1 shrink min-w-0"
				title="Choose work (Hot key: 'b')"
			>
				<span class="truncate">{currentWork.titleEnglish}</span>
				<span class="text-[10px] text-[var(--color-ink-soft)] shrink-0">▾</span>
			</button>

			<!-- Book / Section Navigator Button -->
			<div class="flex items-center gap-0.5 shrink-0">
				<button
					type="button"
					onclick={() => readerState.prevBook()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Previous book"
					title="Previous Book (← / [)"
				>
					&larr;
				</button>
				<button
					type="button"
					onclick={() => readerState.openChapterModal()}
					class="rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs sm:text-sm font-semibold text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-rule)] cursor-pointer flex items-center gap-1"
					title="Choose book or section (Hot key: 'c')"
				>
					<span>{isMultiBook ? `Bk. ${readerState.currentBook}` : 'Outline'}</span>
					<span class="text-[10px] text-[var(--color-ink-soft)]">▾</span>
				</button>
				<button
					type="button"
					onclick={() => readerState.nextBook()}
					class="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] cursor-pointer"
					aria-label="Next book"
					title="Next Book (→ / ])"
				>
					&rarr;
				</button>
			</div>
		</div>

		<!-- Right: Jump to Section, Command Palette, Theme, Help -->
		<div class="flex items-center gap-1.5 sm:gap-2">
			<!-- Niese Quick Jump Form -->
			<form onsubmit={handleJumpSubmit} class="flex items-center gap-1">
				<input
					id="niese-input"
					type="text"
					class="nj-input w-16 sm:w-20 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-1.5 py-0.5 text-xs text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:ring-1 focus:ring-blue-500"
					placeholder="§ Jump"
					bind:value={jumpValue}
					title="Jump to Niese Section (Press 'j')"
				/>
				<button
					type="submit"
					class="nj-trigger-btn rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer"
					title="Jump to Section"
				>
					§ Jump
				</button>
			</form>

			<!-- Search & Command Palette Button -->
			<button
				type="button"
				class="search-trigger search-trigger-btn flex items-center gap-1 rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-2 py-1 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer"
				onclick={() => readerState.openCommandPalette()}
				title="Search & Command Palette (Cmd+K / Ctrl+K)"
			>
				<span class="hs-icon">🔍</span>
				<span class="hs-kbd hidden sm:inline text-[10px] font-mono">⌘K</span>
			</button>

			<!-- Theme Slider -->
			<div class="shrink-0">
				<ThemeSlider />
			</div>

			<!-- Shortcuts Help Button -->
			<button
				type="button"
				class="help-trigger help-trigger-btn rounded p-1 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)] cursor-pointer"
				onclick={() => readerState.openHotkeyHelp()}
				aria-label="Keyboard Shortcuts"
				title="Keyboard Shortcuts (?)"
			>
				?
			</button>
		</div>
	</div>
</header>
