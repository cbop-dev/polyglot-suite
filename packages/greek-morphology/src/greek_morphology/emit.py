"""Dataset Emitter for Biblical Corpora Static JSON and Client Search Indexes."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import List, Dict, Any, Optional

from .normalizer import strip_accents, to_beta_code
from .adapters.base import Token, Verse, BookMeta
from .gloss import GlossResolver
from .consolidator import LemmaConsolidator


class CorpusEmitter:
    """Emits production static JSON datasets and search indexes."""

    def __init__(
        self,
        output_data_dir: Path,
        output_lib_dir: Optional[Path] = None,
        gloss_resolver: Optional[GlossResolver] = None,
        consolidator: Optional[LemmaConsolidator] = None,
    ):
        self.output_data_dir = Path(output_data_dir)
        self.output_lib_dir = Path(output_lib_dir) if output_lib_dir else None
        self.gloss_resolver = gloss_resolver or GlossResolver()
        self.consolidator = consolidator or LemmaConsolidator()

    def emit_corpus(
        self,
        tokens: List[Token],
        verses: List[Verse],
        books: Dict[int, BookMeta],
    ) -> Dict[str, Any]:
        """Process tokens and emit all standard JSON corpus files."""
        self.output_data_dir.mkdir(parents=True, exist_ok=True)
        books_out_dir = self.output_data_dir / "books"
        books_out_dir.mkdir(parents=True, exist_ok=True)

        # 1. Build lexemes and frequency counts
        lemma_counts: Dict[str, int] = Counter()
        lemma_pos: Dict[str, Counter] = defaultdict(Counter)

        for tok in tokens:
            lem = tok.lemma or tok.clean
            canon_l = self.consolidator.canonicalize_lemma(lem)
            lemma_counts[canon_l] += 1
            pos_val = tok.pos if tok.pos is not None else (13 if canon_l[0].isupper() else 4)
            lemma_pos[canon_l][pos_val] += 1

        # Assign deterministic Lexeme IDs (sorted by frequency descending, then lemma)
        sorted_lemmata = sorted(lemma_counts.keys(), key=lambda l: (-lemma_counts[l], l))
        lemma_to_id: Dict[str, int] = {}
        lexemes_dict: Dict[str, Dict[str, Any]] = {}

        for idx, lem in enumerate(sorted_lemmata, start=1):
            lemma_to_id[lem] = idx
            best_pos = lemma_pos[lem].most_common(1)[0][0] if lemma_pos[lem] else 4
            gloss = self.gloss_resolver.resolve_gloss(lem, best_pos)
            strongs = self.gloss_resolver.resolve_strongs(lem)

            lexemes_dict[str(idx)] = {
                "id": idx,
                "lemma": lem,
                "gloss": gloss,
                "pos": best_pos,
                "total": lemma_counts[lem],
                "beta": to_beta_code(lem),
                "plain": strip_accents(lem),
                "strongs": strongs,
            }

        # 2. Build Concordance, Sections, and Verses
        concordance: Dict[str, Dict[str, Any]] = {}
        for idx_str in lexemes_dict.keys():
            concordance[idx_str] = {
                "total": 0,
                "bookcounts": {},
                "refs": [],
                "nodes": [],
            }

        verse_node_map: Dict[str, Dict[str, Any]] = {}
        sections_data: Dict[str, Dict[str, Any]] = {}

        # Group verses by book and chapter for books/<Book>.json
        book_verses: Dict[str, Dict[str, Dict[str, str]]] = defaultdict(lambda: defaultdict(dict))

        for v in verses:
            v_id_str = str(v.id)
            verse_node_map[v_id_str] = {
                "id": v.id,
                "section": v.section,
                "text": v.text,
            }
            book_verses[v.book_abbrev][str(v.chap)][str(v.verse)] = v.text

        # 3. Populate concordance and sections from tokens
        seen_refs: Dict[str, set] = defaultdict(set)
        for tok in tokens:
            lem = tok.lemma or tok.clean
            canon_l = self.consolidator.canonicalize_lemma(lem)
            lex_id = lemma_to_id.get(canon_l)
            if not lex_id:
                continue

            lex_id_str = str(lex_id)
            conc = concordance[lex_id_str]
            conc["total"] += 1

            b_abbrev = tok.book_abbrev
            conc["bookcounts"][b_abbrev] = conc["bookcounts"].get(b_abbrev, 0) + 1

            ref_str = f"{tok.book_abbrev} {tok.chap}:{tok.verse}"
            if ref_str not in seen_refs[lex_id_str]:
                seen_refs[lex_id_str].add(ref_str)
                conc["refs"].append(ref_str)
                conc["nodes"].append(tok.verse_id)

        # 4. Save files
        with open(self.output_data_dir / "lexemes.json", "w", encoding="utf-8") as f:
            json.dump(lexemes_dict, f, ensure_ascii=False)

        with open(self.output_data_dir / "concordance.json", "w", encoding="utf-8") as f:
            json.dump(concordance, f, ensure_ascii=False)

        with open(self.output_data_dir / "verses.json", "w", encoding="utf-8") as f:
            json.dump(verse_node_map, f, ensure_ascii=False)

        # Books metadata
        books_meta_dict = {}
        for b_id, b_meta in books.items():
            books_meta_dict[str(b_id)] = {
                "name": b_meta.name,
                "abbrev": b_meta.abbrev,
                "node": b_meta.id,
                "words": b_meta.words,
                "chapters": b_meta.chapters,
            }

        with open(self.output_data_dir / "books.json", "w", encoding="utf-8") as f:
            json.dump(books_meta_dict, f, ensure_ascii=False)

        # Per-book chapter/verse texts
        for b_abbrev, chap_dict in book_verses.items():
            with open(books_out_dir / f"{b_abbrev}.json", "w", encoding="utf-8") as f:
                json.dump(chap_dict, f, ensure_ascii=False)

        # Emit search index if lib dir provided
        if self.output_lib_dir:
            self.output_lib_dir.mkdir(parents=True, exist_ok=True)
            search_lexes = []
            for idx_str, entry in lexemes_dict.items():
                search_lexes.append({
                    "id": entry["id"],
                    "lemma": entry["lemma"],
                    "gloss": entry["gloss"],
                    "pos": entry["pos"],
                    "total": entry["total"],
                    "beta": entry["beta"],
                    "plain": entry["plain"],
                    "strongs": entry["strongs"],
                })
            with open(self.output_lib_dir / "lxxLexes6.json", "w", encoding="utf-8") as f:
                json.dump(search_lexes, f, ensure_ascii=False)

        return {
            "lexemes_count": len(lexemes_dict),
            "verses_count": len(verses),
            "tokens_count": len(tokens),
            "books_count": len(books),
        }
