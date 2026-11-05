"""Ancient Corpora Reader (ACR) Pipeline Configuration.

Defines isolated paths for ACR database compilation and chunking.
"""

from __future__ import annotations
import os
import shutil
from pathlib import Path

# Base directories strictly within ancient-corpora-reader
ACR_DIR = Path(__file__).resolve().parent.parent
BUILD_DIR = ACR_DIR / "build" / "db"
STATIC_DB_DIR = ACR_DIR / "static" / "db"

WORKSPACE_ROOT = ACR_DIR.parent.parent

def get_source_db(corpus_id: str) -> Path:
	"""Resolves the best available input database for a corpus."""
	BUILD_DIR.mkdir(parents=True, exist_ok=True)
	raw_path = BUILD_DIR / f"{corpus_id}.raw.sqlite3"
	if raw_path.exists():
		return raw_path

	candidates = []
	if corpus_id == "philo":
		candidates.append(WORKSPACE_ROOT / "apps" / "philo-reader" / "pipeline" / "build" / "philo.sqlite3")
	elif corpus_id == "josephus":
		candidates.append(WORKSPACE_ROOT / "apps" / "josephus-reader" / "pipeline" / "build" / "josephus.sqlite3")
	elif corpus_id == "af":
		candidates.append(WORKSPACE_ROOT / "apps" / "apostolic-fathers-reader" / "pipeline" / "build" / "apostolic-fathers.sqlite3")

	candidates.append(BUILD_DIR / f"{corpus_id}.sqlite3")

	for p in candidates:
		if p.exists():
			try:
				os.link(p, raw_path)
			except Exception:
				shutil.copy2(p, raw_path)
			return raw_path

	raise FileNotFoundError(f"No source database found for {corpus_id}. Looked in: {candidates}")

CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB
