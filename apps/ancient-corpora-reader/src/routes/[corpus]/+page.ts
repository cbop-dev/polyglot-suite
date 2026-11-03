import type { PageLoad } from './$types';
import type { AncientCorpusId } from '@polyglot/ancient-languages';

export const load: PageLoad = ({ params }) => {
	const raw = params.corpus?.toLowerCase();
	const valid: AncientCorpusId[] = ['af', 'philo', 'josephus'];
	const corpusId: AncientCorpusId = valid.includes(raw as any) ? (raw as AncientCorpusId) : 'af';
	return { corpusId };
};
