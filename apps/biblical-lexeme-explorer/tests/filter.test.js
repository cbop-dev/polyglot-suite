import { LexQuery, LexQueryFilter } from "$lib/components/LexQuery.svelte.js";
import { VocabEngine } from "$lib/engine/VocabEngine.js";
import { test, expect } from 'vitest';

test('filter test', async () => {
    let query = new LexQuery([623751]); // Gen 1
    await VocabEngine.fetchLexemes(query);
    const lexes = query.results.lexemeArray.toSorted((x, y) => x.lemma.localeCompare(y.lemma));

    expect(lexes.length).toBe(118);
});
