#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const res = spawnSync('npm', ['--workspace=portal', 'run', 'build'], {
  stdio: 'inherit',
  env: process.env
});

if (res.status !== 0) {
  process.exit(res.status ?? 1);
}
