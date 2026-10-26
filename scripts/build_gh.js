#!/usr/bin/env node
import { spawn } from 'node:child_process';

console.log('🌐 Building Polyglot Suite for GitHub Pages (ignoring .env.deploy)...');

// Force GitHub target and strip any VPS-specific environment variables
process.env.TARGET = 'github';
process.env.BUILD_TARGET = 'github';

for (const key of Object.keys(process.env)) {
  if (key.startsWith('PUBLIC_') || key.startsWith('VPS_')) {
    delete process.env[key];
  }
}

const build = spawn('npm', ['run', 'build:www'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});

build.on('close', code => {
  if (code !== 0) {
    console.error(`\x1b[31m❌ GitHub Pages build failed with exit code ${code}\x1b[0m`);
    process.exit(code || 1);
  } else {
    console.log(`\n\x1b[32m✔ GitHub Pages suite build completed successfully in dist/\x1b[0m`);
    console.log(`  Run "npm run preview:gh" to preview locally on http://localhost:5000/polyglot-suite/\n`);
  }
});
