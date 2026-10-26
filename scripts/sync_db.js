#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const APPS = {
  bible: {
    name: 'Polyglot Bible & BLE Engine',
    dir: path.join(REPO_ROOT, 'apps/polyglot-bible-reader/static/db'),
    pattern: 'polyglot.db.*',
    defaultPrefix: 'bible-data-v',
    title: 'Polyglot Bible & Lexeme Explorer SQLite Database',
    notes: 'Consolidated master SQLite database (5MB chunks) and unified lexemes for Polyglot Bible Reader and Biblical Lexeme Explorer.',
  },
  philo: {
    name: 'Philo Reader',
    dir: path.join(REPO_ROOT, 'apps/philo-reader/static/db'),
    pattern: 'philo.db.*',
    defaultPrefix: 'philo-db-v',
    title: 'Philo Reader SQLite Database',
    notes: 'Pre-computed 5MB SQLite database chunks for Philo Reader.',
  },
  fathers: {
    name: 'Apostolic Fathers Reader',
    dir: path.join(REPO_ROOT, 'apps/apostolic-fathers-reader/static/db'),
    pattern: 'af.db.*',
    defaultPrefix: 'af-db-v',
    title: 'Apostolic Fathers Reader SQLite Database',
    notes: 'Pre-computed 5MB SQLite database chunks for Apostolic Fathers Reader.',
  },
};
APPS.data = APPS.bible;
APPS['bible-data'] = APPS.bible;
APPS.af = APPS.fathers;

export function getGhEnv() {
  const env = { ...process.env };
  // In GitHub Actions CI, preserve the runner token
  if (process.env.GITHUB_ACTIONS) {
    return env;
  }
  try {
    execSync('gh repo view cbop-dev/polyglot-suite --json name', { stdio: 'ignore', env });
    return env;
  } catch {
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    return env;
  }
}

export const ghEnv = getGhEnv();

export function getAppConfig(appKey) {
  const app = APPS[appKey];
  if (!app) {
    throw new Error(`Unknown app: "${appKey}". Available: ${Object.keys(APPS).join(', ')}`);
  }
  const configPath = path.join(app.dir, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const tag = config.databaseVersion;
  if (!tag) {
    throw new Error(`"databaseVersion" is not defined in ${configPath}`);
  }
  return { ...app, configPath, tag };
}

export function pullApp(appKey) {
  const app = getAppConfig(appKey);
  console.log(`📥 Downloading database chunks for ${app.name} [release: ${app.tag}]...`);
  fs.mkdirSync(app.dir, { recursive: true });
  execSync(
    `gh release download "${app.tag}" --repo cbop-dev/polyglot-suite --pattern "${app.pattern}" --dir "${app.dir}" --clobber`,
    {
      stdio: 'inherit',
      cwd: REPO_ROOT,
      env: ghEnv,
    }
  );
  console.log(`✅ Successfully downloaded ${app.name} chunks to ${app.dir}\n`);
}

export function publishApp(appKey) {
  const app = getAppConfig(appKey);
  console.log(`📤 Publishing database chunks for ${app.name} [release: ${app.tag}]...`);
  const chunkPattern = path.join(app.dir, app.pattern);
  try {
    execSync(`gh release view "${app.tag}" --repo cbop-dev/polyglot-suite`, { stdio: 'ignore', cwd: REPO_ROOT, env: ghEnv });
    console.log(`Release ${app.tag} exists. Uploading/updating assets...`);
    execSync(
      `gh release upload "${app.tag}" ${chunkPattern} "${app.configPath}" --repo cbop-dev/polyglot-suite --clobber`,
      {
        stdio: 'inherit',
        cwd: REPO_ROOT,
        env: ghEnv,
      }
    );
  } catch {
    console.log(`Creating new release ${app.tag}...`);
    execSync(
      `gh release create "${app.tag}" ${chunkPattern} "${app.configPath}" --repo cbop-dev/polyglot-suite --title "${app.title} ${app.tag}" --notes "${app.notes}"`,
      {
        stdio: 'inherit',
        cwd: REPO_ROOT,
        env: ghEnv,
      }
    );
  }
  console.log(`✅ Successfully published release ${app.tag} for ${app.name}!\n`);
}

export function printUsage() {
  console.log(`
Database Sync Script (scripts/sync_db.js)
========================================
Synchronizes pre-computed SQLite database chunks between GitHub Releases and local static/db/ directories.

Usage:
  node scripts/sync_db.js <--pull | --publish> [app]
  npm run pull:db [app]
  npm run push:db [app]

Actions:
  --pull, pull         Download database chunks from GitHub Releases to local static/db/
  --publish, publish   Upload local database chunks to GitHub Releases

Apps:
  all                  Sync all reader databases (bible, philo, fathers) [default for pull]
  bible (or data)      Polyglot Bible Reader & BLE database (tag: bible-data-vX.Y.Z)
  philo                Philo Reader database (tag: philo-db-vX.Y.Z)
  fathers (or af)      Apostolic Fathers Reader database (tag: af-db-vX.Y.Z)

Options:
  --help, -h, help     Show this help message

Workflow Note:
  Before running 'npm run build:gh', ensure database chunks exist locally by running 'npm run pull:db'.
  In GitHub Actions CI, 'npm run pull:db' is executed automatically during deployment.

Examples:
  npm run pull:db                       # Pull all reader databases from GitHub Releases
  node scripts/sync_db.js pull bible    # Pull only the biblical database
  node scripts/sync_db.js publish bible # Upload local bible chunks to GitHub Releases
`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
  const action = process.argv[2];
  const targetApp = process.argv[3] || 'all';

  if (!action || action === '--help' || action === '-h' || action === 'help') {
    printUsage();
    process.exit(0);
  }

  const targets = targetApp === 'all' ? ['bible', 'philo', 'fathers'] : [targetApp];

  if (!['--pull', 'pull', '--publish', 'publish'].includes(action)) {
    printUsage();
    process.exit(1);
  }

  for (const key of targets) {
    if (!APPS[key]) {
      console.error(`❌ Unknown app: "${key}". Available apps: ${Object.keys(APPS).join(', ')}`);
      process.exit(1);
    }
    try {
      if (action === '--pull' || action === 'pull') {
        pullApp(key);
      } else {
        publishApp(key);
      }
    } catch (err) {
      console.error(`❌ Error syncing ${key}:`, err.message);
      process.exit(1);
    }
  }
}
