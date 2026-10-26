"""Neural Morphological Inference Bridge using Stanford Stanza Ancient Greek models."""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class NeuralStanzaPipeline:
    """Wrapper for Stanford Stanza Ancient Greek (grc_proiel) neural pipeline."""

    def __init__(self, package: str = "proiel", use_gpu: bool = True):
        self.package = package
        self.use_gpu = use_gpu
        self._nlp = None

    def is_available(self) -> bool:
        """Check if Stanza library is installed."""
        try:
            import stanza  # type: ignore
            return True
        except ImportError:
            return False

    def initialize(self):
        """Lazy initialization of Stanza pipeline."""
        if self._nlp is not None:
            return

        try:
            import stanza  # type: ignore
            try:
                self._nlp = stanza.Pipeline(
                    lang="grc",
                    package=self.package,
                    processors="tokenize,pos,lemma",
                    tokenize_pretokenized=True,
                    use_gpu=self.use_gpu,
                    verbose=False,
                )
            except Exception:
                logger.info("Downloading Stanza Ancient Greek package '%s'...", self.package)
                stanza.download("grc", package=self.package)
                self._nlp = stanza.Pipeline(
                    lang="grc",
                    package=self.package,
                    processors="tokenize,pos,lemma",
                    tokenize_pretokenized=True,
                    use_gpu=self.use_gpu,
                    verbose=False,
                )
        except Exception as e:
            logger.warning("Could not initialize Stanza neural pipeline: %s", e)
            self._nlp = None

    def tag_batch(self, sentences: List[List[str]]) -> List[List[Dict[str, Any]]]:
        """Tag a batch of pre-tokenized sentences.

        Returns a list of sentences, where each sentence is a list of token dicts
        containing: text, lemma, upos, xpos, feats.
        """
        self.initialize()
        if self._nlp is None:
            # Fallback: emit dummy UPOS/lemma
            return [
                [
                    {
                        "text": word,
                        "lemma": word,
                        "upos": "X",
                        "xpos": "X",
                        "feats": "",
                    }
                    for word in sent
                ]
                for sent in sentences
            ]

        doc = self._nlp(sentences)
        results = []
        for sent in doc.sentences:
            sent_preds = []
            for word in sent.words:
                sent_preds.append({
                    "text": word.text,
                    "lemma": word.lemma or word.text,
                    "upos": word.upos or "X",
                    "xpos": word.xpos or "",
                    "feats": word.feats or "",
                })
            results.append(sent_preds)
        return results
