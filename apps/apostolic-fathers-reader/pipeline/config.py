"""Apostolic Fathers Pipeline - Configuration & Metadata Catalog."""

from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

PIPELINE_DIR = Path(__file__).parent.resolve()
CACHE_DIR = PIPELINE_DIR / "cache"
MORPH_DIR = CACHE_DIR / "morph"
TEXTS_DIR = CACHE_DIR / "texts"
PERSEUS_DIR = CACHE_DIR / "perseus"
LEXICON_DIR = CACHE_DIR / "lexicon"
BUILD_DIR = PIPELINE_DIR / "build"
STATIC_DB_DIR = PIPELINE_DIR.parent / "static" / "db"
GENERATED_TS_DIR = PIPELINE_DIR.parent / "src" / "lib" / "config"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
MORPH_DIR.mkdir(parents=True, exist_ok=True)
TEXTS_DIR.mkdir(parents=True, exist_ok=True)
PERSEUS_DIR.mkdir(parents=True, exist_ok=True)
LEXICON_DIR.mkdir(parents=True, exist_ok=True)
BUILD_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DB_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_TS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class AFWork:
    code: str
    order_index: int
    category: str
    title_english: str
    title_greek: str
    title_latin: Optional[str]
    total_chapters: int
    brannan_filename: str
    tauber_filename: str
    perseus_tlg_author: str
    perseus_tlg_work: str
    perseus_filename: str


CANONICAL_WORKS: List[AFWork] = [
    AFWork(
        code="1CLE",
        order_index=1,
        category="epistle",
        title_english="1 Clement",
        title_greek="Κλήμεντος πρὸς Κορινθίους Α΄",
        title_latin="Clementis ad Corinthios I",
        total_chapters=65,
        brannan_filename="001-i_clement.txt",
        tauber_filename="001-i_clement.txt",
        perseus_tlg_author="tlg1271",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1271.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="2CLE",
        order_index=2,
        category="homily",
        title_english="2 Clement",
        title_greek="Κλήμεντος πρὸς Κορινθίους Β΄",
        title_latin="Clementis ad Corinthios II",
        total_chapters=20,
        brannan_filename="002-ii_clement.txt",
        tauber_filename="002-ii_clement.txt",
        perseus_tlg_author="tlg1271",
        perseus_tlg_work="tlg002",
        perseus_filename="tlg1271.tlg002.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_EPH",
        order_index=3,
        category="epistle",
        title_english="Ignatius to the Ephesians",
        title_greek="Ἰγνατίου πρὸς Ἐφεσίους",
        title_latin="Ignatii ad Ephesios",
        total_chapters=21,
        brannan_filename="003-ignatius-ephesians.txt",
        tauber_filename="003-ignatius-ephesians.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_MAG",
        order_index=4,
        category="epistle",
        title_english="Ignatius to the Magnesians",
        title_greek="Ἰγνατίου πρὸς Μαγνησιεῖς",
        title_latin="Ignatii ad Magnesios",
        total_chapters=15,
        brannan_filename="004-ignatius-magnesians.txt",
        tauber_filename="004-ignatius-magnesians.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_TRA",
        order_index=5,
        category="epistle",
        title_english="Ignatius to the Trallians",
        title_greek="Ἰγνατίου πρὸς Τραλλιανούς",
        title_latin="Ignatii ad Trallianos",
        total_chapters=13,
        brannan_filename="005-ignatius-trallians.txt",
        tauber_filename="005-ignatius-trallians.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_ROM",
        order_index=6,
        category="epistle",
        title_english="Ignatius to the Romans",
        title_greek="Ἰγνατίου πρὸς Ῥωμαίους",
        title_latin="Ignatii ad Romanos",
        total_chapters=10,
        brannan_filename="006-ignatius-romans.txt",
        tauber_filename="006-ignatius-romans.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_PHL",
        order_index=7,
        category="epistle",
        title_english="Ignatius to the Philadelphians",
        title_greek="Ἰγνατίου πρὸς Φιλαδελφεῖς",
        title_latin="Ignatii ad Philadelphenos",
        total_chapters=11,
        brannan_filename="007-ignatius-philadelphians.txt",
        tauber_filename="007-ignatius-philadelphians.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_SMY",
        order_index=8,
        category="epistle",
        title_english="Ignatius to the Smyrnaeans",
        title_greek="Ἰγνατίου πρὸς Σμυρναίους",
        title_latin="Ignatii ad Smyrnaeos",
        total_chapters=13,
        brannan_filename="008-ignatius-smyrnaeans.txt",
        tauber_filename="008-ignatius-smyrnaeans.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="IGN_POL",
        order_index=9,
        category="epistle",
        title_english="Ignatius to Polycarp",
        title_greek="Ἰγνατίου πρὸς Πολύκαρπον",
        title_latin="Ignatii ad Polycarpum",
        total_chapters=8,
        brannan_filename="009-ignatius-polycarp.txt",
        tauber_filename="009-ignatius-polycarp.txt",
        perseus_tlg_author="tlg1443",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1443.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="POL_PHI",
        order_index=10,
        category="epistle",
        title_english="Polycarp to the Philippians",
        title_greek="Πολυκάρπου πρὸς Φιλιππησίους",
        title_latin="Polycarpi ad Philippenses",
        total_chapters=14,
        brannan_filename="010-polycarp-philippians.txt",
        tauber_filename="010-polycarp-philippians.txt",
        perseus_tlg_author="tlg1622",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1622.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="DID",
        order_index=11,
        category="order",
        title_english="Didache",
        title_greek="Διδαχὴ τῶν δώδεκα ἀποστόλων",
        title_latin="Doctrina duodecim apostolorum",
        total_chapters=16,
        brannan_filename="011-didache.txt",
        tauber_filename="011-didache.txt",
        perseus_tlg_author="tlg1311",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1311.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="BAR",
        order_index=12,
        category="treatise",
        title_english="Epistle of Barnabas",
        title_greek="Βαρνάβα ἐπιστολή",
        title_latin="Barnabae epistula",
        total_chapters=21,
        brannan_filename="012-barnabas.txt",
        tauber_filename="012-barnabas.txt",
        perseus_tlg_author="tlg1216",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1216.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="HER",
        order_index=13,
        category="apocalypse",
        title_english="Shepherd of Hermas",
        title_greek="Ποιμὴν τοῦ Ἑρμᾶ",
        title_latin="Pastoris Hermae",
        total_chapters=114,
        brannan_filename="013-shepherd.txt",
        tauber_filename="013-shepherd.txt",
        perseus_tlg_author="tlg1419",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1419.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="MAR_POL",
        order_index=14,
        category="martyrology",
        title_english="Martyrdom of Polycarp",
        title_greek="Μαρτύριον τοῦ ἁγίου Πολυκάρπου",
        title_latin="Martyrium Polycarpi",
        total_chapters=22,
        brannan_filename="014-martyrdom.txt",
        tauber_filename="014-martyrdom.txt",
        perseus_tlg_author="tlg1484",
        perseus_tlg_work="tlg001",
        perseus_filename="tlg1484.tlg001.perseus-eng1.xml",
    ),
    AFWork(
        code="DIOG",
        order_index=15,
        category="apology",
        title_english="Epistle to Diognetus",
        title_greek="Πρὸς Διόγνητον ἐπιστολή",
        title_latin="Epistula ad Diognetum",
        total_chapters=12,
        brannan_filename="015-diognetus.txt",
        tauber_filename="015-diognetus.txt",
        perseus_tlg_author="tlg0646",
        perseus_tlg_work="tlg004",
        perseus_filename="tlg0646.tlg004.perseus-eng1.xml",
    ),
]
