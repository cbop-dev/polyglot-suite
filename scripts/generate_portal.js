#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

mkdirSync('dist', { recursive: true });

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Polyglot Suite — Ancient Texts & Lexical Readers</title>
  <meta name="description" content="Digital editions, lexical engines, and comparative textual tooling for Biblical and Classical literature." />
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #475569;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --tag-bg: #f1f5f9;
      --tag-text: #334155;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --card-bg: #1e293b;
        --border: #334155;
        --text: #f8fafc;
        --text-muted: #94a3b8;
        --accent: #3b82f6;
        --accent-hover: #60a5fa;
        --tag-bg: #334155;
        --tag-text: #cbd5e1;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1.25rem 4rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      max-width: 1080px;
      width: 100%;
    }
    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-top: 2rem;
    }
    h1 {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.75rem;
    }
    .subtitle {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.75rem;
      margin-bottom: 3.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
      border-color: var(--accent);
    }
    .card.disabled {
      opacity: 0.82;
    }
    .card.disabled:hover {
      transform: none;
      box-shadow: none;
      border-color: var(--border);
    }
    .card-header {
      margin-bottom: 1rem;
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    .badge-live {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .badge-dev {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .description {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1.5rem;
    }
    .tag {
      background: var(--tag-bg);
      color: var(--tag-text);
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      background: var(--accent);
      color: #ffffff;
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background: var(--accent-hover);
    }
    .btn-disabled {
      background: var(--tag-bg);
      color: var(--text-muted);
      cursor: not-allowed;
    }
    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      padding-top: 2rem;
      width: 100%;
    }
    footer a {
      color: var(--accent);
      text-decoration: none;
    }
    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Polyglot Suite</h1>
      <p class="subtitle">Digital editions, lexical engines, and comparative textual readers for ancient literature.</p>
    </header>

    <div class="grid">
      <!-- Polyglot Bible Reader -->
      <div class="card">
        <div>
          <div class="card-header">
            <span class="badge badge-live">Available</span>
            <h2>Polyglot Bible Reader</h2>
          </div>
          <p class="description">Multi-corpus biblical reader featuring Tyndale House TVTMS universal cross-tradition verse alignment, unabridged LSJ &amp; BDB lexicons, instant lemma concordance search, and multi-color highlighting.</p>
          <div class="tags">
            <span class="tag">Hebrew MT</span>
            <span class="tag">Greek LXX</span>
            <span class="tag">Greek SBLGNT</span>
            <span class="tag">Latin Vulgate</span>
            <span class="tag">English KJV/NET</span>
            <span class="tag">SvelteKit 5</span>
            <span class="tag">sql.js-httpvfs</span>
          </div>
        </div>
        <a href="./bible/" class="btn">Launch Bible Reader &rarr;</a>
      </div>

      <!-- Josephus Reader -->
      <div class="card">
        <div>
          <div class="card-header">
            <span class="badge badge-live">Available</span>
            <h2>Josephus Reader</h2>
          </div>
          <p class="description">Synchronized parallel Greek and English reader for the complete corpus of Flavius Josephus (Jewish War, Antiquities of the Jews, Life, and Against Apion) with interactive morphology inspection.</p>
          <div class="tags">
            <span class="tag">Ancient Greek</span>
            <span class="tag">Whiston English</span>
            <span class="tag">Jewish War</span>
            <span class="tag">Antiquities</span>
            <span class="tag">Astro 6</span>
            <span class="tag">Svelte 5</span>
          </div>
        </div>
        <a href="./josephus/" class="btn">Launch Josephus Reader &rarr;</a>
      </div>

      <!-- Apostolic Fathers Reader -->
      <div class="card disabled">
        <div>
          <div class="card-header">
            <span class="badge badge-dev">In Development</span>
            <h2>Apostolic Fathers Reader</h2>
          </div>
          <p class="description">Tri-lingual parallel reader covering all 15 canonical works of the Apostolic Fathers with Kirsopp Lake Loeb Greek/English text, Latin fragments, unabridged LSJ definitions, and multi-color lemma highlighter.</p>
          <div class="tags">
            <span class="tag">1 &amp; 2 Clement</span>
            <span class="tag">Ignatius</span>
            <span class="tag">Polycarp</span>
            <span class="tag">Didache</span>
            <span class="tag">Shepherd of Hermas</span>
            <span class="tag">LSJ Lexicon</span>
          </div>
        </div>
        <button class="btn btn-disabled" disabled>Coming Soon</button>
      </div>
    </div>

    <footer>
      <p>Polyglot Suite &bull; Maintained by <a href="https://github.com/cbop-dev/polyglot-suite">cbop-dev</a></p>
    </footer>
  </div>
</body>
</html>
`;

writeFileSync(resolve('dist/index.html'), html, 'utf8');
console.log('✓ Generated dist/index.html portal page');
