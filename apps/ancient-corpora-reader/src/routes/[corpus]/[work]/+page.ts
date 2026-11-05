import type { PageLoad } from './$types';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { CORPORA_CONFIG } from '$lib/config/corpora.js';

export const load: PageLoad = ({ params }) => {
	const raw = params.corpus?.toLowerCase();
	const corpusId: AncientCorpusId = raw && raw in CORPORA_CONFIG ? (raw as AncientCorpusId) : 'af';
	const work = params.work;
	return { corpusId, work };
};
