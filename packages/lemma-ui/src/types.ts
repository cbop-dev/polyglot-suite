export interface LexiconEntry {
	headword: string;
	lsjIndex?: string;
	strongs?: string;
	matchType?: string;
	def?: string;
	markdown?: string;
}

export interface BookFrequency {
	book: string;
	count: number;
	totalWords?: number;
	freqPer1k?: number;
}

export interface ConcordanceOccurrence {
	id: number;
	ref: string;
	text?: string;
	surface?: string;
	morph?: string;
}

export interface LemmaData {
	id?: string | number;
	lemma: string;
	headword?: string;
	language?: 'greek' | 'hebrew' | 'syriac';
	gloss?: string;
	pos?: string | number;
	posLabel?: string;
	strongs?: string;
	strongs_number?: string;
	total?: number;
	total_count?: number;
	corpus?: string;
	corpus_id?: string;
	dictionary?: LexiconEntry | null;
	[key: string]: any;
}
