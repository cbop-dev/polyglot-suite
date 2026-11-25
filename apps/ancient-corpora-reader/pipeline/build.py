"""ACR Pipeline Master Runner.

Builds and chunks optimized Tier-2 SQLite databases strictly within Ancient Corpora Reader:
- AF: static/db/af/
- Philo: static/db/philo/
- Josephus: static/db/josephus/
"""

from __future__ import annotations
import argparse
import importlib
import json
import sys
from pathlib import Path

# Add pipeline-core to sys.path
PIPELINE_CORE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))

from pipeline_core import DatabaseChunker

from .config import (
	ACR_DIR,
	BUILD_DIR,
	STATIC_DB_DIR,
	get_source_db,
	CHUNK_SIZE,
)
from .db_builder import build_optimized_corpus_db
from .export_canonical_manifests import export_canonical_manifests


def load_corpora_from_manifest() -> list[dict]:
	"""Loads corpus build targets from apps/ancient-corpora-reader/corpora.manifest.json."""
	manifest_path = ACR_DIR / "corpora.manifest.json"
	with open(manifest_path, "r", encoding="utf-8") as f:
		data = json.load(f)
	entries = []
	for entry in data.get("corpora", []):
		cid = entry["id"]
		pipe = entry.get("pipeline", {})
		entries.append({
			"id": cid,
			"name": entry["name"],
			"target": BUILD_DIR / f"{cid}.sqlite3",
			"chunk_dir": STATIC_DB_DIR / cid,
			"chunk_prefix": pipe.get("chunkPrefix", f"{cid}.db"),
			"db_tag_prefix": pipe.get("dbTagPrefix", f"corpora-{cid}-db-v"),
		})
	return entries


CORPORA = load_corpora_from_manifest()


def _maybe_run_ingestor(cid: str):
	"""Runs pipeline.ingestors.<cid> if <cid>.raw.sqlite3 does not yet exist."""
	raw_path = BUILD_DIR / f"{cid}.raw.sqlite3"
	if raw_path.exists():
		return
	try:
		mod = importlib.import_module(f".ingestors.{cid}", package=__package__)
	except ModuleNotFoundError:
		return
	builder_fn = getattr(mod, f"build_{cid}_raw_db", None) or getattr(mod, "build_raw_db", None)
	if callable(builder_fn):
		builder_fn()


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

		_maybe_run_ingestor(cid)

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
			default_database_version=f"{c['db_tag_prefix']}0.0.0",
		)
		chunker.chunk()
		print(f"✓ Completed {c['name']} ({cid}).")

	# 4. Export canonical manifests from compiled databases to TypeScript
	print("\n>>> Exporting canonical manifests to TypeScript...")
	export_canonical_manifests()

	print("\n✓ All target corpora compiled, chunked, and manifests exported successfully in ACR!")


def main():
	parser = argparse.ArgumentParser(description="ACR Tier-2 Database Compiler and Chunker")
	parser.add_argument("--corpus", choices=["af", "josephus", "philo", "justin"], help="Build only specific corpus")
	args = parser.parse_args()

	filter_list = [args.corpus] if args.corpus else None
	build_all(filter_list)


if __name__ == "__main__":
	main()
