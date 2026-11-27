"""Pluggable lemmatization & morphological tagging adapters for ACR pipeline.

Decouples raw text ingestion/alignment from token lemmatization so different
schemes (Celano pre-lemmatized XML, Stanza neural models, or untokenized witnesses)
can be selected or swapped without changing db_builder.py or the frontend.
"""

from __future__ import annotations
import sys
from pathlib import Path
from typing import Protocol, List, Dict, Any, Optional

PIPELINE_CORE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))

from pipeline_core.morph_schema import parse_mate_morph  # noqa: E402


class Lemmatizer(Protocol):
	"""Interface for converting a text unit or pre-parsed token stream into canonical ACR tokens."""

	def lemmatize_tokens(self, raw_tokens: List[Dict[str, Any]], lang: str = "grc") -> List[Dict[str, Any]]:
		...


class CelanoLemmatizer:
	"""Adapter for Giuseppe Celano's LemmatizedAncientGreekXML (<t> elements)."""

	def lemmatize_tokens(self, raw_tokens: List[Dict[str, Any]], lang: str = "grc") -> List[Dict[str, Any]]:
		canonical: List[Dict[str, Any]] = []
		for tok in raw_tokens:
			surface = (tok.get("w") or "").strip()
			if not surface:
				continue
			mate_code = (tok.get("o") or "").strip()
			parsed = parse_mate_morph(mate_code) if mate_code else {}
			pos = parsed.get("pos", "")

			# Skip pure punctuation in lemma assignment
			if pos == "punctuation" or (len(surface) == 1 and surface in ".,;·:!?()[]«»\"'—–-"):
				canonical.append({"w": surface, "lang": lang})
				continue

			lemma = (tok.get("l1") or tok.get("l2") or "").strip()
			if not lemma:
				lemma = surface.lower()

			entry: Dict[str, Any] = {
				"w": surface,
				"l": lemma,
				"lang": lang,
			}
			if mate_code:
				entry["m"] = mate_code
			if pos:
				entry["p"] = pos
			canonical.append(entry)
		return canonical


class NoOpLemmatizer:
	"""Pass-through adapter for untokenized or unlemmatized parallel witnesses (e.g. Latin/English)."""

	def lemmatize_tokens(self, raw_tokens: List[Dict[str, Any]], lang: str = "lat") -> List[Dict[str, Any]]:
		return [{"w": tok.get("w", ""), "lang": lang} for tok in raw_tokens if tok.get("w")]


UPOS_TO_ACR_POS = {
	"NOUN": "noun",
	"PROPN": "noun",
	"VERB": "verb",
	"AUX": "verb",
	"ADJ": "adjective",
	"ADV": "adverb",
	"DET": "article",
	"PART": "particle",
	"CCONJ": "conjunction",
	"SCONJ": "conjunction",
	"ADP": "preposition",
	"PRON": "pronoun",
	"NUM": "numeral",
	"INTJ": "interjection",
}


class StanzaLemmatizer:
	"""Adapter for packages/greek-morphology (GreekLemmatizer with Stanza neural grc_proiel)."""

	def __init__(self, lang: str = "grc", use_neural: bool = True):
		self.lang = lang
		self.use_neural = use_neural
		self._lemmatizer = None

	def _get_engine(self):
		if self._lemmatizer is not None:
			return self._lemmatizer
		gm_src = Path(__file__).resolve().parent.parent.parent.parent / "packages" / "greek-morphology" / "src"
		if str(gm_src) not in sys.path:
			sys.path.insert(0, str(gm_src))
		from greek_morphology import GreekLemmatizer  # noqa: E402
		self._lemmatizer = GreekLemmatizer(use_neural=self.use_neural)
		return self._lemmatizer

	def lemmatize_tokens(self, raw_tokens: List[Dict[str, Any]], lang: Optional[str] = None) -> List[Dict[str, Any]]:
		target_lang = lang or self.lang
		surfaces = [(tok.get("w") or "").strip() for tok in raw_tokens if (tok.get("w") or "").strip()]
		if not surfaces:
			return []

		engine = self._get_engine()
		word_surfaces: List[str] = []
		is_punct: List[bool] = []
		for s in surfaces:
			punct = all(ch in ".,;·:!?()[]«»\"'—–-᾽" for ch in s)
			is_punct.append(punct)
			if not punct:
				word_surfaces.append(s)

		parsed_words = engine.lemmatize_sentence(" ".join(word_surfaces)) if word_surfaces else []
		word_idx = 0
		canonical: List[Dict[str, Any]] = []
		for s, punct in zip(surfaces, is_punct):
			if punct:
				canonical.append({"w": s, "lang": target_lang})
				continue
			if word_idx < len(parsed_words):
				pw = parsed_words[word_idx]
				word_idx += 1
				entry: Dict[str, Any] = {
					"w": s,
					"l": (pw.lemma or s.lower()).strip(),
					"lang": target_lang,
				}
				pos_str = UPOS_TO_ACR_POS.get((pw.upos or "").upper(), "")
				if pos_str:
					entry["p"] = pos_str
				if pw.morph and pw.morph != "X":
					entry["m"] = pw.morph
				canonical.append(entry)
			else:
				canonical.append({"w": s, "l": s.lower(), "lang": target_lang})
		return canonical


def get_lemmatizer(scheme: str = "celano") -> Lemmatizer:
	"""Factory returning the requested lemmatizer adapter."""
	if scheme == "celano":
		return CelanoLemmatizer()
	if scheme == "none":
		return NoOpLemmatizer()
	if scheme == "stanza":
		return StanzaLemmatizer()
	raise ValueError(f"Unknown lemmatizer scheme: {scheme}")
