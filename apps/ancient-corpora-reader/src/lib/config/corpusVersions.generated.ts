/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.
 * Generated from SQLite Tier-2 database corpus_versions tables by:
 *   apps/ancient-corpora-reader/pipeline/export_canonical_manifests.py
 */

import type { TextVersionConfig } from '@polyglot/ancient-languages/corpora-types';

export const CANONICAL_CORPUS_VERSIONS: Record<string, TextVersionConfig[]> = {
  "af": [
    {
      "id": "af_lake_grc",
      "language": "grc",
      "title": "Kirsopp Lake Greek Critical Text (1912)",
      "shortTitle": "Lake 1912",
      "versionLabel": "Lake 1912",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "The Apostolic Fathers",
        "publisher": "Harvard University Press",
        "year": "1912",
        "editor": "Kirsopp Lake",
        "series": "Loeb Classical Library",
        "address": "Cambridge, MA",
        "volume": "Vols. 1–2"
      }
    },
    {
      "id": "af_lake_lat",
      "language": "lat",
      "title": "Ancient Latin Witness (Lake Loeb Edition)",
      "shortTitle": "Latin Witness",
      "versionLabel": "Latin Witness",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "ancient_witness",
        "booktitle": "The Apostolic Fathers",
        "publisher": "Harvard University Press",
        "year": "1912",
        "editor": "Kirsopp Lake",
        "series": "Loeb Classical Library",
        "address": "Cambridge, MA",
        "volume": "Vols. 1–2",
        "sblQualifier": "(Latin)",
        "applicableWorks": [
          "HER",
          "POL_PHI"
        ]
      },
      "applicableWorks": [
        "HER",
        "POL_PHI"
      ]
    },
    {
      "id": "af_lake_eng",
      "language": "eng",
      "title": "Kirsopp Lake English Translation (1912)",
      "shortTitle": "English (Lake)",
      "versionLabel": "English (Lake)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 3,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Apostolic Fathers",
        "publisher": "Harvard University Press",
        "year": "1912",
        "translator": "Kirsopp Lake",
        "series": "Loeb Classical Library",
        "address": "Cambridge, MA",
        "volume": "Vols. 1–2",
        "sblQualifier": "(trans. Lake)"
      }
    }
  ],
  "philo": [
    {
      "id": "philo_cw_grc",
      "language": "grc",
      "title": "Cohn-Wendland Greek Critical Text",
      "shortTitle": "Cohn-Wendland",
      "versionLabel": "Cohn-Wendland",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Philonis Alexandrini Opera Quae Supersunt",
        "publisher": "Georg Reimer",
        "year": "1896–1915",
        "editor": "Leopold Cohn and Paul Wendland",
        "address": "Berlin",
        "volume": "6 vols."
      }
    },
    {
      "id": "philo_yonge_eng",
      "language": "eng",
      "title": "C. D. Yonge English Translation",
      "shortTitle": "Yonge 1854",
      "versionLabel": "Yonge 1854",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Works of Philo Judaeus, the Contemporary of Josephus",
        "publisher": "H. G. Bohn",
        "year": "1854–1855",
        "translator": "Charles Duke Yonge",
        "address": "London",
        "volume": "4 vols.",
        "sblQualifier": "(trans. Yonge)"
      }
    }
  ],
  "josephus": [
    {
      "id": "josephus_niese_grc",
      "language": "grc",
      "title": "Benedikt Niese Greek Critical Text (1885–1895)",
      "shortTitle": "Niese 1895",
      "versionLabel": "Niese 1895",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Flavii Iosephi Opera",
        "publisher": "Weidmann",
        "year": "1885–1895",
        "editor": "Benedikt Niese",
        "address": "Berlin",
        "volume": "7 vols.",
        "sblQualifier": "(Niese)"
      }
    },
    {
      "id": "josephus_whiston_eng",
      "language": "eng",
      "title": "William Whiston English Translation (1856)",
      "shortTitle": "Whiston 1856",
      "versionLabel": "Whiston 1856",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Works of Flavius Josephus",
        "publisher": "Alden and Beardsley",
        "year": "1856",
        "translator": "William Whiston",
        "address": "Auburn and Rochester",
        "sblQualifier": "(trans. Whiston)"
      }
    }
  ],
  "justin": [
    {
      "id": "justin_celano_grc",
      "language": "grc",
      "title": "Greek Critical Text (First1KGreek / Celano Lemmatized)",
      "shortTitle": "First1KGreek / Celano",
      "versionLabel": "First1KGreek / Celano",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Patrologia Graeca (Vol. 6) / First1KGreek",
        "publisher": "OpenGreekAndLatin",
        "year": "2014",
        "editor": "Giuseppe Celano",
        "address": "Leipzig",
        "volume": "Vol. 6"
      }
    },
    {
      "id": "justin_anf_eng",
      "language": "eng",
      "title": "Roberts & Donaldson English Translation (ANF Vol. 1)",
      "shortTitle": "ANF Vol. 1 (1885)",
      "versionLabel": "ANF Vol. 1 (1885)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885",
        "translator": "Alexander Roberts and James Donaldson",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vol. 1",
        "sblQualifier": "(ANF)"
      }
    }
  ],
  "irenaeus": [
    {
      "id": "irenaeus_celano_grc",
      "language": "grc",
      "title": "Greek Fragments (First1KGreek / Celano Lemmatized)",
      "shortTitle": "Greek Fragments (Harvey / Celano)",
      "versionLabel": "Greek Fragments (Harvey / Celano)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Sancti Irenaei Libros quinque adversus haereses",
        "publisher": "OpenGreekAndLatin",
        "year": "1857",
        "editor": "W. W. Harvey / Giuseppe Celano",
        "series": "First1KGreek",
        "address": "Cambridge",
        "volume": "Vol. 1",
        "sblQualifier": "(Greek)"
      }
    },
    {
      "id": "irenaeus_pg_lat",
      "language": "lat",
      "title": "Latin Text (Massuet 1710 / Migne PG 7)",
      "shortTitle": "Latin (Massuet / PG 7)",
      "versionLabel": "Latin (Massuet / PG 7)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "ancient_witness",
        "booktitle": "Patrologia Graeca",
        "publisher": "J.-P. Migne / Sabbatismus",
        "year": "1857",
        "editor": "René Massuet / J.-P. Migne",
        "series": "Patrologia Graeca",
        "address": "Paris",
        "volume": "Vol. 7",
        "sblQualifier": "(Latin)",
        "url": "https://www.sabbatismus.com/en/san-ireneo-de-lyon/adversus-haereses/"
      }
    },
    {
      "id": "irenaeus_anf_eng",
      "language": "eng",
      "title": "Roberts & Rambaut English Translation (ANF Vol. 1)",
      "shortTitle": "English (ANF)",
      "versionLabel": "English (ANF)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 3,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885",
        "translator": "Alexander Roberts and William Rambaut",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vol. 1",
        "sblQualifier": "(ANF)"
      }
    },
    {
      "id": "irenaeus_sab_eng",
      "language": "eng",
      "title": "Sabbatismus English Translation (CC BY-SA 4.0)",
      "shortTitle": "English (Sabbatismus)",
      "versionLabel": "English (Sabbatismus)",
      "direction": "ltr",
      "isDefaultVisible": false,
      "order": 4,
      "bibliographic": {
        "role": "translation",
        "booktitle": "Against Heresies",
        "publisher": "Sabbatismus",
        "year": "2025",
        "translator": "Sabbatismus",
        "sblQualifier": "(Sabbatismus)",
        "url": "https://www.sabbatismus.com/en/san-ireneo-de-lyon/adversus-haereses/"
      }
    }
  ],
  "clement": [
    {
      "id": "clement_celano_grc",
      "language": "grc",
      "title": "Otto Stählin Greek Critical Text (GCS, via Celano)",
      "shortTitle": "Greek (Stählin / Celano)",
      "versionLabel": "Greek (Stählin / Celano)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Clemens Alexandrinus",
        "publisher": "J. C. Hinrichs / LemmatizedAncientGreekXML",
        "year": "1905–1909",
        "editor": "Otto Stählin",
        "series": "Die griechischen christlichen Schriftsteller",
        "address": "Leipzig",
        "volume": "Vols. 1–3",
        "sblQualifier": "(GCS)",
        "applicableWorks": [
          "PROT",
          "PAED",
          "STROM",
          "QUIS",
          "EXC_TH",
          "ECL_PR"
        ],
        "url": "https://github.com/gcelano/LemmatizedAncientGreekXML"
      },
      "applicableWorks": [
        "PROT",
        "PAED",
        "STROM",
        "QUIS",
        "EXC_TH",
        "ECL_PR"
      ]
    },
    {
      "id": "clement_perseus_grc",
      "language": "grc",
      "title": "Otto Stählin / Butterworth Greek Text (Perseus, Stanza-lemmatized)",
      "shortTitle": "Greek (Perseus / Stanza)",
      "versionLabel": "Greek (Perseus / Stanza)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Clemens Alexandrinus / Loeb Classical Library 92",
        "publisher": "Perseus Digital Library",
        "year": "1905–1919",
        "editor": "Otto Stählin / G. W. Butterworth",
        "series": "GCS / Loeb Classical Library",
        "address": "Leipzig / Cambridge, MA",
        "sblQualifier": "(Perseus)",
        "applicableWorks": [
          "STROM",
          "BAPT"
        ],
        "url": "https://github.com/PerseusDL/canonical-greekLit"
      },
      "applicableWorks": [
        "STROM",
        "BAPT"
      ]
    },
    {
      "id": "clement_anf_eng",
      "language": "eng",
      "title": "Ante-Nicene Fathers English Translation (Vols. 2 & 8)",
      "shortTitle": "English (ANF)",
      "versionLabel": "English (ANF)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 3,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885",
        "editor": "Alexander Roberts and James Donaldson",
        "translator": "William Wilson",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vols. 2 & 8",
        "sblQualifier": "(ANF)",
        "applicableWorks": [
          "PROT",
          "PAED",
          "STROM",
          "QUIS",
          "ECL_PR"
        ],
        "url": "https://www.ccel.org/ccel/schaff/anf02"
      },
      "applicableWorks": [
        "PROT",
        "PAED",
        "STROM",
        "QUIS",
        "ECL_PR"
      ]
    },
    {
      "id": "clement_butterworth_eng",
      "language": "eng",
      "title": "G. W. Butterworth English Translation (Loeb Classical Library 92, 1919)",
      "shortTitle": "English (Butterworth 1919)",
      "versionLabel": "English (Butterworth 1919)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 4,
      "bibliographic": {
        "role": "translation",
        "booktitle": "Clement of Alexandria: The Exhortation to the Greeks, The Rich Man's Salvation, To the Newly Baptized",
        "publisher": "William Heinemann / Harvard University Press",
        "year": "1919",
        "editor": "G. W. Butterworth",
        "translator": "G. W. Butterworth",
        "series": "Loeb Classical Library",
        "address": "London / Cambridge, MA",
        "volume": "LCL 92",
        "sblQualifier": "(trans. Butterworth)",
        "applicableWorks": [
          "PROT",
          "QUIS",
          "BAPT"
        ],
        "url": "https://archive.org/details/L092ClementOfAlexandriaTheExhortationToTheGreeks"
      },
      "applicableWorks": [
        "PROT",
        "QUIS",
        "BAPT"
      ]
    },
    {
      "id": "clement_anf_lat",
      "language": "lat",
      "title": "Gentian Hervet / John Potter Latin Translation (Stromata Book 3, via ANF Vol. 2)",
      "shortTitle": "Latin (Hervet / ANF)",
      "versionLabel": "Latin (Hervet / ANF)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 5,
      "bibliographic": {
        "role": "ancient_witness",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885",
        "editor": "John Potter / Alexander Roberts & James Donaldson",
        "translator": "Gentian Hervet",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vol. 2",
        "sblQualifier": "(Latin)",
        "applicableWorks": [
          "STROM"
        ],
        "url": "https://www.ccel.org/ccel/schaff/anf02"
      },
      "applicableWorks": [
        "STROM"
      ]
    }
  ],
  "origen": [
    {
      "id": "origen_celano_grc",
      "language": "grc",
      "title": "Greek Critical Text (First1KGreek / Celano Lemmatized)",
      "shortTitle": "Greek (Celano)",
      "versionLabel": "Greek (Celano)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 1,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Lemmatized Ancient Greek XML (tlg2042)",
        "publisher": "OpenGreekAndLatin",
        "year": "2017",
        "editor": "Giuseppe Celano",
        "series": "First1KGreek",
        "address": "Leipzig",
        "sblQualifier": "(Greek)",
        "applicableWorks": [
          "CELS",
          "COMM_JO",
          "COMM_MT",
          "ORAT",
          "EP_AFR"
        ],
        "url": "https://github.com/gcelano/LemmatizedAncientGreekXML"
      },
      "applicableWorks": [
        "CELS",
        "COMM_JO",
        "COMM_MT",
        "ORAT",
        "EP_AFR"
      ]
    },
    {
      "id": "origen_f1k_grc",
      "language": "grc",
      "title": "Greek Critical Text (First1KGreek TEI)",
      "shortTitle": "Greek (First1KGreek)",
      "versionLabel": "Greek (First1KGreek)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 2,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "The Philocalia of Origen",
        "publisher": "Cambridge University Press",
        "year": "1893",
        "editor": "J. Armitage Robinson",
        "series": "First1KGreek",
        "address": "Cambridge",
        "sblQualifier": "(Greek)",
        "applicableWorks": [
          "PHIL"
        ],
        "url": "https://github.com/OpenGreekAndLatin/First1KGreek"
      },
      "applicableWorks": [
        "PHIL"
      ]
    },
    {
      "id": "origen_mgr_grc",
      "language": "grc",
      "title": "Greek Fragments (Migne Patrologia Graeca Vol. 11)",
      "shortTitle": "Greek (PG 11)",
      "versionLabel": "Greek (PG 11)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 3,
      "bibliographic": {
        "role": "critical_edition",
        "booktitle": "Patrologia Graeca",
        "publisher": "J.-P. Migne",
        "year": "1857",
        "editor": "J.-P. Migne",
        "series": "Patrologia Graeca",
        "address": "Paris",
        "volume": "Vol. 11",
        "sblQualifier": "(Greek)",
        "applicableWorks": [
          "PRIN"
        ],
        "url": "https://www.documentacatholicaomnia.eu/04z/z_0185-0254__Origenes__De_principiis__MGR.pdf.html"
      },
      "applicableWorks": [
        "PRIN"
      ]
    },
    {
      "id": "origen_cc_lat",
      "language": "lat",
      "title": "Rufinus Latin Translation (Corpus Corporum)",
      "shortTitle": "Latin (Rufinus)",
      "versionLabel": "Latin (Rufinus)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 4,
      "bibliographic": {
        "role": "ancient_witness",
        "booktitle": "Collectio Selecta SS. Ecclesiae Patrum",
        "publisher": "Méquignon-Havard / Univ. of Zurich",
        "year": "1829",
        "editor": "Armand Benjamin Caillau and Philipp Roelli",
        "translator": "Rufinus of Aquileia",
        "series": "Corpus Corporum",
        "address": "Paris / Zurich",
        "volume": "Vol. 15",
        "sblQualifier": "(Latin, Rufinus)",
        "applicableWorks": [
          "PRIN"
        ],
        "url": "https://mlat.uzh.ch/browser?path=21750"
      },
      "applicableWorks": [
        "PRIN"
      ]
    },
    {
      "id": "origen_f1k_lat",
      "language": "lat",
      "title": "Ancient Latin Translation (First1KGreek, Mt. Bks 12–17)",
      "shortTitle": "Latin (First1KGreek)",
      "versionLabel": "Latin (First1KGreek)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 5,
      "bibliographic": {
        "role": "ancient_witness",
        "booktitle": "Origenes Werke: Matthäuserklärung",
        "publisher": "OpenGreekAndLatin",
        "year": "1935",
        "editor": "Erich Klostermann",
        "series": "Die griechischen christlichen Schriftsteller",
        "address": "Leipzig",
        "volume": "Vol. 10",
        "sblQualifier": "(Latin)",
        "applicableWorks": [
          "COMM_MT"
        ],
        "url": "https://github.com/OpenGreekAndLatin/First1KGreek"
      },
      "applicableWorks": [
        "COMM_MT"
      ]
    },
    {
      "id": "origen_anf_eng",
      "language": "eng",
      "title": "Ante-Nicene Fathers English Translation (Vols. 4 & 9)",
      "shortTitle": "English (ANF)",
      "versionLabel": "English (ANF)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 6,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885–1896",
        "editor": "Alexander Roberts, James Donaldson, and Allan Menzies",
        "translator": "Frederick Crombie, Allan Menzies, and John Patrick",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vols. 4 & 9",
        "sblQualifier": "(ANF)",
        "applicableWorks": [
          "PRIN",
          "CELS",
          "COMM_JO",
          "COMM_MT",
          "EP_AFR"
        ],
        "url": "https://www.ccel.org/ccel/schaff/anf04"
      },
      "applicableWorks": [
        "PRIN",
        "CELS",
        "COMM_JO",
        "COMM_MT",
        "EP_AFR"
      ]
    },
    {
      "id": "origen_anf_grc_eng",
      "language": "eng",
      "title": "Ante-Nicene Fathers English (from the Greek, De Principiis 3.1 & 4.1–23)",
      "shortTitle": "English (ANF, from Greek)",
      "versionLabel": "English (ANF, from Greek)",
      "direction": "ltr",
      "isDefaultVisible": false,
      "order": 7,
      "bibliographic": {
        "role": "translation",
        "booktitle": "The Ante-Nicene Fathers",
        "publisher": "Christian Literature Publishing Co.",
        "year": "1885",
        "editor": "Alexander Roberts and James Donaldson",
        "translator": "Frederick Crombie",
        "series": "Ante-Nicene Fathers",
        "address": "Buffalo, NY",
        "volume": "Vol. 4",
        "sblQualifier": "(ANF from Greek)",
        "applicableWorks": [
          "PRIN"
        ],
        "url": "https://www.ccel.org/ccel/schaff/anf04"
      },
      "applicableWorks": [
        "PRIN"
      ]
    },
    {
      "id": "origen_tert_eng",
      "language": "eng",
      "title": "English Translations (Curtis / Lewis 1911 via Tertullian.org)",
      "shortTitle": "English (Tertullian.org)",
      "versionLabel": "English (Tertullian.org)",
      "direction": "ltr",
      "isDefaultVisible": true,
      "order": 8,
      "bibliographic": {
        "role": "translation",
        "booktitle": "Early Church Fathers — Additional Texts",
        "publisher": "Tertullian.org",
        "year": "1911",
        "editor": "Roger Pearse",
        "translator": "William A. Curtis and George Lewis",
        "sblQualifier": "(trans. Curtis / Lewis)",
        "applicableWorks": [
          "ORAT",
          "PHIL"
        ],
        "url": "https://www.tertullian.org/fathers/index.htm"
      },
      "applicableWorks": [
        "ORAT",
        "PHIL"
      ]
    }
  ]
};
