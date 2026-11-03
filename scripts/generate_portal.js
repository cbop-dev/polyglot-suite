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
      '{{JOSEPHUS_URL}}': './corpora/josephus/war/1',
      '{{FATHERS_URL}}': './corpora/af/1-clem/1',
      '{{PHILO_URL}}': './corpora/philo/opif/1',
      '{{CORPORA_URL}}': './corpora/',
      '{{PORTAL_URL}}': './'
    }
  : {
      '{{BIBLE_URL}}': process.env.PUBLIC_BIBLE_APP_URL || './bible/',
      '{{LEXEMES_URL}}': process.env.PUBLIC_LEXEMES_APP_URL || './lexemes/',
      '{{JOSEPHUS_URL}}': process.env.PUBLIC_JOSEPHUS_APP_URL || (process.env.PUBLIC_CORPORA_APP_URL ? `${process.env.PUBLIC_CORPORA_APP_URL}/josephus/war/1` : './corpora/josephus/war/1'),
      '{{FATHERS_URL}}': process.env.PUBLIC_FATHERS_APP_URL || (process.env.PUBLIC_CORPORA_APP_URL ? `${process.env.PUBLIC_CORPORA_APP_URL}/af/1-clem/1` : './corpora/af/1-clem/1'),
      '{{PHILO_URL}}': process.env.PUBLIC_PHILO_APP_URL || (process.env.PUBLIC_CORPORA_APP_URL ? `${process.env.PUBLIC_CORPORA_APP_URL}/philo/opif/1` : './corpora/philo/opif/1'),
      '{{CORPORA_URL}}': process.env.PUBLIC_CORPORA_APP_URL || './corpora/',
      '{{PORTAL_URL}}': process.env.PUBLIC_PORTAL_URL || './'
    };

for (const [placeholder, url] of Object.entries(replacements)) {
  html = html.replaceAll(placeholder, url);
}

mkdirSync(resolve(ROOT_DIR, 'dist'), { recursive: true });
writeFileSync(resolve(ROOT_DIR, 'dist/index.html'), html, 'utf8');
console.log('✓ Generated dist/index.html portal page from templates/portal.html');

// Generate static forwarders for consolidated standalone readers
const forwarders = [
  { dir: 'dist/josephus', target: '../corpora/josephus/war/1', name: 'Flavius Josephus' },
  { dir: 'dist/fathers', target: '../corpora/af/1-clem/1', name: 'Apostolic Fathers' },
  { dir: 'dist/philo', target: '../corpora/philo/opif/1', name: 'Philo of Alexandria' }
];

for (const f of forwarders) {
  const fullDir = resolve(ROOT_DIR, f.dir);
  mkdirSync(fullDir, { recursive: true });
  const forwardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting to ${f.name} in Ancient Corpora Reader...</title>
  <meta http-equiv="refresh" content="0; url=${f.target}">
  <script>location.replace(${JSON.stringify(f.target)});</script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 4rem 1rem;">
  <h2>Redirecting to Ancient Corpora Reader</h2>
  <p>${f.name} has been consolidated into the unified Ancient Corpora Reader.</p>
  <p><a href="${f.target}" style="color: #2563eb; text-decoration: underline;">Click here to continue to ${f.name} &rarr;</a></p>
</body>
</html>
`;
  writeFileSync(resolve(fullDir, 'index.html'), forwardHtml, 'utf8');
}
console.log('✓ Generated legacy forwarders in dist/josephus, dist/fathers, dist/philo');

// Generate root dist/404.html for GitHub Pages SPA routing
const root404Html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Polyglot Suite</title>
  <script>
    (function() {
      var pathname = window.location.pathname;
      var search = window.location.search || '';
      var hash = window.location.hash || '';
      
      if (pathname.startsWith('/corpora') || pathname.includes('/corpora/')) {
        window.location.replace('/corpora/' + search + hash);
        return;
      }
      if (pathname.startsWith('/bible') || pathname.includes('/bible/')) {
        window.location.replace('/bible/' + search + hash);
        return;
      }
      if (pathname.startsWith('/lexemes') || pathname.includes('/lexemes/')) {
        window.location.replace('/lexemes/' + search + hash);
        return;
      }
      window.location.replace('/');
    })();
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 4rem 1rem;">
  <h2>Polyglot Suite</h2>
  <p>Redirecting to <a href="./">Polyglot Suite</a>...</p>
</body>
</html>
`;
writeFileSync(resolve(ROOT_DIR, 'dist/404.html'), root404Html, 'utf8');
console.log('✓ Generated dist/404.html SPA router for GitHub Pages');
