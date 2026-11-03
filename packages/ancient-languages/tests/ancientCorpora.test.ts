import { describe, it, expect } from 'vitest';
import {
	formatAncientCorpusCitation,
	ANCIENT_CORPORA_WORKS
} from '../src/citations/ancientCorpora.js';

describe('Ancient Corpora Citations', () => {
	it('contains metadata for all three corpora (AF, Philo, Josephus)', () => {
		expect(ANCIENT_CORPORA_WORKS.af['1-clem']).toBeDefined();
		expect(ANCIENT_CORPORA_WORKS.philo['opif']).toBeDefined();
		expect(ANCIENT_CORPORA_WORKS.josephus['ant']).toBeDefined();
		expect(ANCIENT_CORPORA_WORKS.josephus['war']).toBeDefined();
	});

	it('formats Apostolic Fathers citations as Chapter:Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'af', workCode: '1-clem', chapter: 5, section: 1 }))
			.toBe('1 Clem. 5:1');
		expect(formatAncientCorpusCitation({ corpusId: 'af', workCode: 'did', chapter: 1, section: 2 }))
			.toBe('Did. 1:2');
	});

	it('formats Philo citations as Section or Book.Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'philo', workCode: 'opif', section: 15 }))
			.toBe('Opif. 15');
		expect(formatAncientCorpusCitation({ corpusId: 'philo', workCode: 'leg', book: 1, section: 25 }))
			.toBe('Leg. 1.25');
	});

	it('formats Josephus citations as Book.Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', workCode: 'ant', book: 1, section: 18 }))
			.toBe('Ant. 1.18');
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', workCode: 'war', book: 2, section: 120 }))
			.toBe('War 2.120');
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', workCode: 'life', section: 5 }))
			.toBe('Life 5');
	});
});
