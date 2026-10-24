"""Apostolic Fathers Pipeline - Master Build Runner."""

import argparse
import sys
from .fetcher import fetch_all
from .db_builder import build_database
from pipeline_core import DatabaseChunker
from .config import BUILD_DIR, STATIC_DB_DIR
from .export_canonical_works import export_ts


def main():
    parser = argparse.ArgumentParser(description="Apostolic Fathers Data Pipeline")
    parser.add_argument("--all", action="store_true", help="Run entire pipeline end-to-end")
    parser.add_argument("--fetch", action="store_true", help="Fetch source texts and morphology")
    parser.add_argument("--build-db", action="store_true", help="Build SQLite database")
    parser.add_argument("--chunk", action="store_true", help="Chunk SQLite database for httpvfs")
    parser.add_argument("--export-ts", action="store_true", help="Export canonical works TypeScript catalog")

    args = parser.parse_args()

    if not any([args.all, args.fetch, args.build_db, args.chunk, args.export_ts]):
        parser.print_help()
        sys.exit(1)

    if args.all or args.fetch:
        print("\n>>> Stage 1: Fetching Sources")
        fetch_all()

    if args.all or args.build_db:
        print("\n>>> Stage 2: Compiling SQLite Database")
        build_database()

    if args.all or args.chunk:
        print("\n>>> Stage 3: Chunking Database for sql.js-httpvfs")
        db_file = BUILD_DIR / "apostolic-fathers.sqlite3"
        chunker = DatabaseChunker(
            db_path=db_file,
            output_dir=STATIC_DB_DIR,
            chunk_prefix="af.db",
            chunk_size=5 * 1024 * 1024,
        )
        chunker.chunk()

    if args.all or args.export_ts:
        print("\n>>> Stage 4: Exporting TypeScript Definitions")
        export_ts()

    print("\n✓ Pipeline execution complete!")


if __name__ == "__main__":
    main()
