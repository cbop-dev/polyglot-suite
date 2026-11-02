<script lang="ts">
	import { SectionPickerModal } from '@polyglot/ui';
	import { readerState } from '../stores/readerState.svelte.js';

	let items = $derived.by(() => {
		const work = readerState.currentWork;
		const list = [];
		for (let i = work.minDivision; i <= work.totalDivisions; i++) {
			list.push({
				value: i,
				label: `${work.divisionLabel} ${i}`
			});
		}
		return list;
	});

	function handleSelect(val: number) {
		readerState.setDivision(val);
		readerState.isDivisionModalOpen = false;
	}
</script>

<SectionPickerModal
	open={readerState.isDivisionModalOpen}
	placeholder="Jump to {readerState.currentWork.divisionLabel.toLowerCase()} number..."
	{items}
	totalCount={readerState.currentWork.totalDivisions}
	currentValue={readerState.currentDivision}
	onSelect={handleSelect}
	onClose={() => (readerState.isDivisionModalOpen = false)}
/>
