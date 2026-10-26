#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPS, publishApp, ghEnv } from './sync_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function parseTag(tag) {
  // Matches e.g. "bible-data-v1.0.0", "philo-db-v0.0.5", "af-db-v0.1.5", "database-v0.1.10"
  const match = tag.match(/^(.*-v)(\d+)\.(\d+)\.(\d+)$/);
  if (match) {
    return {
      prefix: match[1],
      major: parseInt(match[2], 10),
      minor: parseInt(match[3], 10),
      patch: parseInt(match[4], 10),
    };
  }
  // Fallback for tags without "-v"
  const matchNoV = tag.match(/^(.*?)(\d+)\.(\d+)\.(\d+)$/);
  if (matchNoV) {
    return {
      prefix: matchNoV[1],
      major: parseInt(matchNoV[2], 10),
      minor: parseInt(matchNoV[3], 10),
      patch: parseInt(matchNoV[4], 10),
    };
  }
  throw new Error(`Unable to parse semver from tag "${tag}". Expected format like "bible-data-v1.0.0" or "philo-db-v0.0.5"`);
}

function bumpVersion(currentTag, bumpType = 'patch', defaultPrefix = null) {
  // If bumpType is already a full tag (e.g. "bible-data-v1.0.0" or "philo-db-v0.1.0")
  if (bumpType.includes('-v') || (defaultPrefix && bumpType.startsWith(defaultPrefix))) {
    return bumpType;
  }

  const parsed = parseTag(currentTag);
  const targetPrefix = defaultPrefix || parsed.prefix;
  let { major, minor, patch } = parsed;

  const isMigratingPrefix = Boolean(defaultPrefix && parsed.prefix !== defaultPrefix);

  if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
    return `${targetPrefix}${bumpType}`;
  } else if (isMigratingPrefix) {
    // When changing prefix naming convention (e.g. database-v -> bible-data-v),
    // default starting version is 1.0.0
    return `${targetPrefix}1.0.0`;
  } else if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
    return `${targetPrefix}${major}.${minor}.${patch}`;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
    return `${targetPrefix}${major}.${minor}.${patch}`;
  } else if (bumpType === 'patch') {
    patch += 1;
    return `${targetPrefix}${major}.${minor}.${patch}`;
  } else {
    throw new Error(
      `Unknown bump type: "${bumpType}". Expected "patch", "minor", "major", or an explicit version like "1.0.0".`
    );
  }
}

function getMatchingChunks(app) {
  if (!fs.existsSync(app.dir)) return [];
  const regex = new RegExp('^' + app.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
  return fs.readdirSync(app.dir).filter((file) => regex.test(file));
}

function printUsage() {
  console.log(`
Unified Database Release Script (scripts/release_db.js)
======================================================
Prepares, versions, tags, and publishes chunked SQLite databases to GitHub Releases.

Usage:
  node scripts/release_db.js <app> [bump-type] [options]
  npm run release:db <app> [bump-type] [options]

Apps:
  bible (or data)     Polyglot Bible Reader & BLE database (tag: bible-data-vX.Y.Z)
  philo               Philo Reader database (tag: philo-db-vX.Y.Z)
  fathers (or af)     Apostolic Fathers Reader database (tag: af-db-vX.Y.Z)

Bump Types:
  patch               Increment patch version (e.g. 1.0.0 -> 1.0.1) [default]
  minor               Increment minor version (e.g. 1.0.0 -> 1.1.0)
  major               Increment major version (e.g. 1.0.0 -> 2.0.0)
  <X.Y.Z>             Explicit semver (e.g. "1.0.0" -> "bible-data-v1.0.0")
  <full-tag>          Explicit full tag (e.g. "bible-data-v1.0.0")

Options:
  --dry-run           Preview tag bump and verify chunks without uploading or modifying files
  --push              Automatically run "git push" after committing config.json
  --no-commit         Skip automatic "git commit" of the updated config.json
  --help, -h          Show this help message

Release Workflow Order:
  1. Build & Chunk DB:   npm run chunk:bible    (or npm run data:all)
  2. Release DB Chunks:  npm run release:db bible 1.0.0
     -> Updates static/db/config.json with the new tag
     -> Uploads chunked DB files to GitHub Releases
     -> Commits config.json
  3. Deploy Site:        git push origin <branch>
     -> GitHub Actions downloads DB chunks matching config.json tag
     -> Builds and deploys static sites to GitHub Pages

Examples:
  node scripts/release_db.js bible 1.0.0 --dry-run   # Test release of unified bible data v1.0.0
  node scripts/release_db.js bible 1.0.0             # Release bible-data-v1.0.0
  node scripts/release_db.js bible patch             # Bump to next patch version
  node scripts/release_db.js philo minor             # Bump philo DB minor version
`);
}

function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('-')));
  const positional = args.filter((a) => !a.startsWith('-'));

  const appKey = positional[0];
  const bumpType = positional[1] || 'patch';
  const shouldPush = flags.has('--push');
  const noCommit = flags.has('--no-commit');
  const isDryRun = flags.has('--dry-run');

  if (flags.has('--help') || flags.has('-h') || positional.includes('help')) {
    printUsage();
    process.exit(0);
  }

  if (!appKey) {
    printUsage();
    process.exit(1);
  }

  const app = APPS[appKey];
  if (!app) {
    console.error(`❌ Unknown app: "${appKey}". Available: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }

  const configPath = path.join(app.dir, 'config.json');
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Missing config file at ${configPath}`);
    process.exit(1);
  }

  const configRaw = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configRaw);
  const currentTag = config.databaseVersion;

  if (!currentTag) {
    console.error(`❌ "databaseVersion" is not defined in ${configPath}`);
    process.exit(1);
  }

  const newTag = bumpVersion(currentTag, bumpType, app.defaultPrefix);
  console.log(`\n📦 Database Release: ${app.name}`);
  console.log(`   Current version : ${currentTag}`);
  console.log(`   New version     : ${newTag}`);

  // Check chunks
  const chunks = getMatchingChunks(app);
  if (chunks.length === 0) {
    console.error(
      `\n❌ No chunk files matching "${app.pattern}" found in ${app.dir}.\n` +
      `   Please run the database build & chunking pipeline first!`
    );
    process.exit(1);
  }
  console.log(`   Found ${chunks.length} database chunk files to publish.`);

  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf-8' }).trim();
  } catch {}

  if (isDryRun) {
    console.log(`\n[dry-run] Would update ${configPath} with "databaseVersion": "${newTag}"`);
    console.log(`[dry-run] Would create GitHub Release "${newTag}" and upload ${chunks.length} chunks.`);
    if (!noCommit) {
      console.log(`[dry-run] Would commit ${configPath} with message: chore(${appKey}): bump databaseVersion to ${newTag}`);
    }
    if (shouldPush) {
      console.log(`[dry-run] Would run: git push origin ${currentBranch}`);
    }
    console.log('\n[dry-run] Complete.\n');
    return;
  }

  // 1. Update config.json
  config.databaseVersion = newTag;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  console.log(`✓ Updated ${configPath}`);

  // 2. Upload to GitHub Releases
  console.log(`\n🚀 Uploading chunks to GitHub Releases (${newTag})...`);
  try {
    publishApp(appKey);
  } catch (err) {
    console.error(`❌ Failed to publish release:`, err.message);
    console.error(`   Rolling back config.json to ${currentTag}...`);
    config.databaseVersion = currentTag;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    process.exit(1);
  }

  // 3. Git commit config.json
  const relConfigPath = path.relative(REPO_ROOT, configPath);
  if (!noCommit) {
    try {
      execSync(`git add "${relConfigPath}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
      const commitMsg = `chore(${appKey}): bump databaseVersion to ${newTag}`;
      execSync(`git commit -m "${commitMsg}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
      console.log(`✓ Committed ${relConfigPath} (${commitMsg})`);
    } catch (err) {
      console.warn(`⚠️ Warning: Could not automatically commit ${relConfigPath}:`, err.message);
    }
  }

  // 4. Push if requested
  if (shouldPush) {
    console.log(`\n🚀 Pushing commit to GitHub (${currentBranch})...`);
    execSync(`git push origin ${currentBranch}`, { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log(`✓ Successfully pushed to GitHub (${currentBranch})! Pages deployment will trigger when merged to main.`);
  } else {
    console.log(`\n🎉 Success!`);
    console.log(`👉 Next step: Push your commit to GitHub to trigger GitHub Pages CI deployment.\n`);
  }
}

main();
