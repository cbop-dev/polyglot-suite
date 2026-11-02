<script lang="ts">
	import { CommandPaletteModal, type CommandPaletteItem } from '@polyglot/ui';
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
	import { SBL_ABBREVIATIONS } from '$lib/services/citationService';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let query = $state<string>('');

	interface JumpTarget extends CommandPaletteItem {
		work: CanonicalWork;
		targetChapter: number;
		label: string;
		subLabel: string;
		badge: string;
	}

	// Parse query like "1 Clem 5", "Did 8", "Herm 12", "Ign Rom 3"
	let parsedResults = $derived.by<JumpTarget[]>(() => {
		const raw = query.trim().toLowerCase();
		if (!raw) {
			return CANONICAL_WORKS.map((w) => ({
				work: w,
				targetChapter: w.minChapter ?? 1,
				label: w.titleEnglish,
				subLabel: `${w.titleGreek} (${w.totalChapters} chapters)`,
				badge: SBL_ABBREVIATIONS[w.code] || w.code
			}));
		}

		// Check if user typed work + chapter e.g. "1 clem 5" or "didache 3" or "ign eph 2"
		const match = raw.match(/^(.*?)(?:\s+(\d+))?$/);
		const textPart = match ? match[1].trim() : raw;
		const chapterPart = match && match[2] ? parseInt(match[2], 10) : null;

		const matchingWorks = CANONICAL_WORKS.filter((w) => {
			const sbl = (SBL_ABBREVIATIONS[w.code] || '').toLowerCase();
			return (
				w.titleEnglish.toLowerCase().includes(textPart) ||
				w.code.toLowerCase().includes(textPart) ||
				sbl.includes(textPart) ||
				w.titleGreek.toLowerCase().includes(textPart) ||
				(w.titleLatin && w.titleLatin.toLowerCase().includes(textPart))
			);
		});

		const targets: JumpTarget[] = [];
		for (const w of matchingWorks) {
			if (chapterPart !== null) {
				const clampedCh = Math.min(Math.max(w.minChapter ?? 1, chapterPart), w.totalChapters);
				const isLat = readerState.hasLatinInChapter(w.code, clampedCh);
				targets.push({
					work: w,
					targetChapter: clampedCh,
					label: `${w.titleEnglish} — Chapter ${clampedCh}${isLat ? ' [Latin Extant]' : ''}`,
					subLabel: `${SBL_ABBREVIATIONS[w.code] || w.code} ${clampedCh}${isLat ? ' (Preserves Ancient Latin text)' : ''}`,
					badge: isLat ? 'Latin' : 'Jump to Ch'
				});
			} else {
				const hasAnyLat = readerState.hasLatinInWork(w.code);
				targets.push({
					work: w,
					targetChapter: w.minChapter ?? 1,
					label: w.titleEnglish,
					subLabel: `${w.titleGreek} (${w.totalChapters} ch)${hasAnyLat ? ' • Latin in Ch. 10–14' : ''}`,
					badge: SBL_ABBREVIATIONS[w.code] || w.code
				});
			}
		}

		return targets;
	});

	function selectTarget(target: JumpTarget) {
		readerState.setWork(target.work.code, target.targetChapter);
		onClose();
	}
</script>

<CommandPaletteModal
	{open}
	placeholder="Type a work or reference (e.g., '1 Clem 5', 'Didache 8', 'Ign Rom 3')..."
	emptyMessage="No matching Apostolic Fathers works or references found."
	bind:query
	items={parsedResults}
	onSelect={selectTarget}
	{onClose}
/>
