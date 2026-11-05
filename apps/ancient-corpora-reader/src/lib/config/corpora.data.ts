/**
 * Corpus Works Catalog for Ancient Corpora Reader (ACR).
 * 
 * Standardizes work metadata, codes, titles, and division structures
 * across Apostolic Fathers, Philo of Alexandria, and Flavius Josephus.
 * 
 * Replaces and supersedes legacy canonicalWorks.ts and canonicalWorks.data.ts.
 */

import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { getCorpusConfig } from './corpora.js';

export interface CorpusWork {
	corpusId: AncientCorpusId;
	code: string;                  // Canonical uppercase code ('1CLE', 'OPIF', 'Antiquities')
	slug: string;                  // URL-friendly slug ('1-clement', 'opif', 'antiquities')
	orderIndex: number;
	category: string;
	abbrev: string;                // Standard academic abbreviation ('1 Clem.', 'Opif.', 'Ant. Iud.')
	titleEnglish: string;
	titlePrimary: string;          // Primary language title (Greek)
	titleSecondary?: string;       // Secondary language title (Latin)
	titleGreek: string;            // Direct alias for titlePrimary
	titleLatin?: string;           // Direct alias for titleSecondary
	totalDivisions: number;        // Total books or chapters
	minDivision: number;           // Usually 1 (0 for 1 Clement preface)
	divisionLabel: 'Book' | 'Chapter';
	sectionsByDivision?: Record<number | string, number>;
	coordinateScheme?: 'book_only' | 'division_both';
}

// Backward-compatibility alias
export type UnifiedCanonicalWork = CorpusWork;

export interface DivisionCoordinates {
	book: number;
	chapter: number;
}

function slugify(text: string): string {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const RAW_AF_WORKS = [
	{
		code: '1CLE',
		orderIndex: 1,
		category: 'epistle',
		titleEnglish: '1 Clement',
		titleGreek: 'Κλήμεντος πρὸς Κορινθίους Α΄',
		titleLatin: 'Clementis ad Corinthios I',
		minChapter: 0,
		totalChapters: 65
	},
	{
		code: '2CLE',
		orderIndex: 2,
		category: 'homily',
		titleEnglish: '2 Clement',
		titleGreek: 'Κλήμεντος πρὸς Κορινθίους Β΄',
		titleLatin: 'Clementis ad Corinthios II',
		minChapter: 1,
		totalChapters: 20
	},
	{
		code: 'IGN_EPH',
		orderIndex: 3,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Ephesians',
		titleGreek: 'Ἰγνατίου πρὸς Ἐφεσίους',
		titleLatin: 'Ignatii ad Ephesios',
		minChapter: 0,
		totalChapters: 21
	},
	{
		code: 'IGN_MAG',
		orderIndex: 4,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Magnesians',
		titleGreek: 'Ἰγνατίου πρὸς Μαγνησιεῖς',
		titleLatin: 'Ignatii ad Magnesios',
		minChapter: 0,
		totalChapters: 15
	},
	{
		code: 'IGN_TRA',
		orderIndex: 5,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Trallians',
		titleGreek: 'Ἰγνατίου πρὸς Τραλλιανούς',
		titleLatin: 'Ignatii ad Trallianos',
		minChapter: 0,
		totalChapters: 13
	},
	{
		code: 'IGN_ROM',
		orderIndex: 6,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Romans',
		titleGreek: 'Ἰγνατίου πρὸς Ῥωμαίους',
		titleLatin: 'Ignatii ad Romanos',
		minChapter: 0,
		totalChapters: 10
	},
	{
		code: 'IGN_PHL',
		orderIndex: 7,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Philadelphians',
		titleGreek: 'Ἰγνατίου πρὸς Φιλαδελφεῖς',
		titleLatin: 'Ignatii ad Philadelphenos',
		minChapter: 0,
		totalChapters: 11
	},
	{
		code: 'IGN_SMY',
		orderIndex: 8,
		category: 'epistle',
		titleEnglish: 'Ignatius to the Smyrnaeans',
		titleGreek: 'Ἰγνατίου πρὸς Σμυρναίους',
		titleLatin: 'Ignatii ad Smyrnaeos',
		minChapter: 0,
		totalChapters: 13
	},
	{
		code: 'IGN_POL',
		orderIndex: 9,
		category: 'epistle',
		titleEnglish: 'Ignatius to Polycarp',
		titleGreek: 'Ἰγνατίου πρὸς Πολύκαρπον',
		titleLatin: 'Ignatii ad Polycarpum',
		minChapter: 0,
		totalChapters: 8
	},
	{
		code: 'POL_PHI',
		orderIndex: 10,
		category: 'epistle',
		titleEnglish: 'Polycarp to the Philippians',
		titleGreek: 'Πολυκάρπου πρὸς Φιλιππησίους',
		titleLatin: 'Polycarpi ad Philippenses',
		minChapter: 0,
		totalChapters: 14
	},
	{
		code: 'DID',
		orderIndex: 11,
		category: 'order',
		titleEnglish: 'Didache',
		titleGreek: 'Διδαχὴ τῶν δώδεκα ἀποστόλων',
		titleLatin: 'Doctrina duodecim apostolorum',
		minChapter: 0,
		totalChapters: 16
	},
	{
		code: 'BAR',
		orderIndex: 12,
		category: 'treatise',
		titleEnglish: 'Epistle of Barnabas',
		titleGreek: 'Βαρνάβα ἐπιστολή',
		titleLatin: 'Barnabae epistula',
		minChapter: 1,
		totalChapters: 21
	},
	{
		code: 'HER',
		orderIndex: 13,
		category: 'apocalypse',
		titleEnglish: 'Shepherd of Hermas',
		titleGreek: 'Ποιμὴν τοῦ Ἑρμᾶ',
		titleLatin: 'Pastoris Hermae',
		minChapter: 1,
		totalChapters: 27
	},
	{
		code: 'MAR_POL',
		orderIndex: 14,
		category: 'martyrology',
		titleEnglish: 'Martyrdom of Polycarp',
		titleGreek: 'Μαρτύριον τοῦ ἁγίου Πολυκάρπου',
		titleLatin: 'Martyrium Polycarpi',
		minChapter: 0,
		totalChapters: 22
	},
	{
		code: 'DIOG',
		orderIndex: 15,
		category: 'apology',
		titleEnglish: 'Epistle to Diognetus',
		titleGreek: 'Πρὸς Διόγνητον ἐπιστολή',
		titleLatin: 'Epistula ad Diognetum',
		minChapter: 1,
		totalChapters: 12
	}
];

const RAW_PHILO_WORKS = [
	{
		code: 'OPIF',
		tlgId: 'tlg001',
		orderIndex: 1,
		category: 'allegorical',
		abbrev: 'Opif.',
		titleEnglish: 'On the Creation of the World',
		titleGreek: 'Περὶ τῆς κατὰ Μωυσέα κοσμοποιίας',
		titleLatin: 'De Opificio Mundi',
		totalBooks: 1,
		totalSections: 172,
		sectionsByBook: { '1': 172 }
	},
	{
		code: 'LEG',
		tlgId: 'tlg002',
		orderIndex: 2,
		category: 'allegorical',
		abbrev: 'Leg.',
		titleEnglish: 'Allegorical Interpretation',
		titleGreek: 'Νόμων ἱερῶν ἀλληγορίαι',
		titleLatin: 'Legum Allegoriarum Libri I-III',
		totalBooks: 3,
		totalSections: 472,
		sectionsByBook: { '1': 108, '2': 108, '3': 253 }
	},
	{
		code: 'CHER',
		tlgId: 'tlg003',
		orderIndex: 3,
		category: 'allegorical',
		abbrev: 'Cher.',
		titleEnglish: 'On the Cherubim',
		titleGreek: 'Περὶ τῶν Χερουβὶμ',
		titleLatin: 'De Cherubim',
		totalBooks: 1,
		totalSections: 130,
		sectionsByBook: { '1': 130 }
	},
	{
		code: 'SACR',
		tlgId: 'tlg004',
		orderIndex: 4,
		category: 'allegorical',
		abbrev: 'Sacr.',
		titleEnglish: 'On the Sacrifices of Abel and Cain',
		titleGreek: 'Περὶ θυσιῶν Ἄβελ καὶ Κάιν',
		titleLatin: 'De Sacrificiis Abelis et Caini',
		totalBooks: 1,
		totalSections: 139,
		sectionsByBook: { '1': 139 }
	},
	{
		code: 'DET',
		tlgId: 'tlg005',
		orderIndex: 5,
		category: 'allegorical',
		abbrev: 'Det.',
		titleEnglish: 'That the Worse Attacks the Better',
		titleGreek: 'Περὶ τοῦ τὸ χεῖρον τῷ κρείττονι φιλεῖν ἐπιτίθεσθαι',
		titleLatin: 'Quod Deterius Potiori Insidiari Soleat',
		totalBooks: 1,
		totalSections: 178,
		sectionsByBook: { '1': 178 }
	},
	{
		code: 'POST',
		tlgId: 'tlg006',
		orderIndex: 6,
		category: 'allegorical',
		abbrev: 'Post.',
		titleEnglish: 'On the Posterity of Cain',
		titleGreek: 'Περὶ τῶν τοῦ δοκησισόφου Κάιν ἐγγόνων',
		titleLatin: 'De Posteritate Caini',
		totalBooks: 1,
		totalSections: 185,
		sectionsByBook: { '1': 185 }
	},
	{
		code: 'GIG',
		tlgId: 'tlg007',
		orderIndex: 7,
		category: 'allegorical',
		abbrev: 'Gig.',
		titleEnglish: 'On the Giants',
		titleGreek: 'Περὶ γιγάντων',
		titleLatin: 'De Gigantibus',
		totalBooks: 1,
		totalSections: 67,
		sectionsByBook: { '1': 67 }
	},
	{
		code: 'DEUS',
		tlgId: 'tlg008',
		orderIndex: 8,
		category: 'allegorical',
		abbrev: 'Deus',
		titleEnglish: 'That God Is Unchangeable',
		titleGreek: 'Περὶ τοῦ ἄτρεπτον εἶναι τὸ θεῖον',
		titleLatin: 'Quod Deus Sit Immutabilis',
		totalBooks: 1,
		totalSections: 183,
		sectionsByBook: { '1': 183 }
	},
	{
		code: 'AGR',
		tlgId: 'tlg009',
		orderIndex: 9,
		category: 'allegorical',
		abbrev: 'Agr.',
		titleEnglish: 'On Agriculture',
		titleGreek: 'Περὶ γεωργίας',
		titleLatin: 'De Agricultura',
		totalBooks: 1,
		totalSections: 181,
		sectionsByBook: { '1': 181 }
	},
	{
		code: 'PLANT',
		tlgId: 'tlg010',
		orderIndex: 10,
		category: 'allegorical',
		abbrev: 'Plant.',
		titleEnglish: 'On Planting',
		titleGreek: 'Περὶ φυτουργίας',
		titleLatin: 'De Plantatione',
		totalBooks: 1,
		totalSections: 177,
		sectionsByBook: { '1': 177 }
	},
	{
		code: 'EBR',
		tlgId: 'tlg011',
		orderIndex: 11,
		category: 'allegorical',
		abbrev: 'Ebr.',
		titleEnglish: 'On Drunkenness',
		titleGreek: 'Περὶ μέθης',
		titleLatin: 'De Ebrietate',
		totalBooks: 1,
		totalSections: 224,
		sectionsByBook: { '1': 224 }
	},
	{
		code: 'SOBR',
		tlgId: 'tlg012',
		orderIndex: 12,
		category: 'allegorical',
		abbrev: 'Sobr.',
		titleEnglish: 'On Sobriety',
		titleGreek: 'Περὶ ὧν νήψας ὁ Νῶε εὔχεται καὶ καταρᾶται',
		titleLatin: 'De Sobrietate',
		totalBooks: 1,
		totalSections: 69,
		sectionsByBook: { '1': 69 }
	},
	{
		code: 'CONF',
		tlgId: 'tlg013',
		orderIndex: 13,
		category: 'allegorical',
		abbrev: 'Conf.',
		titleEnglish: 'On the Confusion of Tongues',
		titleGreek: 'Περὶ συγχύσεως διαλέκτων',
		titleLatin: 'De Confusione Linguarum',
		totalBooks: 1,
		totalSections: 198,
		sectionsByBook: { '1': 198 }
	},
	{
		code: 'MIGR',
		tlgId: 'tlg014',
		orderIndex: 14,
		category: 'allegorical',
		abbrev: 'Migr.',
		titleEnglish: 'On the Migration of Abraham',
		titleGreek: 'Περὶ τῆς μεταναστάσεως Ἀβραάμ',
		titleLatin: 'De Migratione Abrahami',
		totalBooks: 1,
		totalSections: 225,
		sectionsByBook: { '1': 225 }
	},
	{
		code: 'HER',
		tlgId: 'tlg015',
		orderIndex: 15,
		category: 'allegorical',
		abbrev: 'Her.',
		titleEnglish: 'Who Is the Heir of Divine Things',
		titleGreek: 'Περὶ τοῦ τίς ὁ τῶν θείων ἐστὶ κληρονόμος',
		titleLatin: 'Quis Rerum Divinarum Heres Sit',
		totalBooks: 1,
		totalSections: 316,
		sectionsByBook: { '1': 316 }
	},
	{
		code: 'CONGR',
		tlgId: 'tlg016',
		orderIndex: 16,
		category: 'allegorical',
		abbrev: 'Congr.',
		titleEnglish: 'On Mating with the Preliminary Studies',
		titleGreek: 'Περὶ τῆς πρὸς τὰ προπαιδεύματα συνόδου',
		titleLatin: 'De Congressu Eruditionis Gratia',
		totalBooks: 1,
		totalSections: 180,
		sectionsByBook: { '1': 180 }
	},
	{
		code: 'FUG',
		tlgId: 'tlg017',
		orderIndex: 17,
		category: 'allegorical',
		abbrev: 'Fug.',
		titleEnglish: 'On Flight and Finding',
		titleGreek: 'Περὶ φυγῆς καὶ εὑρέσεως',
		titleLatin: 'De Fuga Et Inventione',
		totalBooks: 1,
		totalSections: 213,
		sectionsByBook: { '1': 213 }
	},
	{
		code: 'MUT',
		tlgId: 'tlg018',
		orderIndex: 18,
		category: 'allegorical',
		abbrev: 'Mut.',
		titleEnglish: 'On the Change of Names',
		titleGreek: 'Περὶ τῶν μετονομαζομένων',
		titleLatin: 'De Mutatione Nominum',
		totalBooks: 1,
		totalSections: 270,
		sectionsByBook: { '1': 270 }
	},
	{
		code: 'SOMN',
		tlgId: 'tlg019',
		orderIndex: 19,
		category: 'allegorical',
		abbrev: 'Somn.',
		titleEnglish: 'On Dreams',
		titleGreek: 'Περὶ τοῦ θεοπέμπτους εἶναι τοὺς ὀνείρους',
		titleLatin: 'De Somniis',
		totalBooks: 2,
		totalSections: 560,
		sectionsByBook: { '1': 256, '2': 302 }
	},
	{
		code: 'ABR',
		tlgId: 'tlg020',
		orderIndex: 20,
		category: 'exposition',
		abbrev: 'Abr.',
		titleEnglish: 'On Abraham',
		titleGreek: 'Βίος σοφοῦ τοῦ κατὰ διδασκαλίαν τελειωθέντος ἢ περὶ Ἀβραάμ',
		titleLatin: 'De Abrahamo',
		totalBooks: 1,
		totalSections: 276,
		sectionsByBook: { '1': 276 }
	},
	{
		code: 'IOS',
		tlgId: 'tlg021',
		orderIndex: 21,
		category: 'exposition',
		abbrev: 'Ios.',
		titleEnglish: 'On Joseph',
		titleGreek: 'Βίος πολιτικοῦ ὅπερ ἐστὶ περὶ Ἰωσήφ',
		titleLatin: 'De Josepho',
		totalBooks: 1,
		totalSections: 270,
		sectionsByBook: { '1': 270 }
	},
	{
		code: 'MOS',
		tlgId: 'tlg022',
		orderIndex: 22,
		category: 'exposition',
		abbrev: 'Mos.',
		titleEnglish: 'On the Life of Moses',
		titleGreek: 'Περὶ τοῦ βίου Μωυσέως',
		titleLatin: 'De Vita Mosis',
		totalBooks: 2,
		totalSections: 628,
		sectionsByBook: { '1': 334, '2': 292 }
	},
	{
		code: 'DECAL',
		tlgId: 'tlg023',
		orderIndex: 23,
		category: 'exposition',
		abbrev: 'Decal.',
		titleEnglish: 'On the Decalogue',
		titleGreek: 'Περὶ τῶν δέκα λογίων',
		titleLatin: 'De Decalogo',
		totalBooks: 1,
		totalSections: 178,
		sectionsByBook: { '1': 178 }
	},
	{
		code: 'SPEC',
		tlgId: 'tlg024',
		orderIndex: 24,
		category: 'exposition',
		abbrev: 'Spec.',
		titleEnglish: 'On the Special Laws',
		titleGreek: 'Περὶ τῶν ἐν μέρει διαταγμάτων',
		titleLatin: 'De Specialibus Legibus',
		totalBooks: 4,
		totalSections: 1054,
		sectionsByBook: { '1': 345, '2': 262, '3': 209, '4': 238 }
	},
	{
		code: 'VIRT',
		tlgId: 'tlg025',
		orderIndex: 25,
		category: 'exposition',
		abbrev: 'Virt.',
		titleEnglish: 'On the Virtues',
		titleGreek: 'Περὶ ἀρετῶν',
		titleLatin: 'De Virtutibus',
		totalBooks: 1,
		totalSections: 227,
		sectionsByBook: { '1': 227 }
	},
	{
		code: 'PRAEM',
		tlgId: 'tlg026',
		orderIndex: 26,
		category: 'exposition',
		abbrev: 'Praem.',
		titleEnglish: 'On Rewards and Punishments',
		titleGreek: 'Περὶ ἄθλων καὶ ἐπιτιμίων',
		titleLatin: 'De Praemiis Et Poenis',
		totalBooks: 1,
		totalSections: 172,
		sectionsByBook: { '1': 172 }
	},
	{
		code: 'PROB',
		tlgId: 'tlg027',
		orderIndex: 27,
		category: 'philosophical',
		abbrev: 'Prob.',
		titleEnglish: 'That Every Good Man Is Free',
		titleGreek: 'Περὶ τοῦ πάντα σπουδαῖον ἐλεύθερον εἶναι',
		titleLatin: 'Quod Omnis Probus Liber Sit',
		totalBooks: 1,
		totalSections: 160,
		sectionsByBook: { '1': 160 }
	},
	{
		code: 'CONTEMPL',
		tlgId: 'tlg028',
		orderIndex: 28,
		category: 'historical',
		abbrev: 'Contempl.',
		titleEnglish: 'On the Contemplative Life',
		titleGreek: 'Περὶ βίου θεωρητικοῦ ἢ ἱκετῶν',
		titleLatin: 'De Vita Contemplativa',
		totalBooks: 1,
		totalSections: 90,
		sectionsByBook: { '1': 90 }
	},
	{
		code: 'AET',
		tlgId: 'tlg029',
		orderIndex: 29,
		category: 'philosophical',
		abbrev: 'Aet.',
		titleEnglish: 'On the Eternity of the World',
		titleGreek: 'Περὶ ἀφθαρσίας κόσμου',
		titleLatin: 'De Aeternitate Mundi',
		totalBooks: 1,
		totalSections: 150,
		sectionsByBook: { '1': 150 }
	},
	{
		code: 'FLACC',
		tlgId: 'tlg030',
		orderIndex: 30,
		category: 'historical',
		abbrev: 'Flacc.',
		titleEnglish: 'Against Flaccus',
		titleGreek: 'Εἰς Φλάκκον',
		titleLatin: 'In Flaccum',
		totalBooks: 1,
		totalSections: 191,
		sectionsByBook: { '1': 191 }
	},
	{
		code: 'LEGAT',
		tlgId: 'tlg031',
		orderIndex: 31,
		category: 'historical',
		abbrev: 'Legat.',
		titleEnglish: 'On the Embassy to Gaius',
		titleGreek: 'Πρεσβεία πρὸς Γάιον',
		titleLatin: 'Legatio Ad Gaium',
		totalBooks: 1,
		totalSections: 373,
		sectionsByBook: { '1': 373 }
	}
];

const RAW_JOSEPHUS_WORKS = [
	{
		code: 'Antiquities',
		tlgId: '0526.001',
		orderIndex: 1,
		category: 'history',
		abbrev: 'Ant. Iud.',
		titleEnglish: 'Antiquities of the Jews',
		titleGreek: 'Ἰουδαϊκὴ Ἀρχαιολογία',
		titleLatin: 'Antiquitates Judaicae',
		totalBooks: 20,
		defaultBook: 1,
		sectionsByBook: {
			'1': 84, '2': 76, '3': 79, '4': 88, '5': 98, '6': 83, '7': 76, '8': 85,
			'9': 54, '10': 52, '11': 54, '12': 68, '13': 87, '14': 111, '15': 67,
			'16': 61, '17': 61, '18': 57, '19': 52, '20': 51
		}
	},
	{
		code: 'War',
		tlgId: '0526.004',
		orderIndex: 2,
		category: 'history',
		abbrev: 'Bel. Iud.',
		titleEnglish: 'The Jewish War',
		titleGreek: 'Ἰουδαϊκὸς Πόλεμος',
		titleLatin: 'Bellum Judaicum',
		totalBooks: 7,
		defaultBook: 1,
		sectionsByBook: {
			'1': 234, '2': 143, '3': 88, '4': 78, '5': 65, '6': 52, '7': 47
		}
	},
	{
		code: 'Life',
		tlgId: '0526.002',
		orderIndex: 3,
		category: 'autobiography',
		abbrev: 'Vita',
		titleEnglish: 'The Life of Flavius Josephus',
		titleGreek: 'Ἰωσήπου Βίος',
		titleLatin: 'Vita',
		totalBooks: 1,
		defaultBook: 1,
		sectionsByBook: { '1': 76 }
	},
	{
		code: 'Apion',
		tlgId: '0526.003',
		orderIndex: 4,
		category: 'apology',
		abbrev: 'Con. Ap.',
		titleEnglish: 'Against Apion',
		titleGreek: 'Περὶ τῆς τῶν Ἰουδαίων ἀρχαιότητος (Κατʼ Ἀπίωνος)',
		titleLatin: 'Contra Apionem',
		totalBooks: 2,
		defaultBook: 1,
		sectionsByBook: { '1': 35, '2': 42 }
	}
];

export const AF_WORKS: CorpusWork[] = RAW_AF_WORKS.map((w) => ({
	corpusId: 'af',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: w.orderIndex,
	category: w.category,
	abbrev: w.titleEnglish.split(' ')[0] + '.',
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	titleGreek: w.titleGreek,
	titleLatin: w.titleLatin,
	totalDivisions: w.totalChapters,
	minDivision: w.minChapter ?? 1,
	divisionLabel: 'Chapter',
	coordinateScheme: 'division_both'
}));

export const PHILO_WORKS: CorpusWork[] = (RAW_PHILO_WORKS as any[]).map((w, idx) => ({
	corpusId: 'philo',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: idx + 1,
	category: w.category || 'treatise',
	abbrev: w.abbrev,
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	titleGreek: w.titleGreek,
	titleLatin: w.titleLatin,
	totalDivisions: w.totalBooks,
	minDivision: 1,
	divisionLabel: w.totalBooks > 1 ? 'Book' : 'Chapter',
	sectionsByDivision: w.sectionsByBook,
	coordinateScheme: 'division_both'
}));

export const JOSEPHUS_WORKS: CorpusWork[] = (RAW_JOSEPHUS_WORKS as any[]).map((w, idx) => ({
	corpusId: 'josephus',
	code: w.code,
	slug: slugify(w.code),
	orderIndex: idx + 1,
	category: w.category || 'history',
	abbrev: w.abbrev,
	titleEnglish: w.titleEnglish,
	titlePrimary: w.titleGreek,
	titleSecondary: w.titleLatin,
	titleGreek: w.titleGreek,
	titleLatin: w.titleLatin,
	totalDivisions: w.totalBooks,
	minDivision: 1,
	divisionLabel: 'Book',
	sectionsByDivision: w.sectionsByBook,
	coordinateScheme: 'book_only'
}));

export const ALL_CORPUS_WORKS: Record<AncientCorpusId, CorpusWork[]> = {
	af: AF_WORKS,
	philo: PHILO_WORKS,
	josephus: JOSEPHUS_WORKS
};

// Backward-compatibility alias
export const ALL_CANONICAL_WORKS = ALL_CORPUS_WORKS;

/**
 * Resolves the database storage coordinates (book, chapter) for a division
 * based on the work's structural metadata. Supports both (work, division)
 * and (corpusId, workCode, division).
 */
export function resolveDivisionCoordinates(
	work: CorpusWork | undefined,
	division: number
): DivisionCoordinates;
export function resolveDivisionCoordinates(
	corpusId: AncientCorpusId | string,
	workCode: string,
	division: number
): DivisionCoordinates;
export function resolveDivisionCoordinates(
	workOrCorpus: CorpusWork | AncientCorpusId | string | undefined,
	divisionOrCode: number | string,
	maybeDivision?: number
): DivisionCoordinates {
	let work: CorpusWork | undefined;
	let division: number;

	if (typeof workOrCorpus === 'string' && typeof divisionOrCode === 'string') {
		work = findWork(workOrCorpus as AncientCorpusId, divisionOrCode);
		division = typeof maybeDivision === 'number' ? maybeDivision : 1;
	} else if (typeof workOrCorpus === 'object' || workOrCorpus === undefined) {
		work = workOrCorpus;
		division = typeof divisionOrCode === 'number' ? divisionOrCode : 1;
	} else {
		division = 1;
	}

	const scheme = work?.coordinateScheme || (work?.corpusId ? getCorpusConfig(work.corpusId).coordinateScheme : 'division_both');
	if (scheme === 'book_only') {
		return { book: division, chapter: 0 };
	}
	return { book: division, chapter: division };
}

/**
 * Returns all works for a given corpus.
 */
export function getCorpusWorks(corpusId: AncientCorpusId | string): CorpusWork[] {
	return ALL_CORPUS_WORKS[corpusId as AncientCorpusId] || [];
}

/**
 * Finds a work within a corpus by code, slug, abbreviation, or title.
 */
export function findWork(corpusId: AncientCorpusId | string, codeOrSlug: string): CorpusWork | undefined {
	const list = getCorpusWorks(corpusId);
	if (!codeOrSlug) return list[0];
	const norm = slugify(codeOrSlug);

	// 1. Exact match on code, slug, English title, Greek title, Latin title, or abbrev
	const exact = list.find(
		(w) =>
			slugify(w.code) === norm ||
			w.slug === norm ||
			slugify(w.titleEnglish) === norm ||
			(w.titleSecondary && slugify(w.titleSecondary) === norm) ||
			(w.titleLatin && slugify(w.titleLatin) === norm) ||
			slugify(w.abbrev) === norm
	);
	if (exact) return exact;

	// 2. Prefix / alias match (e.g. 'ant' -> 'antiquities', 'war' -> 'war')
	return list.find(
		(w) =>
			w.slug.startsWith(norm) ||
			norm.startsWith(w.slug) ||
			slugify(w.titleEnglish).startsWith(norm) ||
			slugify(w.abbrev).startsWith(norm)
	);
}
