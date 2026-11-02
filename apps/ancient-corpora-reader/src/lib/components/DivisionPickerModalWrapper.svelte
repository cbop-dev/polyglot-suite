<script lang="ts">
	import { SectionPickerModal, type SubBookItem } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';

	interface Props {
		greekSectionsCount?: number;
	}

	let { greekSectionsCount = 0 }: Props = $props();

	let currentWork = $derived(readerState.currentWork);
	let isMultiDivision = $derived(currentWork.totalDivisions > 1);

	let allDivisions = $derived.by<SubBookItem[]>(() => {
		if (!isMultiDivision) return [];
		const list: SubBookItem[] = [];
		const isChapter = currentWork.divisionLabel === 'Chapter';
		for (let i = currentWork.minDivision; i <= currentWork.totalDivisions; i++) {
			const secCount = currentWork.sectionsByDivision?.[i];
			list.push({
				book: i,
				label: isChapter ? `Ch. ${i}` : `Bk. ${i}`,
				sections: secCount,
				isSelected: i === readerState.currentDivision
			});
		}
		return list;
	});

	let maxSectionInDivision = $derived.by(() => {
		if (currentWork.sectionsByDivision && currentWork.sectionsByDivision[readerState.currentDivision]) {
			return currentWork.sectionsByDivision[readerState.currentDivision];
		}
		if (greekSectionsCount > 0) return greekSectionsCount;
		return 50;
	});

	let quickJumpSections = $derived.by(() => {
		const steps = maxSectionInDivision <= 25
			? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25]
			: [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 100, 150, 200, 250, 300, 400];
		return steps.filter((s) => s <= maxSectionInDivision);
	});

	function selectDivision(divNum: number) {
		readerState.setDivision(divNum);
		readerState.isDivisionModalOpen = false;
	}

	function jumpToSection(secNum: number, divNum?: number) {
		const targetDiv = divNum !== undefined
			? Math.max(currentWork.minDivision, Math.min(divNum, currentWork.totalDivisions))
			: readerState.currentDivision;

		readerState.setDivision(targetDiv, secNum);
		readerState.isDivisionModalOpen = false;

		setTimeout(() => {
			const el = document.getElementById(`section-${secNum}`) ||
				document.getElementById(`niese-${secNum}`) ||
				document.getElementById(`sec-${secNum}`);
			el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 100);
	}
</script>

<SectionPickerModal
	open={readerState.isDivisionModalOpen}
	placeholder={isMultiDivision
		? `Jump to ${currentWork.divisionLabel.toLowerCase()} & section (e.g. '15' or '2.110')...`
		: `Jump to section (1..${maxSectionInDivision})...`}
	subBooks={allDivisions}
	onSelectSubBook={selectDivision}
	subBookLabel={currentWork.divisionLabel}
	subBookShortLabel={currentWork.divisionLabel === 'Chapter' ? 'Ch.' : 'Bk.'}
	{quickJumpSections}
	currentValue={typeof readerState.currentSection === 'number' ? readerState.currentSection : undefined}
	onSelect={jumpToSection}
	onClose={() => (readerState.isDivisionModalOpen = false)}
/>
