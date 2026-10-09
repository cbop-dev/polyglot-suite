"""Main entrypoint for Josephus Pipeline CLI."""

from __future__ import annotations

import argparse
import sys
from .config import Manifest, MANIFESTS_DIR
from .stage1_niese import run_stage1
from .stage2_validate import run_stage2
from .stage3_tokenize import run_stage3
from .stage4_morphology import run_stage4
from .stage5_lsj import run_stage5
from .stage6_search import run_stage6
from .stage7_emit import run_stage7
from .stage8_ngrams import run_stage8

WORKS = ["Antiquities", "War", "Life", "Apion"]


def run_pipeline_for_work(work_slug: str):
    manifest = Manifest.for_work(work_slug)
    print(f"\n=================== Processing {manifest.title} ({work_slug}) ===================")
    run_stage1(manifest)
    run_stage2(manifest)
    run_stage3(manifest)
    run_stage4(manifest)
    run_stage5(manifest)
    run_stage6(manifest)
    run_stage7(manifest)


def main():
    parser = argparse.ArgumentParser(description="Josephus Pipeline CLI")
    parser.add_argument("cmd", nargs="?", default="all", help="Command: 'all', or work slug (e.g. 'Antiquities')")
    args = parser.parse_args()

    if args.cmd == "all":
        for w in WORKS:
            run_pipeline_for_work(w)
        run_stage8()
        print("\n🎉 Pipeline execution complete for all 30 books of Josephus!")
    elif args.cmd in WORKS or (MANIFESTS_DIR / f"{args.cmd}.yaml").exists():
        run_pipeline_for_work(args.cmd)
    else:
        print(f"Unknown work or command: {args.cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
