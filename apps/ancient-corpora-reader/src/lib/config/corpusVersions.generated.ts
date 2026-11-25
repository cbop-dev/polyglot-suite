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
  ]
};
