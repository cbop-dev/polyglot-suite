"""Philo Pipeline Package."""

import sys
from pathlib import Path

# Automatically ensure packages/pipeline-core is on sys.path
REPO_ROOT = Path(__file__).resolve().parents[3]
PIPELINE_CORE_DIR = REPO_ROOT / "packages" / "pipeline-core"
if PIPELINE_CORE_DIR.exists() and str(PIPELINE_CORE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_CORE_DIR))
