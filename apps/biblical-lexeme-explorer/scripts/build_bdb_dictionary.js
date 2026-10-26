#!/usr/bin/env node

/**
 * build_bdb_dictionary.js
 * 
 * Builds sharded BDB dictionary entries for BHS lemmata
 * using the unabridged BDB JSON (DictBDB.json).
 * 
 * Usage:
 *   node scripts/build_bdb_dictionary.js [--bdb path/to/DictBDB.json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULT_BDB = path.join(REPO_ROOT, 'scratch', 'unabridged-BDB-Hebrew-lexicon', 'DictBDB.json');
const OUT_DIR = path.join(REPO_ROOT, 'static', 'data', 'lexicons', 'bdb');

const HEBREW_BUCKET_MAP = {
  'א': 'aleph', 'ב': 'bet', 'ג': 'gimel', 'ד': 'dalet', 'ה': 'he', 'ו': 'vav',
  'ז': 'zayin', 'ח': 'het', 'ט': 'tet', 'י': 'yod', 'ך': 'kaf', 'כ': 'kaf',
  'ל': 'lamed', 'ם': 'mem', 'מ': 'mem', 'ן': 'nun', 'נ': 'nun', 'ס': 'samekh',
  'ע': 'ayin', 'ף': 'pe', 'פ': 'pe', 'ץ': 'tsadi', 'צ': 'tsadi', 'ק': 'qof',
  'ר': 'resh', 'ש': 'shin', 'ת': 'tav'
};

const HEBREW_DIAC_REGEX = /[\u0591-\u05C7]/g;

function removeHebrewDiacritics(str) {
  if (!str) return '';
  return str.replace(HEBREW_DIAC_REGEX, '');
}

function getHebrewBucket(text) {
  if (!text) return 'other';
  const plain = removeHebrewDiacritics(text);
  if (!plain) return 'other';
  const ch = plain[0];
  return HEBREW_BUCKET_MAP[ch] || 'other';
}

async function main() {
  const args = process.argv.slice(2);
  let bdbPath = DEFAULT_BDB;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bdb' && args[i + 1]) bdbPath = args[++i];
  }

  if (!fs.existsSync(bdbPath)) {
    console.error(`ERROR: BDB JSON file (${bdbPath}) not found!`);
    console.error(`You may need to clone https://github.com/eliranwong/unabridged-BDB-Hebrew-lexicon into scratch/`);
    process.exit(1);
  }

  console.log(`Loading BDB dictionary from ${bdbPath}...`);
  const bdbData = JSON.parse(fs.readFileSync(bdbPath, 'utf8'));
  
  // Map Strongs to BDB entries
  const bdbByStrongs = new Map();
  let bdbCount = 0;
  for (const entry of bdbData) {
    if (entry.top) {
      bdbByStrongs.set(entry.top, entry.def);
      bdbCount++;
    }
  }
  console.log(`Indexed ${bdbCount} BDB entries by Strongs number.`);

  // Load BHS lexemes
  const bhsFile = path.join(REPO_ROOT, 'static', 'data', 'bhs', 'lexemes.json');
  if (!fs.existsSync(bhsFile)) {
    console.error(`ERROR: BHS lexemes file (${bhsFile}) not found!`);
    process.exit(1);
  }

  const bhsData = JSON.parse(fs.readFileSync(bhsFile, 'utf8'));
  console.log(`Loaded ${Object.keys(bhsData).length} BHS lexemes.`);

  const shards = {};
  for (const bucket of Object.values(HEBREW_BUCKET_MAP)) {
    shards[bucket] = {};
  }
  shards['other'] = {};

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const [idStr, item] of Object.entries(bhsData)) {
    const lemma = item.lemma || '';
    const plain = removeHebrewDiacritics(lemma);
    if (!plain) continue;

    const strongs = item.strongs; // expected e.g., "H6086"
    let matchFound = false;

    if (strongs && bdbByStrongs.has(strongs)) {
      const bucket = getHebrewBucket(plain);
      shards[bucket][plain] = {
        headword: lemma,
        strongs: strongs,
        matchType: 'strongs',
        def: bdbByStrongs.get(strongs)
      };
      matchedCount++;
      matchFound = true;
    } else {
        // Fallback: search values by some other logic if desired, or skip
    }

    if (!matchFound) {
      unmatchedCount++;
    }
  }

  console.log('\n================ MATCHING RESULTS ================');
  console.log(`Total BHS Lexemes:   ${Object.keys(bhsData).length}`);
  console.log(`Total Matched:       ${matchedCount}`);
  console.log(`Unmatched:           ${unmatchedCount}`);
  console.log('==================================================\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalSize = 0;
  for (const [bucket, entries] of Object.entries(shards)) {
    if (Object.keys(entries).length === 0) continue; // skip empty shards
    const filePath = path.join(OUT_DIR, `${bucket}.json`);
    const jsonStr = JSON.stringify(entries);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    const sizeKb = Buffer.byteLength(jsonStr, 'utf8') / 1024;
    totalSize += sizeKb;
    console.log(`  Saved ${bucket}.json: ${Object.keys(entries).length} entries (${sizeKb.toFixed(1)} KB)`);
  }

  console.log(`\nAll BDB shards saved to ${OUT_DIR} (${(totalSize / 1024).toFixed(2)} MB total uncompressed).`);
}

main().catch((err) => {
  console.error('Fatal error building BDB dictionary:', err);
  process.exit(1);
});
