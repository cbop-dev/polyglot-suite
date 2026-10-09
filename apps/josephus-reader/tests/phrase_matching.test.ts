import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKey,
  normalizeLemmaAccents,
  isWordPhraseMatch,
  getWordHighlightInfo,
  getCanonicalForm,
  getCanonicalAttestedForms,
  isFormFilterMatch
} from '../shared/lib/highlights.ts';
import {
  transliterateLatinToGreek,
  normalizeGreekSearch,
  findMatchInText
} from '../shared/lib/transliterate.ts';

test('Custom Phrase Matching - Exact Word & Movable Nu Matching', () => {
  const queryNorm = normalizeKey('μελλει'); // "μελλει"

  // 1. True Positives
  assert.equal(isWordPhraseMatch(normalizeKey('μέλλει'), queryNorm), true, 'μέλλει should match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('μέλλειν'), queryNorm), true, 'μέλλειν (movable nu) should match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('μελλει'), queryNorm), true, 'unaccented μελλει should match');

  // 2. False Positives Prevention (User reported bugs)
  assert.equal(isWordPhraseMatch(normalizeKey('μέλλοιεν'), queryNorm), false, 'μέλλοιεν must NOT match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('εἰ'), queryNorm), false, 'εἰ must NOT match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('με'), queryNorm), false, 'με must NOT match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('μέλλων'), queryNorm), false, 'μέλλων must NOT match μελλει');
  assert.equal(isWordPhraseMatch(normalizeKey('ἐλπίς'), queryNorm), false, 'ἐλπίς must NOT match μελλει');
});

test('Custom Phrase Matching - Multi-Word Phrase Queries', () => {
  const phraseQuery = normalizeKey('Ἰουδαίων ἄρχοντες'); // "ιουδαιων αρχοντες"

  assert.equal(isWordPhraseMatch(normalizeKey('Ἰουδαίων'), phraseQuery), true, 'Ἰουδαίων should match phrase Ἰουδαίων ἄρχοντες');
  assert.equal(isWordPhraseMatch(normalizeKey('ἄρχοντες'), phraseQuery), true, 'ἄρχοντες should match phrase Ἰουδαίων ἄρχοντες');
  assert.equal(isWordPhraseMatch(normalizeKey('καί'), phraseQuery), false, 'καί must NOT match phrase Ἰουδαίων ἄρχοντες');
  assert.equal(isWordPhraseMatch(normalizeKey('εἰ'), phraseQuery), false, 'εἰ must NOT match phrase Ἰουδαίων ἄρχοντες');
});

test('Attested Forms Canonicalization - Capitalization, Accents, and Movable Nu', () => {
  // 1. Capitalization & Accents: "ἔμελλε" vs "Ἔμελλε" vs "ἔμελλὲ"
  assert.equal(getCanonicalForm('ἔμελλε'), 'ἔμελλε(ν)');
  assert.equal(getCanonicalForm('Ἔμελλε'), 'ἔμελλε(ν)');
  assert.equal(getCanonicalForm('ἔμελλὲ'), 'ἔμελλε(ν)');

  // 2. Movable Nu: "ἔμελλεν" vs "Ἔμελλεν"
  assert.equal(getCanonicalForm('ἔμελλεν'), 'ἔμελλε(ν)');
  assert.equal(getCanonicalForm('Ἔμελλεν'), 'ἔμελλε(ν)');

  // 3. Deduplication in getCanonicalAttestedForms
  const rawOccurrences = [
    { word: 'ἔμελλε' },
    { word: 'Ἔμελλε' },
    { word: 'ἔμελλεν' },
    { word: 'Ἔμελλεν' },
    { word: 'ἔμελλὲ' }
  ];
  const canonicalForms = getCanonicalAttestedForms(rawOccurrences);
  assert.deepEqual(canonicalForms, ['ἔμελλε(ν)'], 'All capitalization and movable nu variants must collapse to single canonical form');

  // 4. Form Filtering Matching
  assert.equal(isFormFilterMatch('ἔμελλε', 'ἔμελλε(ν)'), true);
  assert.equal(isFormFilterMatch('Ἔμελλε', 'ἔμελλε(ν)'), true);
  assert.equal(isFormFilterMatch('ἔμελλεν', 'ἔμελλε(ν)'), true);
  assert.equal(isFormFilterMatch('Ἔμελλεν', 'ἔμελλε(ν)'), true);
  assert.equal(isFormFilterMatch('μέλλοιεν', 'ἔμελλε(ν)'), false);
});

test('Highlight Store Integration - getWordHighlightInfo()', () => {
  const mockStore = {
    lemmas: [],
    forms: [],
    phrases: [
      { phrase: 'μελλει', displayPhrase: 'μελλει', hue: 160 }
    ]
  };

  const matchRes1 = getWordHighlightInfo('μέλλει', mockStore);
  assert.equal(matchRes1.isPhrase, true);
  assert.equal(matchRes1.hue, 160);

  const matchRes2 = getWordHighlightInfo('μέλλειν', mockStore);
  assert.equal(matchRes2.isPhrase, true);

  const falseMatch1 = getWordHighlightInfo('μέλλοιεν', mockStore);
  assert.equal(falseMatch1.isPhrase, false, 'μέλλοιεν must be false in getWordHighlightInfo');

  const falseMatch2 = getWordHighlightInfo('εἰ', mockStore);
  assert.equal(falseMatch2.isPhrase, false, 'εἰ must be false in getWordHighlightInfo');
});

test('Lemma Accent Normalization - No Grave Accent on Lemmata', () => {
  assert.equal(normalizeLemmaAccents('παρὰ'), 'παρά');
  assert.equal(normalizeLemmaAccents('καὶ'), 'καί');
  assert.equal(normalizeLemmaAccents('διὰ'), 'διά');
  assert.equal(normalizeLemmaAccents('ἀπὸ'), 'ἀπό');
  assert.equal(normalizeLemmaAccents('ὑπὸ'), 'ὑπό');
  assert.equal(normalizeLemmaAccents('ἐπὶ'), 'ἐπί');
  assert.equal(normalizeLemmaAccents('περὶ'), 'περί');
  assert.equal(normalizeLemmaAccents('μετὰ'), 'μετά');
  assert.equal(normalizeLemmaAccents('κατὰ'), 'κατά');
});

test('Sigma Conversion & Search Result Equivalence (σ / ς)', () => {
  // 1. Transliteration Rules: non-trailing ς -> σ, trailing σ -> ς
  assert.equal(transliterateLatinToGreek('πιςτις'), 'πιστις', 'non-trailing ς before τ must convert to σ');
  assert.equal(transliterateLatinToGreek('πιστισ'), 'πιστις', 'trailing σ at word end must convert to ς');
  assert.equal(transliterateLatinToGreek('πιστις'), 'πιστις', 'canonical σ/ς placement stays unchanged');
  assert.equal(transliterateLatinToGreek('pistis'), 'πιστις', 'Latin pistis produces canonical πιστις');
  assert.equal(transliterateLatinToGreek('pijtis'), 'πιστις', 'Latin betacode j in pijtis produces canonical πιστις');
  assert.equal(transliterateLatinToGreek('πιςτις και ςιγμα'), 'πιστις και σιγμα', 'multi-word non-trailing ς must convert to σ');

  // 2. Search Result Equivalence: "πιςτις", "πιστισ", and "πιστις" must all normalize to identical keys
  const norm1 = normalizeKey('πιςτις');
  const norm2 = normalizeKey('πιστισ');
  const norm3 = normalizeKey('πιστις');
  assert.equal(norm1, norm2, 'πιςτις and πιστισ must normalize to identical keys');
  assert.equal(norm2, norm3, 'πιστισ and πιστις must normalize to identical keys');
  assert.equal(norm1, 'πιστισ', 'all sigma variations normalize to medial sigmas');

  const gNorm1 = normalizeGreekSearch('πιςτις');
  const gNorm2 = normalizeGreekSearch('πιστισ');
  const gNorm3 = normalizeGreekSearch('πιστις');
  assert.equal(gNorm1, gNorm2, 'normalizeGreekSearch(πιςτις) === normalizeGreekSearch(πιστισ)');
  assert.equal(gNorm2, gNorm3, 'normalizeGreekSearch(πιστισ) === normalizeGreekSearch(πιστις)');

  // 3. Match Verification: findMatchInText returns matches regardless of sigma variant
  const text = 'ἡ δὲ πίστις αὕτη ἐστίν';
  assert.ok(findMatchInText(text, 'πιςτις'), 'search query πιςτις must match text πίστις');
  assert.ok(findMatchInText(text, 'πιστισ'), 'search query πιστισ must match text πίστις');
  assert.ok(findMatchInText(text, 'πιστις'), 'search query πιστις must match text πίστις');
});
