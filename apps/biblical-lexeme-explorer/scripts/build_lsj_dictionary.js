#!/usr/bin/env node
/**
 * build_lsj_dictionary.js
 * 
 * Builds sharded LSJ dictionary entries for LXX and SBLGNT lemmata
 * using Giuseppe Celano & Logeion/U. Chicago's LSJ Markdown CEX edition.
 * 
 * Usage:
 *   node scripts/build_lsj_dictionary.js [--cex path/to/lsj_chicago.cex] [--index path/to/lsj_index.txt]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Default paths to CEX and index
const DEFAULT_CEX = '/home/cbrannan/dev/cb/bible-tools/lxx-vocab2/data/cite_lsj_cex/lsj_chicago.cex';
const DEFAULT_INDEX = '/home/cbrannan/dev/cb/bible-tools/lxx-vocab2/data/cite_lsj_cex/lsj_index.txt';
const OUT_DIR = path.join(REPO_ROOT, 'static', 'data', 'lexicons', 'lsj');

// ----------------------------------------------------
// 1. Greek Normalization & Diacritics
// ----------------------------------------------------
const GREEK_DIAC_REGEX = /[\u0300-\u036f\u0313\u0314\u0342\u0345\u0308']+/g;

function normalizeGreek(str) {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFD').replaceAll(/[\u0304\u0305\u0306]+/g, '');
}

function removeDiacritics(str) {
  if (!str) return '';
  const norm = normalizeGreek(str);
  return norm.replace(GREEK_DIAC_REGEX, '').toLowerCase().replace(/ς/g, 'σ');
}

function isCapitalized(str) {
  if (!str) return false;
  const clean = normalizeGreek(str.trim()).replace(GREEK_DIAC_REGEX, '');
  if (!clean) return false;
  return clean[0].toLowerCase() !== clean[0];
}

// Map initial Greek letter to bucket name
const GREEK_BUCKET_MAP = {
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
  'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
  'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
  'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau',
  'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi',
  'ω': 'omega'
};

function getGreekBucket(text) {
  if (!text) return 'other';
  const plain = removeDiacritics(text);
  if (!plain) return 'other';
  const ch = plain[0];
  return GREEK_BUCKET_MAP[ch] || 'other';
}

// ----------------------------------------------------
// 2. Linguistic Variation Rules (from greek-utils.js)
// ----------------------------------------------------
class RegexReplace {
  constructor(match, replace) {
    this.match = match;
    this.replace = replace;
  }
}

const EUPHONY_RULES = [
  new RegexReplace(/νγ/, 'γγ'),
  new RegexReplace(/νκ/, 'γκ'),
  new RegexReplace(/νμ/, 'μμ'),
  new RegexReplace(/νχ/, 'γχ'),
  new RegexReplace(/νπ/, 'μπ'),
  new RegexReplace(/νφ/, 'μφ'),
  new RegexReplace(/α+/, 'α'),
  new RegexReplace(/u+/, 'υ'),
  new RegexReplace(/φ+/, 'φ'),
  new RegexReplace(/βτ|φτ/, 'πτ'),
  new RegexReplace(/οο/, 'ου'),
  new RegexReplace(/[aο]ε/, 'ε'),
  new RegexReplace(/πσ/, 'ψ'),
  new RegexReplace(/(?<=[αειουωη][\u0314\u0313\u0342\u0301\u0345\u0308\u0300]*)ρ(?!ρ)/, 'ρρ')
];

const ENDING_RULES = [
  new RegexReplace(/ω$/, 'ομαι'),
  new RegexReplace(/ομαι$/, 'ω'),
  new RegexReplace(/α([\u0301]?)ζω$/, 'αννυμι'),
  new RegexReplace(/α([\u0301]?)μαι$/, 'αννυμι'),
  new RegexReplace(/ι([\u0301]?)νομαι$/, 'ι$1γνομαι'),
  new RegexReplace(/ι([\u0301]?)γνομαι$/, 'ι$1νομαι'),
  new RegexReplace(/τι([\u0301]?)θεμαι$/, 'τι$1θημι'),
  new RegexReplace(/τι([\u0301]?)θημι$/, 'τι$1θεμαι'),
  new RegexReplace(/[εο](\u0301)?ω$/, 'α$1ω'),
  new RegexReplace(/[αο](\u0301)?ω$/, 'ε$1ω'),
  new RegexReplace(/ο(\u0301)?ς$/, 'ο$1ν'),
  new RegexReplace(/ο(\u0301)?ν$/, 'ο$1ς'),
  new RegexReplace(/ο(\u0301)?ς$/, 'η$1'),
  new RegexReplace(/[ηα](\u0301)?$/, 'ο$1ς'),
  new RegexReplace(/α(\u0301)?$/, 'η$1'),
  new RegexReplace(/η(\u0301)?$/, 'α$1'),
  new RegexReplace(/νυ([\u0301]?)ω$/, 'νυ$1μι'),
  new RegexReplace(/υ([\u0301]?)ω$/, 'υντε$1ω'),
  new RegexReplace(/ι([\u0301]?)γνυμι$/, 'ι$1σγω'),
  new RegexReplace(/ολλυ([\u0301]?)ω$/, 'ο$1λλυμι'),
  new RegexReplace(/ω[\u0314\u0313\u0342\u0301\u0345\u0308\u0300]*ς$/, 'ος'),
  new RegexReplace(/ω[\u0314\u0313\u0342\u0301\u0345\u0308\u0300]*ς$/, 'ης'),
  new RegexReplace(/μι(\u0301)?ον$/, 'μειον'),
  new RegexReplace(/ε([\u0301]?)ως$/, 'υ$1ς')
];

function generateVariations(word, rules, combine = true) {
  const variations = [];
  let variant = word;
  let veryVariant = combine ? word : null;
  for (const { match, replace } of rules) {
    variant = word.replaceAll(new RegExp(match, 'g'), replace);
    veryVariant = combine && veryVariant ? veryVariant.replaceAll(new RegExp(match, 'g'), replace) : null;
    if (variant && variant !== word && !variations.includes(variant)) variations.push(variant);
    if (combine && veryVariant && veryVariant !== word && !variations.includes(veryVariant)) variations.push(veryVariant);
  }
  return variations;
}

function findVariations(greek) {
  let variants = generateVariations(greek, EUPHONY_RULES);
  if (!variants.includes(greek)) variants.push(greek);
  const endingVariants = [];
  for (const v of variants) {
    const ev = generateVariations(v, ENDING_RULES, false);
    for (const item of ev) {
      if (!variants.includes(item) && !endingVariants.includes(item)) {
        endingVariants.push(item);
      }
    }
  }
  return [...variants, ...endingVariants];
}

// High-frequency pronouns, irregular verbs, and biblical forms
const MANUAL_OVERRIDES = {
  // Pronouns
  'μου': 'ἐγώ', 'μοι': 'ἐγώ', 'με': 'ἐγώ', 'ἐμοῦ': 'ἐγώ', 'ἐμοί': 'ἐγώ', 'ἐμέ': 'ἐγώ',
  'ἡμεῖς': 'ἐγώ', 'ἡμῶν': 'ἐγώ', 'ἡμῖν': 'ἐγώ', 'ἡμᾶς': 'ἐγώ',
  'σου': 'σύ', 'σοι': 'σύ', 'σε': 'σύ',
  'ὑμεῖς': 'σύ', 'ὑμῶν': 'σύ', 'ὑμῖν': 'σύ', 'ὑμᾶς': 'σύ',
  // Defective verbs & Koine forms
  'φάγω': 'ἐσθίω', 'ἔφαγον': 'ἐσθίω', 'ἔπω': 'λέγω', 'εἶπον': 'λέγω',
  'βίβλος': 'βύβλος', 'κύκλῳ': 'κύκλος', 'πλησίον': 'πλησίος',
  'πρεσβύτερος': 'πρέσβυς', 'οὐχί': 'οὐ',
  'ὀμνύω': 'ὄμνυμι', 'ἀνοίγω': 'ἀνοίγνυμι', 'δεικνύω': 'δείκνυμι',
  'ἀπολλύω': 'ἀπόλλυμι', 'ἐμπίπλημι': 'ἐμπίμπλημι', 'ἐξολοθρεύω': 'ὀλοθρεύω',
  'διατίθεμαι': 'διατίθημι', 'ἀσθενέω': 'ἀσθενής', 'βοηθός': 'βοηθόος',
  'δούλη': 'δοῦλος', 'ᾅδης': 'Ἅιδης'
};

// ----------------------------------------------------
// 3. LSJ Database Parsing
// ----------------------------------------------------
class LsjDataset {
  constructor() {
    this.indexMap = new Map(); // index (e.g. 'n9082') -> { greek, plain }
    this.greekMap = new Map(); // exact greek -> index
    this.plainMap = new Map(); // plain greek -> Array<index>
    this.entries = new Map();  // index -> markdown entry
  }

  loadIndex(indexPath) {
    console.log(`Loading LSJ index from ${indexPath}...`);
    const content = fs.readFileSync(indexPath, 'utf8');
    const lines = content.split('\n');
    let count = 0;

    for (const line of lines) {
      if (!line) continue;
      const m = line.match(/^(n[0-9]+[a-z]?)#([^#]+)#([^#]+)#/);
      if (m) {
        const index = m[1];
        const greek = normalizeGreek(m[2].trim().replaceAll(/[- ]+/g, ''));
        const plain = removeDiacritics(greek);

        this.indexMap.set(index, { greek, plain });
        this.greekMap.set(greek, index);
        this.greekMap.set(greek.toLowerCase(), index);

        if (!this.plainMap.has(plain)) {
          this.plainMap.set(plain, []);
        }
        this.plainMap.get(plain).push(index);
        count++;
      }
    }
    console.log(`  Indexed ${count.toLocaleString()} LSJ entries.`);
  }

  loadCexEntries(cexPath, neededIndices) {
    console.log(`Loading needed entries from ${cexPath}...`);
    const content = fs.readFileSync(cexPath, 'utf8');
    const lines = content.split('\n');
    let loaded = 0;

    for (const line of lines) {
      if (!line || !line.includes('#urn:cite2:hmt:lsj.chicago_md:')) continue;
      const parts = line.trim().split('#');
      if (parts.length >= 4) {
        const urn = parts[1];
        const index = urn.split(':').pop();
        if (neededIndices.has(index)) {
          const entryMd = parts.slice(3).join('#');
          this.entries.set(index, entryMd);
          loaded++;
        }
      }
    }
    console.log(`  Loaded ${loaded.toLocaleString()} full markdown entries.`);
  }

  lookup(word) {
    if (!word) return null;
    const norm = normalizeGreek(word);
    if (this.greekMap.has(norm)) {
      return { index: this.greekMap.get(norm), matchType: 'exact' };
    }
    const plain = removeDiacritics(word);
    if (this.plainMap.has(plain)) {
      const idxs = this.plainMap.get(plain);
      return { index: idxs[0], matchType: 'plain' };
    }
    return null;
  }

  lookupWithRules(word) {
    // 1. Direct lookup
    let match = this.lookup(word);
    if (match) return match;

    // 2. Manual override
    const norm = normalizeGreek(word);
    const plain = removeDiacritics(word);
    const override = MANUAL_OVERRIDES[norm] || MANUAL_OVERRIDES[plain];
    if (override) {
      match = this.lookup(override);
      if (match) return { index: match.index, matchType: 'manual_override', target: override };
    }

    // 3. Koine γιν- -> γιγν-
    if (plain.includes('γιν')) {
      const cand = plain.replaceAll('γιν', 'γιγν');
      if (this.plainMap.has(cand)) {
        return { index: this.plainMap.get(cand)[0], matchType: 'koine_phonetic' };
      }
    }

    // 4. Deponent -ομαι -> -ω / -εω / -αω
    if (plain.endsWith('ομαι')) {
      for (const end of ['ω', 'εω', 'αω']) {
        const cand = plain.slice(0, -4) + end;
        if (this.plainMap.has(cand)) {
          return { index: this.plainMap.get(cand)[0], matchType: 'deponent_to_active' };
        }
      }
    }

    // 5. Neuter -ον -> masculine -ος
    if (plain.endsWith('ον')) {
      const cand = plain.slice(0, -2) + 'οσ';
      if (this.plainMap.has(cand)) {
        return { index: this.plainMap.get(cand)[0], matchType: 'neuter_adjective' };
      }
    }

    // 6. Systematic variations (euphony + endings)
    const variations = findVariations(plain);
    for (const v of variations) {
      const vPlain = removeDiacritics(v);
      if (this.plainMap.has(vPlain)) {
        return { index: this.plainMap.get(vPlain)[0], matchType: 'variation' };
      }
    }

    return null;
  }
}

// ----------------------------------------------------
// 4. Main Build Runner
// ----------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  let cexPath = DEFAULT_CEX;
  let indexPath = DEFAULT_INDEX;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cex' && args[i + 1]) cexPath = args[++i];
    if (args[i] === '--index' && args[i + 1]) indexPath = args[++i];
  }

  if (!fs.existsSync(cexPath) || !fs.existsSync(indexPath)) {
    console.error(`ERROR: CEX file (${cexPath}) or Index file (${indexPath}) not found!`);
    process.exit(1);
  }

  const lsj = new LsjDataset();
  lsj.loadIndex(indexPath);

  // Load lexemes from both LXX and SBLGNT
  const lxxFile = path.join(REPO_ROOT, 'static', 'data', 'lxx', 'lexemes.json');
  const sblgntFile = path.join(REPO_ROOT, 'static', 'data', 'sblgnt', 'lexemes.json');

  const allWords = new Map(); // plainKey -> { lemma, plain, strongs, pos, datasets: [] }

  function ingestDataset(filePath, dbName) {
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Dataset file not found: ${filePath}`);
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Ingesting ${Object.keys(data).length.toLocaleString()} lexemes from ${dbName}...`);
    for (const [idStr, item] of Object.entries(data)) {
      const lemma = item.lemma || '';
      const plain = removeDiacritics(item.plain || lemma);
      if (!plain) continue;

      if (!allWords.has(plain)) {
        allWords.set(plain, {
          lemma,
          plain,
          strongs: item.strongs || '',
          isProper: isCapitalized(lemma),
          occurrences: item.total || 0,
          lexIds: { [dbName]: Number(item.id || idStr) }
        });
      } else {
        const existing = allWords.get(plain);
        existing.occurrences += (item.total || 0);
        existing.lexIds[dbName] = Number(item.id || idStr);
      }
    }
  }

  ingestDataset(lxxFile, 'lxx');
  ingestDataset(sblgntFile, 'sblgnt');

  console.log(`Total unique Greek plain words across corpora: ${allWords.size.toLocaleString()}`);

  // Perform matching
  console.log('Matching vocabulary to LSJ...');
  const neededIndices = new Set();
  const matchedEntries = new Map(); // plainKey -> { lsjIndex, matchType, headword }
  let matchedCount = 0;
  let properCount = 0;
  let unmatchedProperCount = 0;
  let unmatchedGreekCount = 0;

  for (const [plain, info] of allWords.entries()) {
    if (info.isProper) {
      properCount++;
    }

    const match = lsj.lookupWithRules(info.lemma);
    if (match) {
      matchedCount++;
      neededIndices.add(match.index);
      const headwordInfo = lsj.indexMap.get(match.index);
      matchedEntries.set(plain, {
        lsjIndex: match.index,
        matchType: match.matchType,
        headword: headwordInfo?.greek || info.lemma
      });
    } else {
      if (info.isProper) {
        unmatchedProperCount++;
      } else {
        unmatchedGreekCount++;
      }
    }
  }

  const nonProperTotal = allWords.size - properCount;
  console.log('\n================ MATCHING RESULTS ================');
  console.log(`Total Lexemes:              ${allWords.size.toLocaleString()}`);
  console.log(`Proper Nouns:               ${properCount.toLocaleString()}`);
  console.log(`Non-Proper Greek Words:     ${nonProperTotal.toLocaleString()}`);
  console.log(`Total Matched:              ${matchedCount.toLocaleString()} (${((matchedCount / allWords.size) * 100).toFixed(2)}% overall)`);
  console.log(`Non-Proper Match Rate:      ${(((matchedCount - (properCount - unmatchedProperCount)) / nonProperTotal) * 100).toFixed(2)}%`);
  console.log(`Unmatched Non-Proper Words: ${unmatchedGreekCount.toLocaleString()} (${((unmatchedGreekCount / nonProperTotal) * 100).toFixed(2)}%)`);
  console.log(`Unmatched Proper Nouns:     ${unmatchedProperCount.toLocaleString()}`);
  console.log(`Unique LSJ Entries Needed:  ${neededIndices.size.toLocaleString()}`);
  console.log('==================================================\n');

  // Load entry markdown from CEX for needed indices
  lsj.loadCexEntries(cexPath, neededIndices);

  // Group into 25 letter buckets
  console.log('Partitioning dictionary entries into letter shards...');
  const shards = {};
  for (const bucket of Object.values(GREEK_BUCKET_MAP)) {
    shards[bucket] = {};
  }
  shards['other'] = {};

  for (const [plain, matchInfo] of matchedEntries.entries()) {
    const entryDef = lsj.entries.get(matchInfo.lsjIndex);
    if (!entryDef) continue;

    const bucket = getGreekBucket(plain);
    shards[bucket][plain] = {
      headword: matchInfo.headword,
      lsjIndex: matchInfo.lsjIndex,
      matchType: matchInfo.matchType,
      def: entryDef
    };
  }

  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalSize = 0;
  for (const [bucket, entries] of Object.entries(shards)) {
    const filePath = path.join(OUT_DIR, `${bucket}.json`);
    const jsonStr = JSON.stringify(entries);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    const sizeKb = Buffer.byteLength(jsonStr, 'utf8') / 1024;
    totalSize += sizeKb;
    console.log(`  Saved ${bucket}.json: ${Object.keys(entries).length.toLocaleString()} entries (${sizeKb.toFixed(1)} KB)`);
  }

  console.log(`\nAll shards saved to ${OUT_DIR} (${(totalSize / 1024).toFixed(2)} MB total uncompressed).`);
}

main().catch((err) => {
  console.error('Fatal error building LSJ dictionary:', err);
  process.exit(1);
});
