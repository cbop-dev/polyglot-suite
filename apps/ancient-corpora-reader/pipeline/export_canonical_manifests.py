"""ACR Pipeline - Canonical Manifest Exporter.

Extracts single-source-of-truth metadata from compiled SQLite databases
and generates typed TypeScript manifests (*.generated.ts):
- corpusVersions.generated.ts: Master text versions & bibliographic metadata
- canonicalWorks.generated.ts: Master corpus works & division metadata
"""

from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Dict, Any, List

from .config import BUILD_DIR, ACR_DIR, CORPUS_VERSIONS_CATALOG

CONFIG_DIR = ACR_DIR / "src" / "lib" / "config"
VERSIONS_TS_PATH = CONFIG_DIR / "corpusVersions.generated.ts"
WORKS_TS_PATH = CONFIG_DIR / "canonicalWorks.generated.ts"


def _load_manifest_config() -> tuple[List[str], Dict[str, tuple[int, Dict[str, int]]]]:
	manifest_path = ACR_DIR / "corpora.manifest.json"
	with open(manifest_path, "r", encoding="utf-8") as f:
		data = json.load(f)
	ids: List[str] = []
	pag_cfg: Dict[str, tuple[int, Dict[str, int]]] = {}
	for entry in data.get("corpora", []):
		cid = entry["id"]
		ids.append(cid)
		default_pag = int(entry.get("defaultPaginationLevel", 0))
		overrides = {k: int(v) for k, v in entry.get("paginationLevels", {}).items()}
		pag_cfg[cid] = (default_pag, overrides)
	return ids, pag_cfg


CORPORA_IDS, PAGINATION_CONFIG = _load_manifest_config()


def export_canonical_manifests():
	"""Exports TypeScript manifests from compiled SQLite databases."""
	CONFIG_DIR.mkdir(parents=True, exist_ok=True)
	
	all_versions: Dict[str, List[Dict[str, Any]]] = {}
	all_works: Dict[str, List[Dict[str, Any]]] = {}

	for cid in CORPORA_IDS:
		db_path = BUILD_DIR / f"{cid}.sqlite3"
		if not db_path.exists():
			print(f"  [manifest] Skipping {cid}: {db_path} does not exist yet.")
			continue

		conn = sqlite3.connect(str(db_path))
		conn.row_factory = sqlite3.Row
		cur = conn.cursor()

		# 1. Export corpus_versions
		cur.execute("SELECT * FROM corpus_versions ORDER BY order_index ASC")
		v_rows = cur.fetchall()
		versions_list = []
		for r in v_rows:
			app_works = None
			if "applicable_works" in r.keys() and r["applicable_works"]:
				try:
					app_works = json.loads(r["applicable_works"])
				except Exception:
					app_works = None

			role = r["role"] if "role" in r.keys() and r["role"] else "critical_edition"
			editor = r["editor"] if "editor" in r.keys() else None
			translator = r["translator"] if "translator" in r.keys() else None
			booktitle = r["booktitle"] if "booktitle" in r.keys() and r["booktitle"] else r["title"]
			series = r["series"] if "series" in r.keys() else None
			publisher = r["publisher"] if "publisher" in r.keys() and r["publisher"] else "Unknown"
			address = r["address"] if "address" in r.keys() else None
			year = str(r["year"]) if "year" in r.keys() and r["year"] else "Unknown"
			volume = r["volume"] if "volume" in r.keys() else None
			sbl_qualifier = r["sbl_qualifier"] if "sbl_qualifier" in r.keys() else None
			url = r["url"] if "url" in r.keys() else None

			bib_config = {
				"role": role,
				"booktitle": booktitle,
				"publisher": publisher,
				"year": year,
			}
			if editor:
				bib_config["editor"] = editor
			if translator:
				bib_config["translator"] = translator
			if series:
				bib_config["series"] = series
			if address:
				bib_config["address"] = address
			if volume:
				bib_config["volume"] = volume
			if sbl_qualifier:
				bib_config["sblQualifier"] = sbl_qualifier
			if app_works:
				bib_config["applicableWorks"] = app_works
			if url:
				bib_config["url"] = url

			catalog_entry = next(
				(c for c in CORPUS_VERSIONS_CATALOG.get(cid, []) if c["id"] == r["id"]),
				None,
			)
			is_default_visible = catalog_entry.get("is_default_visible", True) if catalog_entry else True

			v_entry: Dict[str, Any] = {
				"id": r["id"],
				"language": r["language"],
				"title": r["title"],
				"shortTitle": r["version_label"] if ("version_label" in r.keys() and r["version_label"]) else r["title"],
				"versionLabel": r["version_label"] if ("version_label" in r.keys() and r["version_label"]) else None,
				"direction": r["direction"] if ("direction" in r.keys() and r["direction"]) else "ltr",
				"isDefaultVisible": is_default_visible,
				"order": r["order_index"],
				"bibliographic": bib_config,
			}
			if app_works:
				v_entry["applicableWorks"] = app_works

			versions_list.append(v_entry)
		all_versions[cid] = versions_list

		# 2. Export corpus_works
		cur.execute("SELECT * FROM corpus_works ORDER BY order_index ASC")
		w_rows = cur.fetchall()
		works_list = []
		for w in w_rows:
			code = w["code"]
			slug = w["slug"]
			order_idx = w["order_index"]
			category = w["category"]
			abbrev = w["abbrev"]
			title_eng = w["title_english"]
			title_pri = w["title_primary"]
			title_sec = w["title_secondary"]
			total_divs = w["total_divisions"]
			min_div = w["min_division"]
			div_label = w["division_label"]
			hierarchy_levels = (
				json.loads(w["hierarchy_levels"])
				if ("hierarchy_levels" in w.keys() and w["hierarchy_levels"])
				else (["Book", "Section"] if div_label == "Book" else [div_label, "Section"])
			)
			default_pag, pag_overrides = PAGINATION_CONFIG.get(cid, (0, {}))
			raw_pag = pag_overrides.get(code, default_pag)
			pagination_level = max(0, min(raw_pag, len(hierarchy_levels) - 1))

			# Query distinct coord_paths ordered by sort_key, then group into pages in Python
			# according to the UI-configured pagination_level.
			cur.execute(
				"""
				SELECT coord_path
				FROM text_units
				WHERE work_code = ?
				GROUP BY coord_path
				ORDER BY MIN(sort_key) ASC
				""",
				(code,),
			)
			pages: List[str] = []
			units_by_page: Dict[str, int] = {}
			level_sets: List[set] = [set() for _ in hierarchy_levels]
			for (c_path,) in cur.fetchall():
				parts = c_path.split(".")
				for lvl_idx in range(min(len(parts), len(level_sets))):
					level_sets[lvl_idx].add(tuple(parts[: lvl_idx + 1]))
				p_path = ".".join(parts[: pagination_level + 1])
				if p_path not in units_by_page:
					pages.append(p_path)
					units_by_page[p_path] = 0
				units_by_page[p_path] += 1
			counts_by_level = [len(s) for s in level_sets]

			# Determine sectionsByDivision (backward compatibility)
			sections_by_div = None
			if cid == "josephus":
				cur.execute(
					"SELECT book, COUNT(DISTINCT section) FROM text_units WHERE work_code = ? GROUP BY book ORDER BY book",
					(code,)
				)
				s_counts = cur.fetchall()
				if s_counts:
					sections_by_div = {str(row[0]): row[1] for row in s_counts}
			elif total_divs > 1:
				cur.execute(
					"SELECT book, MAX(section) FROM text_units WHERE work_code = ? GROUP BY book ORDER BY book",
					(code,)
				)
				s_counts = cur.fetchall()
				if s_counts:
					sections_by_div = {str(row[0]): row[1] for row in s_counts}

			coord_scheme = "book_only" if cid == "josephus" else "division_both"

			work_entry: Dict[str, Any] = {
				"corpusId": cid,
				"code": code,
				"slug": slug,
				"orderIndex": order_idx,
				"category": category,
				"abbrev": abbrev,
				"titleEnglish": title_eng,
				"titlePrimary": title_pri,
				"titleGreek": title_pri,
				"totalDivisions": total_divs,
				"minDivision": min_div,
				"divisionLabel": div_label,
				"hierarchyLevels": hierarchy_levels,
				"countsByLevel": counts_by_level,
				"paginationLevel": pagination_level,
				"pages": pages,
				"unitsByPage": units_by_page,
				"coordinateScheme": coord_scheme,
			}
			if title_sec:
				work_entry["titleSecondary"] = title_sec
				work_entry["titleLatin"] = title_sec
			if sections_by_div:
				work_entry["sectionsByDivision"] = sections_by_div

			works_list.append(work_entry)
		all_works[cid] = works_list

		conn.close()

	# Emit corpusVersions.generated.ts
	print(f"  → Writing generated versions manifest to {VERSIONS_TS_PATH}")
	versions_json = json.dumps(all_versions, indent=2, ensure_ascii=False)
	versions_ts_content = f"""/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.
 * Generated from SQLite Tier-2 database corpus_versions tables by:
 *   apps/ancient-corpora-reader/pipeline/export_canonical_manifests.py
 */

import type {{ TextVersionConfig }} from '@polyglot/ancient-languages/corpora-types';

export const CANONICAL_CORPUS_VERSIONS: Record<string, TextVersionConfig[]> = {versions_json};
"""
	VERSIONS_TS_PATH.write_text(versions_ts_content, encoding="utf-8")

	# Emit canonicalWorks.generated.ts
	print(f"  → Writing generated works manifest to {WORKS_TS_PATH}")
	works_json = json.dumps(all_works, indent=2, ensure_ascii=False)
	works_ts_content = f"""/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.
 * Generated from SQLite Tier-2 database corpus_works tables by:
 *   apps/ancient-corpora-reader/pipeline/export_canonical_manifests.py
 */

import type {{ AncientCorpusId }} from '@polyglot/ancient-languages';

export interface CorpusWork {{
	corpusId: AncientCorpusId;
	code: string;
	slug: string;
	orderIndex: number;
	category: string;
	abbrev: string;
	titleEnglish: string;
	titlePrimary: string;
	titleSecondary?: string;
	titleGreek: string;
	titleLatin?: string;
	totalDivisions: number;
	minDivision: number;
	divisionLabel: 'Book' | 'Chapter' | 'Section';
	hierarchyLevels: string[];
	countsByLevel?: number[];
	paginationLevel: number;
	pages: string[];
	unitsByPage?: Record<string, number>;
	sectionsByDivision?: Record<number | string, number>;
	coordinateScheme?: 'book_only' | 'division_both';
}}

export const CANONICAL_CORPUS_WORKS: Record<AncientCorpusId, CorpusWork[]> = {works_json};
"""
	WORKS_TS_PATH.write_text(works_ts_content, encoding="utf-8")
	print("✓ Canonical manifests exported successfully.")


if __name__ == "__main__":
	export_canonical_manifests()
