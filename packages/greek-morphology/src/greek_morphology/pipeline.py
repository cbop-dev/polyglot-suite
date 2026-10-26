"""Morphological Pipeline Runner for orchestrating end-to-end corpus builds."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

from .adapters.base import BaseCorpusAdapter, Token, Verse, BookMeta
from .gazetteer import build_gazetteer_from_tokens
from .solver import MorphologySolver
from .neural import NeuralStanzaPipeline
from .emit import CorpusEmitter
from .gloss import GlossResolver
from .consolidator import LemmaConsolidator

logger = logging.getLogger(__name__)


class MorphologicalPipeline:
    """End-to-end pipeline coordinator for Ancient Greek text processing."""

    def __init__(
        self,
        adapter: BaseCorpusAdapter,
        output_data_dir: Path,
        output_lib_dir: Optional[Path] = None,
        use_neural: bool = False,
        gi_cache: Optional[Dict[str, Any]] = None,
        sblgnt_lexicon: Optional[Dict[str, Any]] = None,
    ):
        self.adapter = adapter
        self.output_data_dir = Path(output_data_dir)
        self.output_lib_dir = Path(output_lib_dir) if output_lib_dir else None
        self.use_neural = use_neural
        self.gi_cache = gi_cache or {}
        self.sblgnt_lexicon = sblgnt_lexicon or {}

    def run(self) -> Dict[str, Any]:
        """Execute all pipeline stages: Ingest -> Gazetteer -> Neural/Rule Solver -> Emit."""
        logger.info("Stage 1: Ingesting and tokenizing corpus...")
        tokens, verses, books = self.adapter.load_corpus()
        token_dicts = [{"raw": t.raw, "clean": t.clean, "plain": t.plain} for t in tokens]

        logger.info("Stage 2: Building proper name gazetteer (%d tokens)...", len(tokens))
        gazetteer = build_gazetteer_from_tokens(token_dicts)

        neural_preds = None
        if self.use_neural:
            logger.info("Stage 3: Running neural Stanza parser...")
            neural = NeuralStanzaPipeline()
            if neural.is_available():
                # Batch sentences by verse
                sentences = []
                for v in verses:
                    v_words = [tokens[idx].clean for idx in v.token_indices if idx < len(tokens)]
                    if v_words:
                        sentences.append(v_words)
                neural_batches = neural.tag_batch(sentences)
                # Flatten
                neural_preds = [word for sent in neural_batches for word in sent]

        logger.info("Stage 4: Resolving morphology and lemmatization constraints...")
        solver = MorphologySolver(gazetteer=gazetteer, gi_cache=self.gi_cache)
        for i, tok in enumerate(tokens):
            n_pred = neural_preds[i] if neural_preds and i < len(neural_preds) else None
            res = solver.resolve_single(tok.clean, raw=tok.raw, neural_pred=n_pred)
            tok.lemma = res["lemma"]
            tok.pos = res["pos"]
            tok.upos = res["upos"]
            tok.morph = res["morph"]
            tok.confidence = res["confidence"]
            tok.source = res["source"]

        logger.info("Stage 5: Canonical consolidation and emitting datasets...")
        gloss_resolver = GlossResolver(sblgnt_lexicon=self.sblgnt_lexicon)
        consolidator = LemmaConsolidator()
        emitter = CorpusEmitter(
            output_data_dir=self.output_data_dir,
            output_lib_dir=self.output_lib_dir,
            gloss_resolver=gloss_resolver,
            consolidator=consolidator,
        )
        stats = emitter.emit_corpus(tokens, verses, books)
        logger.info("Pipeline complete! Emitted %d lexemes across %d verses.", stats["lexemes_count"], stats["verses_count"])
        return stats
