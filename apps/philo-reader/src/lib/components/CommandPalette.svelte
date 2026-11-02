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
		targetChapter: number;
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
				targetChapter: 1,
				targetSection: 1,
				label: w.titleEnglish,
				subLabel: `${w.titleLatin} • ${w.abbrev} (${w.totalSections} sections)`,
				badge: w.abbrev
			}));
		}

		// Check if user typed work + book.section e.g. "leg 2.14" or "spec leg 1 177" or "opif 10"
		// Pattern: "<treatise_str> <num1>[.: ]<num2>" or "<treatise_str> <num1>"
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
				// Multi-book treatise
				if (num1 !== null && num2 !== null) {
					// num1 = book, num2 = section
					const b = Math.min(Math.max(1, num1), w.totalBooks);
					const maxSec = w.sectionsByBook?.[b] || w.totalSections;
					const s = Math.min(Math.max(1, num2), maxSec);
					targets.push({
						work: w,
						targetChapter: b,
						targetSection: s,
						label: `${w.titleEnglish} — Book ${b}, § ${s}`,
						subLabel: `${w.abbrev} ${b}.${s}`,
						badge: 'Jump to §'
					});
				} else if (num1 !== null) {
					// num1 might be book (if <= totalBooks) or section in book 1
					if (num1 <= w.totalBooks) {
						targets.push({
							work: w,
							targetChapter: num1,
							targetSection: 1,
							label: `${w.titleEnglish} — Book ${num1}`,
							subLabel: `${w.abbrev} ${num1}`,
							badge: 'Jump to Book'
						});
					} else {
						// treated as section in book 1
						targets.push({
							work: w,
							targetChapter: 1,
							targetSection: num1,
							label: `${w.titleEnglish} — Book 1, § ${num1}`,
							subLabel: `${w.abbrev} 1.${num1}`,
							badge: 'Jump to §'
						});
					}
				} else {
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: 1,
						label: w.titleEnglish,
						subLabel: `${w.titleLatin} (${w.totalBooks} books, ${w.totalSections} sections)`,
						badge: w.abbrev
					});
				}
			} else {
				// Single-book treatise
				if (num1 !== null) {
					const s = Math.min(Math.max(1, num1), w.totalSections);
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: s,
						label: `${w.titleEnglish} — § ${s}`,
						subLabel: `${w.abbrev} ${s}`,
						badge: 'Jump to §'
					});
				} else {
					targets.push({
						work: w,
						targetChapter: 1,
						targetSection: 1,
						label: w.titleEnglish,
						subLabel: `${w.titleLatin} (${w.totalSections} sections)`,
						badge: w.abbrev
					});
				}
			}
		}

		return targets;
	});

	function selectTarget(target: JumpTarget) {
		readerState.setWork(target.work.code, target.targetChapter, target.targetSection ?? 1);
		onClose();
		if (target.targetSection) {
			setTimeout(() => {
				const el = document.getElementById(`section-${target.targetSection}`);
				el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 150);
		}
	}
</script>

<CommandPaletteModal
	{open}
	placeholder="Jump to treatise or section (e.g. 'Opif 10', 'Leg 2.14', 'Moses 1')..."
	emptyMessage="No matching Philo treatises or sections found."
	bind:query
	items={parsedResults}
	onSelect={selectTarget}
	{onClose}
/>
