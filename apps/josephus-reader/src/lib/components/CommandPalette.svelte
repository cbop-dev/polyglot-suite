<script lang="ts">
	import { CommandPaletteModal, type CommandPaletteItem } from '@polyglot/ui';
	import { CANONICAL_WORKS, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
	import { readerState } from '$lib/stores/readerState.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let query = $state<string>('');

	interface JumpTarget extends CommandPaletteItem {
		work: CanonicalWork;
		targetBook: number;
		targetSection?: number;
		label: string;
		subLabel: string;
		badge: string;
	}

	let parsedResults = $derived.by<JumpTarget[]>(() => {
		const raw = query.trim().toLowerCase();
		if (!raw) {
			return CANONICAL_WORKS.map((w) => ({
				work: w,
				targetBook: 1,
				targetSection: 1,
				label: w.titleEnglish,
				subLabel: `${w.titleLatin} • ${w.abbrev} (${w.totalBooks} ${w.totalBooks === 1 ? 'book' : 'books'})`,
				badge: w.abbrev
			}));
		}

		// Pattern: "<work_query> <num1>[.: ]<num2>" or "<work_query> <num1>"
		const matchComplex = raw.match(/^(.*?)(?:\s+(\d+)(?:[.:\s]+(\d+))?)?$/);
		const textPart = matchComplex ? matchComplex[1].trim() : raw;
		const num1 = matchComplex && matchComplex[2] ? parseInt(matchComplex[2], 10) : null;
		const num2 = matchComplex && matchComplex[3] ? parseInt(matchComplex[3], 10) : null;

		const matchingWorks = CANONICAL_WORKS.filter((w) => {
			return (
				w.titleEnglish.toLowerCase().includes(textPart) ||
				w.titleLatin.toLowerCase().includes(textPart) ||
				w.abbrev.toLowerCase().includes(textPart) ||
				w.code.toLowerCase().includes(textPart) ||
				w.titleGreek.toLowerCase().includes(textPart)
			);
		});

		const targets: JumpTarget[] = [];
		for (const w of matchingWorks) {
			if (w.totalBooks > 1) {
				if (num1 !== null && num2 !== null) {
					const b = Math.min(Math.max(1, num1), w.totalBooks);
					targets.push({
						work: w,
						targetBook: b,
						targetSection: num2,
						label: `${w.titleEnglish} Book ${b}, § ${num2}`,
						subLabel: `Direct Jump to ${w.abbrev} ${b}.${num2}`,
						badge: w.abbrev
					});
				} else if (num1 !== null) {
					if (num1 <= w.totalBooks) {
						targets.push({
							work: w,
							targetBook: num1,
							targetSection: 1,
							label: `${w.titleEnglish} Book ${num1}`,
							subLabel: `Jump to Book ${num1} in ${w.abbrev}`,
							badge: w.abbrev
						});
					} else {
						targets.push({
							work: w,
							targetBook: 1,
							targetSection: num1,
							label: `${w.titleEnglish} § ${num1}`,
							subLabel: `Section in Book 1`,
							badge: w.abbrev
						});
					}
				} else {
					targets.push({
						work: w,
						targetBook: 1,
						targetSection: 1,
						label: w.titleEnglish,
						subLabel: `${w.titleLatin} • ${w.abbrev} (${w.totalBooks} books)`,
						badge: w.abbrev
					});
				}
			} else {
				const s = num1 || 1;
				targets.push({
					work: w,
					targetBook: 1,
					targetSection: s,
					label: `${w.titleEnglish}${num1 ? ` § ${s}` : ''}`,
					subLabel: `${w.titleLatin} • ${w.abbrev}`,
					badge: w.abbrev
				});
			}
		}

		return targets;
	});

	function handleSelect(item: JumpTarget) {
		readerState.setWork(item.work.code, item.targetBook, item.targetSection ?? 1);
		onClose();
		if (item.targetSection) {
			setTimeout(() => {
				const el = document.getElementById(`niese-${item.targetSection}`) || document.getElementById(`section-${item.targetSection}`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 100);
		}
	}
</script>

<CommandPaletteModal
	{open}
	placeholder="Search Josephus (e.g. 'Antiquities 1.15', 'War 2', 'Apion')..."
	items={parsedResults}
	bind:query
	onSelect={handleSelect}
	{onClose}
/>
