#!/usr/bin/env node
import { spawn } from 'node:child_process';

const apps = [
  { name: 'portal', command: 'npm', args: ['--workspace=portal', 'run', 'dev'], color: '\x1b[35m' },
  { name: 'bible', command: 'npm', args: ['--workspace=polyglot-bible-reader', 'run', 'dev'], color: '\x1b[34m' },
  { name: 'lexemes', command: 'npm', args: ['--workspace=biblical-lexeme-explorer', 'run', 'dev'], color: '\x1b[32m' },
  { name: 'corpora', command: 'npm', args: ['--workspace=ancient-corpora-reader', 'run', 'dev'], color: '\x1b[36m' }
];

console.log('\n  🚀 Launching Polyglot Suite Dev Servers:');
console.log('     ➜ Portal:                   http://localhost:5170');
console.log('     ➜ Bible Reader:             http://localhost:5173');
console.log('     ➜ Biblical Lexeme Explorer: http://localhost:5174');
console.log('     ➜ Ancient Corpora Reader:   http://localhost:5175\n');

const devEnv = {
  ...process.env,
  PUBLIC_BIBLE_APP_URL: process.env.PUBLIC_BIBLE_APP_URL || 'http://localhost:5173',
  PUBLIC_LEXEMES_APP_URL: process.env.PUBLIC_LEXEMES_APP_URL || 'http://localhost:5174',
  PUBLIC_CORPORA_APP_URL: process.env.PUBLIC_CORPORA_APP_URL || 'http://localhost:5175'
};

const procs = apps.map(app => {
  const p = spawn(app.command, app.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: devEnv
  });

  p.stdout.on('data', data => {
    process.stdout.write(`${app.color}[${app.name}]\x1b[0m ${data}`);
  });

  p.stderr.on('data', data => {
    process.stderr.write(`${app.color}[${app.name}]\x1b[0m ${data}`);
  });

  return p;
});

function cleanup() {
  procs.forEach(p => {
    try {
      p.kill();
    } catch {
      // Ignore
    }
  });
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
