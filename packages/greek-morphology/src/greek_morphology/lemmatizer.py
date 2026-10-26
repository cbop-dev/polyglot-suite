"""High-level GreekLemmatizer API for parsing and lemmatizing Greek text."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union

from .normalizer import normalize_greek, strip_accents, to_beta_code
from .solver import MorphologySolver
from .neural import NeuralStanzaPipeline
from .consolidator import LemmaConsolidator
from .gloss import GlossResolver

PUNCT_SPLIT_REGEX = re.compile(r"([.,;:·!?᾽'\"«»\-\u2014()\[\]\s]+)")


@dataclass
class LemmatizedWord:
    surface: str
    lemma: str
    plain: str
    beta: str
    pos: int
    upos: str
    morph: str
    gloss: str = ""
    strongs: str = ""
    confidence: float = 1.0
    source: str = "rule"


class GreekLemmatizer:
    """High-level Python API for lemmatizing Greek text."""

    def __init__(
        self,
        use_neural: bool = False,
        gazetteer: Optional[Dict[str, Any]] = None,
        gi_cache: Optional[Dict[str, Any]] = None,
        sblgnt_lexicon: Optional[Dict[str, Any]] = None,
    ):
        self.solver = MorphologySolver(gazetteer=gazetteer, gi_cache=gi_cache)
        self.consolidator = LemmaConsolidator()
        self.gloss_resolver = GlossResolver(sblgnt_lexicon=sblgnt_lexicon)
        self.neural_pipeline = NeuralStanzaPipeline() if use_neural else None

    def lemmatize_word(self, word: str) -> LemmatizedWord:
        """Lemmatize a single Greek word."""
        clean = normalize_greek(word.strip())
        res = self.solver.resolve_single(clean, raw=word)
        canon_lemma = self.consolidator.canonicalize_lemma(res["lemma"])
        gloss = self.gloss_resolver.resolve_gloss(canon_lemma, res["pos"])
        strongs = self.gloss_resolver.resolve_strongs(canon_lemma)

        return LemmatizedWord(
            surface=clean,
            lemma=canon_lemma,
            plain=strip_accents(canon_lemma),
            beta=to_beta_code(canon_lemma),
            pos=res["pos"],
            upos=res["upos"],
            morph=res["morph"],
            gloss=gloss,
            strongs=strongs,
            confidence=res["confidence"],
            source=res["source"],
        )

    def lemmatize_sentence(self, sentence: str) -> List[LemmatizedWord]:
        """Lemmatize a complete Greek sentence."""
        raw_tokens = [w.strip() for w in re.findall(r"[\w\u0300-\u036f\u1f00-\u1fff]+", sentence) if w.strip()]
        if not raw_tokens:
            return []

        neural_preds = None
        if self.neural_pipeline and self.neural_pipeline.is_available():
            try:
                batch_res = self.neural_pipeline.tag_batch([raw_tokens])
                if batch_res:
                    neural_preds = batch_res[0]
            except Exception:
                neural_preds = None

        results = []
        for i, word in enumerate(raw_tokens):
            clean = normalize_greek(word)
            n_pred = neural_preds[i] if neural_preds and i < len(neural_preds) else None
            res = self.solver.resolve_single(clean, raw=word, neural_pred=n_pred)
            canon_lemma = self.consolidator.canonicalize_lemma(res["lemma"])
            gloss = self.gloss_resolver.resolve_gloss(canon_lemma, res["pos"])
            strongs = self.gloss_resolver.resolve_strongs(canon_lemma)

            results.append(LemmatizedWord(
                surface=clean,
                lemma=canon_lemma,
                plain=strip_accents(canon_lemma),
                beta=to_beta_code(canon_lemma),
                pos=res["pos"],
                upos=res["upos"],
                morph=res["morph"],
                gloss=gloss,
                strongs=strongs,
                confidence=res["confidence"],
                source=res["source"],
            ))

        return results
