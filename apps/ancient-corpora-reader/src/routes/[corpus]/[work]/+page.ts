import type { PageLoad, EntryGenerator } from './$types';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { CORPORA_CONFIG, getActiveCorpora } from '$lib/config/corpora.js';
import { getCorpusWorks } from '$lib/config/corpora.data.js';
export const prerender = true;

export const entries: EntryGenerator = () => {
	const entriesList: { corpus: string; work: string }[] = [];
	for (const corpus of getActiveCorpora()) {
		const works = getCorpusWorks(corpus.id as AncientCorpusId);
		for (const w of works) {
			entriesList.push({ corpus: corpus.id, work: w.slug });
		}
	}
	return entriesList;
};

export const load: PageLoad = ({ params }) => {
	const raw = params.corpus?.toLowerCase();
	const corpusId: AncientCorpusId = raw && raw in CORPORA_CONFIG ? (raw as AncientCorpusId) : 'af';
	const work = params.work;
	return { corpusId, work };
};
