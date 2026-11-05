<script lang="ts">
	import { Modal2 } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';

	const HOTKEYS = [
		{ key: 'B', desc: 'Open Corpus selector' },
		{ key: 'W', desc: 'Open Work / Treatise selector' },
		{ key: 'J / S / C', desc: 'Jump to Section & Division selector' },
		{ key: '] / →', desc: 'Next division' },
		{ key: '[ / ←', desc: 'Previous division' },
		{ key: 'P', desc: 'Parallel view layout' },
		{ key: 'D', desc: 'Toggle layout (Parallel ↔ Stacked)' },
		{ key: 'F / /', desc: 'Toggle Lemma Search & Lexeme Side Panel' },
		{ key: 'Esc', desc: 'Close modals & side panel' },
		{ key: '?', desc: 'Show this keyboard shortcuts guide' }
	];
</script>

<Modal2
	bind:showModal={readerState.showHotkeyHelp}
	title="Keyboard Shortcuts"
	maxWidth="max-w-md"
	onclose={() => (readerState.showHotkeyHelp = false)}
>
	<div class="space-y-3 py-2">
		<table class="w-full text-left text-xs text-[var(--color-ink)]">
			<thead>
				<tr class="border-b border-[var(--color-rule)] text-[var(--color-ink-soft)]">
					<th class="py-1.5 font-medium">Key</th>
					<th class="py-1.5 font-medium">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-rule)]">
				{#each HOTKEYS as hk}
					<tr>
						<td class="py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
							<kbd class="rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-1.5 py-0.5 shadow-2xs">
								{hk.key}
							</kbd>
						</td>
						<td class="py-2 text-[var(--color-ink-soft)] font-medium">{hk.desc}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Modal2>
