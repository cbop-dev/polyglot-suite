"""Pipeline Core - Database HTTP-VFS Chunker.

Chunks compiled SQLite databases into byte slices (default 5MB) for static web hosting
via sql.js-httpvfs, and generates client config.json.
"""

from __future__ import annotations
import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Optional, List, Dict, Any

DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB


class DatabaseChunker:
    """Slices a compiled SQLite database into byte-range chunks for sql.js-httpvfs."""

    def __init__(
        self,
        db_path: Path | str,
        output_dir: Path | str,
        chunk_prefix: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ):
        self.db_path = Path(db_path).resolve()
        self.output_dir = Path(output_dir).resolve()
        self.chunk_prefix = chunk_prefix
        self.chunk_size = chunk_size

    def chunk(self) -> Dict[str, Any]:
        """Executes database chunking and writes config.json.
        
        Returns the generated config dictionary.
        """
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found at {self.db_path}")

        self.output_dir.mkdir(parents=True, exist_ok=True)
        total_bytes = self.db_path.stat().st_size
        size_mb = total_bytes / (1024 * 1024)

        print(f"==================================================")
        print(f"Chunking database for sql.js-httpvfs: {self.chunk_prefix}")
        print(f"Source: {self.db_path} ({size_mb:.2f} MB)")
        print(f"Destination: {self.output_dir}")
        print(f"Chunk size: {self.chunk_size / (1024*1024):.1f} MB")
        print(f"==================================================")

        # 1. Clean previous chunks matching this prefix
        for old_file in self.output_dir.glob(f"{self.chunk_prefix}.*"):
            if old_file.name != "config.json":
                old_file.unlink()

        # 2. Extract SQLite page size
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA page_size;")
        page_size = cur.fetchone()[0]
        conn.close()

        # 3. Stream and chunk file
        t0 = time.time()
        chunk_index = 0
        orig_hasher = hashlib.sha256()
        chunk_files: List[Dict[str, Any]] = []

        with open(self.db_path, "rb") as src:
            while True:
                data = src.read(self.chunk_size)
                if not data:
                    break

                orig_hasher.update(data)
                chunk_filename = f"{self.chunk_prefix}.{chunk_index:02d}"
                chunk_dest = self.output_dir / chunk_filename

                chunk_hasher = hashlib.sha256(data)
                with open(chunk_dest, "wb") as dst:
                    dst.write(data)

                chunk_files.append({
                    "name": chunk_filename,
                    "offset": chunk_index * self.chunk_size,
                    "size": len(data),
                    "sha256": chunk_hasher.hexdigest(),
                })
                print(f"  → Wrote {chunk_filename}: {len(data) / (1024*1024):.2f} MB")
                chunk_index += 1

        db_sha256 = orig_hasher.hexdigest()

        # 4. Generate sql.js-httpvfs config.json
        cache_bust = f"v{int(time.time())}"
        url_prefix = self.chunk_prefix if self.chunk_prefix.endswith(".") else f"{self.chunk_prefix}."
        config = {
            "serverMode": "chunked",
            "requestChunkSize": page_size,
            "urlPrefix": url_prefix,
            "serverChunkSize": self.chunk_size,
            "databaseLengthBytes": total_bytes,
            "suffixLength": 2,
            "cacheBust": cache_bust,
        }

        config_path = self.output_dir / "config.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

        elapsed = time.time() - t0
        print(f"✓ Created {len(chunk_files)} chunks in {elapsed:.2f}s")
        print(f"✓ Config written to: {config_path}")
        return config
