import { describe, it, expect } from 'vitest';
import {
	latinToGreek,
	transliterateLatinToGreek,
	latinToHebrew,
	toPlainGreek,
	stripGreekAccents,
	normalizeGreekSearch,
	toPlainHebrew,
	transliterate,
	findMatchInText,
	findAllMatchesInText,
	getKwicSnippet,
	getAllKwicSnippets,
	formatHebrew,
	formatGreek,
	decodeMorph,
	decodeGreekMorph,
	decodeHebrewMorph,
	formatMorphBadges,
	parseHebrewMorphSegments,
	HIGHLIGHT_PALETTE,
	getPaletteColor,
	getNextPaletteColorIndex,
	getHighlightInlineStyle,
	normalizeStrongsId,
	HebrewUtils,
	parseProielMorph,
	parsePerseusMorph,
	parseGreekMorph,
	parseHebrewMorph,
	getCanonicalForm,
	getCanonicalAttestedForms,
	isFormFilterMatch,
	buildAttestedForms,
	extractAvailableInflections,
	filterAttestedForms,
	isCriteriaActive,
	countActiveFilters
} from '../src/index.js';

describe('@polyglot/ancient-languages', () => {

	describe('restrict to Hebrew vowels', () => {
		it('removes all Hebrew markings', () => {
			const tests = [{input:"אֲשֵׁמִ֣ים׀",output:"אֲשֵׁמִים"}];
			tests.forEach((t)=>{
				expect(HebrewUtils.vowelsOnly(t.input)).toEqual(t.output);
			})
			//expect(latinToHebrew('b')).toBe('ב');
			
		});

		
	});
	describe('Greek transliteration & normalization', () => {
		it('transliterates basic Latin Beta Code to Greek', () => {
			expect(latinToGreek('logos')).toBe('λογος');
			expect(latinToGreek('en arxh')).toBe('εν αρξη');
			expect(latinToGreek('c')).toBe('χ');
			expect(latinToGreek('q')).toBe('θ');
			expect(latinToGreek('f')).toBe('φ');
			expect(latinToGreek('y')).toBe('ψ');
			expect(latinToGreek('w')).toBe('ω');
		});

		it('supports digraphs in transliterateLatinToGreek', () => {
			expect(transliterateLatinToGreek('theos')).toBe('θεος');
			expect(transliterateLatinToGreek('christos')).toBe('χριστος');
			expect(transliterateLatinToGreek('psalmos')).toBe('ψαλμος');
			expect(transliterateLatinToGreek('philosophia')).toBe('φιλοσοφια');
		});

		it('normalizes Greek and strips polytonic accents', () => {
			expect(toPlainGreek('λόγος')).toBe('λογοσ');
			expect(toPlainGreek('Ἐν ἀρχῇ')).toBe('εν αρχη');
			expect(stripGreekAccents('Ἰησοῦς')).toBe('ιησους');
			expect(normalizeGreekSearch('Χριστός!')).toBe('χριστοσ');
		});

		it('formats Greek diacritics toggle', () => {
			expect(formatGreek('λόγος', true)).toBe('λόγος');
			expect(formatGreek('λόγος', false)).toBe('λογος');
		});

		it('finds match in text and extracts KWIC snippet', () => {
			const text = 'Ἐν ἀρχῇ ἦν ὁ λόγος καὶ ὁ λόγος ἦν πρὸς τὸν θεόν';
			const match = findMatchInText(text, 'logos');
			expect(match).not.toBeNull();

			const snippet = getKwicSnippet(text, 'logos');
			expect(snippet.match).toBe('λόγος');
		});

		it('finds all occurrences and extracts multiple KWIC snippets', () => {
			const text = 'Ἐν ἀρχῇ ἦν ὁ λόγος καὶ ὁ λόγος ἦν πρὸς τὸν θεόν';
			const matches = findAllMatchesInText(text, 'logos');
			expect(matches.length).toBe(2);

			const snippets = getAllKwicSnippets(text, 'logos', { radius: 15 });
			expect(snippets.length).toBe(2);
			expect(snippets[0].match).toBe('λόγος');
			expect(snippets[1].match).toBe('λόγος');
			expect(snippets[0].before).toContain('Ἐν ἀρχῇ');
			expect(snippets[1].after).toContain('ἦν πρὸς τὸν');
		});

		it('finds Hebrew words in pointed text ignoring vowels and accents', () => {
			const pointed = 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃';
			const match = findMatchInText(pointed, 'אלהים');
			expect(match).not.toBeNull();
			const snippet = getKwicSnippet(pointed, 'אלהים', { radius: 20, lang: 'hebrew' });
			expect(snippet.match).toBe('אֱלֹהִים');

			// 'ברא' appears both as prefix of 'בְּרֵאשִׁית' and full word 'בָּרָא'
			const allMatches = getAllKwicSnippets(pointed, 'ברא', { radius: 15, lang: 'hebrew' });
			expect(allMatches.length).toBe(2);
			expect(allMatches[0].match).toBe('בְּרֵא');
			expect(allMatches[1].match).toBe('בָּרָא');
		});
	});

	describe('Hebrew transliteration & normalization', () => {
		it('transliterates Latin to Hebrew with final consonants', () => {
			expect(latinToHebrew('b')).toBe('ב');
			expect(latinToHebrew('adm')).toBe('אדם');
			expect(latinToHebrew('mlk')).toBe('מלך');
		});

		it('normalizes pointed Hebrew', () => {
			expect(toPlainHebrew('בְּרֵאשִׁית')).toBe('בראשית');
			expect(toPlainHebrew('אָדָם')).toBe('אדמ');
		});

		it('formats Hebrew diacritics by mode', () => {
			const pointed = 'בְּרֵאשִׁית';
			expect(formatHebrew(pointed, 'all')).toBe(pointed);
			expect(formatHebrew(pointed, 'none')).toBe('בראשׁית');
		});
	});

	describe('Morphological decoders', () => {
		it('decodes PROIEL Apostolic Fathers morphology', () => {
			const res = decodeMorph('V-', '-AMN----');
			expect(res.pos).toBe('Verb');
			expect(res.details).toEqual(['Aorist Middle Infinitive']);
			expect(res.summary).toBe('Verb • Aorist Middle Infinitive');

			const res2 = decodeMorph('V-', '3AAI-S--');
			expect(res2.pos).toBe('Verb');
			expect(res2.details).toEqual(['Aorist Active Indicative', '3rd Person Singular']);
		});

		it('decodes Swete LXX and MorphGNT Greek morphology', () => {
			expect(decodeGreekMorph('V-AAI-3S')).toEqual([
				'Verb',
				'Aorist Active Indicative',
				'3rd Person Singular'
			]);
			expect(decodeGreekMorph('V- 3AAI-S--')).toEqual([
				'Verb',
				'Aorist Active Indicative',
				'3rd Person Singular'
			]);
		});

		it('decodes Hebrew morphology & prefixes', () => {
			const parsed = parseHebrewMorphSegments('Prep-b | N-fs');
			expect(parsed.prefixes).toHaveLength(1);
			expect(parsed.prefixes[0].prefix).toBe('בְּ');
			expect(parsed.stem).toBe('N-fs');

			expect(decodeHebrewMorph('V-qp3ms')).toEqual([
				'Verb',
				'Qal Perfect',
				'3rd Person Masculine Singular'
			]);
			expect(formatMorphBadges('Prep-b | N-fs', 'hebrew')).toEqual([
				'Preposition בְּ',
				'Noun',
				'Feminine Singular'
			]);
		});
	});

	describe('Highlights & Palettes', () => {
		it('provides 16 distinct palette colors with light and dark themes', () => {
			expect(HIGHLIGHT_PALETTE).toHaveLength(16);
			for (const p of HIGHLIGHT_PALETTE) {
				expect(p.hex).toMatch(/^#[0-9a-f]{6}$/i);
				expect(p.bgLight).toContain('rgba');
				expect(p.bgDark).toContain('rgba');
				expect(p.textLight).toBeDefined();
				expect(p.textDark).toBeDefined();
				expect(p.borderLight).toBeDefined();
				expect(p.borderDark).toBeDefined();
			}
		});

		it('gets palette color safely with modular arithmetic fallback', () => {
			expect(getPaletteColor(0).name).toBe('Amber');
			expect(getPaletteColor(1).name).toBe('Sky Blue');
			expect(getPaletteColor(16).name).toBe('Amber');
			expect(getPaletteColor(-1).name).toBe('Sky Blue');
			expect(getPaletteColor(NaN).name).toBe('Amber');
		});

		it('finds the next available palette color index', () => {
			expect(getNextPaletteColorIndex([])).toBe(0);
			expect(getNextPaletteColorIndex([0])).toBe(1);
			expect(getNextPaletteColorIndex([0, 1, 2])).toBe(3);
			expect(getNextPaletteColorIndex([0, 2])).toBe(1);

			// When all 16 are filled, cycles based on length
			const all = Array.from({ length: 16 }, (_, i) => i);
			expect(getNextPaletteColorIndex(all)).toBe(0);
			expect(getNextPaletteColorIndex([...all, 0])).toBe(1);
		});

		it('formats inline highlight CSS style for light and dark modes', () => {
			const lightStyle = getHighlightInlineStyle(0, false);
			expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].bgLight);
			expect(lightStyle).toContain(HIGHLIGHT_PALETTE[0].textLight);

			const darkStyle = getHighlightInlineStyle(0, true);
			expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].bgDark);
			expect(darkStyle).toContain(HIGHLIGHT_PALETTE[0].textDark);
		});

		it('normalizes Strongs identifiers', () => {
			expect(normalizeStrongsId('G03056')).toBe('G3056');
			expect(normalizeStrongsId('h00123')).toBe('H123');
			expect(normalizeStrongsId('3056')).toBe('3056');
			expect(normalizeStrongsId(undefined)).toBe('');
		});
	});

	describe('Unified Morphological Analysis & Attested Forms', () => {
		it('parses PROIEL tags into structured MorphAnalysis', () => {
			const finiteVerb = parseProielMorph('V-', '3AAI-S--');
			expect(finiteVerb.pos).toBe('Verb');
			expect(finiteVerb.tense).toBe('Aorist');
			expect(finiteVerb.voice).toBe('Active');
			expect(finiteVerb.mood).toBe('Indicative');
			expect(finiteVerb.person).toBe('3rd');
			expect(finiteVerb.number).toBe('Singular');

			const participle = parseProielMorph('V-', '-AMPNSM-');
			expect(participle.pos).toBe('Verb');
			expect(participle.tense).toBe('Aorist');
			expect(participle.voice).toBe('Middle');
			expect(participle.mood).toBe('Participle');
			expect(participle.case).toBe('Nominative');
			expect(participle.number).toBe('Singular');
			expect(participle.gender).toBe('Masculine');

			const noun = parseProielMorph('N-', '----NSF-');
			expect(noun.pos).toBe('Noun');
			expect(noun.case).toBe('Nominative');
			expect(noun.number).toBe('Singular');
			expect(noun.gender).toBe('Feminine');
		});

		it('parses Perseus / Josephus parse strings into structured MorphAnalysis', () => {
			const res1 = parsePerseusMorph('Perf Ind MidPass 3s', 'verb');
			expect(res1.pos).toBe('Verb');
			expect(res1.tense).toBe('Perfect');
			expect(res1.mood).toBe('Indicative');
			expect(res1.voice).toBe('Middle/Passive');
			expect(res1.person).toBe('3rd');
			expect(res1.number).toBe('Singular');

			const res2 = parsePerseusMorph('Pres Part Act Acc Pl M', 'verb');
			expect(res2.pos).toBe('Verb');
			expect(res2.tense).toBe('Present');
			expect(res2.mood).toBe('Participle');
			expect(res2.voice).toBe('Active');
			expect(res2.case).toBe('Accusative');
			expect(res2.number).toBe('Plural');
			expect(res2.gender).toBe('Masculine');

			const res3 = parsePerseusMorph('Nom Sg M', 'noun');
			expect(res3.pos).toBe('Noun');
			expect(res3.case).toBe('Nominative');
			expect(res3.number).toBe('Singular');
			expect(res3.gender).toBe('Masculine');
		});

		it('parses MorphGNT & Swete LXX Greek codes into structured MorphAnalysis', () => {
			const mgnt = parseGreekMorph('V- 3AAI-S--');
			expect(mgnt.pos).toBe('Verb');
			expect(mgnt.person).toBe('3rd');
			expect(mgnt.tense).toBe('Aorist');
			expect(mgnt.voice).toBe('Active');
			expect(mgnt.mood).toBe('Indicative');
			expect(mgnt.number).toBe('Singular');

			const swete = parseGreekMorph('V-AAI-3S');
			expect(swete.pos).toBe('Verb');
			expect(swete.person).toBe('3rd');
			expect(swete.tense).toBe('Aorist');
			expect(swete.voice).toBe('Active');
			expect(swete.mood).toBe('Indicative');
			expect(swete.number).toBe('Singular');
		});

		it('canonicalizes Greek movable nu correctly', () => {
			expect(getCanonicalForm('ἔμελλεν')).toBe('ἔμελλε(ν)');
			expect(getCanonicalForm('ἔμελλε')).toBe('ἔμελλε(ν)');
			expect(getCanonicalForm('Ἔμελλεν')).toBe('ἔμελλε(ν)');
			expect(getCanonicalForm('ἀρχή')).toBe('ἀρχή');
			expect(getCanonicalForm('παρὰ')).toBe('παρά');

			const list = getCanonicalAttestedForms([
				{ word: 'ἔμελλε' },
				{ word: 'Ἔμελλε' },
				{ word: 'ἔμελλεν' },
				{ word: 'Ἔμελλεν' }
			]);
			expect(list).toEqual(['ἔμελλε(ν)']);

			expect(isFormFilterMatch('ἔμελλεν', 'ἔμελλε(ν)')).toBe(true);
			expect(isFormFilterMatch('ἔμελλε', 'ἔμελλε(ν)')).toBe(true);
			expect(isFormFilterMatch('ἄλλο', 'ἔμελλε(ν)')).toBe(false);
		});

		it('builds unified AttestedForm objects with counts and analyses', () => {
			const tokens = [
				{ word: 'ἔμελλε', pos: 'V-', morph: '3IAI-S--' },
				{ word: 'ἔμελλεν', pos: 'V-', morph: '3IAI-S--' },
				{ word: 'μελλήσει', pos: 'V-', morph: '3FAI-S--' }
			];

			const forms = buildAttestedForms(tokens, { canonicalize: true });
			expect(forms).toHaveLength(2);
			expect(forms[0].form).toBe('ἔμελλε(ν)');
			expect(forms[0].count).toBe(2);
			expect(forms[0].rawForms).toContain('ἔμελλε');
			expect(forms[0].rawForms).toContain('ἔμελλεν');
			expect(forms[0].analyses).toHaveLength(1);
			expect(forms[0].analyses[0].tense).toBe('Imperfect');

			expect(forms[1].form).toBe('μελλήσει(ν)');
			expect(forms[1].count).toBe(1);
			expect(forms[1].analyses[0].tense).toBe('Future');
		});

		it('extracts available inflection options from forms', () => {
			const tokens = [
				{ word: 'ἔμελλε', pos: 'V-', morph: '3IAI-S--' }, // Impf Act Ind 3s
				{ word: 'μέλλοντος', pos: 'V-', morph: '-PAPGSM-' }, // Pres Act Part Gen Sg Masc
				{ word: 'μελλήσει', pos: 'V-', morph: '3FAI-S--' } // Fut Act Ind 3s
			];
			const forms = buildAttestedForms(tokens);
			const available = extractAvailableInflections(forms);

			expect(available.isVerb).toBe(true);
			expect(available.hasParticiple).toBe(true);
			expect(available.moods).toEqual(['Indicative', 'Participle']);
			expect(available.tenses).toEqual(['Present', 'Imperfect', 'Future']);
			expect(available.voices).toEqual(['Active']);
			expect(available.persons).toEqual(['3rd']);
			expect(available.numbers).toEqual(['Singular']);
			expect(available.cases).toEqual(['Genitive']);
			expect(available.genders).toEqual(['Masculine']);
		});

		it('identifies nouns and suppresses verbal dimensions even if stray verbal tokens exist', () => {
			const tokens = [
				// Majority noun forms (e.g. אֱלֹהִים or λόγος)
				{ word: 'אֱלֹהִים', morphAnalysis: parseHebrewMorph('4c.subs.m.pl.a') },
				{ word: 'אֱלֹהֵיכֶם', morphAnalysis: parseHebrewMorph('4c.subs.m.pl.a') },
				{ word: 'אֱלֹהֵינוּ', morphAnalysis: parseHebrewMorph('4c.subs.m.pl.a') },
				// Stray corrupted verb token (e.g. H430 attached to a verb)
				{ word: 'יָּסֶת', morphAnalysis: parseHebrewMorph('4c.verb.hif.wayq.p3.m.sg') }
			];
			const forms = buildAttestedForms(tokens);
			const available = extractAvailableInflections(forms);

			expect(available.isVerb).toBe(false);
			expect(available.hasParticiple).toBe(false);
			expect(available.moods).toEqual([]);
			expect(available.tenses).toEqual([]);
			expect(available.voices).toEqual([]);
			expect(available.genders).toEqual(['Masculine']);
			expect(available.numbers).toEqual(['Plural']);
		});

		it('identifies prepositions and suppresses verbal dimensions', () => {
			const tokens = [
				{ word: 'בֵּין', morphAnalysis: parseHebrewMorph('4c.prep') },
				{ word: 'וּבֵין', morphAnalysis: parseHebrewMorph('4c.prep') },
				// Stray homographic verb (e.g. from בִּין)
				{ word: 'הָבִין', morphAnalysis: parseHebrewMorph('4c.verb.hif.infc') }
			];
			const forms = buildAttestedForms(tokens);
			const available = extractAvailableInflections(forms);

			expect(available.isVerb).toBe(false);
			expect(available.moods).toEqual([]);
			expect(available.tenses).toEqual([]);
			expect(available.voices).toEqual([]);
		});

		it('filters forms with multi-select OR within dimension and AND across dimensions', () => {
			const tokens = [
				{ word: 'ἔμελλε', pos: 'V-', morph: '3IAI-S--' }, // Impf Ind
				{ word: 'ἔμελλον', pos: 'V-', morph: '1IAI-S--' }, // Impf Ind
				{ word: 'μελλήσει', pos: 'V-', morph: '3FAI-S--' }, // Fut Ind
				{ word: 'μέλλοντος', pos: 'V-', morph: '-PAPGSM-' }, // Pres Part
				{ word: 'μελλόντων', pos: 'V-', morph: '-PAPGPM-' } // Pres Part
			];
			const forms = buildAttestedForms(tokens);

			// Multi-select OR within tense (Imperfect OR Future)
			const resTense = filterAttestedForms(forms, { tense: ['Imperfect', 'Future'] });
			const tenseForms = resTense.map((f) => f.form);
			expect(tenseForms).toContain('ἔμελλε(ν)');
			expect(tenseForms).toContain('ἔμελλον');
			expect(tenseForms).toContain('μελλήσει(ν)');
			expect(tenseForms).not.toContain('μέλλοντος');

			// AND across dimensions: Tense = Present AND Mood = Participle
			const resPart = filterAttestedForms(forms, { tense: ['Present'], mood: ['Participle'] });
			const partForms = resPart.map((f) => f.form);
			expect(partForms).toEqual(['μέλλοντος', 'μελλόντων']);

			// Filter by Case when Participle (Genitive)
			const resGen = filterAttestedForms(forms, { case: ['Genitive'] });
			expect(resGen.map((f) => f.form)).toEqual(['μέλλοντος', 'μελλόντων']);

			// Helper checks
			expect(isCriteriaActive({ tense: ['Aorist'] })).toBe(true);
			expect(isCriteriaActive({})).toBe(false);
			expect(isCriteriaActive({ tense: [] })).toBe(false);
			expect(countActiveFilters({ tense: ['Aorist', 'Future'], mood: ['Indicative'] })).toBe(3);
		});

		it('parses Robinson-style Greek morphology (OpenGNT / Swete)', () => {
			const m = parseGreekMorph('V-PAP-DSF');
			expect(m.pos).toBe('Verb');
			expect(m.tense).toBe('Present');
			expect(m.voice).toBe('Active');
			expect(m.mood).toBe('Participle');
			expect(m.case).toBe('Dative');
			expect(m.number).toBe('Singular');
			expect(m.gender).toBe('Feminine');

			const n = parseGreekMorph('N-NSM-P');
			expect(n.pos).toBe('Noun');
			expect(n.case).toBe('Nominative');
			expect(n.number).toBe('Singular');
			expect(n.gender).toBe('Masculine');
		});

		it('parses Hebrew morphology (ETCBC / BHSA and Open Scriptures)', () => {
			const etcbc = parseHebrewMorph('4c.verb.qal.perf.p3.m.sg');
			expect(etcbc.pos).toBe('Verb');
			expect(etcbc.tense).toBe('Perfect');
			expect(etcbc.person).toBe('3rd');
			expect(etcbc.gender).toBe('Masculine');
			expect(etcbc.number).toBe('Singular');
			expect(etcbc.voice).toBe('Active');

			const noun = parseHebrewMorph('4c.nmpr.m.sg.a');
			expect(noun.pos).toBe('Noun');
			expect(noun.gender).toBe('Masculine');
			expect(noun.number).toBe('Singular');

			const part = parseHebrewMorph('4c.verb.qal.ptca.m.sg.a');
			expect(part.pos).toBe('Verb');
			expect(part.mood).toBe('Participle');
			expect(part.gender).toBe('Masculine');
			expect(part.number).toBe('Singular');

			const openScr = parseHebrewMorph('Prep-b | V-qp3ms');
			expect(openScr.pos).toBe('Verb');
			expect(openScr.tense).toBe('Perfect');
			expect(openScr.person).toBe('3rd');
			expect(openScr.gender).toBe('Masculine');
			expect(openScr.number).toBe('Singular');
		});
	});
});
