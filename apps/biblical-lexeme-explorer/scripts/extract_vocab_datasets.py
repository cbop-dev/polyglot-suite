#!/usr/bin/env python3
"""
extract_vocab_datasets.py - Build-time Text-Fabric Extractor for LXX-Vocab-Web 2.0.

Extracts:
1. lexemes.json: Complete lexicon dictionary (lemma, gloss, pos, total, beta, plain, strongs)
2. sections.json: Frequency distribution per chapter node and book node { node: { words: N, lex: { id: count } } }
3. concordance.json: Per-lemma occurrence data (total, bookcounts by bookNodeId, refs array, nodes array)
4. books/<Book>.json: Verse texts organized by chapter and verse
5. verses.json: Direct lookup of verse node ID -> { id, section, text }
6. books.json: Book metadata and chapter node mapping
"""

import sys, os, json, argparse, time
from pathlib import Path
from collections import Counter

# Add tf-fast directory from synoptic-viewer-2.0 to sys.path
TF_FAST_DIR = Path("/home/cbrannan/dev/2-tmp/synoptic-viewer-2.0/tf-fast").resolve()
if str(TF_FAST_DIR) not in sys.path:
    sys.path.insert(0, str(TF_FAST_DIR))

from tffast.MyDatasets import getDataset

def extract_dataset(dbname, output_dir):
    print(f"\n==========================================")
    print(f"Extracting Dataset: {dbname}")
    print(f"==========================================")
    start_time = time.time()

    ds = getDataset(dbname)
    if not ds:
        print(f"ERROR: Could not load dataset '{dbname}'!")
        return False

    api = ds.api
    dest_dir = Path(output_dir) / dbname
    books_dir = dest_dir / "books"
    dest_dir.mkdir(parents=True, exist_ok=True)
    books_dir.mkdir(parents=True, exist_ok=True)

    # ----------------------------------------------------
    # 1. Extract Lexemes Lexicon
    # ----------------------------------------------------
    print("1. Extracting lexemes dictionary...")
    lexemes_dict = {}
    lemma_to_id = {}
    if hasattr(ds, 'lexemes') and ds.lexemes:
        for lemma_key, lex in ds.lexemes.items():
            pos_val = 0
            if hasattr(lex, 'pos') and lex.pos is not None:
                if isinstance(lex.pos, list) and len(lex.pos) > 0:
                    pos_val = lex.pos[0]
                elif isinstance(lex.pos, int):
                    pos_val = lex.pos

            # If LXX dataset, reclassify capitalized nouns (pos in [4, 14, 15]) as proper nouns (pos = 13)
            if dbname == "lxx" and lex.lemma and lex.lemma[0].isupper() and pos_val in (4, 14, 15):
                pos_val = 13

            str_id = str(lex.id)
            lexemes_dict[str_id] = {
                "id": lex.id,
                "lemma": lex.lemma,
                "gloss": lex.gloss if hasattr(lex, 'gloss') and lex.gloss else "",
                "pos": pos_val,
                "total": lex.total if hasattr(lex, 'total') else 0,
                "beta": lex.beta if hasattr(lex, 'beta') and lex.beta else "",
                "plain": lex.plain if hasattr(lex, 'plain') and lex.plain else lex.lemma,
                "strongs": getattr(lex, 'strongs', '') or ''
            }
            lemma_to_id[lex.lemma] = lex.id

    with open(dest_dir / "lexemes.json", "w", encoding="utf-8") as f:
        json.dump(lexemes_dict, f, ensure_ascii=False)
    print(f"   Saved {len(lexemes_dict)} lexemes to {dest_dir / 'lexemes.json'}")

    # ----------------------------------------------------
    # 2. Extract Books, Chapters, Verses, Sections & Concordance
    # ----------------------------------------------------
    print("2. Extracting books, sections, and concordance...")
    sections_data = {}  # nodeId -> { "words": int, "lex": { str(lexId): count } }
    concordance = {}    # str(lexId) -> { "total": int, "bookcounts": { str(bNode): count }, "refs": [], "nodes": [] }
    seen_refs = {}      # str(lexId) -> set(refs)
    verse_node_map = {} # str(vNode) -> { "id": vNode, "section": ref_str, "text": text }
    books_meta = {}

    for lex_id in lexemes_dict.keys():
        concordance[lex_id] = {
            "total": 0,
            "bookcounts": {},
            "refs": [],
            "nodes": []
        }
        seen_refs[lex_id] = set()

    for bookNode, bInfo in ds.booksDict.items():
        abbrev = bInfo.get("abbrev", "")
        book_name = bInfo.get("name", abbrev)
        print(f"   Processing book {book_name} ({abbrev}, node {bookNode})...")

        book_data = {
            "book": book_name,
            "abbrev": abbrev,
            "chapters": {}
        }
        book_lex_counts = Counter()
        book_total_words = 0

        # Chapter nodes
        chapter_nodes = api.L.d(bookNode, "chapter")
        for cNode in chapter_nodes:
            cNum = str(api.F.chapter.v(cNode))
            book_data["chapters"][cNum] = {}
            chap_lex_counts = Counter()
            chap_total_words = 0

            # Verse nodes
            verse_nodes = api.L.d(cNode, "verse")
            for vNode in verse_nodes:
                vNum = str(api.F.verse.v(vNode))
                ref_str = f"{abbrev} {cNum}:{vNum}"

                # Text of verse
                raw_text = ds.getText(vNode).strip()

                verse_words = []
                word_nodes = api.L.d(vNode, "word")
                for wNode in word_nodes:
                    wText = ds.getText(wNode).strip()
                    if not wText:
                        continue
                    chap_total_words += 1
                    book_total_words += 1

                    lex_id = ds.getLexID(wNode) if hasattr(ds, 'getLexID') else 0
                    if lex_id > 0:
                        chap_lex_counts[lex_id] += 1
                        book_lex_counts[lex_id] += 1

                        str_lex_id = str(lex_id)
                        if str_lex_id in concordance:
                            concordance[str_lex_id]["total"] += 1
                            str_bNode = str(bookNode)
                            concordance[str_lex_id]["bookcounts"][str_bNode] = (
                                concordance[str_lex_id]["bookcounts"].get(str_bNode, 0) + 1
                            )
                            if ref_str not in seen_refs[str_lex_id]:
                                seen_refs[str_lex_id].add(ref_str)
                                concordance[str_lex_id]["refs"].append(ref_str)
                                concordance[str_lex_id]["nodes"].append(vNode)

                    verse_words.append({
                        "word": wText,
                        "id": lex_id
                    })

                verse_entry = {
                    "id": vNode,
                    "section": ref_str,
                    "text": raw_text
                }
                book_data["chapters"][cNum][vNum] = verse_entry
                verse_node_map[str(vNode)] = verse_entry

            # Store chapter in sections_data
            sections_data[str(cNode)] = {
                "words": chap_total_words,
                "lex": {str(k): v for k, v in chap_lex_counts.items()}
            }

        # Store whole book in sections_data
        sections_data[str(bookNode)] = {
            "words": book_total_words,
            "lex": {str(k): v for k, v in book_lex_counts.items()}
        }

        # Save individual book JSON
        clean_abbrev = abbrev.replace(" ", "_").replace("/", "_")
        book_file = books_dir / f"{clean_abbrev}.json"
        with open(book_file, "w", encoding="utf-8") as f:
            json.dump(book_data, f, ensure_ascii=False)

        books_meta[str(bookNode)] = {
            "name": book_name,
            "abbrev": abbrev,
            "node": bookNode,
            "words": book_total_words,
            "chapters": {str(cNode): str(api.F.chapter.v(cNode)) for cNode in chapter_nodes}
        }

    # Save sections.json
    with open(dest_dir / "sections.json", "w", encoding="utf-8") as f:
        json.dump(sections_data, f, ensure_ascii=False)
    print(f"   Saved {len(sections_data)} sections to {dest_dir / 'sections.json'}")

    # Save concordance.json
    with open(dest_dir / "concordance.json", "w", encoding="utf-8") as f:
        json.dump(concordance, f, ensure_ascii=False)
    print(f"   Saved concordance to {dest_dir / 'concordance.json'}")

    # Save verses index (for fast fetchText by verse node)
    with open(dest_dir / "verses.json", "w", encoding="utf-8") as f:
        json.dump(verse_node_map, f, ensure_ascii=False)
    print(f"   Saved {len(verse_node_map)} verses to {dest_dir / 'verses.json'}")

    # Save books.json metadata
    with open(dest_dir / "books.json", "w", encoding="utf-8") as f:
        json.dump(books_meta, f, ensure_ascii=False, indent=2)
    print(f"   Saved books metadata to {dest_dir / 'books.json'}")

    elapsed = time.time() - start_time
    print(f"Finished {dbname} in {elapsed:.2f} seconds.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Extract Text-Fabric datasets to static JSON for LXX-Vocab-Web 2.0")
    parser.add_argument("--datasets", default="sblgnt,lxx,bhs", help="Comma-separated dataset names")
    parser.add_argument("--output", default="static/data", help="Output directory for static data")
    args = parser.parse_args()

    datasets = [d.strip() for d in args.datasets.split(",") if d.strip()]
    output_path = Path(args.output).resolve()
    print(f"Starting extraction for datasets: {datasets}")
    print(f"Output directory: {output_path}")

    for ds in datasets:
        success = extract_dataset(ds, output_path)
        if not success:
            print(f"Warning: Failed to extract dataset {ds}")

    print("\n==========================================")
    print("ALL DATASETS EXTRACTED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    main()
