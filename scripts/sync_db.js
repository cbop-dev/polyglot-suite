#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const APPS = {
  bible: {
    name: 'Polyglot Bible Reader',
    dir: path.join(REPO_ROOT, 'apps/polyglot-bible-reader/static/db'),
    pattern: 'polyglot.db.*',
    title: 'Polyglot Bible Reader SQLite Database',
    notes: 'Pre-computed 10MB SQLite database chunks for Polyglot Bible Reader.',
  },
  philo: {
    name: 'Philo Reader',
    dir: path.join(REPO_ROOT, 'apps/philo-reader/static/db'),
    pattern: 'philo.db.*',
    title: 'Philo Reader SQLite Database',
    notes: 'Pre-computed 5MB SQLite database chunks for Philo Reader.',
  },
  fathers: {
    name: 'Apostolic Fathers Reader',
    dir: path.join(REPO_ROOT, 'apps/apostolic-fathers-reader/static/db'),
    pattern: 'af.db.*',
    title: 'Apostolic Fathers Reader SQLite Database',
    notes: 'Pre-computed 5MB SQLite database chunks for Apostolic Fathers Reader.',
  },
};

function getGhEnv() {
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

const ghEnv = getGhEnv();

function getAppConfig(appKey) {
  const app = APPS[appKey];
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

function pullApp(appKey) {
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

function publishApp(appKey) {
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

const action = process.argv[2];
const targetApp = process.argv[3] || 'all';

const targets = targetApp === 'all' ? Object.keys(APPS) : [targetApp];

if (!['--pull', 'pull', '--publish', 'publish'].includes(action)) {
  console.log('Usage: node scripts/sync_db.js [--pull | --publish] [all | bible | philo | fathers]');
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
