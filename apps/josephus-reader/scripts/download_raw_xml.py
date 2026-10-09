#!/usr/bin/env python3
import os
import urllib.request

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "raw_xml")
os.makedirs(RAW_DIR, exist_ok=True)

WORKS = {
    "tlg001": ("Antiquitates Judaicae", "perseus-grc2.xml", "perseus-eng2.xml"),
    "tlg002": ("Vita", "perseus-grc2.xml", "perseus-eng2.xml"),
    "tlg003": ("Bellum Judaicum", "perseus-grc2.xml", "perseus-eng2.xml"),
    "tlg004": ("Contra Apionem", "perseus-grc2.xml", "perseus-eng2.xml"),
}

BASE_URL = "https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/master/data/tlg0526"

def download_file(url, target_path):
    print(f"Downloading {url} -> {target_path} ...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    with open(target_path, "wb") as f:
        f.write(data)
    print(f"Saved {target_path} ({len(data)} bytes)")

def main():
    for work_id, (name, grc_file, eng_file) in WORKS.items():
        work_dir = os.path.join(RAW_DIR, work_id)
        os.makedirs(work_dir, exist_ok=True)
        
        # Download Greek
        grc_url = f"{BASE_URL}/{work_id}/tlg0526.{work_id}.{grc_file}"
        grc_target = os.path.join(work_dir, f"grc.{grc_file}")
        if not os.path.exists(grc_target):
            download_file(grc_url, grc_target)
        else:
            print(f"Already downloaded: {grc_target}")
            
        # Download English
        eng_url = f"{BASE_URL}/{work_id}/tlg0526.{work_id}.{eng_file}"
        eng_target = os.path.join(work_dir, f"eng.{eng_file}")
        if not os.path.exists(eng_target):
            download_file(eng_url, eng_target)
        else:
            print(f"Already downloaded: {eng_target}")

if __name__ == "__main__":
    main()
