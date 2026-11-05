import { describe, it, expect } from 'vitest';
import {
	CORPORA_CONFIG,
	getCorpusConfig,
	getAllCorpora
} from '../src/lib/config/corpora.js';
import {
	getCorpusWorks,
	findWork,
	resolveDivisionCoordinates
} from '../src/lib/config/corpora.data.js';

describe('Phase 1: Corpora Configuration & Typography Groundwork', () => {
	it('defines all three corpora in CORPORA_CONFIG and resolves them via getCorpusConfig', () => {
		const corpora = getAllCorpora();
		expect(corpora.map((c) => c.id)).toEqual(['af', 'philo', 'josephus']);

		const afConfig = getCorpusConfig('af');
		expect(afConfig.name).toBe('Apostolic Fathers');
		expect(afConfig.title).toBe('Apostolic Fathers');
		expect(afConfig.primaryLanguage).toBe('grc');
		expect(afConfig.textVersions.length).toBeGreaterThanOrEqual(3);

		const philoConfig = getCorpusConfig('philo');
		expect(philoConfig.name).toBe('Philo of Alexandria');
		expect(philoConfig.milestoneScheme?.id).toBe('mangey');

		const josephusConfig = getCorpusConfig('josephus');
		expect(josephusConfig.name).toBe('Flavius Josephus');
		expect(josephusConfig.milestoneScheme?.id).toBe('niese');
	});

	it('resolves works and works metadata correctly', () => {
		const afWorks = getCorpusWorks('af');
		expect(afWorks.length).toBe(15);
		expect(findWork('af', '1-clem')?.titleEnglish).toBe('1 Clement');

		const philoWorks = getCorpusWorks('philo');
		expect(philoWorks.length).toBe(31);
		expect(findWork('philo', 'opif')?.titleEnglish).toBe('On the Creation of the World');

		const josephusWorks = getCorpusWorks('josephus');
		expect(josephusWorks.length).toBe(4);
		expect(findWork('josephus', 'ant')?.titleEnglish).toBe('Antiquities of the Jews');
	});

	it('resolves division coordinates correctly without hardcoding in components', () => {
		// Philo division coordinates (pre-Phase 2 schema uses division for both coordinates)
		expect(resolveDivisionCoordinates('philo', 'leg', 2)).toEqual({ book: 2, chapter: 2 });
		expect(resolveDivisionCoordinates(findWork('philo', 'leg'), 2)).toEqual({ book: 2, chapter: 2 });

		expect(resolveDivisionCoordinates('philo', 'opif', 1)).toEqual({ book: 1, chapter: 1 });

		// Apostolic Fathers (uses division for both coordinates)
		expect(resolveDivisionCoordinates('af', '1-clem', 5)).toEqual({ book: 5, chapter: 5 });
		expect(resolveDivisionCoordinates(findWork('af', '1-clem'), 5)).toEqual({ book: 5, chapter: 5 });

		// Josephus multi-book work (Antiquities book 1: book_only coordinate scheme)
		expect(resolveDivisionCoordinates('josephus', 'ant', 1)).toEqual({ book: 1, chapter: 0 });
		expect(resolveDivisionCoordinates(findWork('josephus', 'ant'), 1)).toEqual({ book: 1, chapter: 0 });

		// Josephus single-book work (Life division 1)
		expect(resolveDivisionCoordinates('josephus', 'life', 1)).toEqual({ book: 1, chapter: 0 });
	});
});
