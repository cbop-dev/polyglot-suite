import { getWork, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
import type { AcademicCitationStyle } from '@polyglot/ancient-languages';

export function formatLocus(workCode: string, book: number, section?: string | number | null): string {
	const work = getWork(workCode);
	const abbrev = work?.abbrev || workCode;
	const secStr = section ? ` § ${section}` : '';
	return `${abbrev} ${book}${secStr}`;
}

export function generateAcademicCitations(
	workCode: string,
	book: number,
	section: string | number | null = null,
	edition: 'grc' | 'eng' = 'grc'
): AcademicCitationStyle[] {
	const work = getWork(workCode);
	const workTitle = edition === 'grc' ? (work?.titleLatin || workCode) : (work?.titleEnglish || workCode);
	const locus = section ? `${book}.${section}` : `${book}`;
	const citeRef = `${work?.abbrev || workCode} ${locus}`;

	if (edition === 'grc') {
		const chicago = `Flavius Josephus, ${workTitle} ${locus}, in Flavii Iosephi Opera, ed. Benedikt Niese (Berlin: Weidmann, 1887–1890).`;
		const mla = `Josephus, Flavius. "${workTitle} ${locus}." Flavii Iosephi Opera, edited by Benedikt Niese, Weidmann, 1887–1890.`;
		const sbl = `Josephus, ${citeRef} (Niese).`;
		const bibtex = `@book{josephus_niese_${workCode.toLowerCase()},
  author    = {Flavius Josephus},
  title     = {Flavii Iosephi Opera},
  editor    = {Benedikt Niese},
  publisher = {Weidmann},
  address   = {Berlin},
  year      = {1887--1890},
  note      = {${citeRef}}
}`;

		return [
			{ id: 'chicago', name: 'Chicago / Turabian', description: 'Standard humanities footnote format', citationText: chicago },
			{ id: 'sbl', name: 'SBL Handbook of Style', description: 'Society of Biblical Literature classical citation', citationText: sbl },
			{ id: 'mla', name: 'MLA 9th Edition', description: 'Modern Language Association bibliography style', citationText: mla },
			{ id: 'bibtex', name: 'BibTeX Entry', description: 'LaTeX bibliography item', citationText: bibtex }
		];
	} else {
		const chicago = `Flavius Josephus, The Works of Flavius Josephus, trans. William Whiston (Auburn and Rochester: Alden and Beardsley, 1856), ${citeRef}.`;
		const mla = `Josephus, Flavius. The Works of Flavius Josephus. Translated by William Whiston, Alden and Beardsley, 1856, ${citeRef}.`;
		const sbl = `Josephus, ${citeRef} (Whiston).`;
		const bibtex = `@book{josephus_whiston_${workCode.toLowerCase()},
  author    = {Flavius Josephus},
  title     = {The Works of Flavius Josephus},
  translator= {William Whiston},
  publisher = {Alden and Beardsley},
  address   = {Auburn and Rochester},
  year      = {1856},
  note      = {${citeRef}}
}`;

		return [
			{ id: 'chicago', name: 'Chicago / Turabian', description: 'Standard humanities footnote format', citationText: chicago },
			{ id: 'sbl', name: 'SBL Handbook of Style', description: 'Society of Biblical Literature classical citation', citationText: sbl },
			{ id: 'mla', name: 'MLA 9th Edition', description: 'Modern Language Association bibliography style', citationText: mla },
			{ id: 'bibtex', name: 'BibTeX Entry', description: 'LaTeX bibliography item', citationText: bibtex }
		];
	}
}
