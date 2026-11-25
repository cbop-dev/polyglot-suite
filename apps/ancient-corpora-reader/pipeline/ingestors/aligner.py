"""Reusable Witness Alignment Utilities for ACR Ingestors."""

from __future__ import annotations
from typing import Any, Dict, List, Tuple


class ExactMatchHybridAligner:
	"""Aligns Greek token sections and English paragraphs within a chapter.

	When both witnesses have > 1 sub-chapter unit and identical counts, aligns 1:1
	as sections 1..N. Otherwise falls back to a single unit (section = 1) per chapter.
	"""

	@staticmethod
	def align_chapter(
		grc_secs: Dict[int, List[Dict[str, Any]]],
		eng_paras: List[str],
	) -> Tuple[bool, List[Tuple[int, List[Dict[str, Any]], str]]]:
		sorted_sec_keys = sorted(grc_secs.keys())
		if len(sorted_sec_keys) > 1 and len(sorted_sec_keys) == len(eng_paras):
			return True, [
				(idx, grc_secs[sec_k], eng_paras[idx - 1])
				for idx, sec_k in enumerate(sorted_sec_keys, 1)
			]

		merged_grc: List[Dict[str, Any]] = []
		for sec_k in sorted_sec_keys:
			merged_grc.extend(grc_secs[sec_k])
		merged_eng = "\n\n".join(eng_paras)
		return False, [(1, merged_grc, merged_eng)]
