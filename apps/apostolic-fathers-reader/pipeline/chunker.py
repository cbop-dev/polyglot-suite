"""Apostolic Fathers Pipeline - Database HTTP-VFS Chunker.

Chunks the compiled SQLite database into 5MB slices for static web hosting
via sql.js-httpvfs, and generates the client config.json.
"""

from __future__ import annotations
import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Optional
from .config import BUILD_DIR, STATIC_DB_DIR

DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB


class DatabaseChunker:
    def __init__(
        self,
        db_path: Optional[Path] = None,
        output_dir: Optional[Path] = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ):
        self.db_path = db_path or (BUILD_DIR / "apostolic-fathers.sqlite3")
        self.output_dir = output_dir or STATIC_DB_DIR
        self.chunk_size = chunk_size

    def chunk(self) -> dict:
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database not found at {self.db_path}")

        self.output_dir.mkdir(parents=True, exist_ok=True)
        total_bytes = self.db_path.stat().st_size
        size_mb = total_bytes / (1024 * 1024)

        print(f"==================================================")
        print(f"Chunking Apostolic Fathers DB for sql.js-httpvfs")
        print(f"Source: {self.db_path} ({size_mb:.2f} MB)")
        print(f"Destination: {self.output_dir}")
        print(f"Chunk size: {self.chunk_size / (1024*1024):.1f} MB")
        print(f"==================================================")

        # 1. Clean previous chunks
        for old_file in self.output_dir.glob("af.db.*"):
            old_file.unlink()

        # 2. Page size
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA page_size;")
        page_size = cur.fetchone()[0]
        conn.close()

        # 3. Chunking
        t0 = time.time()
        chunk_index = 0
        orig_hasher = hashlib.sha256()
        chunk_files = []

        with open(self.db_path, "rb") as src:
            while True:
                chunk_data = src.read(self.chunk_size)
                if not chunk_data:
                    break
                orig_hasher.update(chunk_data)

                suffix = f"{chunk_index:02d}"
                chunk_name = f"af.db.{suffix}"
                chunk_path = self.output_dir / chunk_name

                with open(chunk_path, "wb") as dst:
                    dst.write(chunk_data)

                chunk_files.append(chunk_path)
                chunk_index += 1

        elapsed = time.time() - t0
        orig_hash = orig_hasher.hexdigest()
        print(f"Created {len(chunk_files)} chunks in {elapsed:.2f}s ({chunk_files[0].name} .. {chunk_files[-1].name})")

        # 4. Generate config.json
        cache_bust = f"v{int(time.time())}"
        config = {
            "serverMode": "chunked",
            "requestChunkSize": page_size,
            "urlPrefix": "af.db.",
            "serverChunkSize": self.chunk_size,
            "databaseLengthBytes": total_bytes,
            "suffixLength": 2,
            "cacheBust": cache_bust,
        }

        config_path = self.output_dir / "config.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        print(f"Generated {config_path.name}")

        # 5. Integrity check
        reasm_hasher = hashlib.sha256()
        reasm_size = 0
        for cp in chunk_files:
            reasm_size += cp.stat().st_size
            with open(cp, "rb") as cf:
                while block := cf.read(64 * 1024):
                    reasm_hasher.update(block)

        reasm_hash = reasm_hasher.hexdigest()
        assert orig_hash == reasm_hash, "Checksum mismatch!"
        assert total_bytes == reasm_size, "Size mismatch!"
        print(f"[PASS] Reassembly verified! SHA256: {orig_hash[:16]}...")
        return config


if __name__ == "__main__":
    chunker = DatabaseChunker()
    chunker.chunk()
