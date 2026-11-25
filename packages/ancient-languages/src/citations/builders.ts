import type { AcademicCitationStyle } from './types.js';
import type { TextVersionConfig } from '../ancient-corpora-types.js';
import { formatAncientCorpusCitation } from './ancientCorpora.js';

export function buildBibtexIncollection(params: {
	key: string;
	author: string;
	title: string;
	booktitle: string;
	editor?: string;
	translator?: string;
	publisher?: string;
	address?: string;
	year: string | number;
	series?: string;
	chapter?: string;
	note?: string;
}): string {
	const lines = [`@incollection{${params.key},`];
	lines.push(`  author    = {${params.author}},`);
	lines.push(`  title     = {${params.title}},`);
	lines.push(`  booktitle = {${params.booktitle}},`);
	if (params.series) lines.push(`  series    = {${params.series}},`);
	if (params.editor) lines.push(`  editor    = {${params.editor}},`);
	if (params.translator) lines.push(`  translator= {${params.translator}},`);
	if (params.publisher) lines.push(`  publisher = {${params.publisher}},`);
	if (params.address) lines.push(`  address   = {${params.address}},`);
	lines.push(`  year      = {${params.year}},`);
	if (params.chapter) lines.push(`  chapter   = {${params.chapter}},`);
	if (params.note) lines.push(`  note      = {${params.note}},`);

	// Remove trailing comma from last line before closing brace
	const lastIdx = lines.length - 1;
	lines[lastIdx] = lines[lastIdx].replace(/,$/, '');
	lines.push('}');
	return lines.join('\n');
}

export interface FormatVersionCitationsParams {
	corpusConfig?: { id: string; name: string; author?: string };
	corpusId?: string;
	version: TextVersionConfig;
	work: {
		code: string;
		titleEnglish: string;
		titleGreek?: string;
		titleLatin?: string;
		abbrev: string;
		divisionLabel?: string;
	};
	division?: number | string;
	section?: number | string;
}

/**
 * Generate scholarly citations (SBL, Chicago, BibTeX) for a specific textual edition or translation.
 */
export function formatVersionAcademicCitations(params: FormatVersionCitationsParams): AcademicCitationStyle[] {
	const { corpusConfig, corpusId, version, work, division, section } = params;
	const bib = version.bibliographic;

	const cid = corpusId || corpusConfig?.id || '';
	const baseLocus = formatAncientCorpusCitation({
		corpusId: cid,
		work,
		division,
		section
	});

	// SBL Style
	let sblText = baseLocus;
	if (bib?.sblQualifier) {
		sblText = `${baseLocus} ${bib.sblQualifier}`;
	}

	// Chicago Style
	const divSec = `${division !== undefined ? division : ''}${section !== undefined && section !== null && section !== '' ? `.${section}` : ''}`;
	let chicagoText = '';
	const author = corpusConfig?.author || corpusConfig?.name || cid;

	if (bib) {
		const imprint = [
			bib.address && bib.publisher ? `${bib.address}: ${bib.publisher}` : (bib.publisher || bib.address || ''),
			bib.year
		].filter(Boolean).join(', ');
		const seriesPart = bib.series ? `, ${bib.series}` : '';

		if (bib.role === 'critical_edition') {
			const titleWithOrig = work.titleGreek ? `${work.titleEnglish} (${work.titleGreek})` : work.titleEnglish;
			const edPart = bib.editor ? `, ed. ${bib.editor}` : '';
			chicagoText = `${author !== 'Early Christian Fathers' ? `${author}, ` : ''}*${titleWithOrig}*, in *${bib.booktitle}*${edPart}${seriesPart} (${imprint}), ${divSec}.`;
		} else if (bib.role === 'ancient_witness') {
			const titleWithLat = work.titleLatin ? `${work.titleEnglish} (${work.titleLatin})` : work.titleEnglish;
			const edPart = bib.editor ? `, ed. ${bib.editor}` : '';
			chicagoText = `*${titleWithLat}*, in *${bib.booktitle}*${edPart}${seriesPart} (${imprint}), ${divSec}.`;
		} else {
			// translation
			const transPart = bib.translator ? `, trans. ${bib.translator}` : '';
			chicagoText = `${author}, *${work.titleEnglish}*${transPart}, in *${bib.booktitle}*${seriesPart} (${imprint}), ${divSec}.`;
		}
	} else {
		chicagoText = `${author}, *${work.titleEnglish}*, ${divSec}.`;
	}

	// BibTeX
	const keySec = section !== undefined && section !== null && section !== '' ? `_s${section}` : '';
	const bibKey = `${version.id}_${work.code.toLowerCase()}_${division || 1}${keySec}`;
	const bibAuthor = bib?.role === 'critical_edition' && cid === 'af'
		? (bib.editor || author)
		: author;

	const fallbackBooktitle = corpusConfig?.name ? `The Works of ${corpusConfig.name}` : 'Collected Works';
	const bibtexText = buildBibtexIncollection({
		key: bibKey,
		author: bibAuthor,
		title: work.titleEnglish,
		booktitle: bib?.booktitle || fallbackBooktitle,
		editor: bib?.editor,
		translator: bib?.translator,
		series: bib?.series,
		publisher: bib?.publisher,
		address: bib?.address,
		year: bib?.year || '1912',
		chapter: divSec
	});

	return [
		{
			id: 'sbl',
			name: 'SBL Handbook',
			description: 'Standard academic citation for biblical and ancient Near Eastern studies',
			citationText: sblText
		},
		{
			id: 'chicago',
			name: 'Chicago Manual of Style',
			description: 'Standard humanities notes and bibliography citation',
			citationText: chicagoText
		},
		{
			id: 'bibtex',
			name: 'BibTeX Entry',
			description: 'Machine-readable BibTeX reference for LaTeX documents',
			citationText: bibtexText
		}
	];
}
