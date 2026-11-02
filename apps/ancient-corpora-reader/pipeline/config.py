"""Ancient Corpora Reader (ACR) Pipeline Configuration.

Defines isolated paths for ACR database compilation and chunking.
Standalone reader apps (philo, josephus, af) remain 100% untouched.
"""

from __future__ import annotations
from pathlib import Path

# Base directories strictly within ancient-corpora-reader
ACR_DIR = Path(__file__).resolve().parent.parent
BUILD_DIR = ACR_DIR / "build" / "db"
STATIC_DB_DIR = ACR_DIR / "static" / "db"

# Source databases (read-only input sources)
WORKSPACE_ROOT = ACR_DIR.parent.parent
PHILO_SOURCE_DB = WORKSPACE_ROOT / "apps" / "philo-reader" / "pipeline" / "build" / "philo.sqlite3"
JOSEPHUS_SOURCE_DB = WORKSPACE_ROOT / "apps" / "josephus-reader" / "pipeline" / "build" / "josephus.sqlite3"
AF_SOURCE_DB = WORKSPACE_ROOT / "apps" / "apostolic-fathers-reader" / "pipeline" / "build" / "apostolic-fathers.sqlite3"

CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB
