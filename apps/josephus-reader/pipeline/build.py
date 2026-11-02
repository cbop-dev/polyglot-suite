"""Josephus Pipeline - Master Build Runner."""

import argparse
import sys
from pathlib import Path

# Ensure pipeline-core is available
REPO_ROOT = Path(__file__).resolve().parents[3]
PIPELINE_CORE_DIR = REPO_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_CORE_DIR))

from pipeline_core import DatabaseChunker
from .db_builder import build_database
from .export_canonical_works import export_ts
from .config import BUILD_DIR, STATIC_DB_DIR


def main():
    parser = argparse.ArgumentParser(description="Josephus Data Pipeline")
    parser.add_argument("--all", action="store_true", help="Run entire pipeline end-to-end")
    parser.add_argument("--build-db", action="store_true", help="Build SQLite database")
    parser.add_argument("--chunk", action="store_true", help="Chunk SQLite database for httpvfs")
    parser.add_argument("--export-ts", action="store_true", help="Export canonical works TypeScript catalog")

    args = parser.parse_args()

    if not any([args.all, args.build_db, args.chunk, args.export_ts]):
        parser.print_help()
        sys.exit(1)

    if args.all or args.build_db:
        print("\n>>> Stage 1: Compiling SQLite Database")
        build_database()

    if args.all or args.chunk:
        print("\n>>> Stage 2: Chunking Database for sql.js-httpvfs")
        db_file = BUILD_DIR / "josephus.sqlite3"
        chunker = DatabaseChunker(
            db_path=db_file,
            output_dir=STATIC_DB_DIR,
            chunk_prefix="josephus.db",
            chunk_size=5 * 1024 * 1024,
        )
        chunker.chunk()

    if args.all or args.export_ts:
        print("\n>>> Stage 3: Exporting TypeScript Definitions")
        export_ts()

    print("\n✓ Pipeline execution complete!")


if __name__ == "__main__":
    main()
