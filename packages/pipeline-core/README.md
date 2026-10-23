# Polyglot Suite — Pipeline Core (`pipeline_core`)

Shared Python data pipeline utilities for ancient text readers in the `polyglot-suite` monorepo.

## Modules

- `pipeline_core.cache_fetcher`: Resilient, polite HTTP file downloading with local filesystem caching and standard user agents.
- `pipeline_core.vfs_chunker`: Slices compiled SQLite databases into 5MB chunks and generates `config.json` for `@polyglot/db-vfs` (`sql.js-httpvfs`).
- `pipeline_core.lsj_resolver`: Parses STEPBible / Perseus LSJ lexicons, normalizes Greek headwords, and links lemmas to definitions.
- `pipeline_core.morph_schema`: Normalizes morphological tags (Mate tagger, Perseus, Morpheus) into the standard `@polyglot/ancient-languages` schema.
