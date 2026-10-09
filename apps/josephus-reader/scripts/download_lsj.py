#!/usr/bin/env python3
import os
import urllib.request

LSJ_DIR = os.path.join(os.path.dirname(__file__), "..", "raw_xml", "lsj")
os.makedirs(LSJ_DIR, exist_ok=True)

BASE_URL = "https://raw.githubusercontent.com/PerseusDL/lexica/master/CTS_XML_TEI/perseus/pdllex/grc/lsj"

def download_lsj():
    print("Downloading 27 LSJ TEI XML files from PerseusDL/lexica...")
    for i in range(1, 28):
        fname = f"grc.lsj.perseus-eng{i}.xml"
        target_path = os.path.join(LSJ_DIR, fname)
        if os.path.exists(target_path) and os.path.getsize(target_path) > 100000:
            print(f"  Already exists: {fname}")
            continue
        url = f"{BASE_URL}/{fname}"
        print(f"  Downloading {fname} ...")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
            with open(target_path, "wb") as f:
                f.write(data)
            print(f"  Saved {fname} ({len(data)} bytes).")
        except Exception as e:
            print(f"  Failed to download {fname}: {e}")

if __name__ == "__main__":
    download_lsj()
