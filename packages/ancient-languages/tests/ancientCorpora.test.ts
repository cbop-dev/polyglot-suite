import { describe, it, expect } from 'vitest';
import {
	formatAncientCorpusCitation
} from '../src/citations/ancientCorpora.js';

describe('Ancient Corpora Citations', () => {
	it('formats Apostolic Fathers citations as Chapter:Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'af', customAbbrev: '1 Clem.', chapter: 5, section: 1 }))
			.toBe('1 Clem. 5:1');
		expect(formatAncientCorpusCitation({ corpusId: 'af', work: { abbrev: 'Did.' }, chapter: 1, section: 2 }))
			.toBe('Did. 1:2');
		expect(formatAncientCorpusCitation({ corpusId: 'af', work: { abbrev: '1 Clem.' }, division: 5, section: 1 }))
			.toBe('1 Clem. 5:1');
	});

	it('formats Philo citations as Section or Book.Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'philo', customAbbrev: 'Opif.', section: 15 }))
			.toBe('Opif. 15');
		expect(formatAncientCorpusCitation({ corpusId: 'philo', work: { abbrev: 'Leg.' }, book: 1, section: 25 }))
			.toBe('Leg. 1.25');
		expect(formatAncientCorpusCitation({ corpusId: 'philo', work: { abbrev: 'Leg.' }, division: 1, section: 25 }))
			.toBe('Leg. 1.25');
	});

	it('formats Josephus citations as Book.Section', () => {
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', customAbbrev: 'Ant.', book: 1, section: 18 }))
			.toBe('Ant. 1.18');
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', work: { abbrev: 'War' }, book: 2, section: 120 }))
			.toBe('War 2.120');
		expect(formatAncientCorpusCitation({ corpusId: 'josephus', work: { abbrev: 'Life' }, section: 5 }))
			.toBe('Life 5');
	});

	it('formats milestone citations when milestone is provided', () => {
		expect(formatAncientCorpusCitation({ work: { abbrev: 'Ant.' }, milestone: '1.18' }))
			.toBe('Ant. 1.18');
	});
});
