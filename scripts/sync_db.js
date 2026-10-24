#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(REPO_ROOT, 'apps/polyglot-bible-reader/static/db');
const CONFIG_PATH = path.join(DB_DIR, 'config.json');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Error: Config file not found at ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const tag = config.databaseVersion;

if (!tag) {
  console.error('❌ Error: "databaseVersion" is not defined in config.json.');
  process.exit(1);
}

const action = process.argv[2];

if (action === '--pull' || action === 'pull') {
  console.log(`📥 Downloading database chunks for release [${tag}]...`);
  fs.mkdirSync(DB_DIR, { recursive: true });
  try {
    execSync(`gh release download "${tag}" --pattern "polyglot.db.*" --dir "${DB_DIR}" --clobber`, {
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
    console.log(`✅ Successfully downloaded database chunks for ${tag} to ${DB_DIR}`);
  } catch (err) {
    console.error(`❌ Failed to download release via gh CLI:`, err.message);
    process.exit(1);
  }
} else if (action === '--publish' || action === 'publish') {
  console.log(`📤 Publishing database chunks for release [${tag}]...`);
  const chunkPattern = path.join(DB_DIR, 'polyglot.db.*');
  try {
    // Check if release exists
    execSync(`gh release view "${tag}"`, { stdio: 'ignore', cwd: REPO_ROOT });
    console.log(`Release ${tag} exists. Uploading/updating assets...`);
    execSync(`gh release upload "${tag}" ${chunkPattern} "${CONFIG_PATH}" --clobber`, {
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
  } catch {
    console.log(`Creating new release ${tag}...`);
    execSync(`gh release create "${tag}" ${chunkPattern} "${CONFIG_PATH}" --title "Polyglot SQLite Database ${tag}" --notes "Pre-computed 10MB SQLite database chunks for Polyglot Bible Reader."`, {
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
  }
  console.log(`✅ Successfully published database release ${tag}!`);
} else {
  console.log('Usage: node scripts/sync_db.js [--pull | --publish]');
  process.exit(1);
}
