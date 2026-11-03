#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = parseInt(process.env.PORT || '5000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.sqlite': 'application/vnd.sqlite3',
  '.sqlite3': 'application/vnd.sqlite3',
  '.db': 'application/vnd.sqlite3',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

if (!fs.existsSync(DIST_DIR)) {
  console.error(`\x1b[31m[preview] Error: Build directory "${DIST_DIR}" does not exist.\x1b[0m`);
  console.error(`\x1b[33mRun "npm run build:www" first to build the suite.\x1b[0m\n`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS and base headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.setHeader('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);

  // Support both domain-root / and legacy /polyglot-suite prefixes
  if (reqPath.startsWith('/polyglot-suite')) {
    reqPath = reqPath.slice('/polyglot-suite'.length);
  }
  if (!reqPath.startsWith('/')) {
    reqPath = '/' + reqPath;
  }

  // Resolve target file path within dist
  let targetPath = path.join(DIST_DIR, reqPath);

  // Security check: prevent directory traversal outside DIST_DIR
  if (!targetPath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check file resolution
  let stat;
  try {
    stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      const indexHtml = path.join(targetPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        targetPath = indexHtml;
        stat = fs.statSync(targetPath);
      }
    }
  } catch {
    // File not found on disk
  }

  // SPA Fallback: if not an existing file on disk and not requesting a static asset extension
  if (!stat || !stat.isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    const isStaticAsset = ext && !['.html', '.htm'].includes(ext);

    if (!isStaticAsset) {
      let spaFallback = null;
      if (reqPath.startsWith('/corpora')) {
        spaFallback = path.join(DIST_DIR, 'corpora/index.html');
      } else if (reqPath.startsWith('/bible')) {
        spaFallback = path.join(DIST_DIR, 'bible/index.html');
      } else if (reqPath.startsWith('/lexemes')) {
        spaFallback = path.join(DIST_DIR, 'lexemes/index.html');
      }

      if (spaFallback && fs.existsSync(spaFallback)) {
        targetPath = spaFallback;
        stat = fs.statSync(targetPath);
      }
    }
  }

  if (!stat || !stat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not Found: ${req.url}`);
    return;
  }

  const ext = path.extname(targetPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileSize = stat.size;

  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, {
        'Content-Range': `bytes */${fileSize}`,
        'Content-Type': 'text/plain'
      });
      res.end('Requested Range Not Satisfiable');
      return;
    }

    const chunksize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetPath, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetPath);
    stream.pipe(res);
  }
});

server.listen(PORT, () => {
  console.log('\n  🌍 Polyglot Suite Preview Server running at:');
  console.log(`     ➜ Portal:   http://localhost:${PORT}/`);
  console.log(`     ➜ Bible:    http://localhost:${PORT}/bible/`);
  console.log(`     ➜ Lexemes:  http://localhost:${PORT}/lexemes/`);
  console.log(`     ➜ Corpora:  http://localhost:${PORT}/corpora/`);
  console.log(`     ➜ AF:       http://localhost:${PORT}/corpora/af/1-clem/1`);
  console.log(`     ➜ Philo:    http://localhost:${PORT}/corpora/philo/opif/1`);
  console.log(`     ➜ Josephus: http://localhost:${PORT}/corpora/josephus/war/1\n`);
  console.log('  Press Ctrl+C to stop.\n');
});
