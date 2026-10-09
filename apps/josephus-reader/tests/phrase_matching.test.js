import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKey,
  isWordPhraseMatch,
  getWordHighlightInfo
} from '../shared/lib/highlights.js';

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
