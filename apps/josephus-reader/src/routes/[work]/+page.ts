import { CANONICAL_WORKS } from '$lib/config/canonicalWorks.generated';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
	return CANONICAL_WORKS.map((w) => ({ work: w.code }));
};
