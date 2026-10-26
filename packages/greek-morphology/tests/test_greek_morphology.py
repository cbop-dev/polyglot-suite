"""Tests for greek_morphology package."""

import pytest
from greek_morphology import (
    normalize_greek,
    strip_accents,
    to_beta_code,
    is_capitalized,
    are_lexically_equivalent,
    is_semitic_transliteration,
    canonicalize_proper_name,
    GreekLemmatizer,
    LemmaConsolidator,
    GlossResolver,
    PlainTextAdapter,
)


def test_normalization():
    assert normalize_greek("λόγος") == "λόγος"
    assert normalize_greek("ἰδοὺ") == "ἰδού"
    assert normalize_greek("τὶς") == "τίς"
    assert normalize_greek("Ἀβραὰμ") == "Ἀβραάμ"
    assert strip_accents("Ἐν ἀρχῇ") == "εν αρχη"
    assert to_beta_code("λόγος") == "logos"
    assert is_capitalized("Ἰησοῦς") is True
    assert is_capitalized("λόγος") is False


def test_lexical_equivalence():
    assert are_lexically_equivalent("γίνομαι", "γίγνομαι") is True
    assert are_lexically_equivalent("ἀνοίγω", "ἀνοίγνυμι") is True
    assert are_lexically_equivalent("λόγος", "λόγος") is True
    assert are_lexically_equivalent("λόγος", "ῥῆμα") is False


def test_proper_name_heuristics():
    assert is_semitic_transliteration("Αβρααμ") is True
    assert is_semitic_transliteration("Δαυιδ") is True
    assert is_semitic_transliteration("Σαουλ") is True
    assert canonicalize_proper_name("Δαυειδ") == "Δαυίδ"
    assert canonicalize_proper_name("Ιησους") == "Ἰησοῦς"


def test_lemmatizer_rule_lookups():
    lemmatizer = GreekLemmatizer(use_neural=False)

    res1 = lemmatizer.lemmatize_word("καί")
    assert res1.lemma == "καί"
    assert res1.pos == 1

    res2 = lemmatizer.lemmatize_word("ἐν")
    assert res2.lemma == "ἐν"
    assert res2.pos == 5

    res3 = lemmatizer.lemmatize_word("ὁ")
    assert res3.lemma == "ὁ"
    assert res3.pos == 6

    res4 = lemmatizer.lemmatize_word("Δός")
    assert res4.lemma == "δίδωμι"
    assert res4.pos == 11


def test_lemmatize_sentence():
    lemmatizer = GreekLemmatizer(use_neural=False)
    words = lemmatizer.lemmatize_sentence("Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν.")
    assert len(words) >= 10
    lemmata = [w.lemma for w in words]
    assert "ἐν" in lemmata
    assert "ὁ" in lemmata
    assert "καί" in lemmata
    assert "πρός" in lemmata
    assert "θεός" in lemmata


def test_plain_text_adapter():
    adapter = PlainTextAdapter("Ἐν ἀρχῇ ἦν ὁ λόγος.\nΚαὶ ὁ λόγος ἦν πρὸς τὸν θεόν.")
    tokens, verses, books = adapter.load_corpus()
    assert len(verses) == 2
    assert len(tokens) == 12
    assert len(books) == 1
