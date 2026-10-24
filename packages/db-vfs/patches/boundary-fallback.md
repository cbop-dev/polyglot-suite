# sql.js-httpvfs Chunk Boundary Fallback Patch

## Background & Bug Description
`sql.js-httpvfs` supports reading SQLite databases over HTTP range requests using either a single file or fixed-size chunk files (e.g., 5 MB or 10 MB chunks: `db.00`, `db.01`, etc.).

When SQLite queries execute sequential scans, large index traversals, or joins (such as lexicon or concordance lookups), the VFS read-ahead prefetch accelerator dynamically doubles its request window (`readHead.speed`: 1 -> 2 -> 4 -> ... up to 1,280 pages / 5 MB).

When this prefetch window crosses the boundary between two server chunk files:
1. `rangeMapper()` in `sqlite.worker.ts` computes `toByte = serverFrom + (to - from)`.
2. The HTTP server (or CDN) responds with only the available bytes from the current chunk (clamped to 5 MB), truncating the response.
3. Because the returned buffer does not contain the pages beyond the boundary, `this.chunks[wantedChunkNum]` remains `undefined`.
4. Upstream `lazyFile.ts:104` immediately threw an unrecoverable exception:
   ```javascript
   if (typeof this.chunks[wantedChunkNum] === "undefined")
       throw new Error("doXHR failed (bug)!");
   ```

## The Fix
Before throwing the fatal error, if `this.chunks[wantedChunkNum]` is `undefined`, the worker executes a single-page fallback request for `[wantedChunkNum * chunkSize, (wantedChunkNum + 1) * chunkSize - 1]`.

Because a single database page is 4,096 bytes, this fallback range is guaranteed to reside entirely within a single server chunk file, eliminating any risk of crossing a boundary.

```javascript
if (typeof this.chunks[wantedChunkNum] === "undefined") {
    try {
        const sStart = wantedChunkNum * this.chunkSize;
        const sEnd = Math.min((wantedChunkNum + 1) * this.chunkSize - 1, this.length - 1);
        const sBuf = this.doXHR(sStart, sEnd);
        this.chunks[wantedChunkNum] = new Uint8Array(sBuf, 0, Math.min(this.chunkSize, sBuf.byteLength));
        this.readHeads.unshift({ startChunk: wantedChunkNum, speed: 1 });
        while (this.readHeads.length > this.maxReadHeads) this.readHeads.pop();
    } catch (err) {
        console.warn("[sqlite.worker] boundary fallback failed for page", wantedChunkNum, err);
    }
}
if (typeof this.chunks[wantedChunkNum] === "undefined") throw new Error("doXHR failed (bug)!");
```

This patched file is maintained as the single canonical worker in `packages/db-vfs/assets/sqlite/sqlite.worker.js` and distributed to applications via `sqliteVfsPlugin`.
