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
  // Matches e.g. "philo-db-v0.0.5", "af-db-v0.1.5", "database-v0.1.10"
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
  const matchNoV = tag.match(/^(.*)(\d+)\.(\d+)\.(\d+)$/);
  if (matchNoV) {
    return {
      prefix: matchNoV[1],
      major: parseInt(matchNoV[2], 10),
      minor: parseInt(matchNoV[3], 10),
      patch: parseInt(matchNoV[4], 10),
    };
  }
  throw new Error(`Unable to parse semver from tag "${tag}". Expected format like "philo-db-v0.0.5"`);
}

function bumpVersion(currentTag, bumpType = 'patch') {
  const parsed = parseTag(currentTag);
  let { prefix, major, minor, patch } = parsed;

  if (bumpType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
    return `${prefix}${major}.${minor}.${patch}`;
  } else if (bumpType === 'minor') {
    minor += 1;
    patch = 0;
    return `${prefix}${major}.${minor}.${patch}`;
  } else if (bumpType === 'patch') {
    patch += 1;
    return `${prefix}${major}.${minor}.${patch}`;
  } else if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
    return `${prefix}${bumpType}`;
  } else if (bumpType.startsWith(prefix)) {
    return bumpType;
  } else {
    throw new Error(
      `Unknown bump type: "${bumpType}". Expected "patch", "minor", "major", or an explicit version like "0.0.6".`
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
Usage:
  node scripts/release_db.js <app> [bump-type] [options]
  npm run release:db <app> [bump-type] [options]

Arguments:
  app         Target reader app: "bible", "philo", "fathers" (or "af")
  bump-type   "patch" (default), "minor", "major", or explicit version (e.g. "0.0.6")

Options:
  --push       Automatically run "git push origin main" after committing config.json
  --no-commit  Skip the git commit step
  --dry-run    Simulate version bump and asset check without modifying files or uploading

Examples:
  npm run release:db philo
  npm run release:db philo minor
  npm run release:db fathers patch --push
  npm run release:db bible patch
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

  if (flags.has('--help') || flags.has('-h')) {
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

  const newTag = bumpVersion(currentTag, bumpType);
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

  if (isDryRun) {
    console.log(`\n[dry-run] Would update ${configPath} with "databaseVersion": "${newTag}"`);
    console.log(`[dry-run] Would create GitHub Release "${newTag}" and upload ${chunks.length} chunks.`);
    if (!noCommit) {
      console.log(`[dry-run] Would commit ${configPath} with message: chore(${appKey}): bump databaseVersion to ${newTag}`);
    }
    if (shouldPush) {
      console.log(`[dry-run] Would run: git push origin main`);
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
    console.log(`\n🚀 Pushing commit to GitHub (main)...`);
    execSync(`git push origin main`, { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log(`✓ Successfully pushed to GitHub! Pages deployment is now starting.`);
  } else {
    console.log(`\n🎉 Success!`);
    console.log(`👉 Next step: Run "git push origin main" to trigger GitHub Pages CI deployment.\n`);
  }
}

main();
