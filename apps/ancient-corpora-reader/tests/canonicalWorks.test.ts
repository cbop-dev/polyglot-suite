import { describe, it, expect } from 'vitest';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import {
	getCorpusWorks,
	findWork,
	resolveDivisionCoordinates,
	CORPUS_TITLES
} from '../src/lib/config/corpora.js';

describe('Canonical Works Registry', () => {
	it('provides corpus titles and subtitles for all three corpora', () => {
		const corpora: AncientCorpusId[] = ['af', 'philo', 'josephus'];
		for (const c of corpora) {
			expect(CORPUS_TITLES[c].name).toBeDefined();
			expect(CORPUS_TITLES[c].subtitle).toBeDefined();
			expect(CORPUS_TITLES[c].badge).toBeDefined();
		}
	});

	it('returns 15 canonical works for Apostolic Fathers', () => {
		const works = getCorpusWorks('af');
		expect(works.length).toBe(15);
		expect(works[0].code).toBe('1CLE');
		expect(works[0].divisionLabel).toBe('Chapter');
	});

	it('returns 31 canonical treatises for Philo', () => {
		const works = getCorpusWorks('philo');
		expect(works.length).toBe(31);
		expect(works[0].code).toBe('OPIF');
	});

	it('returns 4 works for Flavius Josephus', () => {
		const works = getCorpusWorks('josephus');
		expect(works.length).toBe(4);
		expect(works.map((w) => w.code)).toEqual(['Antiquities', 'War', 'Life', 'Apion']);
		expect(works[0].totalDivisions).toBe(20);
		expect(works[0].divisionLabel).toBe('Book');
	});

	it('finds works flexibly by code, slug, or title', () => {
		// AF
		expect(findWork('af', '1cle')?.code).toBe('1CLE');
		expect(findWork('af', 'did')?.titleEnglish).toBe('Didache');

		// Philo
		expect(findWork('philo', 'opif')?.code).toBe('OPIF');
		expect(findWork('philo', 'de-opificio-mundi')?.code).toBe('OPIF');
		expect(findWork('philo', 'leg')?.totalDivisions).toBe(3);

		// Josephus
		expect(findWork('josephus', 'ant')?.code).toBe('Antiquities');
		expect(findWork('josephus', 'war')?.code).toBe('War');
		expect(findWork('josephus', 'life')?.code).toBe('Life');
		expect(findWork('josephus', 'apion')?.code).toBe('Apion');
	});

	it('resolves division coordinates dynamically based on work metadata without hardcoded corpus checks', () => {
		// Josephus works are book_only: (book = div, chapter = 0)
		const antWork = findWork('josephus', 'Antiquities');
		expect(resolveDivisionCoordinates(antWork, 3)).toEqual({ book: 3, chapter: 0 });

		// Philo works use division_both: (book = div, chapter = div)
		const legWork = findWork('philo', 'LEG');
		expect(resolveDivisionCoordinates(legWork, 2)).toEqual({ book: 2, chapter: 2 });

		// Apostolic Fathers works use division_both: (book = div, chapter = div)
		const cleWork = findWork('af', '1CLE');
		expect(resolveDivisionCoordinates(cleWork, 5)).toEqual({ book: 5, chapter: 5 });

		// Fallback for undefined work
		expect(resolveDivisionCoordinates(undefined, 1)).toEqual({ book: 1, chapter: 1 });
	});
});
