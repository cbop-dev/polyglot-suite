#!/usr/bin/env python3
"""Polyglot Bible Reader - Canonical Book Definitions Generator.

Auto-generates `src/lib/config/canonicalBooks.generated.ts` directly from
the SQLite `canonical_books` table and `pipeline/config.py` metadata.
Guarantees 100% parity between the SQLite database and the TypeScript client.
"""

from __future__ import annotations
import json
import sqlite3
import sys
from pathlib import Path

# Paths
PIPELINE_DIR = Path(__file__).resolve().parent
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

MONOREPO_ROOT = PIPELINE_DIR.parent.parent
APP_ROOT = MONOREPO_ROOT / "apps" / "polyglot-bible-reader"
REPO_ROOT = APP_ROOT
DB_PATH = PIPELINE_DIR / "build" / "polyglot-working.sqlite3"
if not DB_PATH.exists():
    DB_PATH = APP_ROOT / "pipeline" / "build" / "polyglot-working.sqlite3"
TARGET_TS = APP_ROOT / "src" / "lib" / "config" / "canonicalBooks.generated.ts"

# Standard UI Abbreviations for all 90 canonical books
STANDARD_ABBREVS = {
    "GEN": "Gen", "EXO": "Exod", "LEV": "Lev", "NUM": "Num", "DEU": "Deut",
    "JOS": "Josh", "JDG": "Judg", "RUT": "Ruth",
    "1SA": "1Sam", "2SA": "2Sam", "1KI": "1Kgs", "2KI": "2Kgs",
    "1CH": "1Chr", "2CH": "2Chr", "EZR": "Ezra", "NEH": "Neh",
    "EST": "Esth", "JOB": "Job", "PSA": "Ps", "PRO": "Prov",
    "ECC": "Eccl", "SNG": "Song", "ISA": "Isa", "JER": "Jer",
    "LAM": "Lam", "EZK": "Ezek", "DAN": "Dan", "HOS": "Hos",
    "JOL": "Joel", "AMO": "Amos", "OBA": "Obad", "JON": "Jonah",
    "MIC": "Mic", "NAM": "Nah", "HAB": "Hab", "ZEP": "Zeph",
    "HAG": "Hag", "ZEC": "Zech", "MAL": "Mal",
    # Apocrypha / Deuterocanon
    "TOB": "Tob", "JDT": "Jdt", "ESG": "AddEsth", "WIS": "Wis",
    "SIR": "Sir", "BAR": "Bar", "LJE": "EpJer", "S3Y": "PrAzar",
    "SUS": "Sus", "BEL": "Bel", "1MA": "1Mac", "2MA": "2Mac",
    "3MA": "3Mac", "4MA": "4Mac", "1ES": "1Esdr", "2ES": "2Esdr",
    "MAN": "PrMan", "PS2": "Ps151", "ODA": "Od", "PSS": "PsSol",
    "DAG": "Dan", "SUG": "Sus", "BLG": "Bel", "LAO": "Lao",
    # NT
    "MAT": "Matt", "MRK": "Mark", "LUK": "Luke", "JHN": "John",
    "ACT": "Acts", "ROM": "Rom", "1CO": "1_Cor", "2CO": "2_Cor",
    "GAL": "Gal", "EPH": "Eph", "PHP": "Phil", "COL": "Col",
    "1TH": "1_Thess", "2TH": "2_Thess", "1TI": "1_Tim", "2TI": "2_Tim",
    "TIT": "Titus", "PHM": "Phlm", "HEB": "Heb", "JAS": "Jas",
    "1PE": "1_Pet", "2PE": "2_Pet", "1JN": "1_John", "2JN": "2_John",
    "3JN": "3_John", "JUD": "Jude", "REV": "Rev"
}

# Version-specific preferred display abbreviations
VERSION_BOOKS = {
    "ECC": {
        "BHS": "Qoh", "LXX": "Qoh", "KJV": "Eccl", "WEB": "Eccl", "Vulgate": "Eccl", "Brenton": "Eccl"
    },
    "SNG": {
        "BHS": "Cant", "LXX": "Cant", "KJV": "Song", "WEB": "Song", "Vulgate": "Song", "Brenton": "Song"
    },
    "TOB": {
        "LXX": "TobBA", "KJV": "Tob", "WEB": "Tob", "Vulgate": "Tob", "Brenton": "Tob"
    },
    "ESG": {
        "LXX": "Esth", "KJV": "AddEsth", "WEB": "AddEsth", "Brenton": "AddEsth"
    },
    "SUS": {
        "LXX": "SusTh", "KJV": "Sus", "WEB": "Sus", "Brenton": "Sus"
    },
    "SUG": {
        "LXX": "Sus", "Brenton": "Sus"
    },
    "BEL": {
        "LXX": "BelTh", "KJV": "Bel", "WEB": "Bel", "Brenton": "Bel"
    },
    "BLG": {
        "LXX": "Bel", "Brenton": "Bel"
    },
    "DAN": {
        "LXX": "DanTh", "KJV": "Dan", "WEB": "Dan", "Brenton": "Dan"
    },
    "DAG": {
        "LXX": "Dan", "Brenton": "Dan"
    },
    "1MA": {
        "LXX": "1Mac", "KJV": "1Mac", "WEB": "1Mac", "Vulgate": "1Mac", "Brenton": "1Mac"
    },
    "2MA": {
        "LXX": "2Mac", "KJV": "2Mac", "WEB": "2Mac", "Vulgate": "2Mac", "Brenton": "2Mac"
    },
    "3MA": {
        "LXX": "3Mac", "Brenton": "3Mac"
    },
    "4MA": {
        "LXX": "4Mac", "Brenton": "4Mac"
    },
    "EZR": {
        "LXX": "2Esdr",
    },
    "NEH": {
        "LXX": "2Esdr",
    },
}

# Slugs mapping
SLUG_OVERRIDES = {
    "SNG": "song-of-solomon",
    "ESG": "esther-greek",
    "DAG": "daniel-old-greek",
    "SUG": "susanna-old-greek",
    "BLG": "bel-and-the-dragon-old-greek",
    "LAO": "laodiceans",
    "PS2": "psalm-151",
    "PSS": "psalms-of-solomon",
    "1ES": "1-esdras",
    "2ES": "2-esdras",
    "1MA": "1-maccabees",
    "2MA": "2-maccabees",
    "3MA": "3-maccabees",
    "4MA": "4-maccabees",
    "1SA": "1-samuel",
    "2SA": "2-samuel",
    "1KI": "1-kings",
    "2KI": "2-kings",
    "1CH": "1-chronicles",
    "2CH": "2-chronicles",
    "1CO": "1-corinthians",
    "2CO": "2-corinthians",
    "1TH": "1-thessalonians",
    "2TH": "2-thessalonians",
    "1TI": "1-timothy",
    "2TI": "2-timothy",
    "1PE": "1-peter",
    "2PE": "2-peter",
    "1JN": "1-john",
    "2JN": "2-john",
    "3JN": "3-john",
}


def get_extra_aliases(code: str, name_en: str) -> list[str]:
    """Generates rich academic and typing aliases for a canonical book."""
    aliases: set[str] = set()

    # Import BOOK_ALIASES from config
    try:
        from .config import BOOK_ALIASES
    except Exception:
        try:
            from config import BOOK_ALIASES
        except Exception:
            BOOK_ALIASES = {}
    for alias, target in BOOK_ALIASES.items():
        if target == code:
            aliases.add(alias)

    # Add common variants
    if code == "1SA":
        aliases.update(["1Kgdms", "1 Kingdoms", "I Kingdoms", "1_Sam", "1Sam"])
    elif code == "2SA":
        aliases.update(["2Kgdms", "2 Kingdoms", "II Kingdoms", "2_Sam", "2Sam"])
    elif code == "1KI":
        aliases.update(["3Kgdms", "3 Kingdoms", "III Kingdoms", "1_Kgs", "1Kgs"])
    elif code == "2KI":
        aliases.update(["4Kgdms", "4 Kingdoms", "IV Kingdoms", "2_Kgs", "2Kgs"])
    elif code == "1CH":
        aliases.update(["1_Chr", "1 Chron", "I Chronicles", "I Chron"])
    elif code == "2CH":
        aliases.update(["2_Chr", "2 Chron", "II Chronicles", "II Chron"])
    elif code == "EZR":
        aliases.update(["1 Ezra", "1Esdr (Vulgate)", "I Esdras"])
    elif code == "NEH":
        aliases.update(["2 Ezra", "2Esdr (Vulgate)", "II Esdras"])
    elif code == "PSA":
        aliases.update(["Psa", "Psalmi", "Psalm"])
    elif code == "ECC":
        aliases.update(["Qoh", "Qoheleth", "Ecclesiastes"])
    elif code == "SNG":
        aliases.update(["Cant", "Canticles", "Song of Songs", "Song of Solomon"])
    elif code == "DAN":
        aliases.update(["DanTh", "Daniel (Theodotion)"])
    elif code == "DAG":
        aliases.update(["DanOG", "Daniel (Old Greek)", "Greek Daniel"])
    elif code == "SUS":
        aliases.update(["SusTh", "Susanna (Theodotion)"])
    elif code == "SUG":
        aliases.update(["SusOG", "Susanna (Old Greek)"])
    elif code == "BEL":
        aliases.update(["BelTh", "Bel and the Dragon (Theodotion)"])
    elif code == "BLG":
        aliases.update(["BelOG", "Bel and the Dragon (Old Greek)"])
    elif code == "TOB":
        aliases.update(["TobBA", "TobS", "Tobit (BA)", "Tobit (Sinaiticus)"])
    elif code == "SIR":
        aliases.update(["Ecclesiasticus", "Sir"])
    elif code == "1ES":
        aliases.update(["1 Esdras", "1Esd", "1 Esdr", "Greek Ezra", "3 Ezra", "EsdrA"])
    elif code == "2ES":
        aliases.update(["2 Esdras", "2Esd", "2 Esdr", "4 Ezra", "EsdrB", "Ezra-Nehemiah (Greek)"])
    elif code == "1MA":
        aliases.update(["1Mac", "1Macc", "1 Macc", "1 Maccabees", "I Maccabees"])
    elif code == "2MA":
        aliases.update(["2Mac", "2Macc", "2 Macc", "2 Maccabees", "II Maccabees"])
    elif code == "3MA":
        aliases.update(["3Mac", "3Macc", "3 Macc", "3 Maccabees", "III Maccabees"])
    elif code == "4MA":
        aliases.update(["4Mac", "4Macc", "4 Macc", "4 Maccabees", "IV Maccabees"])
    elif code == "PSS":
        aliases.update(["PssSol", "Pss. Sol.", "Psalms of Solomon"])
    elif code == "LAO":
        aliases.update(["Laodiceans", "Epistle to Laodiceans"])

    return sorted(aliases)


def generate_typescript():
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}. Run pipeline build first.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT code, order_index, testament, name_english, name_hebrew, name_greek, name_latin, total_chapters
        FROM canonical_books
        ORDER BY order_index, code
    """)
    rows = cur.fetchall()

    corpus_to_version = {
        "wlc": "BHS",
        "swete_lxx": "LXX",
        "ognt": "OpenGNT",
        "kjv": "KJV",
        "vulgate": "Vulgate",
        "webbe": "WEB",
        "brenton-lxx": "Brenton",
        "peshitta": "Peshitta",
    }

    try:
        from .config import VERSION_CANONICAL_ORDERS
    except Exception:
        try:
            from config import VERSION_CANONICAL_ORDERS
        except Exception:
            VERSION_CANONICAL_ORDERS = {}

    version_available_books = {}
    version_canonical_codes = {}
    for cid, ver in corpus_to_version.items():
        cur.execute("""
            SELECT tu.std_book, cb.order_index
            FROM text_units tu
            JOIN canonical_books cb ON tu.std_book = cb.code
            WHERE tu.corpus_id = ?
            GROUP BY tu.std_book, cb.order_index
            ORDER BY cb.order_index
        """, (cid,))
        rows_ver = cur.fetchall()
        db_book_codes = set(r[0] for r in rows_ver)

        # 1. Determine canonical sequence of USFM codes for this version
        custom_seq = VERSION_CANONICAL_ORDERS.get(ver, [])
        if custom_seq:
            ordered_codes = [c for c in custom_seq if c in db_book_codes]
            # Append any books in db not explicitly in custom_seq
            for std_code, _ in rows_ver:
                if std_code not in ordered_codes:
                    ordered_codes.append(std_code)
        else:
            ordered_codes = [std_code for std_code, _ in rows_ver]

        version_canonical_codes[ver] = ordered_codes

        # 2. Build UI abbreviation list matching this authentic sequence
        books_for_ver = []
        for std_code in ordered_codes:
            if ver == "LXX" and std_code == "TOB":
                if "TobBA" not in books_for_ver:
                    books_for_ver.append("TobBA")
                if "TobS" not in books_for_ver:
                    books_for_ver.append("TobS")
                continue
            if ver == "LXX" and std_code in ("EZR", "NEH"):
                if "2Esdr" not in books_for_ver:
                    books_for_ver.append("2Esdr")
                continue

            abbrev = VERSION_BOOKS.get(std_code, {}).get(ver, STANDARD_ABBREVS.get(std_code, std_code))
            if abbrev not in books_for_ver:
                books_for_ver.append(abbrev)

        version_available_books[ver] = books_for_ver

    # 3. Detect version-specific chapter deviations from text_units
    canonical_chapters = {r[0]: r[7] for r in rows}
    cur.execute("""
        SELECT corpus_id, std_book, std_chapter
        FROM text_units
        GROUP BY corpus_id, std_book, std_chapter
        ORDER BY corpus_id, std_book, std_chapter
    """)
    tu_ch_rows = cur.fetchall()

    version_book_chapters = {}
    for cid, std_book, ch in tu_ch_rows:
        ver = corpus_to_version.get(cid)
        if not ver:
            continue
        if ver not in version_book_chapters:
            version_book_chapters[ver] = {}
        if std_book not in version_book_chapters[ver]:
            version_book_chapters[ver][std_book] = []
        version_book_chapters[ver][std_book].append(ch)

    version_chapter_overrides = {}
    for ver, b_map in version_book_chapters.items():
        for std_code, ch_list in b_map.items():
            tot = canonical_chapters.get(std_code, 0)
            default_ch_list = list(range(1, tot + 1))
            if ch_list != default_ch_list:
                if ver not in version_chapter_overrides:
                    version_chapter_overrides[ver] = {}
                version_chapter_overrides[ver][std_code] = ch_list

    if len(rows) == 0:
        print("Error: No books found in canonical_books table!")
        sys.exit(1)

    print(f"Generating TypeScript canonical book definitions for {len(rows)} books...")

    books_data = []
    for code, order_index, testament, name_en, name_he, name_el, name_la, total_chapters in rows:
        slug = SLUG_OVERRIDES.get(code, name_en.lower().replace(" ", "-").replace("(", "").replace(")", ""))
        std_abbrev = STANDARD_ABBREVS.get(code, code)
        testament_clean = testament.lower()
        if testament_clean == "ap":
            testament_clean = "apocrypha"

        default_chapters = list(range(1, total_chapters + 1))
        item = {
            "code": code,
            "slug": slug,
            "order": order_index,
            "standardAbbrev": std_abbrev,
            "title": name_en,
            "testament": testament_clean,
            "totalChapters": total_chapters,
            "chapters": default_chapters,
        }

        if name_he:
            item["nameHebrew"] = name_he
        if name_el:
            item["nameGreek"] = name_el
        if name_la:
            item["nameLatin"] = name_la

        if code in VERSION_BOOKS:
            item["versionBooks"] = VERSION_BOOKS[code]

        extra = get_extra_aliases(code, name_en)
        if extra:
            item["extraAliases"] = extra

        books_data.append(item)

    # Render TS file
    ts_lines = [
        "/**",
        " * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.",
        " * Generated from SQLite canonical_books table via pipeline/generate_canonical_books.py.",
        f" * Total Canonical Books: {len(books_data)}",
        " */",
        "",
        "export interface CanonicalBook {",
        "	code: string; // Standard 3-letter USFM code (Primary Key)",
        "	slug: string; // Kebab-case URL and slug identifier",
        "	order: number; // Canonical sort order",
        "	standardAbbrev: string; // Preferred UI abbreviation",
        "	title: string; // Full English title",
        "	testament: 'ot' | 'nt' | 'apocrypha';",
        "	totalChapters: number;",
        "	chapters: number[];",
        "	nameHebrew?: string;",
        "	nameGreek?: string;",
        "	nameLatin?: string;",
        "	versionBooks?: Partial<Record<string, string>>;",
        "	extraAliases?: string[];",
        "}",
        "",
        "export const CANONICAL_BOOK_DEFINITIONS: CanonicalBook[] = " + json.dumps(books_data, indent=2) + ";",
        "",
        "export const VERSION_AVAILABLE_BOOKS: Record<string, string[]> = " + json.dumps(version_available_books, indent=2) + ";",
        "",
        "export const VERSION_CANONICAL_CODES: Record<string, string[]> = " + json.dumps(version_canonical_codes, indent=2) + ";",
        "",
        "export const VERSION_CHAPTER_OVERRIDES: Record<string, Partial<Record<string, number[]>>> = " + json.dumps(version_chapter_overrides, indent=2) + ";",
        "",
        "/**",
        " * Normalizes any string to a clean alphanumeric key for fast lookup.",
        " */",
        "export function cleanKey(str?: string | null): string {",
        "	if (!str) return '';",
        "	return str.trim().toLowerCase().replace(/[\\s\\-_.]+/g, '');",
        "}",
        "",
        "const CODE_TO_CANONICAL = new Map<string, CanonicalBook>();",
        "const NORM_TO_CANONICAL = new Map<string, CanonicalBook>();",
        "const VERSION_CODE_INDEX = new Map<string, Map<string, number>>();",
        "const VERSION_ABBREV_INDEX = new Map<string, Map<string, number>>();",
        "",
        "function initIndices() {",
        "	for (const book of CANONICAL_BOOK_DEFINITIONS) {",
        "		CODE_TO_CANONICAL.set(book.code, book);",
        "		NORM_TO_CANONICAL.set(cleanKey(book.code), book);",
        "		NORM_TO_CANONICAL.set(cleanKey(book.slug), book);",
        "		NORM_TO_CANONICAL.set(cleanKey(book.standardAbbrev), book);",
        "		NORM_TO_CANONICAL.set(cleanKey(book.title), book);",
        "",
        "		if (book.extraAliases) {",
        "			for (const alias of book.extraAliases) {",
        "				const c = cleanKey(alias);",
        "				if (!NORM_TO_CANONICAL.has(c)) {",
        "					NORM_TO_CANONICAL.set(c, book);",
        "				}",
        "			}",
        "		}",
        "",
        "		if (book.versionBooks) {",
        "			for (const vb of Object.values(book.versionBooks)) {",
        "				if (vb) {",
        "					const c = cleanKey(vb);",
        "					if (!NORM_TO_CANONICAL.has(c)) {",
        "						NORM_TO_CANONICAL.set(c, book);",
        "					}",
        "				}",
        "			}",
        "		}",
        "	}",
        "",
        "	for (const [ver, codes] of Object.entries(VERSION_CANONICAL_CODES)) {",
        "		const cMap = new Map<string, number>();",
        "		codes.forEach((code, idx) => cMap.set(code, idx + 1));",
        "		VERSION_CODE_INDEX.set(ver.toLowerCase(), cMap);",
        "	}",
        "",
        "	for (const [ver, abbrevs] of Object.entries(VERSION_AVAILABLE_BOOKS)) {",
        "		const aMap = new Map<string, number>();",
        "		abbrevs.forEach((abbrev, idx) => {",
        "			aMap.set(cleanKey(abbrev), idx + 1);",
        "		});",
        "		VERSION_ABBREV_INDEX.set(ver.toLowerCase(), aMap);",
        "	}",
        "}",
        "",
        "initIndices();",
        "",
        "/**",
        " * Resolves any book identifier, title, synonym, or abbreviation to its Canonical Book Definition.",
        " */",
        "export function normalizeBookName(input?: string | null): CanonicalBook | null {",
        "	if (!input) return null;",
        "	const c = cleanKey(input);",
        "	return NORM_TO_CANONICAL.get(c) || null;",
        "}",
        "",
        "/**",
        " * Resolves any book identifier to its 3-letter USFM code.",
        " */",
        "export function resolveBookCode(input?: string | null, version?: string): string {",
        "	if (!input) return '';",
        "	const clean = cleanKey(input);",
        "",
        "	// Dual recensions in LXX",
        "	if (version === 'LXX') {",
        "		if (clean === 'sus') return 'SUG';",
        "		if (clean === 'susth') return 'SUS';",
        "		if (clean === 'dan') return 'DAG';",
        "		if (clean === 'danth') return 'DAN';",
        "		if (clean === 'bel') return 'BLG';",
        "		if (clean === 'belth') return 'BEL';",
        "	}",
        "",
        "	const book = NORM_TO_CANONICAL.get(clean);",
        "	if (book) return book.code;",
        "	const upper = input.trim().toUpperCase();",
        "	if (upper.length === 3) return upper;",
        "	return '';",
        "}",
        "",
        "/**",
        " * Returns the canonical sort index (1-based) for a book, honoring version-specific canonical sequence.",
        " * Falls back to the master Protestant/Catholic/Orthodox canonical order if no version is provided.",
        " */",
        "export function getBookCanonicalIndex(bookIdentifier?: string | null, version?: string | null): number {",
        "	if (!bookIdentifier) return 999;",
        "	const clean = cleanKey(bookIdentifier);",
        "	const canon = NORM_TO_CANONICAL.get(clean);",
        "	const code = canon?.code || resolveBookCode(bookIdentifier, version || undefined) || clean.toUpperCase();",
        "",
        "	if (version) {",
        "		const vKey = version.trim().toLowerCase();",
        "		const aMap = VERSION_ABBREV_INDEX.get(vKey);",
        "		if (aMap && aMap.has(clean)) return aMap.get(clean)!;",
        "		const cMap = VERSION_CODE_INDEX.get(vKey);",
        "		if (cMap && cMap.has(code)) return cMap.get(code)!;",
        "	}",
        "",
        "	if (canon) return canon.order;",
        "	return 999;",
        "}",
        "",
        "/**",
        " * Resolves any book identifier to its canonical DB slug.",
        " */",
        "export function getCanonicalSlug(input?: string | null): string | null {",
        "	return normalizeBookName(input)?.slug || null;",
        "}",
        "",
        "/**",
        " * Get canonical book by exact 3-letter USFM code.",
        " */",
        "export function getCanonicalBook(code?: string | null): CanonicalBook | null {",
        "	if (!code) return null;",
        "	return CODE_TO_CANONICAL.get(code.trim().toUpperCase()) || null;",
        "}",
        "",
        "/**",
        " * Resolves the available chapter numbers for a given book and version.",
        " * Checks version-specific overrides first (e.g. Sirach 0..51 in LXX, 2Esdr 1..23),",
        " * then falls back to canonical book definition chapters (1..N).",
        " */",
        "export function getCanonicalBookChapters(version?: string, bookIdentifier?: string): number[] {",
        "	if (!bookIdentifier) return [1];",
        "	const code = resolveBookCode(bookIdentifier, version) || cleanKey(bookIdentifier).toUpperCase();",
        "	if (version && VERSION_CHAPTER_OVERRIDES[version]?.[code]) {",
        "		return VERSION_CHAPTER_OVERRIDES[version]![code]!;",
        "	}",
        "	const canon = getCanonicalBook(code) || normalizeBookName(bookIdentifier);",
        "	if (canon?.chapters && canon.chapters.length > 0) {",
        "		return canon.chapters;",
        "	}",
        "	if (canon?.totalChapters) {",
        "		return Array.from({ length: canon.totalChapters }, (_, i) => i + 1);",
        "	}",
        "	return [1];",
        "}",
        ""
    ]

    TARGET_TS.parent.mkdir(parents=True, exist_ok=True)
    TARGET_TS.write_text("\n".join(ts_lines), encoding="utf-8")
    print(f"Successfully generated: {TARGET_TS}")

    # Generate corpora.generated.ts directly from the SQLite corpora table
    generate_corpora_definitions(conn)

    # Generate corpusBookStats.ts sorted in canonical order
    generate_corpus_book_stats(conn, version_canonical_codes, corpus_to_version)
    conn.close()


def generate_corpora_definitions(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='corpora'")
    if not cur.fetchone():
        print("Notice: corpora table not found, skipping corpora.generated.ts generation.")
        return

    cur.execute("""
        SELECT id, title, language, direction, category, default_scheme, has_tokens, has_audio, license, attribution
        FROM corpora
        ORDER BY id
    """)
    rows = cur.fetchall()
    if not rows:
        return

    canonical_ids = [r[0] for r in rows]
    corpora_metadata = {}
    for r in rows:
        cid, title, lang, direction, cat, scheme, has_tok, has_aud, lic, attr = r
        corpora_metadata[cid] = {
            "id": cid,
            "title": title,
            "language": lang,
            "direction": direction,
            "category": cat,
            "default_scheme": scheme,
            "has_tokens": bool(has_tok),
            "has_audio": bool(has_aud),
            "license": lic,
            "attribution": attr,
        }

    version_to_corpus = {
        "bhs": "wlc",
        "BHS": "wlc",
        "wlc": "wlc",
        "WLC": "wlc",
        "lxx": "swete_lxx",
        "LXX": "swete_lxx",
        "swete_lxx": "swete_lxx",
        "swete-lxx": "swete_lxx",
        "ognt": "ognt",
        "OGNT": "ognt",
        "opengnt": "ognt",
        "OpenGNT": "ognt",
        "sblgnt": "ognt",
        "SBLGNT": "ognt",
        "sbl": "ognt",
        "peshitta": "peshitta",
        "Peshitta": "peshitta",
        "syc": "peshitta",
        "kjv": "kjv",
        "KJV": "kjv",
        "vulgate": "vulgate",
        "Vulgate": "vulgate",
        "vulgate-clementine": "vulgate",
        "webbe": "webbe",
        "web": "webbe",
        "WEB": "webbe",
        "brenton-lxx": "brenton-lxx",
        "brenton": "brenton-lxx",
        "Brenton": "brenton-lxx",
        "bdb": "bdb",
        "BDB": "bdb",
        "lsj": "lsj",
        "LSJ": "lsj",
    }

    corpus_to_version = {
        "wlc": "BHS",
        "swete_lxx": "LXX",
        "ognt": "OpenGNT",
        "peshitta": "Peshitta",
        "kjv": "KJV",
        "vulgate": "Vulgate",
        "webbe": "WEB",
        "brenton-lxx": "Brenton",
        "bdb": "BDB",
        "lsj": "LSJ",
    }

    work_id_to_corpus = {
        1: "vulgate",
        2: "wlc",
        5: "kjv",
        6: "webbe",
        7: "brenton-lxx",
        8: "peshitta",
        24: "swete_lxx",
        40: "ognt",
    }

    corpus_to_work_id = {
        "vulgate": 1,
        "wlc": 2,
        "kjv": 5,
        "webbe": 6,
        "brenton-lxx": 7,
        "peshitta": 8,
        "swete_lxx": 24,
        "ognt": 40,
        "bdb": 2,
        "lsj": 24,
    }

    target_ts = REPO_ROOT / "src" / "lib" / "config" / "corpora.generated.ts"
    lines = [
        "/**",
        " * Canonical Corpus Definitions and Mappings.",
        " * Auto-generated from SQLite `corpora` table via pipeline/generate_canonical_books.py.",
        " * DO NOT EDIT MANUALLY.",
        " */",
        "",
        "export type TextDirection = 'ltr' | 'rtl';",
        "",
        "export interface CorpusMetadata {",
        "	id: string;",
        "	title: string;",
        "	language: string;",
        "	direction: TextDirection;",
        "	category: 'bible' | 'lexicon' | string;",
        "	default_scheme: string;",
        "	has_tokens: boolean;",
        "	has_audio: boolean;",
        "	license: string | null;",
        "	attribution: string | null;",
        "}",
        "",
        f"export const CANONICAL_CORPORA = {json.dumps(canonical_ids, indent=2)} as const;",
        "",
        "export type CorpusId = (typeof CANONICAL_CORPORA)[number];",
        "",
        f"export const CORPORA_METADATA: Record<CorpusId, CorpusMetadata> = {json.dumps(corpora_metadata, indent=2)};",
        "",
        "/**",
        " * Mapping of UI version names, abbreviations, and aliases to canonical database CorpusId.",
        " */",
        f"export const VERSION_TO_CORPUS_ID: Record<string, CorpusId> = {json.dumps(version_to_corpus, indent=2)};",
        "",
        "/**",
        " * Primary UI display label for each corpus.",
        " */",
        f"export const CORPUS_ID_TO_VERSION: Record<CorpusId, string> = {json.dumps(corpus_to_version, indent=2)};",
        "",
        "/**",
        " * Legacy numeric workId mapping for backward compatibility.",
        " */",
        f"export const WORK_ID_TO_CORPUS_ID: Record<number, CorpusId> = {json.dumps(work_id_to_corpus, indent=2)};",
        "",
        f"export const CORPUS_ID_TO_WORK_ID: Record<CorpusId, number> = {json.dumps(corpus_to_work_id, indent=2)};",
        "",
        "/**",
        " * Resolves any version abbreviation, alias, corpus ID, or legacy work_id into a canonical CorpusId.",
        " */",
        "export function resolveCorpusId(input: string | number | null | undefined, fallback: CorpusId = 'wlc'): CorpusId {",
        "	if (input === null || input === undefined) return fallback;",
        "	if (typeof input === 'number') {",
        "		return WORK_ID_TO_CORPUS_ID[input] || fallback;",
        "	}",
        "	const clean = String(input).trim();",
        "	if (!clean) return fallback;",
        "	if (VERSION_TO_CORPUS_ID[clean]) return VERSION_TO_CORPUS_ID[clean];",
        "	const lower = clean.toLowerCase();",
        "	if (VERSION_TO_CORPUS_ID[lower]) return VERSION_TO_CORPUS_ID[lower];",
        "	const match = CANONICAL_CORPORA.find((c) => c.toLowerCase() === lower);",
        "	if (match) return match;",
        "	return fallback;",
        "}",
        ""
    ]
    target_ts.write_text("\n".join(lines), encoding="utf-8")
    print(f"Successfully generated: {target_ts}")


def generate_corpus_book_stats(conn: sqlite3.Connection, version_canonical_codes: dict, corpus_to_version: dict):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='corpus_book_stats'")
    if not cur.fetchone():
        print("Notice: corpus_book_stats table not found, skipping corpusBookStats.ts generation.")
        return

    cur.execute("SELECT corpus_id, book_code, total_words, total_verses FROM corpus_book_stats")
    rows = cur.fetchall()
    if not rows:
        return

    cur.execute("SELECT corpus_id, SUM(total_words) FROM corpus_book_stats GROUP BY corpus_id")
    corpus_totals = dict(cur.fetchall())

    # Map raw rows: corpus_id -> book_code -> {words, verses}
    raw_stats = {}
    for cid, b_code, w, v in rows:
        if cid not in raw_stats:
            raw_stats[cid] = {}
        raw_stats[cid][b_code] = {"words": w, "verses": v}

    # Sort books for each corpus according to authentic canonical order
    sorted_corpus_stats = {}
    for cid in sorted(raw_stats.keys()):
        ver = corpus_to_version.get(cid, cid.upper())
        canonical_codes = version_canonical_codes.get(ver, [])
        code_order = {c: i for i, c in enumerate(canonical_codes)}

        books_dict = raw_stats[cid]
        sorted_books = sorted(
            books_dict.items(),
            key=lambda x: (code_order.get(x[0], 999), x[0])
        )
        sorted_corpus_stats[cid] = {b: stats for b, stats in sorted_books}

    target_stats_ts = REPO_ROOT / "src" / "lib" / "config" / "corpusBookStats.ts"
    stats_lines = [
        "/**",
        " * Pre-computed word and verse totals by biblical book and corpus.",
        " * Serves as an instant in-memory lookup and static/offline fallback.",
        " * AUTO-GENERATED - books are ordered in authentic canonical sequence.",
        " */",
        "",
        "import { resolveCorpusId, type CorpusId } from './corpora.generated';",
        "",
        "export interface BookWordStat {",
        "	words: number;",
        "	verses: number;",
        "}",
        "",
        "export const CORPUS_TOTAL_WORDS: Record<string, number> = " + json.dumps(corpus_totals, indent=2) + ";",
        "",
        "export const CORPUS_BOOK_STATS: Record<string, Record<string, BookWordStat>> = " + json.dumps(sorted_corpus_stats, indent=2) + ";",
        "",
        "export function getStaticCorpusTotalWords(corpusId: string | number): number {",
        "	const c = resolveCorpusId(corpusId);",
        "	return CORPUS_TOTAL_WORDS[c] || 0;",
        "}",
        "",
        "export function getStaticBookWordStats(corpusId: string | number, bookCode: string): BookWordStat | null {",
        "	const c = resolveCorpusId(corpusId);",
        "	const b = (bookCode || '').toUpperCase();",
        "	return CORPUS_BOOK_STATS[c]?.[b] || null;",
        "}",
        ""
    ]
    target_stats_ts.write_text("\n".join(stats_lines), encoding="utf-8")
    print(f"Successfully generated canonically ordered: {target_stats_ts}")


if __name__ == "__main__":
    generate_typescript()
