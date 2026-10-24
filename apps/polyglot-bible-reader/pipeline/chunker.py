"""Polyglot Bible Reader - Database HTTP-VFS Chunker.

Backward-compatible forwarding wrapper around pipeline_core.DatabaseChunker.
"""

from __future__ import annotations
from pathlib import Path
from typing import Optional
from pipeline_core import DatabaseChunker as CoreChunker
from .config import BUILD_DIR, STATIC_DB_DIR

DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB


class DatabaseChunker(CoreChunker):
    """Slices the compiled polyglot working SQLite database into 5MB chunks."""

    def __init__(
        self,
        db_path: Optional[Path] = None,
        output_dir: Optional[Path] = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ):
        super().__init__(
            db_path=db_path or (BUILD_DIR / "polyglot-working.sqlite3"),
            output_dir=output_dir or STATIC_DB_DIR,
            chunk_prefix="polyglot.db",
            chunk_size=chunk_size,
        )


if __name__ == "__main__":
    chunker = DatabaseChunker()
    chunker.chunk()
