#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../../..');
const PORTAL_BUILD_DIR = resolve(__dirname, '../build');
const DIST_DIR = resolve(ROOT_DIR, 'dist');

if (existsSync(PORTAL_BUILD_DIR)) {
  mkdirSync(DIST_DIR, { recursive: true });
  cpSync(PORTAL_BUILD_DIR, DIST_DIR, { recursive: true });
  console.log('✓ Merged portal static files into dist/');
} else {
  console.error(`❌ Portal build directory not found at ${PORTAL_BUILD_DIR}`);
  process.exit(1);
}
