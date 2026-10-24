import os
import shutil
import subprocess
import json
import hashlib
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_DB_PATH = os.path.join(REPO_ROOT, 'pipeline', 'build', 'polyglot-working.sqlite3')
DB_PATH = os.environ.get('POLYGLOT_DB_PATH', DEFAULT_DB_PATH)
OUTPUT_DIR = os.path.join(REPO_ROOT, 'static', 'db')
CHUNK_SIZE = 10485760

def rechunk():
    total_bytes = os.path.getsize(DB_PATH)
    print(f'Database size: {total_bytes:,} bytes ({total_bytes / (1024*1024):.2f} MB)')

    # Detect page size in read-only mode so SQLite does not touch file change counter
    import sqlite3
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    cur = conn.cursor()
    cur.execute("PRAGMA page_size;")
    page_size = cur.fetchone()[0]
    conn.close()
    print(f'Detected SQLite page_size: {page_size} bytes.')

    # Remove existing chunks
    for f in os.listdir(OUTPUT_DIR):
        if f.startswith('polyglot.db.'):
            os.remove(os.path.join(OUTPUT_DIR, f))

    # Auto-calculate suffix length for split
    chunk_count = (total_bytes + CHUNK_SIZE - 1) // CHUNK_SIZE
    suffix_len = 3 if chunk_count >= 100 else 2

    # Split using split command
    prefix = os.path.join(OUTPUT_DIR, 'polyglot.db.')
    cmd = ['split', '-b', str(CHUNK_SIZE), '-d', '-a', str(suffix_len), DB_PATH, prefix]
    print(f'Running: {" ".join(cmd)}')
    subprocess.check_call(cmd)

    chunks = sorted([f for f in os.listdir(OUTPUT_DIR) if f.startswith('polyglot.db.')])
    print(f'Created {len(chunks)} chunks ({chunks[0]} .. {chunks[-1]}).')

    # Update config.json
    import time
    config_path = os.path.join(OUTPUT_DIR, 'config.json')
    db_version = "database-v0.1.10"
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                old_conf = json.load(f)
                if "databaseVersion" in old_conf:
                    db_version = old_conf["databaseVersion"]
        except Exception:
            pass

    config = {
        "databaseVersion": db_version,
        "serverMode": "chunked",
        "requestChunkSize": page_size,
        "urlPrefix": "polyglot.db.",
        "serverChunkSize": CHUNK_SIZE,
        "databaseLengthBytes": total_bytes,
        "suffixLength": suffix_len,
        "cacheBust": f"v{int(time.time())}"
    }
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f'Updated config.json (version: {db_version}, requestChunkSize: {page_size}) with length {total_bytes:,} bytes (suffixLength: {suffix_len}).')

    # Verify sha256 checksum of reassembled chunks
    orig_hasher = hashlib.sha256()
    with open(DB_PATH, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            orig_hasher.update(chunk)
    orig_hash = orig_hasher.hexdigest()

    reasm_hasher = hashlib.sha256()
    reasm_size = 0
    for c in chunks:
        c_path = os.path.join(OUTPUT_DIR, c)
        reasm_size += os.path.getsize(c_path)
        with open(c_path, 'rb') as f:
            while chunk := f.read(1024 * 1024):
                reasm_hasher.update(chunk)
    reasm_hash = reasm_hasher.hexdigest()

    assert orig_hash == reasm_hash, f'Checksum mismatch! {orig_hash} != {reasm_hash}'
    assert total_bytes == reasm_size, f'Size mismatch! {total_bytes} != {reasm_size}'
    print(f'[PASS] Checksum verified: SHA256 {orig_hash}')
    print('Re-chunking complete!')

if __name__ == '__main__':
    rechunk()
