"""Tests for biblical_data package and dataset integrity."""

import json
from pathlib import Path
import pytest
from biblical_data import CorpusReader, LsjDictionaryReader

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
STATIC_DATA_DIR = REPO_ROOT / "static" / "data"


def test_python_reader_lxx():
    if not (STATIC_DATA_DIR / "lxx").exists():
        pytest.skip("LXX data directory not found")

    reader = CorpusReader(STATIC_DATA_DIR, corpus="lxx")
    lexemes = reader.get_lexemes()
    assert len(lexemes) > 10000

    books = reader.get_books()
    assert len(books) >= 50

    concordance = reader.get_concordance()
    assert len(concordance) > 10000

    verses = reader.get_verses()
    assert len(verses) > 20000


def test_python_reader_sblgnt():
    if not (STATIC_DATA_DIR / "sblgnt").exists():
        pytest.skip("SBLGNT data directory not found")

    reader = CorpusReader(STATIC_DATA_DIR, corpus="sblgnt")
    lexemes = reader.get_lexemes()
    assert len(lexemes) > 4000

    books = reader.get_books()
    assert len(books) == 27


def test_lsj_dictionary_reader():
    dict_dir = STATIC_DATA_DIR / "dictionary"
    if not dict_dir.exists():
        pytest.skip("Dictionary directory not found")

    reader = LsjDictionaryReader(dict_dir)
    entry = reader.lookup("λογος")
    assert entry is not None
    assert "λόγος" in entry.headword or "λόγος" in entry.headword or "λογος" in entry.headword.lower()
    assert len(entry.def_markdown) > 50


def test_schema_files_valid_json():
    schema_dir = Path(__file__).resolve().parent.parent / "schemas"
    for p in schema_dir.glob("*.json"):
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert "$schema" in data
            assert "type" in data
