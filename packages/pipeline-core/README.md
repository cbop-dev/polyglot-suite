# Polyglot Suite — Pipeline Core (`pipeline_core`)

Shared Python data pipeline utilities for ancient text readers in the `polyglot-suite` monorepo. Powers data ingestion, SQLite compilation, dictionary resolution, and static HTTP-VFS database slicing across **Philo Reader**, **Apostolic Fathers Reader**, and **Polyglot Bible Reader**.

---

## Modules

### 1. `pipeline_core.vfs_chunker.DatabaseChunker`
Slices a compiled SQLite database into byte-range chunks (default 5MB) for static web hosting via `sql.js-httpvfs` / `@polyglot/db-vfs`, and automatically writes the client `config.json` manifest.

```python
from pipeline_core import DatabaseChunker

chunker = DatabaseChunker(
    db_path="pipeline/build/corpus.sqlite3",
    output_dir="static/db",
    chunk_prefix="corpus.db",
    chunk_size=5 * 1024 * 1024,  # 5MB
)
config = chunker.chunk()
```

### 2. `pipeline_core.lsj_resolver.LSJAdapter`
Parses STEPBible TFLSJ unabridged Liddell-Scott-Jones lexicon files (`TFLSJ_0_5624.txt` and `TFLSJ_extra.txt`). Normalizes Greek headwords, expands deponent/middle verbs and -μι/-υω variant forms, and merges domain-specific supplements (e.g. patristic or philosophical vocabulary).

```python
from pipeline_core import LSJAdapter, strip_greek_accents

# Strip Greek diacritics and breathing marks for accent-insensitive search keys
normalized_key = strip_greek_accents("λόγος")  # -> "λογος"

# Initialize adapter with optional custom supplements
adapter = LSJAdapter(
    lexicon_dir="pipeline/cache/lexicon",
    supplements=[
        {
            "dictionary": "lsj",
            "strongs_id": None,
            "lemma": "διψυχία",
            "normalized_lemma": strip_greek_accents("διψυχία"),
            "transliteration": "dipsychia",
            "gloss": "doubt, double-mindedness",
            "definition": "<b>διψυχία</b>, ἡ, <i>doubt, hesitation</i>...",
        }
    ]
)

for entry in adapter.iter_entries():
    # Insert or link to SQLite database
    pass
```

### 3. `pipeline_core.cache_fetcher.download_file`
Resilient, polite HTTP downloader with local filesystem caching, standard User-Agent headers, and automatic directory creation.

```python
from pipeline_core import download_file

download_file(
    url="https://raw.githubusercontent.com/.../text.xml",
    dest="pipeline/cache/text.xml",
    force=False  # skips if file exists and has content
)
```

### 4. `pipeline_core.morph_schema`
Normalizes morphological tags from external taggers (e.g. Mate parser, Celano TLG, Morpheus) into the standard `@polyglot/ancient-languages` schema (`p` = part of speech, `m` = morphological code).

```python
from pipeline_core import parse_mate_morph, normalize_token_morph

p, m = parse_mate_morph("pos=verb|person=3|number=s|tense=pres|mood=ind|voice=act")
# p: 'v', m: '3spia'
```

---

## Creating a New Reader Pipeline

To add a new ancient corpus pipeline to the monorepo:

1. Create `apps/<name>-reader/pipeline/config.py`:
   ```python
   import sys
   from pathlib import Path

   PIPELINE_DIR = Path(__file__).parent.resolve()
   REPO_ROOT = PIPELINE_DIR.parents[2]
   PIPELINE_CORE = REPO_ROOT / "packages" / "pipeline-core"
   if str(PIPELINE_CORE) not in sys.path:
       sys.path.insert(0, str(PIPELINE_CORE))
   ```
2. Fetch raw texts using `download_file`.
3. Ingest text units and word tokens into a local SQLite database using standard schema (`corpora`, `canonical_works`, `text_units`, `lexicon_entries`).
4. Chunk the compiled database using `DatabaseChunker`:
   ```python
   DatabaseChunker(
       db_path="pipeline/build/corpus.sqlite3",
       output_dir="static/db",
       chunk_prefix="corpus.db"
   ).chunk()
   ```
5. Connect your Svelte frontend with `@polyglot/db-vfs`.
