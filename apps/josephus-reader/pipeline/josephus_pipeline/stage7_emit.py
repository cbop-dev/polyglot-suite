"""Stage 7: Emission of public JSON datasets into app/public/data/ and static/data/."""

from __future__ import annotations

import json
import unicodedata
from collections import defaultdict
from pathlib import Path
from .config import Manifest, BUILD_DIR, REPO_ROOT


def strip_accents(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return unicodedata.normalize("NFC", text).lower().replace("ς", "σ")


def normalize_lemma_accents(text: str) -> str:
    if not text:
        return ""
    return unicodedata.normalize("NFC", unicodedata.normalize("NFD", text).replace("\u0300", "\u0301"))


def get_greek_bucket(text: str) -> str:
    if not text:
        return "other"
    norm = unicodedata.normalize("NFD", text)
    first_chars = [c for c in norm if unicodedata.category(c) != "Mn"]
    if not first_chars:
        return "other"
    ch = first_chars[0].lower()
    greek_buckets = {
        'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
        'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
        'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
        'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
        'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau',
        'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi',
        'ω': 'omega'
    }
    return greek_buckets.get(ch, "other")


ALL_BUCKETS = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
    'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi',
    'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega', 'other'
]


def save_merged_json(file_path: Path, new_data: dict):
    existing = {}
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = {}
    existing.update(new_data)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False)


def save_merged_lemmata_json(file_path: Path, new_data: dict, current_work_id: str):
    existing = {}
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = {}

    for lemma_norm, entry in new_data.items():
        if lemma_norm in existing:
            prev_occs = [occ for occ in existing[lemma_norm].get("occurrences", []) if occ.get("work") != current_work_id]
            new_occs = entry.get("occurrences", [])
            merged_occs = prev_occs + new_occs
            existing[lemma_norm]["occurrences"] = merged_occs
            existing[lemma_norm]["count"] = len(merged_occs)
            if not existing[lemma_norm].get("lemma") and entry.get("lemma"):
                existing[lemma_norm]["lemma"] = entry["lemma"]
        else:
            existing[lemma_norm] = entry

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False)


def run_stage7(manifest: Manifest) -> dict:
    work_id = manifest.work_id
    stage1_file = BUILD_DIR / "stage1" / work_id / f"{work_id}.json"
    stage4_file = BUILD_DIR / "stage4" / work_id / "morph_map.json"
    stage5_file = BUILD_DIR / "stage5" / work_id / "lsj_map.json"
    stage6_file = BUILD_DIR / "stage6" / work_id / "concordance.json"

    if not stage1_file.exists():
        raise FileNotFoundError(f"Stage 1 output missing for {work_id}")

    with open(stage1_file, "r", encoding="utf-8") as f:
        work_data = json.load(f)

    morph_map = {}
    if stage4_file.exists():
        with open(stage4_file, "r", encoding="utf-8") as f:
            morph_map = json.load(f)

    lsj_map = {}
    if stage5_file.exists():
        with open(stage5_file, "r", encoding="utf-8") as f:
            lsj_map = json.load(f)

    concordance = {}
    if stage6_file.exists():
        with open(stage6_file, "r", encoding="utf-8") as f:
            concordance = json.load(f)

    print(f"[Stage 7] Emitting sharded public dataset for {work_id}...")

    # Build letter buckets
    morph_shards = defaultdict(dict)
    for word, data in morph_map.items():
        bucket = get_greek_bucket(word)
        morph_shards[bucket][word] = data

    dict_shards = defaultdict(dict)
    for key, data in lsj_map.items():
        bucket = get_greek_bucket(key)
        dict_shards[bucket][key] = data

    lemmata_shards = defaultdict(dict)
    lemmata_index = {}
    for lemma_norm, data in concordance.items():
        bucket = get_greek_bucket(lemma_norm)
        occs = data.get("occurrences", [])
        lemma_disp = normalize_lemma_accents(data.get("lemma", lemma_norm))
        entry = {
            "lemma": lemma_disp,
            "count": len(occs),
            "occurrences": occs
        }
        lemmata_shards[bucket][lemma_norm] = entry
        lemmata_index[lemma_norm] = {
            "lemma": lemma_disp,
            "count": len(occs),
            "bucket": bucket
        }

    targets = [
        REPO_ROOT / "app" / "public" / "data"
    ]

    for target in targets:
        work_dir = target / work_id
        work_dir.mkdir(parents=True, exist_ok=True)

        # Write full work file
        with open(target / f"{work_id}.json", "w", encoding="utf-8") as f:
            json.dump(work_data, f, ensure_ascii=False, indent=2)

        # Write per-book files
        for book in work_data.get("books", []):
            b_num = book.get("book", 1)
            b_file = work_dir / f"book-{b_num}.json"
            with open(b_file, "w", encoding="utf-8") as f:
                json.dump(book, f, ensure_ascii=False, indent=2)

        # Write sharded morph map for ALL 25 buckets
        morph_dir = target / "morph"
        morph_dir.mkdir(parents=True, exist_ok=True)
        for bucket in ALL_BUCKETS:
            shard_data = morph_shards.get(bucket, {})
            save_merged_json(morph_dir / f"{bucket}.json", shard_data)

        # Write sharded dictionary for ALL 25 buckets
        dict_dir = target / "dictionary"
        dict_dir.mkdir(parents=True, exist_ok=True)
        for bucket in ALL_BUCKETS:
            shard_data = dict_shards.get(bucket, {})
            save_merged_json(dict_dir / f"{bucket}.json", shard_data)

        # Write sharded lemmata for ALL 25 buckets (merging across works)
        lemmata_dir = target / "lemmata"
        lemmata_dir.mkdir(parents=True, exist_ok=True)
        for bucket in ALL_BUCKETS:
            shard_data = lemmata_shards.get(bucket, {})
            save_merged_lemmata_json(lemmata_dir / f"{bucket}.json", shard_data, work_id)

        # Write top-level summary files (merging across works)
        save_merged_json(target / "morph_map.json", morph_map)
        save_merged_json(target / "dictionary.json", lsj_map)
        save_merged_json(lemmata_dir / "_index.json", lemmata_index)

        # Build & update search_index.json across works
        search_file = target / "search_index.json"
        existing_search = []
        if search_file.exists():
            try:
                with open(search_file, "r", encoding="utf-8") as f:
                    existing_search = json.load(f)
            except Exception:
                existing_search = []
        # Filter out old items for current work_id
        filtered_search = [item for item in existing_search if item.get("w") != work_id]
        
        # Build search entries for current work
        work_search_items = []
        for book in work_data.get("books", []):
            b_num = book.get("book", 1)
            for sec in book.get("sections", []):
                grc = sec.get("grc", "").strip()
                eng = sec.get("eng", "").strip()
                niese_sec = str(sec.get("niese") or sec.get("section_num") or "1")
                if grc or eng:
                    work_search_items.append({
                        "w": work_id,
                        "b": b_num,
                        "s": niese_sec,
                        "g": grc,
                        "n": strip_accents(grc),
                        "e": eng
                    })

        filtered_search.extend(work_search_items)
        with open(search_file, "w", encoding="utf-8") as f:
            json.dump(filtered_search, f, ensure_ascii=False)

        # Build & update lemmata_index.json across works from updated lemmata shards
        lemmata_index_file = target / "lemmata_index.json"
        lemmata_index_map = {}

        # Collect valid dictionary lemmata set (from lsj_map and morph_map explicit lemma attributes)
        valid_lemmas = set(lsj_map.keys())
        for info in morph_map.values():
            if isinstance(info, dict):
                if info.get("lemma"):
                    valid_lemmas.add(info["lemma"])
                if info.get("lemma_norm"):
                    valid_lemmas.add(info["lemma_norm"])

        for bucket in ALL_BUCKETS:
            shard_file = lemmata_dir / f"{bucket}.json"
            if shard_file.exists():
                try:
                    with open(shard_file, "r", encoding="utf-8") as f:
                        shard_data = json.load(f)
                        for l_norm, l_entry in shard_data.items():
                            l_disp = normalize_lemma_accents(l_entry.get("lemma", l_norm))
                            occs = l_entry.get("occurrences", [])
                            count = len(occs)
                            gloss = lsj_map.get(l_disp, {}).get("gloss", "") or lsj_map.get(l_norm, {}).get("gloss", "")
                            
                            # Keep only genuine dictionary headwords
                            if l_disp in valid_lemmas or l_norm in valid_lemmas or gloss:
                                lemmata_index_map[l_norm] = {
                                    "l": l_disp,
                                    "n": l_norm,
                                    "c": count,
                                    "g": gloss
                                }
                except Exception:
                    pass

        lemmata_list = list(lemmata_index_map.values())
        lemmata_list.sort(key=lambda x: x["c"], reverse=True)
        with open(lemmata_index_file, "w", encoding="utf-8") as f:
            json.dump(lemmata_list, f, ensure_ascii=False)

    print(f"  [Stage 7] {work_id}: Emitted search_index.json & lemmata_index.json to app/public/data.")
    return work_data


