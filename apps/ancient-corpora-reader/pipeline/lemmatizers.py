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


class StanzaLemmatizer:
	"""Placeholder adapter for future Stanza (packages/greek-morphology) neural re-lemmatization."""

	def __init__(self, lang: str = "grc"):
		self.lang = lang

	def lemmatize_tokens(self, raw_tokens: List[Dict[str, Any]], lang: Optional[str] = None) -> List[Dict[str, Any]]:
		raise NotImplementedError(
			"StanzaLemmatizer is reserved for future neural re-lemmatization passes via packages/greek-morphology."
		)


def get_lemmatizer(scheme: str = "celano") -> Lemmatizer:
	"""Factory returning the requested lemmatizer adapter."""
	if scheme == "celano":
		return CelanoLemmatizer()
	if scheme == "none":
		return NoOpLemmatizer()
	if scheme == "stanza":
		return StanzaLemmatizer()
	raise ValueError(f"Unknown lemmatizer scheme: {scheme}")
