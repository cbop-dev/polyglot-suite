<script>
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import VersionButton from './VersionButton.svelte';

	/**
	 * @type {{ currentVersion?: string }}
	 */
	let { currentVersion = 'lxx' } = $props();
	let selectedVersion = $state(currentVersion);
	const versions = [
		{ id: 'bhs', label: 'BHS' },
		{ id: 'lxx', label: 'LXX' },
		{ id: 'sblgnt', label: 'SBLGNT' }
	];

	function onSelectVersion(event) {
		const targetVersion = selectedVersion;
		/*console.log('targetVersion', targetVersion);
		console.log('currentVersion', currentVersion);
		*/
		if (targetVersion && targetVersion !== currentVersion) {
			window.location.assign(`${base}/bible/${targetVersion}`);
			/*goto(`${base}/bible/${targetVersion}`, { replaceState: true });*/
		} else {
			console.log('WHAT??');
		}
	}
</script>

<header
	class="top-navbar shadow-xs mb-3 border-b border-base-300 bg-base-100/95 px-3 py-2 sm:px-5 sm:py-2.5"
>
	<div class="mx-auto flex max-w-7xl items-center justify-between gap-2">
		<!-- Left: Home link -->
		<div class="flex items-center">
			<a
				href="{base}/"
				class="btn btn-circle btn-ghost btn-xs text-base-content/80 sm:btn-sm hover:bg-base-200 hover:text-base-content"
				title="Back to Home"
				aria-label="Back to Home"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="sm:w-4.5 sm:h-4.5 h-4 w-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
					/>
				</svg>
			</a>
		</div>

		<!-- Center: Title & Version Button -->
		<div class="flex items-center justify-center text-center">
			<h1
				class="m-0 inline-flex items-center !border-none p-0 text-sm font-bold tracking-tight !no-underline sm:text-base md:text-lg"
			>
				<a
					href="{base}/"
					class="whitespace-nowrap text-base-content !no-underline hover:opacity-85"
				>
					<span class="sm:hidden">Bible Lexemes</span>
					<span class="hidden sm:inline">Biblical Lexeme Explorer</span>
				</a>
				<VersionButton />
			</h1>
		</div>

		<!-- Right: Info Icon & Bible Version Selector -->
		<div class="flex items-center gap-1.5 sm:gap-2.5">
			<!-- Info Icon Linking to Sources & Licenses -->
			<a
				href="{base}/sources-and-licenses"
				class="btn btn-circle btn-ghost btn-xs text-base-content/80 sm:btn-sm hover:bg-base-200 hover:text-base-content"
				title="Sources &amp; Licenses"
				aria-label="Sources &amp; Licenses"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.8"
					stroke="currentColor"
					class="w-4.5 h-4.5 sm:h-5 sm:w-5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
					/>
				</svg>
			</a>

			<!-- Bible Version Dropdown Selector -->
			<div class="version-select-wrapper">
				<select
					class="select select-bordered select-xs cursor-pointer bg-base-100 p-0 pl-1 pr-1 align-text-top text-xs font-semibold sm:select-sm sm:p-2 sm:text-xs"
					bind:value={selectedVersion}
					aria-label="Select Biblical Corpus"
				>
					{#each versions as v}
						<option value={v.id}>{v.label}</option>
					{/each}
				</select>
			</div>
			<button class="btn btn-sm" onclick={onSelectVersion} aria-label="Go">Go!</button>
		</div>
	</div>
</header>

<style>
	.top-navbar {
		border-radius: 8px;
	}

	.top-navbar h1 {
		font-family: inherit;
		text-decoration: none !important;
		border: none !important;
		padding-bottom: 0 !important;
	}

	.top-navbar a:hover {
		text-decoration: none !important;
	}

	.version-select-wrapper select {
		font-family: inherit;
		min-width: 5rem;
	}
</style>
