<script lang="ts">
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	interface Bookmark {
		id: string;
		work: string;
		book: number;
		section: string | number;
		snippet: string;
		timestamp: number;
	}

	let bookmarks = $state<Bookmark[]>([]);

	$effect(() => {
		if (open && typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('josephus_bookmarks');
				bookmarks = saved ? JSON.parse(saved) : [];
			} catch {
				bookmarks = [];
			}
		}
	});

	function jumpTo(bm: Bookmark) {
		readerState.setWork(bm.work, bm.book, bm.section);
		onClose();
		setTimeout(() => {
			const el = document.getElementById(`niese-${bm.section}`) || document.getElementById(`section-${bm.section}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}

	function removeBookmark(id: string) {
		bookmarks = bookmarks.filter((b) => b.id !== id);
		try {
			localStorage.setItem('josephus_bookmarks', JSON.stringify(bookmarks));
		} catch {}
	}
</script>

{#if open}
	<div class="bm-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onclick={onClose} role="presentation">
		<div
			class="bm-card relative w-full max-w-lg rounded-2xl border border-[var(--color-rule)] bg-[var(--color-page)] p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="Bookmarks Manager"
		>
			<div class="flex items-center justify-between border-b border-[var(--color-rule)] pb-3">
				<h2 class="text-base font-bold text-[var(--color-ink)]">Bookmarks Manager</h2>
				<button type="button" onclick={onClose} class="text-sm font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] cursor-pointer">
					✕
				</button>
			</div>

			<div class="mt-4 max-h-80 overflow-y-auto space-y-2">
				{#if bookmarks.length === 0}
					<p class="py-8 text-center text-xs text-[var(--color-ink-soft)]">
						No bookmarks saved yet. Star any section in the text to bookmark it.
					</p>
				{:else}
					{#each bookmarks as bm (bm.id)}
						<div class="flex items-center justify-between rounded-xl border border-[var(--color-rule)] p-3 hover:bg-[var(--color-card-bg)]">
							<button type="button" onclick={() => jumpTo(bm)} class="text-left flex-1 min-w-0 cursor-pointer">
								<div class="text-xs font-bold text-[var(--color-ink)]">{bm.work} {bm.book}.{bm.section}</div>
								<div class="text-xs text-[var(--color-ink-soft)] truncate">{bm.snippet}</div>
							</button>
							<button type="button" onclick={() => removeBookmark(bm.id)} class="text-xs text-red-500 hover:text-red-700 ml-2 cursor-pointer">
								Remove
							</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
