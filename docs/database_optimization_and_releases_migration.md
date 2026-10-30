# Walkthrough: Database Optimization, Decoupling, and Git History Migration

**Project:** Polyglot Suite (`polyglot-suite`)  
**Date:** October 2026  
**Suite Version:** `0.1.10`  
**Database Release:** `database-v0.1.10`

---

## 1. Executive Summary

This document details the architectural refactoring, performance optimization, and data decoupling completed across `polyglot-suite`. 

### Key Achievements:
- **Build Duration**: Reduced `npm run build:www` from **2m 56s** to **26.1s** (~85% faster).
- **Database Size**: Reduced SQLite database from **644.6 MB** to **554.5 MB** (-90.1 MB) and chunk count from 65 to 56.
- **Git Repository Size**: Shrunk `.git` directory from **954 MB** to **227 MB** (-727 MB, a 76% reduction).
- **Zero Binary Bloat in Git**: Untracked large SQLite chunks from Git; migrated storage to **GitHub Releases** (`database-v0.1.10`).
- **Automated CI/CD**: Added intelligent GitHub Actions caching to `.github/workflows/deploy.yml` with automated release downloads (deploy time dropped to **1m 44s**).
- **Data Integrity**: Fixed BDB Pe-dagesh transcription errors (e.g. Gen 43:24 Strong's H4554 `מִסְפֹּוא`), verified with 131/131 unit tests and 10/10 pipeline validation suites.

---

## 2. Background & Initial Problems

### Problem A: Upstream Lexical Transcription Error (Strong's H4554)
In the Bible Reader when viewing Genesis 43:24 (BHS/WLC), clicking the word `מִסְפֹּ֖וא` (Strong's H4554, "fodder") displayed the lemma as `מִסְמּוֺא` (with *Mem* `מּ` + dagesh instead of *Pe* `פּ` + dagesh). Investigation revealed an upstream font decoding flaw in historical electronic BDB editions where the byte corresponding to Pe-with-dagesh had been erroneously mapped to Mem-with-dagesh across 403 distinct headwords.

### Problem B: UI Freezes & SQLite Disk Errors from Ad-Hoc Occurrence Scanning
Clicking the "Attested Forms" or "Inflected Filter" in the lemma modal triggered thousands of live HTTP range requests across the 240,000+ verse table to aggregate inflected forms on the fly. This saturated browser connections and triggered `SQLite: database disk image is malformed` due to concurrent range request cancellations.

### Problem C: Database Bloat from Initial Pre-Computation
To solve Problem B, a pre-computed `lemma_forms` table was introduced. However, storing a verbose dictionary of string representations per verse occurrence across 1.85 million occurrences (`workUnitForms: {"296734": ["מִסְפֹּ֖וא", "מִסְפֹּוא", "מספוא"]}`) bloated the `lemma_forms` table to **231 MB**, growing the database to 645 MB and splitting it into 65 chunks.

### Problem D: 3-Minute Build Times (`npm run build:www`)
Because SvelteKit's static adapter (`@sveltejs/adapter-static`) copies all assets from `static/` to `.svelte-kit/output/client` and then to `build/www` and `dist/bible`, Vite spent over **92 seconds** copying large 10MB chunks repeatedly during `writeBundle`.

### Problem E: Git History Accumulation Risk
Git is optimized for line-based text diffs. Every time a 550 MB+ binary database was rebuilt and committed, Git added ~550 MB of un-diffable binary objects to `.git/objects`. The repository was growing past 1 GB, risking GitHub's repository limits (1 GB soft recommendation, 5 GB hard block).

---

## 3. Phase 1: Database Compaction & Build Acceleration

### 1. Compact Integer Serialization
In `apps/polyglot-bible-reader/pipeline/lemma_indexer.py`, the storage format for `lemma_forms` was refactored:
- **Before**: Each lemma stored a dictionary mapping verse ID strings to an array of 3 inflected string variants.
- **After**: Each attested form stores an array of raw integer `work_unit_ids`:
  ```json
  {
    "forms": [
      {
        "form": "מִסְפֹּוא",
        "canonicalForm": "מִסְפֹּוא",
        "rawForms": ["מִסְפֹּ֖וא"],
        "count": 5,
        "analyses": [...],
        "work_unit_ids": [296734, 297432, ...]
      }
    ]
  }
  ```

### 2. In-Memory Forward Compatibility
In `apps/polyglot-bible-reader/src/lib/services/dbClient.ts`, `fetchAttestedForms` was updated to reconstruct the UI's `workUnitForms` Map dynamically in memory from `form.work_unit_ids`, maintaining 100% backwards compatibility with UI components.

### 3. Rebuild and Page VACUUM
Running `python3 -m apps.polyglot-bible-reader.pipeline.rebuild_hebrew` followed by an SQLite `VACUUM`:
- `lemma_forms` table: dropped from **231 MB** to **154 MB** (-77 MB).
- Database file: dropped from **644.6 MB** to **554.5 MB** (-90.1 MB).
- Chunks: reduced from 65 to **56 chunks** (10 MB each).
- Build duration (`npm run build:www`): plummeted from **176.2s** to **26.1s** (~85% speedup).

---

## 4. Phase 2: Decoupling Data via GitHub Releases

To permanently stop Git history bloat, we migrated the database chunks out of Git tracking and into **GitHub Releases**.

### 1. Why GitHub Releases?
- **100% Free & Unlimited Bandwidth**: Avoids Git LFS's strict 1 GB/month bandwidth cap ($5/pack overages).
- **Fast Datacenter Transfers**: GitHub Actions runners download release assets at 200–500 MB/s directly within GitHub's network.
- **Zero Repo Bloat**: The code repository stays small (~70 MB packed), enabling fast clones.
- **Explicit Versioning**: Releases are tagged semantically (`database-v0.1.10`), ensuring reproducible snapshots.

### 2. Asset Upload
All database chunks across all three apps were published to dedicated GitHub Releases:
- **Polyglot Bible Reader (56 chunks)**: `https://github.com/cbop-dev/polyglot-suite/releases/tag/database-v0.1.10`
- **Philo Reader (32 chunks)**: `https://github.com/cbop-dev/polyglot-suite/releases/tag/philo-db-v0.0.2`
- **Apostolic Fathers Reader (6 chunks)**: `https://github.com/cbop-dev/polyglot-suite/releases/tag/af-db-v0.1.5`

### 3. Version Tracking in `config.json`
Each app's `static/db/config.json` maintains explicit linkage to its database release:
- `apps/polyglot-bible-reader/static/db/config.json`: `"databaseVersion": "database-v0.1.10"`
- `apps/philo-reader/static/db/config.json`: `"databaseVersion": "philo-db-v0.0.5"`
- `apps/apostolic-fathers-reader/static/db/config.json`: `"databaseVersion": "af-db-v0.1.5"`

---

## 5. Phase 3: Tooling, Caching, and Deployment Automation

### 1. Unified & Granular Helper Scripts (`scripts/sync_db.js`)
Enhanced helper scripts in root `package.json`:
- `npm run pull:db`: Downloads all 3 database sets (94 chunks total) in parallel.
- `npm run pull:db:bible`, `npm run pull:db:philo`, `npm run pull:db:fathers`: Download individual databases.
- `npm run publish:db:philo`, `npm run publish:db:fathers`: Upload freshly built chunks to GitHub Releases.

### 2. `.gitignore` Rules
Added wildcard rules to `.gitignore`:
```gitignore
**/static/db/*.db.*
*.db.*
```
- On your local development machine, the chunk files remain on disk for local testing.
- For Apache VPS deployment (`npm run deploy:www`), `deploy_www.sh` runs `npm run build:www` and `rsync`s local `build/www/` over SSH. **Zero VPS workflow changes are needed.**

### 3. GitHub Pages CI/CD Pipeline
Updated `.github/workflows/deploy.yml` with intelligent caching and automated release retrieval:
```yaml
      - name: Cache Database Chunks
        id: db-cache
        uses: actions/cache@v5
        with:
          path: |
            apps/polyglot-bible-reader/static/db/polyglot.db.*
            apps/philo-reader/static/db/philo.db.*
            apps/apostolic-fathers-reader/static/db/af.db.*
          key: polyglot-dbs-${{ hashFiles('apps/*/static/db/config.json') }}

      - name: Fetch Database Chunks
        if: steps.db-cache.outputs.cache-hit != 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run pull:db

      - name: Build Polyglot Suite (Apps & Portal)
        run: npm run build:www
```
On routine code commits, the cache hits in 0 seconds. When any database version changes, the runner fetches the new chunks in ~3–5 seconds.

---

## 6. Phase 4: Git History Purge via `git-filter-repo`

Even though the database files were untracked from `HEAD`, past commits still held ~700 MB of historical database blobs.

### Execution Steps:
1. **Safety Backup**: Created a full mirror clone at `/home/cbrannan/dev/2-tmp/polyglot-suite.backup.git`.
2. **History Filtering**: Ran `git-filter-repo` to excise `*/static/db/polyglot.db.*` across all branches and tags:
   ```bash
   git-filter-repo --path-glob '*/static/db/polyglot.db.*' --path-glob 'static/db/polyglot.db.*' --invert-paths --force
   ```
3. **Garbage Collection**: Pruned unreferenced reflogs and aggressively repacked.
4. **Push Rewritten History**:
   ```bash
   git remote add origin https://github.com/cbop-dev/polyglot-suite.git
   git push origin --force --all
   git push origin --force --tags
   ```

### Result:
- Local `.git` folder dropped from **954 MB** to **227 MB**.
- Zero binary database chunks exist anywhere in Git history.
- Typical code push size is now **~3.6 KiB** instead of 550 MB.

---

## 7. Operational Cheat Sheet for Future Maintenance

### When Rebuilding and Publishing Any Database

After rebuilding and re-chunking a database via its Python pipeline:
- **Philo Reader**: `python3 -m apps.philo-reader.pipeline.build --build-db --chunk`
- **Apostolic Fathers**: `python3 -m apps.apostolic-fathers-reader.pipeline.build --build-db --chunk`
- **Polyglot Bible**: `python3 -m apps.polyglot-bible-reader.pipeline.rebuild_hebrew && python3 apps/polyglot-bible-reader/scripts/chunk_database.py`

Run the one-step release automation:
```bash
# Philo (bumps patch, e.g. philo-db-v0.0.5 -> philo-db-v0.0.6, uploads to GitHub Releases, commits config.json)
npm run release:db philo

# Apostolic Fathers
npm run release:db fathers

# Polyglot Bible
npm run release:db bible
```

#### Optional flags:
- `npm run release:db <app> minor`: Bump minor version instead of patch.
- `npm run release:db <app> patch --push`: Automatically run `git push origin main` after committing `config.json`.
- `npm run release:db <app> --dry-run`: Test version calculations and asset checks without modifying files or uploading.

Finally, push to GitHub to trigger GitHub Pages CI deployment (if `--push` was not used):
```bash
git push origin main
```

### When Setting Up a New Development Machine
After running `git clone`:
```bash
npm install
npm run pull:db    # Downloads the 56 database chunks from GitHub Releases in ~10s
npm run dev:bible  # Ready to run!
```

### When Deploying to Your Apache VPS
```bash
npm run deploy:www          # Builds and syncs to staging on VPS via rsync
npm run deploy:www:promote  # Promotes staging build to live
```
*(Your VPS deployment continues to run unchanged using the local disk chunks).*
