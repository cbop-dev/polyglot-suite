import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
	const list: Array<{ work: string; book: string }> = [];
	for (const w of CANONICAL_WORKS) {
		for (let b = 1; b <= w.totalBooks; b++) {
			list.push({ work: w.code, book: String(b) });
		}
	}
	return list;
};
