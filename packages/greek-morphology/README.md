# greek-morphology

High-performance Ancient and Hellenistic Greek lemmatization and morphological parsing engine.

## Installation

```bash
# In your project or virtual environment:
pip install -e ./packages/greek-morphology

# With optional neural Stanza parsing models:
pip install -e "./packages/greek-morphology[neural]"
```

## Quick Start (Python API)

```python
from greek_morphology import GreekLemmatizer

# 1. Initialize fast rule & dictionary lemmatizer
lemmatizer = GreekLemmatizer()

# 2. Lemmatize a single word
word = lemmatizer.lemmatize_word("λόγον")
print(f"Lemma: {word.lemma}, POS: {word.pos}, Gloss: {word.gloss}")

# 3. Lemmatize a sentence
sentence = "Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν."
parsed_words = lemmatizer.lemmatize_sentence(sentence)
for w in parsed_words:
    print(f"{w.surface:12} -> {w.lemma:12} (POS: {w.pos})")
```

## CLI Usage

```bash
# Lemmatize direct input
greek-morph parse "Ἐν ἀρχῇ ἦν ὁ λόγος"

# Lemmatize a file to JSON
greek-morph parse -f input.txt -o output.json

# Build full static JSON corpus from raw text
greek-morph build-corpus --text-file my_text.txt --out-data ./data/my_corpus/
```

## Architecture & Modules

- **`normalizer`**: Polytonic Unicode NFC normalization, oxia-to-tonos conversion, accent stripping, Beta Code generation.
- **`rules`**: Closed-class words, lexical overrides, UPOS to POS mapping, deponent verb corrections.
- **`gazetteer`**: Biblical proper name catalog, Semitic transliteration detection heuristics, capitalization filters.
- **`canon`**: Linguistic variation, euphony rules, headword citation canonicalization.
- **`consolidator`**: Unification of fractured or typographical variant lemmata.
- **`gloss`**: Public-domain English gloss and Strong's concordance number resolution.
- **`neural`**: Optional Stanford Stanza (`grc_proiel`) neural model bridge.
- **`solver`**: Constraint satisfaction engine resolving surface forms into lemmas and morphology codes.
- **`adapters`**: Modular corpus readers (`SweteCsvAdapter`, `PlainTextAdapter`, `BaseCorpusAdapter`).
- **`emit`**: Production static JSON and client index emitter.
