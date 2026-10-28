#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS, ghEnv } from './sync_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const REPO = 'cbop-dev/polyglot-suite';

function parseTag(tag) {
  if (!tag) return null;
  const match = tag.match(/^(.*-v)(\d+)\.(\d+)\.(\d+)$/);
  if (match) {
    return {
      prefix: match[1],
      major: parseInt(match[2], 10),
      minor: parseInt(match[3], 10),
      patch: parseInt(match[4], 10),
    };
  }
  const matchNoV = tag.match(/^(.*?)(\d+)\.(\d+)\.(\d+)$/);
  if (matchNoV) {
    return {
      prefix: matchNoV[1],
      major: parseInt(matchNoV[2], 10),
      minor: parseInt(matchNoV[3], 10),
      patch: parseInt(matchNoV[4], 10),
    };
  }
  return null;
}

function compareSemverTags(tagA, tagB) {
  const a = parseTag(tagA);
  const b = parseTag(tagB);
  if (!a || !b) return (tagA || '').localeCompare(tagB || '');
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export function fetchGitHubReleases() {
  try {
    const raw = execSync(
      `gh release list --repo ${REPO} --limit 100 --json tagName,isLatest,publishedAt`,
      {
        cwd: REPO_ROOT,
        env: ghEnv,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getAppPrefixes(app) {
  const prefixes = [app.defaultPrefix];
  if (app.defaultPrefix === 'bible-data-v') {
    prefixes.push('database-v');
  }
  return prefixes;
}

function getMatchingChunks(app) {
  if (!fs.existsSync(app.dir)) return [];
  const regex = new RegExp('^' + app.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  return fs.readdirSync(app.dir).filter((file) => regex.test(file));
}

function getLocalDatabaseInfo(app) {
  const configPath = path.join(app.dir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return { error: `Missing config.json at ${configPath}` };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const chunks = getMatchingChunks(app);
    let totalBytes = 0;
    for (const chunk of chunks) {
      try {
        totalBytes += fs.statSync(path.join(app.dir, chunk)).size;
      } catch {}
    }
    const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return {
      version: config.databaseVersion || 'unknown',
      configPath,
      chunkCount: chunks.length,
      sizeMb,
    };
  } catch (err) {
    return { error: `Failed to read config.json: ${err.message}` };
  }
}

export function checkAppStatus(appKey, releases) {
  const app = APPS[appKey];
  if (!app) {
    throw new Error(`Unknown app "${appKey}". Available: ${Object.keys(APPS).join(', ')}`);
  }

  const local = getLocalDatabaseInfo(app);
  if (local.error) {
    return { appKey, name: app.name, error: local.error };
  }

  const prefixes = getAppPrefixes(app);
  let matchingReleases = [];
  let isLocalPublished = false;
  let latestRemoteTag = null;

  if (releases) {
    matchingReleases = releases.filter((r) => prefixes.some((p) => r.tagName.startsWith(p)));
    isLocalPublished = releases.some((r) => r.tagName === local.version);

    if (matchingReleases.length > 0) {
      matchingReleases.sort((a, b) => compareSemverTags(b.tagName, a.tagName));
      latestRemoteTag = matchingReleases[0].tagName;
    }
  }

  let status = 'UNKNOWN';
  let statusEmoji = '❓';
  let message = '';
  let action = null;

  if (!releases) {
    status = 'CANNOT_REACH_GH';
    statusEmoji = '⚠️';
    message = 'Could not connect to GitHub CLI/API to query remote releases.';
    action = 'Check internet connection or run: gh auth status';
  } else if (!latestRemoteTag && !isLocalPublished) {
    status = 'UNRELEASED';
    statusEmoji = '🆕';
    message = `Local version "${local.version}" is not published to GitHub Releases (no releases found with prefix ${app.defaultPrefix}).`;
    action = `npm run release:db ${appKey}`;
  } else if (!isLocalPublished) {
    status = 'LOCAL_AHEAD_UNRELEASED';
    statusEmoji = '⚠️';
    message = `Local version "${local.version}" is NOT published to GitHub Releases (Latest on GitHub: ${latestRemoteTag}).`;
    action = `npm run release:db ${appKey}`;
  } else if (local.version === latestRemoteTag) {
    if (local.chunkCount === 0) {
      status = 'RELEASED_CHUNKS_MISSING';
      statusEmoji = '📥';
      message = `Release "${local.version}" is live on GitHub, but local chunk files are missing from ${path.relative(REPO_ROOT, app.dir)}.`;
      action = `npm run pull:db ${appKey}`;
    } else {
      status = 'UP_TO_DATE';
      statusEmoji = '✅';
      message = `Local config matches the latest GitHub release (${latestRemoteTag}) and has ${local.chunkCount} local chunk files (${local.sizeMb} MB).`;
      action = 'No action needed. Up to date.';
    }
  } else {
    // Local version is published, but a newer version exists on GitHub
    status = 'LOCAL_BEHIND';
    statusEmoji = '⬇️';
    message = `Local version is "${local.version}", but GitHub has a newer release "${latestRemoteTag}".`;
    action = `Update config.json and run: npm run pull:db ${appKey}`;
  }

  return {
    appKey,
    name: app.name,
    localVersion: local.version,
    chunkCount: local.chunkCount,
    sizeMb: local.sizeMb,
    latestRemoteTag: latestRemoteTag || 'none found',
    isLocalPublished,
    status,
    statusEmoji,
    message,
    action,
  };
}

export function printUsage() {
  console.log(`
Database Status Utility (scripts/status_db.js)
==============================================
Compares local database versions (from static/db/config.json) against GitHub Releases.

Usage:
  node scripts/status_db.js [app]
  npm run status:db:gh [app]
  npm run status:db [app]

Apps:
  all                  Check all reader databases (bible, philo, fathers) [default]
  bible (or lex, data) Polyglot Bible Reader & BLE database (tag: bible-data-vX.Y.Z)
  philo                Philo Reader database (tag: philo-db-vX.Y.Z)
  fathers (or af)      Apostolic Fathers Reader database (tag: af-db-vX.Y.Z)

Options:
  --help, -h           Show this help message

Examples:
  npm run status:db:gh          # Check all databases
  npm run status:db:gh bible    # Check only Polyglot Bible & BLE database
  npm run status:db:gh philo    # Check only Philo Reader database
  npm run status:db:gh fathers  # Check only Apostolic Fathers database
`);
}

function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('-'));

  if (args.includes('--help') || args.includes('-h') || positional.includes('help')) {
    printUsage();
    process.exit(0);
  }

  const targetArg = positional[0] || 'all';
  const targetKeys =
    targetArg === 'all'
      ? ['bible', 'philo', 'fathers']
      : [targetArg];

  for (const key of targetKeys) {
    if (!APPS[key]) {
      console.error(`❌ Unknown app: "${key}". Available: ${Object.keys(APPS).join(', ')}`);
      printUsage();
      process.exit(1);
    }
  }

  console.log('\n🔍 Querying GitHub Releases for cbop-dev/polyglot-suite...');
  const releases = fetchGitHubReleases();
  if (releases) {
    console.log(`   Connected to GitHub CLI: found ${releases.length} total repository releases.\n`);
  } else {
    console.warn(`   ⚠️ Could not query GitHub Releases via "gh release list". Proceeding with local inspection.\n`);
  }

  const results = [];
  // Use unique app dirs to avoid duplicate checks when aliases are given
  const seenDirs = new Set();
  for (const key of targetKeys) {
    const app = APPS[key];
    if (seenDirs.has(app.dir)) continue;
    seenDirs.add(app.dir);
    results.push(checkAppStatus(key, releases));
  }

  console.log('='.repeat(78));
  console.log('DATABASE RELEASE STATUS REPORT');
  console.log('='.repeat(78));

  for (const res of results) {
    console.log(`\n📦 ${res.name} [key: ${res.appKey}]`);
    if (res.error) {
      console.log(`   ❌ Error: ${res.error}`);
      continue;
    }
    console.log(`   Local Version  : ${res.localVersion}`);
    console.log(`   Local Chunks   : ${res.chunkCount} files (${res.sizeMb} MB on disk)`);
    console.log(`   GitHub Latest  : ${res.latestRemoteTag}`);
    console.log(`   Published on GH: ${res.isLocalPublished ? 'Yes' : 'No'}`);
    console.log(`   Status         : ${res.statusEmoji} ${res.status}`);
    console.log(`   Details        : ${res.message}`);
    if (res.action) {
      console.log(`   👉 Action      : ${res.action}`);
    }
  }

  console.log('\n' + '='.repeat(78) + '\n');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  main();
}
