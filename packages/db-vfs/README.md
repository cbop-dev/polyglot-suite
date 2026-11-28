# WebAssembly Database VFS (`@polyglot/db-vfs`)

Client-side SQLite WebAssembly engine with HTTP Virtual File System (`sql.js-httpvfs`) worker bridge and row serialization utilities.

> [!IMPORTANT]
> **AI-Generated Documentation Notice**  
> **Human Review Status:** `To be reviewed`  
> This documentation was generated with AI assistance and may contain inaccuracies. Please verify with the codebase and primary sources.

---

## Overview

`@polyglot/db-vfs` powers the zero-backend architecture of the Polyglot Suite. Instead of querying a server-side database over an API, client browsers query pre-computed SQLite database chunks directly using **HTTP Range Requests** (`sql.js-httpvfs`).

This package provides:
- Web Worker management to run SQLite queries off the main browser UI thread.
- Typed query interfaces and monotonic request ID tracking to avoid race conditions.
- Row deserializers and compressed token blob unpackers (`unpackJsonBlob`).
- A Vite plugin (`@polyglot/db-vfs/vite`) for bundling WASM binaries and worker scripts.

---

## How It Works

```
[Browser UI Thread]
       │
       │  postMessage({ action: "query", sql: "SELECT text FROM text_units WHERE ..." })
       ▼
[Web Worker: @polyglot/db-vfs]
       │
       │  Translates SQLite B-Tree page requests into byte offsets
       ▼
[HTTP Range Requests (GET bytes 20480-24576)]
       │
       ▼
[Static Web Server / CDN (GitHub Pages / Nginx)]
```

Only the specific 4KB or 16KB database pages needed to satisfy a query are fetched across the network. A 500MB database requires only a few kilobytes of transfer to render an active chapter.

---

## Configuration (`config.json`)

Each application provides a `static/db/config.json` manifest defining chunk parameters:

```json
{
  "databaseVersion": "bible-data-v0.3.6",
  "serverMode": "chunked",
  "requestChunkSize": 4096,
  "urlPrefix": "polyglot.db.",
  "serverChunkSize": 5242880,
  "databaseLengthBytes": 898486272,
  "suffixLength": 2,
  "cacheBust": "v1794950218"
}
```

- **`serverChunkSize`**: Size of chunk files on disk (5MB for both Bible and Ancient Corpora).
- **`requestChunkSize`**: Size of individual range requests (4096 bytes for Bible, 16384 bytes for Ancient Corpora).
- **`urlPrefix`**: Chunk file naming pattern (e.g., `polyglot.db.00`, `af.db.00`).

---

## Usage

```typescript
import { createHttpVfsWorker } from '@polyglot/db-vfs';

// Initialize worker with database configuration
const worker = await createHttpVfsWorker({
  configUrl: '/db/config.json',
  wasmUrl: '/sqlite/sql-wasm.wasm',
  workerUrl: '/sqlite/sqlite.worker.js'
});

// Run parameterized queries
const rows = await worker.query(
  'SELECT native_citation, text_content FROM text_units WHERE std_book = ? AND std_chapter = ?',
  ['GEN', 1]
);
```

---

## Testing

Run unit tests from the repository root:
```bash
npm run test:packages
```
