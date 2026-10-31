import type { AcademicCitationStyle } from './types.js';

export function buildBibtexIncollection(params: {
	key: string;
	author: string;
	title: string;
	booktitle: string;
	editor?: string;
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
