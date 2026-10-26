#!/usr/bin/env node
import { spawn } from 'node:child_process';

const apps = [
  { name: 'bible', command: 'npm', args: ['--workspace=polyglot-bible-reader', 'run', 'dev'], color: '\x1b[34m' },
  { name: 'lexemes', command: 'npm', args: ['--workspace=biblical-lexeme-explorer', 'run', 'dev'], color: '\x1b[32m' }
];

console.log('\n  🚀 Launching Polyglot Suite Dev Servers:');
console.log('     ➜ Bible Reader:             http://localhost:5173');
console.log('     ➜ Biblical Lexeme Explorer: http://localhost:5174\n');

const procs = apps.map(app => {
  const p = spawn(app.command, app.args, { stdio: ['inherit', 'pipe', 'pipe'], shell: true });
  p.stdout.on('data', data => {
    process.stdout.write(`${app.color}[${app.name}]\x1b[0m ${data}`);
  });
  p.stderr.on('data', data => {
    process.stderr.write(`${app.color}[${app.name}]\x1b[0m ${data}`);
  });
  return p;
});

function cleanup() {
  procs.forEach(p => p.kill());
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
