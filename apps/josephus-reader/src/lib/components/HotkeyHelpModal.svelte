<script lang="ts">
	import { JOSEPHUS_HOTKEYS } from '$lib/config/hotkeys';
	import { formatKey } from '@polyglot/ancient-languages/hotkeys';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();
</script>

{#if open}
	<aside
		id="help-modal"
		class="help-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
		onclick={onClose}
		role="dialog"
		aria-label="Keyboard Shortcuts"
	>
		<div
			class="relative w-full max-w-lg rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="flex items-center justify-between border-b border-[var(--color-rule)] pb-3">
				<h2 class="text-base font-bold text-[var(--color-ink)]">Keyboard Shortcuts</h2>
				<button type="button" onclick={onClose} class="text-sm font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer">
					✕
				</button>
			</div>

			<div class="mt-4 max-h-96 overflow-y-auto">
				<table class="w-full text-left text-xs text-[var(--color-ink)]">
					<thead>
						<tr class="border-b border-[var(--color-rule)] text-[var(--color-ink-soft)]">
							<th class="py-2 font-medium">Key</th>
							<th class="py-2 font-medium">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-rule)]">
						{#each JOSEPHUS_HOTKEYS as hk (hk.id)}
							<tr>
								<td class="py-2.5 font-mono font-semibold">
									{#each hk.keys as k, i}
										{i > 0 ? ' / ' : ''}
										<kbd class="rounded border border-[var(--color-rule)] bg-[var(--color-card-bg)] px-1.5 py-0.5 shadow-2xs">
											{formatKey(k)}
										</kbd>
									{/each}
								</td>
								<td class="py-2.5 text-[var(--color-ink-soft)]">{hk.description}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</aside>
{/if}
