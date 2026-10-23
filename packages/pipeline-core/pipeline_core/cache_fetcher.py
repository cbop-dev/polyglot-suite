"""Pipeline Core - HTTP Cache & Fetcher.

Provides resilient, cached HTTP downloading for upstream classical and biblical text repositories.
"""

from __future__ import annotations
import shutil
import urllib.request
import time
from pathlib import Path
from typing import Optional

DEFAULT_USER_AGENT = "Mozilla/5.0 (PolyglotSuite/1.0; +https://github.com/cbop-dev/polyglot-suite)"


def ensure_directory(path: Path | str) -> Path:
    """Ensures a directory exists and returns it as a Path."""
    p = Path(path).resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


def download_file(
    url: str,
    dest: Path | str,
    force: bool = False,
    timeout: int = 60,
    retries: int = 3,
    user_agent: str = DEFAULT_USER_AGENT,
) -> bool:
    """Downloads a file if not already present or if force=True.
    
    Returns True if downloaded, False if skipped because it already exists.
    """
    dest_path = Path(dest).resolve()
    if dest_path.exists() and not force and dest_path.stat().st_size > 0:
        return False

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = dest_path.with_suffix(dest_path.suffix + ".part")

    headers = {"User-Agent": user_agent}
    req = urllib.request.Request(url, headers=headers)

    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            print(f"Downloading: {url} -> {dest_path.name} (attempt {attempt}/{retries})")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                with open(tmp_path, "wb") as out:
                    shutil.copyfileobj(response, out)
            tmp_path.replace(dest_path)
            return True
        except Exception as e:
            last_error = e
            print(f"Warning: Download attempt {attempt} failed for {url}: {e}")
            if tmp_path.exists():
                tmp_path.unlink()
            if attempt < retries:
                time.sleep(2 * attempt)

    if last_error:
        raise last_error
    return False
