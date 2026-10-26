"""Python Reader for local Biblical Corpora datasets and dictionaries."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Optional, Any, List

from .models import Lexeme, BookInfo, SectionEntry, ConcordanceEntry, VerseEntry, DictionaryEntry


class CorpusReader:
    """Reader for local Biblical Corpora JSON datasets (LXX, SBLGNT, BHS)."""

    def __init__(self, data_dir: Path, corpus: str = "lxx"):
        self.corpus_dir = Path(data_dir) / corpus
        self.corpus = corpus
        self._lexemes: Optional[Dict[str, Lexeme]] = None
        self._books: Optional[Dict[str, BookInfo]] = None
        self._concordance: Optional[Dict[str, ConcordanceEntry]] = None
        self._sections: Optional[Dict[str, SectionEntry]] = None
        self._verses: Optional[Dict[str, VerseEntry]] = None

    def get_lexemes(self) -> Dict[str, Lexeme]:
        if self._lexemes is None:
            p = self.corpus_dir / "lexemes.json"
            with open(p, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._lexemes = {
                k: Lexeme(
                    id=v["id"],
                    lemma=v["lemma"],
                    gloss=v.get("gloss", ""),
                    pos=v["pos"],
                    total=v["total"],
                    beta=v["beta"],
                    plain=v["plain"],
                    strongs=v.get("strongs", ""),
                )
                for k, v in raw.items()
            }
        return self._lexemes

    def get_books(self) -> Dict[str, BookInfo]:
        if self._books is None:
            p = self.corpus_dir / "books.json"
            with open(p, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._books = {
                k: BookInfo(
                    name=v["name"],
                    abbrev=v["abbrev"],
                    node=v["node"],
                    words=v["words"],
                    chapters=v["chapters"],
                )
                for k, v in raw.items()
            }
        return self._books

    def get_concordance(self) -> Dict[str, ConcordanceEntry]:
        if self._concordance is None:
            p = self.corpus_dir / "concordance.json"
            with open(p, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._concordance = {
                k: ConcordanceEntry(
                    total=v["total"],
                    bookcounts=v["bookcounts"],
                    refs=v["refs"],
                    nodes=v["nodes"],
                )
                for k, v in raw.items()
            }
        return self._concordance

    def get_verses(self) -> Dict[str, VerseEntry]:
        if self._verses is None:
            p = self.corpus_dir / "verses.json"
            with open(p, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._verses = {
                k: VerseEntry(id=v["id"], section=v["section"], text=v["text"])
                for k, v in raw.items()
            }
        return self._verses


class LsjDictionaryReader:
    """Reader for LSJ Greek Dictionary shards."""

    def __init__(self, dict_dir: Path):
        self.dict_dir = Path(dict_dir)
        self._cache: Dict[str, Dict[str, Any]] = {}

    def lookup(self, plain_lemma: str) -> Optional[DictionaryEntry]:
        if not plain_lemma:
            return None
        import unicodedata
        norm = unicodedata.normalize("NFKD", plain_lemma)
        clean = "".join(c for c in norm if not unicodedata.combining(c)).lower().replace("ς", "σ").strip()
        if not clean:
            return None
        first_letter = clean[0]
        letter_map = {
            'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
            'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
            'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
            'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
            'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau',
            'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi',
            'ω': 'omega',
        }
        bucket = letter_map.get(first_letter, "other")
        if bucket not in self._cache:
            shard_path = self.dict_dir / f"{bucket}.json"
            if shard_path.exists():
                with open(shard_path, "r", encoding="utf-8") as f:
                    self._cache[bucket] = json.load(f)
            else:
                self._cache[bucket] = {}

        shard = self._cache[bucket]
        entry = shard.get(clean) or shard.get(plain_lemma)
        if entry:
            return DictionaryEntry(
                headword=entry["headword"],
                def_markdown=entry["def"],
                lsj_index=entry.get("lsjIndex"),
                match_type=entry.get("matchType"),
            )
        return None
