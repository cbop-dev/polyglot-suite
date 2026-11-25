"""Justin Martyr Ingestor for Ancient Corpora Reader (ACR).

Ingests the 3 authentic works of Justin Martyr:
  - 1APOL: First Apology (tlg0645.tlg001 + ANF01 viii.ii ch. 1-68)
  - 2APOL: Second Apology (tlg0645.tlg002 + ANF01 viii.iii ch. 1-15)
  - DIAL:  Dialogue with Trypho (tlg0645.tlg003 + ANF01 viii.iv ch. 1-142)
"""

from __future__ import annotations
import sys
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parent.parent
ACR_DIR = PIPELINE_DIR.parent
WORKSPACE_ROOT = ACR_DIR.parent.parent
CACHE_DIR = PIPELINE_DIR / "cache" / "justin"

PIPELINE_CORE_DIR = WORKSPACE_ROOT / "packages" / "pipeline-core"
if str(PIPELINE_CORE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_CORE_DIR))
if str(PIPELINE_DIR) not in sys.path:
	sys.path.insert(0, str(PIPELINE_DIR))

from pipeline_core.cache_fetcher import download_file  # noqa: E402
from config import CORPUS_VERSIONS_CATALOG  # noqa: E402
from lemmatizers import get_lemmatizer  # noqa: E402
from ingestors.base import RawCorpusWriter  # noqa: E402
from ingestors.parsers import CelanoParser, CCELThmlParser, join_tokens  # noqa: E402
from ingestors.aligner import ExactMatchHybridAligner  # noqa: E402

ANF01_URL = "https://www.ccel.org/ccel/schaff/anf01/anf01.xml"

WORKS_SPEC = [
	{
		"code": "1APOL",
		"slug": "1-apology",
		"order_index": 1,
		"category": "apology",
		"abbrev": "1 Apol.",
		"tlg_id": "tlg0645.tlg001",
		"title_english": "First Apology",
		"title_primary": "Ἀπολογία Α΄ ὑπὲρ Χριστιανῶν",
		"title_secondary": "Apologia Prima",
		"celano_file": "tlg0645.tlg001.opp-grc1.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg001.opp-grc1.xml",
		"ccel_div2_id": "viii.ii",
		"total_divisions": 68,
	},
	{
		"code": "2APOL",
		"slug": "2-apology",
		"order_index": 2,
		"category": "apology",
		"abbrev": "2 Apol.",
		"tlg_id": "tlg0645.tlg002",
		"title_english": "Second Apology",
		"title_primary": "Ἀπολογία Β΄ ὑπὲρ Χριστιανῶν",
		"title_secondary": "Apologia Secunda",
		"celano_file": "tlg0645.tlg002.opp-grc1.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg002.opp-grc1.xml",
		"ccel_div2_id": "viii.iii",
		"total_divisions": 15,
	},
	{
		"code": "DIAL",
		"slug": "dialogue-with-trypho",
		"order_index": 3,
		"category": "dialogue",
		"abbrev": "Dial.",
		"tlg_id": "tlg0645.tlg003",
		"title_english": "Dialogue with Trypho",
		"title_primary": "Διάλογος πρὸς Τρύφωνα Ἰουδαῖον",
		"title_secondary": "Dialogus cum Tryphone",
		"celano_file": "tlg0645.tlg003.perseus-grc2.xml",
		"celano_url": "https://raw.githubusercontent.com/gcelano/LemmatizedAncientGreekXML/master/texts/tlg0645.tlg003.perseus-grc2.xml",
		"ccel_div2_id": "viii.iv",
		"total_divisions": 142,
	},
]


def ensure_sources() -> None:
	CACHE_DIR.mkdir(parents=True, exist_ok=True)
	download_file(ANF01_URL, CACHE_DIR / "anf01.xml")
	for spec in WORKS_SPEC:
		download_file(spec["celano_url"], CACHE_DIR / spec["celano_file"])


def build_justin_raw_db(lemmatizer_scheme: str = "celano") -> Path:
	ensure_sources()
	lemmatizer = get_lemmatizer(lemmatizer_scheme)
	ccel_data = CCELThmlParser.parse_div2_map(
		CACHE_DIR / "anf01.xml",
		{s["ccel_div2_id"]: s["total_divisions"] for s in WORKS_SPEC},
	)

	writer = RawCorpusWriter("justin", lemmatizer_scheme=lemmatizer_scheme)
	writer.insert_versions(CORPUS_VERSIONS_CATALOG["justin"])

	for spec in WORKS_SPEC:
		w_code = spec["code"]
		max_ch = spec["total_divisions"]
		writer.insert_work(spec)

		grc_chapters = CelanoParser.parse(CACHE_DIR / spec["celano_file"], max_ch)
		eng_chapters = ccel_data.get(spec["ccel_div2_id"], {})

		exact_sub_matches = 0
		for ch in range(1, max_ch + 1):
			matched, pairs = ExactMatchHybridAligner.align_chapter(
				grc_chapters.get(ch, {}),
				eng_chapters.get(ch, []),
			)
			if matched:
				exact_sub_matches += 1

			for sec_num, raw_toks, eng_text in pairs:
				cit = f"{spec['abbrev']} {ch}:{sec_num}"
				canon_toks = lemmatizer.lemmatize_tokens(raw_toks, lang="grc")
				grc_text = join_tokens(canon_toks)

				writer.insert_text_unit(
					"justin_celano_grc",
					w_code,
					ch,
					ch,
					sec_num,
					cit,
					grc_text,
					tokens=canon_toks,
				)
				writer.insert_text_unit(
					"justin_anf_eng",
					w_code,
					ch,
					ch,
					sec_num,
					cit,
					eng_text,
				)

		print(f"  ✓ Ingested {w_code} ({max_ch} chapters; {exact_sub_matches} exact sub-chapter alignments)")

	return writer.finalize(stats_corpus_id="justin_celano_grc")


if __name__ == "__main__":
	build_justin_raw_db()
