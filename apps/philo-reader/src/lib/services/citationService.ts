/**
 * Academic Citation Generator for Philo of Alexandria.
 * Generates scholarly citations adhering to SBL Handbook of Style (2nd ed.),
 * Cohn-Wendland edition, Thomas Mangey volume/page milestones, Chicago, MLA, and BibTeX.
 */

import { WORKS_BY_CODE, type CanonicalWork } from '$lib/config/canonicalWorks.generated';

export interface AcademicCitationStyle {
	id: string;
	name: string;
	description: string;
	citationText: string;
}

export function formatLocus(
	workCode: string,
	chapter: number,
	section?: number | null,
	mangeyRef?: string | null
): string {
	const work = WORKS_BY_CODE[workCode];
	const abbrev = work ? work.abbrev : workCode;
	let locus = '';

	if (work && work.totalBooks > 1) {
		if (section !== undefined && section !== null) {
			locus = `${abbrev} ${chapter}.${section}`;
		} else {
			locus = `${abbrev} ${chapter}`;
		}
	} else {
		if (section !== undefined && section !== null) {
			locus = `${abbrev} ${section}`;
		} else {
			locus = `${abbrev} 1`;
		}
	}

	if (mangeyRef) {
		locus += ` [${mangeyRef}]`;
	}

	return locus;
}

export function generateAcademicCitations(
	workCode: string,
	chapter: number,
	section?: number | null,
	edition: 'grc' | 'eng' = 'grc',
	mangeyRef?: string | null,
	isSupplement: boolean = false
): AcademicCitationStyle[] {
	const work: CanonicalWork | undefined = WORKS_BY_CODE[workCode];
	const engTitle = work?.titleEnglish || workCode;
	const grcTitle = work?.titleGreek || engTitle;
	const latTitle = work?.titleLatin || engTitle;
	const sblLocus = formatLocus(workCode, chapter, section, mangeyRef);
	const sblClean = formatLocus(workCode, chapter, section, null);

	const secPart = section !== undefined && section !== null ? ` §${section}` : '';
	const bookPart = work && work.totalBooks > 1 ? ` Book ${chapter},` : '';

	if (edition === 'grc') {
		return [
			{
				id: 'sbl-grc',
				name: 'SBL Handbook of Style (2nd ed.)',
				description: 'Standard citation for Cohn-Wendland critical text of Philo',
				citationText: `Philo, ${sblLocus}`
			},
			{
				id: 'chicago-grc',
				name: 'Chicago Manual of Style (Notes & Bibliography)',
				description: 'Full scholarly citation format for Cohn & Wendland critical edition',
				citationText: `Philo, ${latTitle} (${grcTitle}), in Philonis Alexandrini Opera Quae Supersunt, ed. Leopold Cohn and Paul Wendland, 6 vols. (Berlin: Georg Reimer, 1896–1915),${bookPart}${secPart}.`
			},
			{
				id: 'mla-grc',
				name: 'MLA Style (9th ed.)',
				description: 'Modern Language Association citation format',
				citationText: `Philo. "${latTitle}." Philonis Alexandrini Opera Quae Supersunt, edited by Leopold Cohn and Paul Wendland, Georg Reimer, 1896–1915,${bookPart}${secPart}.`
			},
			{
				id: 'bibtex-grc',
				name: 'BibTeX',
				description: 'LaTeX citation entry for Cohn-Wendland Greek edition',
				citationText: `@incollection{philo_grc_${workCode.toLowerCase()}_ch${chapter}_s${section || 1},\n  author    = {Philo of Alexandria},\n  title     = {${latTitle} (${grcTitle})},\n  booktitle = {Philonis Alexandrini Opera Quae Supersunt},\n  editor    = {Cohn, Leopold and Wendland, Paul},\n  publisher = {Georg Reimer},\n  address   = {Berlin},\n  year      = {1896--1915},\n  note      = {Section ${section || 1}${mangeyRef ? `, ${mangeyRef}` : ''}}\n}`
			}
		];
	} else {
		const transNote = isSupplement
			? 'trans. AI Translation (Polyglot Suite Supplement, missing from Yonge 1854)'
			: 'trans. C. D. Yonge (1854)';
		return [
			{
				id: 'sbl-eng',
				name: 'SBL Handbook of Style (2nd ed.)',
				description: 'Standard citation for English translation',
				citationText: `Philo, ${sblLocus} (${transNote})`
			},
			{
				id: 'chicago-eng',
				name: 'Chicago Manual of Style (Notes & Bibliography)',
				description: 'Full scholarly citation format for English translation',
				citationText: `Philo, ${engTitle}, ${transNote}, in The Works of Philo Judaeus, the Contemporary of Josephus (London: H. G. Bohn, 1854–1855),${bookPart}${secPart}.`
			},
			{
				id: 'mla-eng',
				name: 'MLA Style (9th ed.)',
				description: 'Modern Language Association format for English translation',
				citationText: `Philo. "${engTitle}." The Works of Philo Judaeus, translated by C. D. Yonge, H. G. Bohn, 1854–1855,${bookPart}${secPart}.`
			},
			{
				id: 'bibtex-eng',
				name: 'BibTeX',
				description: 'LaTeX citation entry for English translation',
				citationText: `@incollection{philo_eng_${workCode.toLowerCase()}_ch${chapter}_s${section || 1},\n  author     = {Philo of Alexandria},\n  title      = {${engTitle}},\n  booktitle  = {The Works of Philo Judaeus},\n  translator = {${isSupplement ? 'Polyglot Suite (AI Supplemental Translation)' : 'Yonge, C. D.'}},\n  publisher  = {H. G. Bohn},\n  address    = {London},\n  year       = {1854--1855},\n  note       = {Section ${section || 1}${mangeyRef ? `, ${mangeyRef}` : ''}}\n}`
			}
		];
	}
}
