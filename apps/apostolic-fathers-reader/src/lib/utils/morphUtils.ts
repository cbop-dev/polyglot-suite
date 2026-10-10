/**
 * Greek and Latin morphological tag decoder for Apostolic Fathers texts.
 * Translates PROIEL / MorphGNT 8-character morphological codes into
 * clear, human-readable grammatical terminology.
 */

const POS_MAP: Record<string, string> = {
	'V-': 'Verb',
	'N-': 'Noun',
	'NP': 'Proper Noun',
	'A-': 'Adjective',
	'RA': 'Definite Article',
	'RD': 'Demonstrative Pronoun',
	'RI': 'Interrogative / Indefinite Pronoun',
	'RP': 'Personal Pronoun',
	'RR': 'Relative Pronoun',
	'R-': 'Pronoun',
	'C-': 'Conjunction',
	'P-': 'Preposition',
	'D-': 'Adverb',
	'I-': 'Interjection',
	'X-': 'Particle',
	'NU': 'Numeral'
};

const TENSE_MAP: Record<string, string> = {
	P: 'Present',
	I: 'Imperfect',
	F: 'Future',
	A: 'Aorist',
	X: 'Perfect',
	Y: 'Pluperfect'
};

const VOICE_MAP: Record<string, string> = {
	A: 'Active',
	M: 'Middle',
	P: 'Passive',
	E: 'Middle/Passive'
};

const MOOD_MAP: Record<string, string> = {
	I: 'Indicative',
	S: 'Subjunctive',
	O: 'Optative',
	D: 'Imperative',
	M: 'Imperative',
	N: 'Infinitive',
	P: 'Participle'
};

const PERSON_MAP: Record<string, string> = {
	'1': '1st Person',
	'2': '2nd Person',
	'3': '3rd Person'
};

const CASE_MAP: Record<string, string> = {
	N: 'Nominative',
	G: 'Genitive',
	D: 'Dative',
	A: 'Accusative',
	V: 'Vocative'
};

const NUMBER_MAP: Record<string, string> = {
	S: 'Singular',
	P: 'Plural'
};

const GENDER_MAP: Record<string, string> = {
	M: 'Masculine',
	F: 'Feminine',
	N: 'Neuter'
};

const DEGREE_MAP: Record<string, string> = {
	C: 'Comparative',
	S: 'Superlative'
};

export interface DecodedMorph {
	pos: string;
	details: string[];
	summary: string;
	rawCode: string;
}

/**
 * Decodes a Part of Speech tag and 8-character morphological analysis into human-readable labels.
 * E.g.:
 *   decodeMorph('V-', '-AMN----') -> { pos: 'Verb', details: ['Aorist Middle Infinitive'], summary: 'Verb • Aorist Middle Infinitive' }
 *   decodeMorph('V-', '3AAI-S--') -> { pos: 'Verb', details: ['Aorist Active Indicative', '3rd Person Singular'] }
 *   decodeMorph('N-', '----NSF-') -> { pos: 'Noun', details: ['Nominative Singular Feminine'] }
 */
export function decodeMorph(posCode?: string, morphCode?: string): DecodedMorph {
	const posKey = (posCode || '').trim();
	const m = (morphCode || '').trim();
	const rawCode = `${posKey} ${m}`.trim();

	const pos = POS_MAP[posKey] || (posKey ? posKey.replace(/-/g, '') : 'Word');
	const details: string[] = [];

	if (m.length >= 8) {
		const personChar = m[0];
		const tenseChar = m[1];
		const voiceChar = m[2];
		const moodChar = m[3];
		const caseChar = m[4];
		const numberChar = m[5];
		const genderChar = m[6];
		const degreeChar = m[7];

		if (posKey === 'V-') {
			// Verb: Tense + Voice + Mood
			const tvm = [TENSE_MAP[tenseChar], VOICE_MAP[voiceChar], MOOD_MAP[moodChar]]
				.filter(Boolean)
				.join(' ');
			if (tvm) {
				details.push(tvm);
			}

			// Finite verb person & number
			if (PERSON_MAP[personChar]) {
				const pn = [PERSON_MAP[personChar], NUMBER_MAP[numberChar]].filter(Boolean).join(' ');
				if (pn) {
					details.push(pn);
				}
			}

			// Participle case, number, gender
			if (CASE_MAP[caseChar] || NUMBER_MAP[numberChar] || GENDER_MAP[genderChar]) {
				const cng = [CASE_MAP[caseChar], NUMBER_MAP[numberChar], GENDER_MAP[genderChar]]
					.filter(Boolean)
					.join(' ');
				if (cng) {
					details.push(cng);
				}
			}
		} else {
			// Non-verb (Noun, Adjective, Pronoun, Article)
			if (PERSON_MAP[personChar]) {
				details.push(PERSON_MAP[personChar]);
			}

			const cng = [CASE_MAP[caseChar], NUMBER_MAP[numberChar], GENDER_MAP[genderChar]]
				.filter(Boolean)
				.join(' ');
			if (cng) {
				details.push(cng);
			}

			if (DEGREE_MAP[degreeChar]) {
				details.push(DEGREE_MAP[degreeChar]);
			}
		}
	}

	const parts = [pos, ...details];
	const summary = parts.join(' • ');

	return {
		pos,
		details,
		summary,
		rawCode
	};
}
