import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const RESOLVED_TOKENS_PATH = path.join(ROOT_DIR, 'pipeline', 'build', 'swete_resolved_tokens.json');
const LEXEMES_PATH = path.join(ROOT_DIR, 'static', 'data', 'lxx', 'lexemes.json');
const CONCORDANCE_PATH = path.join(ROOT_DIR, 'static', 'data', 'lxx', 'concordance.json');

test('ἀνελῶ in Exod 15:9 is recognized as future 1st person singular active indicative of ἀναιρέω', () => {
	const resolvedTokens = JSON.parse(fs.readFileSync(RESOLVED_TOKENS_PATH, 'utf-8'));
	const token = resolvedTokens.find((t) => t.ref === 'Exod 15:9' && t.surface === 'ἀνελῶ');

	expect(token).toBeDefined();
	expect(token.lemma).toBe('ἀναιρέω');
	expect(token.pos).toBe(11); // Verb
	expect(token.morph).toBe('V-FAI-1S'); // Future Active Indicative 1st Singular
});

test('ἀνελῶ in Od 1:9 is recognized as future 1st person singular active indicative of ἀναιρέω', () => {
	const resolvedTokens = JSON.parse(fs.readFileSync(RESOLVED_TOKENS_PATH, 'utf-8'));
	const token = resolvedTokens.find((t) => t.ref === 'Od 1:9' && t.surface === 'ἀνελῶ');

	expect(token).toBeDefined();
	expect(token.lemma).toBe('ἀναιρέω');
	expect(token.pos).toBe(11); // Verb
	expect(token.morph).toBe('V-FAI-1S'); // Future Active Indicative 1st Singular
});

test('concordance for ἀναιρέω includes Exod 15:9 and Od 1:9, and ἀνελῶ is not a standalone lemma', () => {
	const lexemes = JSON.parse(fs.readFileSync(LEXEMES_PATH, 'utf-8'));
	const concordance = JSON.parse(fs.readFileSync(CONCORDANCE_PATH, 'utf-8'));

	// Ensure ἀνελῶ does not exist as a false headword
	const aneloLemma = Object.values(lexemes).find((l) => l.lemma === 'ἀνελῶ');
	expect(aneloLemma).toBeUndefined();

	// Find ἀναιρέω entry
	const anaireoEntry = Object.entries(lexemes).find(([, l]) => l.lemma === 'ἀναιρέω');
	expect(anaireoEntry).toBeDefined();

	const [anaireoId, anaireoLex] = anaireoEntry;
	expect(anaireoLex.pos).toBe(11);

	// Verify occurrences in concordance
	const anaireoConcordance = concordance[anaireoId];
	expect(anaireoConcordance).toBeDefined();
	expect(anaireoConcordance.refs).toContain('Exod 15:9');
	expect(anaireoConcordance.refs).toContain('Od 1:9');
});
