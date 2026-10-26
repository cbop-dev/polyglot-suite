#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const isGithubTarget = process.env.TARGET === 'github' || process.env.BUILD_TARGET === 'github' || process.env.ADAPTER === 'github';

if (!isGithubTarget) {
  // Load .env.deploy if present
  const envPath = resolve(ROOT_DIR, '.env.deploy');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const templatePath = resolve(ROOT_DIR, 'templates/portal.html');
if (!existsSync(templatePath)) {
  console.error(`❌ Error: Portal template not found at ${templatePath}`);
  process.exit(1);
}

let html = readFileSync(templatePath, 'utf8');

const replacements = isGithubTarget
  ? {
      '{{BIBLE_URL}}': './bible/',
      '{{LEXEMES_URL}}': './lexemes/',
      '{{JOSEPHUS_URL}}': './josephus/',
      '{{FATHERS_URL}}': './fathers/',
      '{{PHILO_URL}}': './philo/',
      '{{PORTAL_URL}}': './'
    }
  : {
      '{{BIBLE_URL}}': process.env.PUBLIC_BIBLE_APP_URL || './bible/',
      '{{LEXEMES_URL}}': process.env.PUBLIC_LEXEMES_APP_URL || './lexemes/',
      '{{JOSEPHUS_URL}}': process.env.PUBLIC_JOSEPHUS_APP_URL || './josephus/',
      '{{FATHERS_URL}}': process.env.PUBLIC_FATHERS_APP_URL || './fathers/',
      '{{PHILO_URL}}': process.env.PUBLIC_PHILO_APP_URL || './philo/',
      '{{PORTAL_URL}}': process.env.PUBLIC_PORTAL_URL || './'
    };

for (const [placeholder, url] of Object.entries(replacements)) {
  html = html.replaceAll(placeholder, url);
}

mkdirSync(resolve(ROOT_DIR, 'dist'), { recursive: true });
writeFileSync(resolve(ROOT_DIR, 'dist/index.html'), html, 'utf8');
console.log('✓ Generated dist/index.html portal page from templates/portal.html');
