# Unified Hebrew Lexical & Concordance Restoration Plan

**Document Purpose:** Cross-conversation specification and implementation plan connecting:
- **Conversation A (`78339624-1e79-40a8-826f-89778bfab4d9`):** BHS/WLC Inflection Filter Bug & Strong's Concordance Cross-Wiring
- **Conversation B (`e94c8c46-0477-4edc-9dc3-64fa6b23e783`):** BDB Lexicon Lemma Bug (Mem/Pe Dagesh Font Decoding Corruption)

---

## 1. Executive Summary

During investigation of the Hebrew Old Testament (BHS/WLC) reading experience in Polyglot Bible Reader, two separate but deeply connected data defects were identified:

1. **WLC Token & Concordance Cross-Wiring:** 
   - Words like **אֱלֹהִים** (*’ĕlōhîm*, H430) and **בַּ֫יִן** (*between*, H996) displayed verbal inflection dimensions (Mood, Tense, Voice) because upstream automated alignment scripts mistakenly tagged unrelated verbs (such as *סות* "incite", *קדם* "confront", *ינה* "oppress") with Strong's `H430`, and consonantal homographs of *בִּין* ("understand", H995) collided with *בַּ֫יִן* (H996).
   - High-frequency words were also cross-wired (most notably **יִשְׂרָאֵל** *Israel*, which occurs 2,514 times, was tagged with `H559` [*'āmar*, to say] instead of `H3478`).
2. **BDB Lexicon Headword Font Corruption:** 
   - In Genesis 43:24, clicking on `מִסְפֹּ֖וא` (*mispo*, fodder, H4554) displayed the corrupted lemma **`מִסְמּוֺא`** (with a *Mem* `מּ` instead of *Pe* `פּ`). 
   - This was traced to an upstream legacy font decoding defect in `DictBDB.json` where **`פּ` (Pe with Dagesh)** was transcribed as **`מּ` (Mem with Dagesh)** across ~56 entries (including `פֶּה` mouth as `מֶּה`, `פֵּאָה` corner as `מֵּאָה`, `פּוֹטִיפַר` Potiphar as `מּוֺטִיפַר`, and `תַּפּוּחַ` apple as `תַּמּוּחַ`).

Because both datasets originate from the same upstream data provider (Eliran Wong / *OpenHebrewBible* & *unabridged-BDB-Hebrew-lexicon*), are processed by the same pipeline (`apps/polyglot-bible-reader/pipeline/build.py`), and write to the same SQLite database (`polyglot-working.sqlite3`), **both issues should be executed and verified in one unified pipeline pass.**

---

## 2. Immediate Safeguards Already Implemented (Tiers 1–3)

Before modifying the underlying database files, runtime defenses were implemented and tested to safeguard the UI and query services immediately:

- **Tier 1 (UI Gating):** Updated `packages/ancient-languages/src/components/InflectionFilterBar.svelte` to gate verbal rows (`Mood`, `Tense`, `Voice`) behind `available.isVerb`, ensuring non-verbs never display verbal filters even if corrupted tokens exist.
- **Tier 2 (Morphological Analysis):** Updated `packages/ancient-languages/src/morphology.ts` (`extractAvailableInflections`) to compute the dominant part of speech and suppress verbal dimensions for non-verbal lemmas. Opposing POS analyses (e.g. stray verbs under a noun) are excluded from feature collection. Full unit test suite added and passing (45/45 tests).
- **Tier 3 (Conflict-Free Token Matching):** Updated `apps/polyglot-bible-reader/src/lib/services/dbClient.ts` (`fetchAttestedForms`) so that when a Strong's ID is queried, any token possessing an explicit, conflicting Strong's ID is rejected immediately (no unpointed consonant fallback to `norm`), and tokens must agree in lemma. Full test suite passing (131/131 tests).

---

## 3. Root Cause Details

### Issue 1: BHS Lexeme Cross-Wiring (`bhs/lexemes.json`)
The foundational linguistic data (consonants, vowels, cantillation, and `4c.*` morphological codes) comes from the **ETCBC** (Vrije Universiteit Amsterdam). ETCBC does not contain Strong's numbers. 

When the *OpenHebrewBible / BHS-Strong-no* project automated the alignment of ETCBC tokens with OpenScriptures MorphHB Strong's numbers, the aligner failed to resolve 9 rare or *hapax legomena* roots. Due to a state-leak / fallback glitch, the aligner assigned the Strong's number of a neighboring prominent theological term in that verse—namely **`H430` (אֱלֹהִים)**:
- Psalm 68:16: `תְּֽרַצְּדוּן֮` (*רצד*, watch) co-occurs in the same verse with `אֱלֹהִים` &rarr; stamped with `H430`.
- Psalm 80:13: `יְכַרְסְמֶ֣נָּֽה` (*כרסם*, eat away) co-occurs in the Psalm with `אֱלֹהִים` chorus &rarr; stamped with `H430`.
- 1 Chron 21:1 / 2 Sam 24: `וַיָּ֨סֶת֙` (*סות*, incite) in the Davidic census narrative &rarr; stamped with `H430`.

Furthermore, automated alignment failed on **`יִשְׂרָאֵל` (Israel, `lex_id: 3226`)**, assigning it `H559` (*'āmar*, to say), affecting 2,514 biblical occurrences.

### Issue 2: BDB Lexicon Font Defect (`DictBDB.json`)
In the digitized Brown-Driver-Briggs lexicon (`pipeline/cache/DictBDB.json`), an early ASCII/Macintosh Hebrew font encoding (e.g. Michigan-Claremont or early Accordance/e-Sword conversions) used a specific byte value for **`פּ` (Pe with Dagesh)** that collided with **`מּ` (Mem with Dagesh)** during UTF-8 conversion. 

As a result:
- Every occurrence of `פּ` in certain headwords was emitted as `מּ`.
- Entry H4554 (*mispo*, fodder) became `מִסְמּוֺא` instead of `מִסְפּוֹא`.
- The entire block of Pe-initial roots from H6284 through H6340 has initial `מּ` instead of `פּ` (e.g., `פָּאָה` &rarr; `מּאה`, `פֵּאָה` &rarr; `מֵּאָה`, `פֶּה` &rarr; `מֶּה`, `פּוֹטִיפַר` &rarr; `מּוֺטִיפַר`).
- Compound entries like `תַּפּוּחַ` (apple, H8598) became `תַּמּוּחַ`, and `צִפּוֹר` (bird, H6833) became `צִמּוֹר`.

---

## 4. The Unified Implementation Plan (Option A)

### Phase 1: WLC Lexemes & Concordance Errata Registry
Update `apps/polyglot-bible-reader/pipeline/data/hebrew_errata.json` to register the verified Strong's numbers and lemmas for all misaligned lexemes:

| `lex_id` | Lemma | Gloss | Corrupted Strong's | Correct Strong's | Biblical Occurrences |
|---|---|---|---|---|---|
| `2881` | **יָוֵן** | *mire, sediment* | `H430` | **`H3121`** | 2 |
| `2996` | **יָנָה** | *oppress, maltreat* | `H430` | **`H3238`** | 19 |
| `3407` | **כֶּסֶא** | *full moon* | `H430` | **`H3677`** | 2 |
| `3487` | **כִּרְסֵם** | *eat away, ravage* | `H430` | **`H3765`** | 1 |
| `4075` | **מְלֵאָה** | *full produce* | `H430` | **`H4395`** | 3 |
| `5116` | **סוּת** | *incite, entice* | `H430` | **`H5496`** | 18 |
| `5235` | **סִפְרָה** | *scroll, book* | `H430` | **`H5615`** | 1 |
| `6477` | **קָדַם** | *confront, precede* | `H430` | **`H6923`** | 26 |
| `7024` | **רָצַד** | *watch, look askance* | `H430` | **`H7520`** | 1 |
| `3226` | **יִשְׂרָאֵל** | *Israel* | `H559` | **`H3478`** | 2,514 |
| `3950` | **מַחֲנֶה** | *camp, army* | `H413` | **`H4264`** | 214 |
| `7077` | **שַׁ־** | *relative prefix (who/which)* | `H1571` | **`H7945`** | 138 |

**Action:**
1. Update `pipeline/data/hebrew_errata.json` with the above entries.
2. Execute `node scripts/apply-hebrew-errata.js --target pipeline/data/bhs/lexemes.json` to patch the source file on disk.
3. Re-pack `pipeline/data/bhs.tar.gz` (`tar -czf pipeline/data/bhs.tar.gz -C pipeline/data bhs`).

---

### Phase 2: BDB Pe-Dagesh Font Decoding Restoration
Update `apps/polyglot-bible-reader/pipeline/adapters/bdb.py` (`extract_headword_and_key` and definition parsing) to systematically restore the corrupted `מּ` &rarr; `פּ`:

1. **Heuristic & Range Detection**:
   When parsing an entry from `DictBDB.json`:
   - If the Strong's number is in the primary corrupted ranges (`H4553`–`H4558`, `H4710`, `H6284`–`H6340`, `H6462`, `H6753`, `H6826`, `H6833`, `H6834`, `H7091`, `H7163`, `H8598`), OR
   - If the English title begins with `P` / `Ph` / `F` / contains `p` and the Hebrew headword has `מּ` (Mem with Dagesh `\u05DE\u05BC`),
   - Replace `\u05DE\u05BC` with `\u05E4\u05BC` (**Pe with Dagesh**).
2. **Definition HTML Restoration**:
   Apply the same replacement to the primary `<ref0 class="word" entry="...">` and title blocks in the entry HTML so that cross-references and displayed article text show `מִסְפּוֹא`, `פֶּה`, `פֵּאָה`, etc.

---

### Phase 3: Pipeline Rebuild & Database Sharding
Run the self-contained pipeline to regenerate the reader database and static web assets:

1. **Build SQLite Database**:
   ```bash
   python3 -m pipeline.build --adapter wlc --adapter bdb
   ```
   - `wlc.py` rebuilds `text_units.tokens_json` and `concordance_refs` with clean Strong's IDs.
   - `bdb.py` rebuilds `lexicon_entries` with restored headwords and definitions.
2. **Re-chunk Database**:
   ```bash
   python3 scripts/chunk_database.py
   ```
   Splits the updated `polyglot-working.sqlite3` into 5MB chunk files in `apps/polyglot-bible-reader/static/db/`.
3. **Regenerate Lemma Search Index**:
   ```bash
   python3 scripts/export_lemma_search_json.py
   ```
   Updates `apps/polyglot-bible-reader/static/data/lemmas/wlc.json` with the corrected lemma keys.

---

### Phase 4: Verification Checklist

1. **Concordance Verification**:
   - Query `concordance_refs` where `lemma_key = 'H430'`: verify count is exactly 2,601 (all `אֱלֹהִים`), with 0 verbs.
   - Query `concordance_refs` where `lemma_key = 'H3478'`: verify count is 2,514 (`יִשְׂרָאֵל`).
   - Query `concordance_refs` where `lemma_key = 'H5496'`: verify count is 18 (`סוּת`).
2. **Lexicon Headword Verification**:
   - Query `lexicon_entries` for `strongs_id = 'H4554'`: verify `headword == 'מִסְפּוֹא'` (not `מִסְמּוֺא`).
   - Query `lexicon_entries` for `strongs_id = 'H6310'`: verify `headword == 'פֶּה'` (not `מֶּה`).
   - Query `lexicon_entries` for `strongs_id = 'H6285'`: verify `headword == 'פֵּאָה'` (not `מֵּאָה`).
3. **Application Build & Tests**:
   - Run `npm test --prefix packages/ancient-languages` (45 unit tests).
   - Run `npm test --prefix apps/polyglot-bible-reader` (131 unit tests).
   - Run `npm run build:www:bible`.

---

## 5. Artifact & Log References

- **Conversation A Log:** `file:///home/cbrannan/.gemini/antigravity/brain/78339624-1e79-40a8-826f-89778bfab4d9/`
- **Conversation B Log:** `file:///home/cbrannan/.gemini/antigravity/brain/e94c8c46-0477-4edc-9dc3-64fa6b23e783/`
- **Errata Registry File:** `apps/polyglot-bible-reader/pipeline/data/hebrew_errata.json`
- **BDB Adapter Script:** `apps/polyglot-bible-reader/pipeline/adapters/bdb.py`
- **WLC Adapter Script:** `apps/polyglot-bible-reader/pipeline/adapters/wlc.py`
