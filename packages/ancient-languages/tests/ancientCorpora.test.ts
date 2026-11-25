import { describe, it, expect } from 'vitest';
import {
	formatAncientCorpusCitation,
	formatVersionAcademicCitations
} from '../src/citations/index.js';
import type { TextVersionConfig } from '../src/ancient-corpora-types.js';

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

	it('generates multi-style academic citations for Greek and English editions with full bibliographic data', () => {
		const lakeGrc: TextVersionConfig = {
			id: 'af_lake_grc',
			language: 'grc',
			title: 'Kirsopp Lake Greek Critical Text (1912)',
			shortTitle: 'Lake Greek',
			isDefaultVisible: true,
			order: 1,
			bibliographic: {
				role: 'critical_edition',
				editor: 'Kirsopp Lake',
				booktitle: 'The Apostolic Fathers',
				series: 'Loeb Classical Library',
				publisher: 'Harvard University Press',
				address: 'Cambridge, MA',
				year: '1912'
			}
		};

		const lakeEng: TextVersionConfig = {
			id: 'af_lake_eng',
			language: 'eng',
			title: 'Kirsopp Lake English Translation (1912)',
			shortTitle: 'English (Lake)',
			isDefaultVisible: true,
			order: 2,
			bibliographic: {
				role: 'translation',
				translator: 'Kirsopp Lake',
				booktitle: 'The Apostolic Fathers',
				series: 'Loeb Classical Library',
				publisher: 'Harvard University Press',
				address: 'Cambridge, MA',
				year: '1912',
				sblQualifier: '(trans. Lake)'
			}
		};

		const work = {
			code: '1CLE',
			titleEnglish: '1 Clement',
			titleGreek: 'Κλήμεντος πρὸς Κορινθίους Α΄',
			abbrev: '1 Clem.'
		};

		const grcCites = formatVersionAcademicCitations({
			corpusConfig: { id: 'af', name: 'Apostolic Fathers', author: 'Early Christian Fathers' },
			version: lakeGrc,
			work,
			division: 1,
			section: 2
		});

		const sblGrc = grcCites.find((c) => c.id === 'sbl')?.citationText;
		const chicagoGrc = grcCites.find((c) => c.id === 'chicago')?.citationText;
		const bibtexGrc = grcCites.find((c) => c.id === 'bibtex')?.citationText;

		expect(sblGrc).toBe('1 Clem. 1:2');
		expect(chicagoGrc).toContain('Kirsopp Lake');
		expect(chicagoGrc).toContain('The Apostolic Fathers');
		expect(bibtexGrc).toContain('af_lake_grc_1cle_1_s2');
		expect(bibtexGrc).toContain('editor    = {Kirsopp Lake}');

		const engCites = formatVersionAcademicCitations({
			corpusConfig: { id: 'af', name: 'Apostolic Fathers', author: 'Early Christian Fathers' },
			version: lakeEng,
			work,
			division: 1,
			section: 2
		});

		const sblEng = engCites.find((c) => c.id === 'sbl')?.citationText;
		const chicagoEng = engCites.find((c) => c.id === 'chicago')?.citationText;
		const bibtexEng = engCites.find((c) => c.id === 'bibtex')?.citationText;

		expect(sblEng).toBe('1 Clem. 1:2 (trans. Lake)');
		expect(chicagoEng).toContain('trans. Kirsopp Lake');
		expect(bibtexEng).toContain('translator= {Kirsopp Lake}');
	});
});
