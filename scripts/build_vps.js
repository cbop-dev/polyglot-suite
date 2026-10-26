#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

// Parse optional --env=<file> flag
let envFile = '.env.deploy';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--env=')) {
    envFile = arg.slice(6);
  }
}

const envPath = resolve(process.cwd(), envFile);

if (existsSync(envPath)) {
  console.log(`📋 Loading deployment environment from ${envFile}...`);
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} else {
  console.log(`ℹ️  No ${envFile} file found. Building with default relative/base-path settings.`);
  console.log(`   (Copy .env.deploy.example to .env.deploy to configure custom VPS domains)\n`);
}

process.env.TARGET = 'vps';
process.env.BUILD_TARGET = 'vps';

console.log('🚀 Running production suite build (build:www)...');
const build = spawn('npm', ['run', 'build:www'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

build.on('close', code => {
  if (code !== 0) {
    console.error(`\x1b[31m❌ Build failed with exit code ${code}\x1b[0m`);
    process.exit(code || 1);
  } else {
    console.log(`\x1b[32m✔ Suite build completed successfully.\x1b[0m`);
  }
});
