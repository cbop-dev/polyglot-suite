import type { PageLoad,EntryGenerator } from './$types';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { CORPORA_CONFIG } from '$lib/config/corpora.js';
//export const prerender = true;

export const entries: EntryGenerator = () => {
	return [
		{ corpus: 'af' },
		{ corpus: 'philo' },
		{ corpus: 'josephus' }
	];
};
export const load: PageLoad = ({ params }) => {
	const raw = params.corpus?.toLowerCase();
	const corpusId: AncientCorpusId = raw && raw in CORPORA_CONFIG ? (raw as AncientCorpusId) : 'af';
	return { corpusId };
};
