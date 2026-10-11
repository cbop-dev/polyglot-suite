#!/usr/bin/env node
/**
 * ============================================================================
 * Hebrew Upstream Errata Applier (apply-hebrew-errata.js)
 * ============================================================================
 * 
 * OVERVIEW:
 * Upstream BHS/ETCBC Hebrew datasets contain several known lexical and Strong's
 * numbering anomalies (for example, the verbal root לוט [enwrap] was mistagged as
 * H397 [Achish], while Achish was mistagged as H6030).
 * 
 * This script downloads the latest curated errata registry from GitHub (falling
 * back to a local bundled copy if offline or unreachable) and patches the target
 * `lexemes.json` file before the application is built.
 * 
 * ----------------------------------------------------------------------------
 * HOW TO USE THIS SCRIPT IN ANY PROJECT (e.g. biblical-lexeme-explorer):
 * ----------------------------------------------------------------------------
 * 
 * 1. Copy this file into your project's `scripts/` directory:
 *      cp scripts/apply-hebrew-errata.js path/to/your-project/scripts/
 * 
 * 2. (Optional) Copy `hebrew_errata.json` into your project as an offline fallback:
 *      cp apps/polyglot-bible-reader/pipeline/data/hebrew_errata.json path/to/your-project/scripts/hebrew_errata.json
 * 
 * 3. Add a "prebuild" hook in your project's `package.json`:
 *      "scripts": {
 *        "prebuild": "node scripts/apply-hebrew-errata.js",
 *        "build": "vite build"
 *      }
 *    Now, whenever you or CI/CD run `npm run build`, npm will automatically run
 *    this patcher first.
 * 
 * 4. Or run it manually at any time from your project root:
 *      node scripts/apply-hebrew-errata.js
 *      node scripts/apply-hebrew-errata.js --target static/data/bhs/lexemes.json
 * 
 * CLI ARGUMENTS:
 *   --target <path>  Path to target lexemes.json (default: searches common locations)
 *   --remote <url>   Remote URL for hebrew_errata.json
 *   --local <path>   Path to local fallback hebrew_errata.json
 * 
 * Zero external dependencies (uses standard Node.js built-ins: fs, path, fetch).
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_REMOTE_URL = 'https://raw.githubusercontent.com/cbop-dev/polyglot-suite/main/apps/polyglot-bible-reader/pipeline/data/hebrew_errata.json';

const CANDIDATE_TARGET_PATHS = [
  'static/data/bhs/lexemes.json',
  'static/data/lexemes.json',
  'src/lib/data/bhs/lexemes.json',
  'data/bhs/lexemes.json',
  'pipeline/data/bhs/lexemes.json'
];

const CANDIDATE_LOCAL_ERRATA = [
  'scripts/hebrew_errata.json',
  'pipeline/data/hebrew_errata.json',
  'static/data/hebrew_errata.json'
];

const CANDIDATE_BDB_DIRS = [
  'static/data/lexicons/bdb',
  'data/lexicons/bdb',
  'public/data/lexicons/bdb'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: null,
    remote: DEFAULT_REMOTE_URL,
    local: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      options.target = path.resolve(args[++i]);
    } else if (args[i] === '--remote' && args[i + 1]) {
      options.remote = args[++i];
    } else if (args[i] === '--local' && args[i + 1]) {
      options.local = path.resolve(args[++i]);
    }
  }
  return options;
}

function resolveFile(explicitPath, candidates) {
  if (explicitPath) {
    return fs.existsSync(explicitPath) ? explicitPath : null;
  }
  for (const c of candidates) {
    const resolved = path.resolve(c);
    if (fs.existsSync(resolved)) return resolved;
  }
  return null;
}

async function loadErrata(remoteUrl, localPath) {
  // 1. Try remote fetch with timeout
  if (remoteUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(remoteUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        console.log(`[hebrew-errata] Successfully fetched latest errata from remote (${remoteUrl})`);
        // Cache locally if local path exists/specified
        if (localPath) {
          try {
            fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf8');
          } catch (_) {}
        }
        return data;
      }
    } catch (e) {
      console.log(`[hebrew-errata] Notice: Remote fetch skipped (${e.message}). Falling back to local copy.`);
    }
  }

  // 2. Fall back to local file
  if (localPath && fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, 'utf8');
      console.log(`[hebrew-errata] Using local errata file: ${localPath}`);
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[hebrew-errata] Warning reading local errata: ${e.message}`);
    }
  }

  return { lexemes: {}, tokens: {} };
}

async function main() {
  const options = parseArgs();
  const targetPath = resolveFile(options.target, CANDIDATE_TARGET_PATHS);
  const localErrataPath = resolveFile(options.local, CANDIDATE_LOCAL_ERRATA);

  if (!targetPath) {
    console.warn('[hebrew-errata] No target lexemes.json found. Checked candidate paths:');
    for (const c of CANDIDATE_TARGET_PATHS) console.warn(`   - ${path.resolve(c)}`);
    console.warn('Pass an explicit path with --target <path/to/lexemes.json>');
    return;
  }

  const errata = await loadErrata(options.remote, localErrataPath);
  const lexemePatches = errata.lexemes || {};
  const patchKeys = Object.keys(lexemePatches);

  if (patchKeys.length === 0) {
    console.log('[hebrew-errata] No lexeme patches defined in errata. Nothing to do.');
    return;
  }

  console.log(`[hebrew-errata] Inspecting ${targetPath}...`);
  let lexemes;
  try {
    lexemes = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch (e) {
    console.error(`[hebrew-errata] Error parsing ${targetPath}: ${e.message}`);
    process.exit(1);
  }

  let patchedCount = 0;
  for (const [id, patch] of Object.entries(lexemePatches)) {
    const entry = lexemes[id];
    if (entry) {
      let changed = false;
      for (const field of ['strongs', 'gloss', 'lemma', 'plain']) {
        if (field in patch && entry[field] !== patch[field]) {
          entry[field] = patch[field];
          changed = true;
        }
      }
      if (changed) {
        patchedCount++;
        console.log(`   -> Patched lexeme ID ${id} (${entry.lemma}): strongs=${entry.strongs}, gloss="${entry.gloss}"`);
      }
    }
  }

  if (patchedCount > 0) {
    fs.writeFileSync(targetPath, JSON.stringify(lexemes, null, 2), 'utf8');
    console.log(`[hebrew-errata] ✓ Successfully applied ${patchedCount} patch(es) to ${path.basename(targetPath)}.`);
  } else {
    console.log(`[hebrew-errata] ✓ Target ${path.basename(targetPath)} is already up to date.`);
  }

  // 4. Also patch BDB lexicon shards if present
  const bdbPatches = errata.bdb || {};
  const bdbPatchFiles = Object.keys(bdbPatches);
  if (bdbPatchFiles.length > 0) {
    const bdbDir = resolveFile(null, CANDIDATE_BDB_DIRS);
    if (bdbDir && fs.existsSync(bdbDir)) {
      console.log(`[hebrew-errata] Inspecting BDB lexicon shards in ${bdbDir}...`);
      for (const [shardFile, entries] of Object.entries(bdbPatches)) {
        const shardPath = path.join(bdbDir, shardFile);
        if (fs.existsSync(shardPath)) {
          try {
            const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
            let shardUpdated = false;
            for (const [key, entryVal] of Object.entries(entries)) {
              const current = shardData[key];
              if (!current || current.strongs !== entryVal.strongs || current.headword !== entryVal.headword) {
                shardData[key] = entryVal;
                shardUpdated = true;
                console.log(`   -> Patched BDB entry in ${shardFile} for [${key}]: strongs=${entryVal.strongs}, headword=${entryVal.headword}`);
              }
            }
            if (shardUpdated) {
              fs.writeFileSync(shardPath, JSON.stringify(shardData), 'utf8');
              console.log(`[hebrew-errata] ✓ Updated BDB shard ${shardFile}`);
            }
          } catch (shardErr) {
            console.warn(`[hebrew-errata] Warning patching BDB shard ${shardFile}: ${shardErr.message}`);
          }
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('[hebrew-errata] Fatal error:', err);
  process.exit(1);
});
