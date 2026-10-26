"""Command-line interface for greek-morph."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .lemmatizer import GreekLemmatizer
from .adapters.swete_csv import SweteCsvAdapter
from .adapters.plain_text import PlainTextAdapter
from .pipeline import MorphologicalPipeline


def main():
    parser = argparse.ArgumentParser(
        prog="greek-morph",
        description="Greek Lemmatization and Morphological Pipeline Tool",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: parse
    parse_parser = subparsers.add_parser("parse", help="Parse and lemmatize Greek text or file")
    parse_parser.add_argument("text", nargs="?", help="Greek text to lemmatize (or omit if using --file)")
    parse_parser.add_argument("-f", "--file", type=Path, help="Input text file")
    parse_parser.add_argument("-o", "--output", type=Path, help="Output JSON file")
    parse_parser.add_argument("--neural", action="store_true", help="Enable Stanza neural parser")

    # Command: build-corpus
    build_parser = subparsers.add_parser("build-corpus", help="Build full static JSON corpus dataset")
    build_parser.add_argument("--swete-vers", type=Path, help="Swete versification CSV path")
    build_parser.add_argument("--swete-words", type=Path, help="Swete words CSV path")
    build_parser.add_argument("--text-file", type=Path, help="Plain text input file")
    build_parser.add_argument("--out-data", type=Path, required=True, help="Destination data directory")
    build_parser.add_argument("--out-lib", type=Path, help="Destination client search index directory")
    build_parser.add_argument("--neural", action="store_true", help="Enable Stanza neural parser")

    args = parser.parse_args()

    if not args.command or args.command == "parse":
        text = args.text
        if not text and args.file and args.file.exists():
            with open(args.file, "r", encoding="utf-8") as f:
                text = f.read()

        if not text:
            parse_parser.print_help()
            sys.exit(1)

        lemmatizer = GreekLemmatizer(use_neural=args.neural)
        results = [w.__dict__ for w in lemmatizer.lemmatize_sentence(text)]

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"Wrote {len(results)} parsed words to {args.output}")
        else:
            print(json.dumps(results, ensure_ascii=False, indent=2))

    elif args.command == "build-corpus":
        if args.swete_vers and args.swete_words:
            adapter = SweteCsvAdapter(args.swete_vers, args.swete_words)
        elif args.text_file:
            with open(args.text_file, "r", encoding="utf-8") as f:
                adapter = PlainTextAdapter(f.read())
        else:
            print("Error: Specify either (--swete-vers and --swete-words) or --text-file")
            sys.exit(1)

        pipeline = MorphologicalPipeline(
            adapter=adapter,
            output_data_dir=args.out_data,
            output_lib_dir=args.out_lib,
            use_neural=args.neural,
        )
        pipeline.run()


if __name__ == "__main__":
    main()
