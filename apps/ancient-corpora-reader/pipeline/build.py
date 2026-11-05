"""ACR Pipeline Master Runner.

Builds and chunks optimized Tier-2 SQLite databases strictly within Ancient Corpora Reader:
- AF: static/db/af/
- Philo: static/db/philo/
- Josephus: static/db/josephus/
"""

from __future__ import annotations
import argparse
import sys
import shutil
from pathlib import Path

# Add pipeline-core to sys.path
PIPELINE_CORE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))

from pipeline_core import DatabaseChunker

from .config import (
	BUILD_DIR,
	STATIC_DB_DIR,
	get_source_db,
	CHUNK_SIZE,
)
from .db_builder import build_optimized_corpus_db


CORPORA = [
	{
		"id": "af",
		"name": "Apostolic Fathers",
		"target": BUILD_DIR / "af.sqlite3",
		"chunk_dir": STATIC_DB_DIR / "af",
		"chunk_prefix": "af.db",
	},
	{
		"id": "josephus",
		"name": "Flavius Josephus",
		"target": BUILD_DIR / "josephus.sqlite3",
		"chunk_dir": STATIC_DB_DIR / "josephus",
		"chunk_prefix": "josephus.db",
	},
	{
		"id": "philo",
		"name": "Philo of Alexandria",
		"target": BUILD_DIR / "philo.sqlite3",
		"chunk_dir": STATIC_DB_DIR / "philo",
		"chunk_prefix": "philo.db",
	},
]


def build_all(corpora_filter: list[str] | None = None):
	"""Executes end-to-end Tier-2 compilation and chunking for ACR."""
	BUILD_DIR.mkdir(parents=True, exist_ok=True)
	STATIC_DB_DIR.mkdir(parents=True, exist_ok=True)

	targets = [c for c in CORPORA if not corpora_filter or c["id"] in corpora_filter]

	for c in targets:
		cid = c["id"]
		print(f"\n========================================================")
		print(f">>> Processing {c['name']} ({cid})")
		print(f"========================================================")

		src_db = get_source_db(cid)

		# 1. Compile SQLite Database with canonical covering schema
		build_optimized_corpus_db(
			corpus_type=cid,
			src_path=src_db,
			tgt_path=c["target"],
		)

		# 2. Prepare chunk directory (replace symlink if present)
		chunk_dest = c["chunk_dir"]
		if chunk_dest.is_symlink():
			print(f"  → Removing legacy symlink at {chunk_dest}")
			chunk_dest.unlink()
		elif chunk_dest.exists() and not chunk_dest.is_dir():
			chunk_dest.unlink()
			
		chunk_dest.mkdir(parents=True, exist_ok=True)

		# 3. Chunk database for sql.js-httpvfs
		print(f"  → Chunking {c['target'].name} into {chunk_dest}...")
		chunker = DatabaseChunker(
			db_path=c["target"],
			output_dir=chunk_dest,
			chunk_prefix=c["chunk_prefix"],
			chunk_size=CHUNK_SIZE,
		)
		chunker.chunk()
		print(f"✓ Completed {c['name']} ({cid}).")

	print("\n✓ All target corpora compiled and chunked successfully in ACR!")


def main():
	parser = argparse.ArgumentParser(description="ACR Tier-2 Database Compiler and Chunker")
	parser.add_argument("--corpus", choices=["af", "josephus", "philo"], help="Build only specific corpus")
	args = parser.parse_args()

	filter_list = [args.corpus] if args.corpus else None
	build_all(filter_list)


if __name__ == "__main__":
	main()
