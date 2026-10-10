/**
 * Academic Citation Generator for the Apostolic Fathers Corpus.
 * Generates scholarly citations adhering to SBL Handbook of Style (2nd ed.),
 * Chicago Manual of Style, MLA, APA, and BibTeX.
 */

import { WORKS_BY_CODE, type CanonicalWork } from '$lib/config/canonicalWorks.generated';

export interface AcademicCitationStyle {
	id: string;
	name: string;
	description: string;
	citationText: string;
}

// Standard SBL abbreviations for Apostolic Fathers works
export const SBL_ABBREVIATIONS: Record<string, string> = {
	'1CLE': '1 Clem.',
	'2CLE': '2 Clem.',
	'IGN_EPH': 'Ign. Eph.',
	'IGN_MAG': 'Ign. Magn.',
	'IGN_TRA': 'Ign. Trall.',
	'IGN_ROM': 'Ign. Rom.',
	'IGN_PHL': 'Ign. Phld.',
	'IGN_SMY': 'Ign. Smyrn.',
	'IGN_POL': 'Ign. Pol.',
	'POL_PHI': 'Pol. Phil.',
	'DID': 'Did.',
	'BAR': 'Barn.',
	'HER': 'Herm.',
	'MAR_POL': 'Mart. Pol.',
	'DIOG': 'Diogn.'
};

export function getSblAbbreviation(workCode: string): string {
	return SBL_ABBREVIATIONS[workCode] || workCode;
}

/**
 * Format standard scholarly locus (e.g. "1 Clem. 5:1", "Ign. Eph. 1:2", "Did. 8:2").
 */
export function formatLocus(workCode: string, chapter: number, section?: number | null): string {
	const abbrev = getSblAbbreviation(workCode);
	if (section !== undefined && section !== null) {
		return `${abbrev} ${chapter}:${section}`;
	}
	return `${abbrev} ${chapter}`;
}

/**
 * Generate academic citations in all major formats for a given work, chapter, and section.
 */
export function generateAcademicCitations(
	workCode: string,
	chapter: number,
	section?: number | null,
	edition: 'grc' | 'eng' | 'lat' = 'grc'
): AcademicCitationStyle[] {
	const work: CanonicalWork | undefined = WORKS_BY_CODE[workCode];
	const engTitle = work?.titleEnglish || workCode;
	const grcTitle = work?.titleGreek || engTitle;
	const latTitle = work?.titleLatin || engTitle;
	const sblAbbrev = getSblAbbreviation(workCode);

	const secPart = section !== undefined && section !== null ? `:${section}` : '';
	const secText = section !== undefined && section !== null ? `, section ${section}` : '';
	const secBib = section !== undefined && section !== null ? `:${section}` : '';
	const bibKeySec = section !== undefined && section !== null ? `_s${section}` : '';

	if (edition === 'grc') {
		return [
			{
				id: 'sbl-grc',
				name: 'SBL Handbook of Style (2nd ed.)',
				description: 'Standard abbreviation for critical Greek text of the Apostolic Fathers',
				citationText: `${sblAbbrev} ${chapter}${secPart}`
			},
			{
				id: 'chicago-grc',
				name: 'Chicago Manual of Style (Notes & Bibliography)',
				description: 'Full scholarly citation format for Kirsopp Lake Loeb Greek critical edition',
				citationText: `${engTitle} (${grcTitle}), in The Apostolic Fathers, ed. Kirsopp Lake, Loeb Classical Library (Cambridge, MA: Harvard University Press, 1912), ${chapter}${secPart}.`
			},
			{
				id: 'mla-grc',
				name: 'MLA Style (9th ed.)',
				description: 'Modern Language Association citation format for Loeb edition',
				citationText: `"${engTitle}." The Apostolic Fathers, edited by Kirsopp Lake, Harvard University Press, 1912, ch. ${chapter}${secText}.`
			},
			{
				id: 'apa-grc',
				name: 'APA Style (7th ed.)',
				description: 'American Psychological Association format',
				citationText: `Lake, K. (Ed.). (1912). ${engTitle} [${grcTitle}]. In The Apostolic Fathers (Vol. 1–2, ch. ${chapter}${secPart}). Harvard University Press.`
			},
			{
				id: 'bibtex-grc',
				name: 'BibTeX',
				description: 'LaTeX citation entry for Kirsopp Lake Greek edition',
				citationText: `@incollection{af_grc_${workCode.toLowerCase()}_ch${chapter}${bibKeySec},\n  author    = {Lake, Kirsopp},\n  title     = {${engTitle} (${grcTitle})},\n  booktitle = {The Apostolic Fathers},\n  series    = {Loeb Classical Library},\n  editor    = {Lake, Kirsopp},\n  publisher = {Harvard University Press},\n  address   = {Cambridge, MA},\n  year      = {1912},\n  chapter   = {${chapter}${secBib}}\n}`
			}
		];
	} else if (edition === 'lat') {
		return [
			{
				id: 'sbl-lat',
				name: 'SBL Handbook of Style (2nd ed.)',
				description: 'Standard citation for Latin text of the Apostolic Fathers',
				citationText: `${sblAbbrev} ${chapter}${secPart} (Latin)`
			},
			{
				id: 'chicago-lat',
				name: 'Chicago Manual of Style (Notes & Bibliography)',
				description: 'Full scholarly citation format for Latin text',
				citationText: `${engTitle} (${latTitle}), in The Apostolic Fathers, ed. Kirsopp Lake, Loeb Classical Library (Cambridge, MA: Harvard University Press, 1912), ${chapter}${secPart}.`
			},
			{
				id: 'bibtex-lat',
				name: 'BibTeX',
				description: 'LaTeX citation entry for Latin text',
				citationText: `@incollection{af_lat_${workCode.toLowerCase()}_ch${chapter}${bibKeySec},\n  author    = {Lake, Kirsopp},\n  title     = {${engTitle} (${latTitle})},\n  booktitle = {The Apostolic Fathers},\n  series    = {Loeb Classical Library},\n  editor    = {Lake, Kirsopp},\n  publisher = {Harvard University Press},\n  address   = {Cambridge, MA},\n  year      = {1912},\n  chapter   = {${chapter}${secBib}}\n}`
			}
		];
	} else {
		return [
			{
				id: 'sbl-eng',
				name: 'SBL Handbook of Style (2nd ed.)',
				description: 'Standard abbreviation for Kirsopp Lake English translation',
				citationText: `${sblAbbrev} ${chapter}${secPart} (trans. Lake)`
			},
			{
				id: 'chicago-eng',
				name: 'Chicago Manual of Style (Notes & Bibliography)',
				description: 'Full scholarly citation format for Kirsopp Lake English translation',
				citationText: `${engTitle}, trans. Kirsopp Lake, in The Apostolic Fathers, Loeb Classical Library (Cambridge, MA: Harvard University Press, 1912), ${chapter}${secPart}.`
			},
			{
				id: 'mla-eng',
				name: 'MLA Style (9th ed.)',
				description: 'Modern Language Association format for Lake translation',
				citationText: `"${engTitle}." The Apostolic Fathers, translated by Kirsopp Lake, Harvard University Press, 1912, ch. ${chapter}${secText}.`
			},
			{
				id: 'apa-eng',
				name: 'APA Style (7th ed.)',
				description: 'APA reference for Kirsopp Lake English translation',
				citationText: `Lake, K. (Trans.). (1912). ${engTitle}. In The Apostolic Fathers (Vol. 1–2, ch. ${chapter}${secPart}). Harvard University Press.`
			},
			{
				id: 'bibtex-eng',
				name: 'BibTeX',
				description: 'LaTeX citation entry for Kirsopp Lake translation',
				citationText: `@incollection{af_eng_${workCode.toLowerCase()}_ch${chapter}${bibKeySec},\n  author     = {Lake, Kirsopp},\n  title      = {${engTitle}},\n  booktitle  = {The Apostolic Fathers},\n  translator = {Lake, Kirsopp},\n  series     = {Loeb Classical Library},\n  publisher  = {Harvard University Press},\n  address    = {Cambridge, MA},\n  year       = {1912},\n  chapter    = {${chapter}${secBib}}\n}`
			}
		];
	}
}
