/**
 * Pre-computed word and verse totals by biblical book and corpus.
 * Serves as an instant in-memory lookup and static/offline fallback.
 * AUTO-GENERATED - books are ordered in authentic canonical sequence.
 */

export interface BookWordStat {
	words: number;
	verses: number;
}

export const CORPUS_TOTAL_WORDS: Record<string, number> = {
  "kjv": 556037,
  "ognt": 138013,
  "peshitta": 525248,
  "swete_lxx": 605183,
  "wlc": 420141
};

export const CORPUS_BOOK_STATS: Record<string, Record<string, BookWordStat>> = {
  "kjv": {
    "GEN": {
      "words": 15469,
      "verses": 1533
    },
    "EXO": {
      "words": 12541,
      "verses": 1213
    },
    "LEV": {
      "words": 8493,
      "verses": 859
    },
    "NUM": {
      "words": 12856,
      "verses": 1288
    },
    "DEU": {
      "words": 10153,
      "verses": 959
    },
    "JOS": {
      "words": 7400,
      "verses": 658
    },
    "JDG": {
      "words": 7357,
      "verses": 618
    },
    "RUT": {
      "words": 931,
      "verses": 85
    },
    "1SA": {
      "words": 25195,
      "verses": 810
    },
    "2SA": {
      "words": 20771,
      "verses": 695
    },
    "1KI": {
      "words": 9726,
      "verses": 816
    },
    "2KI": {
      "words": 23644,
      "verses": 719
    },
    "1CH": {
      "words": 20489,
      "verses": 942
    },
    "2CH": {
      "words": 10260,
      "verses": 822
    },
    "EZR": {
      "words": 3254,
      "verses": 280
    },
    "NEH": {
      "words": 4274,
      "verses": 406
    },
    "EST": {
      "words": 2322,
      "verses": 167
    },
    "JOB": {
      "words": 6693,
      "verses": 1070
    },
    "PSA": {
      "words": 16517,
      "verses": 2461
    },
    "PRO": {
      "words": 6105,
      "verses": 915
    },
    "ECC": {
      "words": 2107,
      "verses": 222
    },
    "SNG": {
      "words": 1022,
      "verses": 117
    },
    "ISA": {
      "words": 13399,
      "verses": 1292
    },
    "JER": {
      "words": 15707,
      "verses": 1364
    },
    "LAM": {
      "words": 1277,
      "verses": 154
    },
    "EZK": {
      "words": 14092,
      "verses": 1273
    },
    "DAN": {
      "words": 5066,
      "verses": 357
    },
    "HOS": {
      "words": 1836,
      "verses": 197
    },
    "JOL": {
      "words": 760,
      "verses": 73
    },
    "AMO": {
      "words": 1574,
      "verses": 146
    },
    "OBA": {
      "words": 221,
      "verses": 21
    },
    "JON": {
      "words": 509,
      "verses": 48
    },
    "MIC": {
      "words": 1096,
      "verses": 105
    },
    "NAM": {
      "words": 467,
      "verses": 47
    },
    "HAB": {
      "words": 546,
      "verses": 56
    },
    "ZEP": {
      "words": 587,
      "verses": 53
    },
    "HAG": {
      "words": 449,
      "verses": 38
    },
    "ZEC": {
      "words": 2339,
      "verses": 211
    },
    "MAL": {
      "words": 639,
      "verses": 55
    },
    "1ES": {
      "words": 11790,
      "verses": 448
    },
    "2ES": {
      "words": 20446,
      "verses": 874
    },
    "TOB": {
      "words": 6978,
      "verses": 244
    },
    "JDT": {
      "words": 11071,
      "verses": 339
    },
    "ESG": {
      "words": 2712,
      "verses": 105
    },
    "WIS": {
      "words": 10618,
      "verses": 436
    },
    "SIR": {
      "words": 28316,
      "verses": 1392
    },
    "BAR": {
      "words": 5058,
      "verses": 213
    },
    "S3Y": {
      "words": 1411,
      "verses": 68
    },
    "SUS": {
      "words": 1450,
      "verses": 64
    },
    "BEL": {
      "words": 1074,
      "verses": 42
    },
    "MAN": {
      "words": 408,
      "verses": 1
    },
    "1MA": {
      "words": 23177,
      "verses": 924
    },
    "2MA": {
      "words": 16370,
      "verses": 555
    },
    "MAT": {
      "words": 15899,
      "verses": 1071
    },
    "MRK": {
      "words": 10026,
      "verses": 678
    },
    "LUK": {
      "words": 17146,
      "verses": 1151
    },
    "JHN": {
      "words": 13619,
      "verses": 879
    },
    "ACT": {
      "words": 15891,
      "verses": 1007
    },
    "ROM": {
      "words": 6121,
      "verses": 433
    },
    "1CO": {
      "words": 6086,
      "verses": 437
    },
    "2CO": {
      "words": 6095,
      "verses": 257
    },
    "GAL": {
      "words": 2003,
      "verses": 149
    },
    "EPH": {
      "words": 2031,
      "verses": 155
    },
    "PHP": {
      "words": 1457,
      "verses": 104
    },
    "COL": {
      "words": 1373,
      "verses": 95
    },
    "1TH": {
      "words": 1849,
      "verses": 89
    },
    "2TH": {
      "words": 1033,
      "verses": 47
    },
    "1TI": {
      "words": 2263,
      "verses": 113
    },
    "2TI": {
      "words": 1696,
      "verses": 83
    },
    "TIT": {
      "words": 627,
      "verses": 46
    },
    "PHM": {
      "words": 319,
      "verses": 25
    },
    "HEB": {
      "words": 4302,
      "verses": 303
    },
    "JAS": {
      "words": 1529,
      "verses": 108
    },
    "1PE": {
      "words": 2481,
      "verses": 105
    },
    "2PE": {
      "words": 1555,
      "verses": 61
    },
    "1JN": {
      "words": 2520,
      "verses": 105
    },
    "2JN": {
      "words": 299,
      "verses": 13
    },
    "3JN": {
      "words": 295,
      "verses": 14
    },
    "JUD": {
      "words": 397,
      "verses": 25
    },
    "REV": {
      "words": 8103,
      "verses": 404
    }
  },
  "ognt": {
    "MAT": {
      "words": 18346,
      "verses": 1068
    },
    "MRK": {
      "words": 11304,
      "verses": 673
    },
    "LUK": {
      "words": 19482,
      "verses": 1149
    },
    "JHN": {
      "words": 15635,
      "verses": 878
    },
    "ACT": {
      "words": 18450,
      "verses": 1002
    },
    "ROM": {
      "words": 7111,
      "verses": 432
    },
    "1CO": {
      "words": 6830,
      "verses": 437
    },
    "2CO": {
      "words": 4477,
      "verses": 256
    },
    "GAL": {
      "words": 2230,
      "verses": 149
    },
    "EPH": {
      "words": 2422,
      "verses": 155
    },
    "PHP": {
      "words": 1629,
      "verses": 104
    },
    "COL": {
      "words": 1582,
      "verses": 95
    },
    "1TH": {
      "words": 1481,
      "verses": 89
    },
    "2TH": {
      "words": 823,
      "verses": 47
    },
    "1TI": {
      "words": 1591,
      "verses": 113
    },
    "2TI": {
      "words": 1238,
      "verses": 83
    },
    "TIT": {
      "words": 659,
      "verses": 46
    },
    "PHM": {
      "words": 335,
      "verses": 25
    },
    "HEB": {
      "words": 4953,
      "verses": 303
    },
    "JAS": {
      "words": 1745,
      "verses": 108
    },
    "1PE": {
      "words": 1679,
      "verses": 105
    },
    "2PE": {
      "words": 1099,
      "verses": 61
    },
    "1JN": {
      "words": 2140,
      "verses": 105
    },
    "2JN": {
      "words": 245,
      "verses": 13
    },
    "3JN": {
      "words": 218,
      "verses": 15
    },
    "JUD": {
      "words": 458,
      "verses": 25
    },
    "REV": {
      "words": 9851,
      "verses": 405
    }
  },
  "peshitta": {
    "GEN": {
      "words": 20080,
      "verses": 1533
    },
    "EXO": {
      "words": 16338,
      "verses": 1213
    },
    "LEV": {
      "words": 11834,
      "verses": 859
    },
    "NUM": {
      "words": 16539,
      "verses": 1289
    },
    "DEU": {
      "words": 14136,
      "verses": 959
    },
    "JOB": {
      "words": 9219,
      "verses": 1065
    },
    "JOS": {
      "words": 10041,
      "verses": 656
    },
    "JDG": {
      "words": 9793,
      "verses": 617
    },
    "1SA": {
      "words": 12937,
      "verses": 809
    },
    "2SA": {
      "words": 11072,
      "verses": 693
    },
    "PSA": {
      "words": 20092,
      "verses": 2454
    },
    "1KI": {
      "words": 12883,
      "verses": 816
    },
    "2KI": {
      "words": 12026,
      "verses": 719
    },
    "PRO": {
      "words": 8052,
      "verses": 914
    },
    "WIS": {
      "words": 6059,
      "verses": 436
    },
    "ECC": {
      "words": 3020,
      "verses": 222
    },
    "SNG": {
      "words": 1312,
      "verses": 117
    },
    "ISA": {
      "words": 17562,
      "verses": 1290
    },
    "JER": {
      "words": 21782,
      "verses": 1369
    },
    "LAM": {
      "words": 1762,
      "verses": 159
    },
    "LJE": {
      "words": 1088,
      "verses": 73
    },
    "BAR": {
      "words": 1940,
      "verses": 142
    },
    "EZK": {
      "words": 18329,
      "verses": 1271
    },
    "HOS": {
      "words": 2580,
      "verses": 197
    },
    "JOL": {
      "words": 984,
      "verses": 73
    },
    "AMO": {
      "words": 2112,
      "verses": 146
    },
    "OBA": {
      "words": 299,
      "verses": 21
    },
    "JON": {
      "words": 720,
      "verses": 48
    },
    "MIC": {
      "words": 1498,
      "verses": 105
    },
    "NAM": {
      "words": 590,
      "verses": 47
    },
    "HAB": {
      "words": 701,
      "verses": 56
    },
    "ZEP": {
      "words": 810,
      "verses": 53
    },
    "HAG": {
      "words": 609,
      "verses": 38
    },
    "ZEC": {
      "words": 3168,
      "verses": 211
    },
    "MAL": {
      "words": 933,
      "verses": 55
    },
    "DAN": {
      "words": 6472,
      "verses": 412
    },
    "BEL": {
      "words": 790,
      "verses": 42
    },
    "RUT": {
      "words": 1392,
      "verses": 86
    },
    "SUS": {
      "words": 1215,
      "verses": 65
    },
    "EST": {
      "words": 2907,
      "verses": 168
    },
    "JDT": {
      "words": 5686,
      "verses": 341
    },
    "SIR": {
      "words": 13074,
      "verses": 1261
    },
    "1CH": {
      "words": 11264,
      "verses": 891
    },
    "2CH": {
      "words": 13568,
      "verses": 768
    },
    "2ES": {
      "words": 10627,
      "verses": 714
    },
    "EZR": {
      "words": 3908,
      "verses": 280
    },
    "NEH": {
      "words": 5492,
      "verses": 405
    },
    "1MA": {
      "words": 23578,
      "verses": 1768
    },
    "2MA": {
      "words": 11196,
      "verses": 556
    },
    "3MA": {
      "words": 4758,
      "verses": 228
    },
    "4MA": {
      "words": 7496,
      "verses": 479
    },
    "ODA": {
      "words": 2200,
      "verses": 209
    },
    "MAN": {
      "words": 551,
      "verses": 32
    },
    "PS2": {
      "words": 637,
      "verses": 65
    },
    "PSS": {
      "words": 3362,
      "verses": 343
    },
    "TOB": {
      "words": 6061,
      "verses": 343
    },
    "1ES": {
      "words": 6474,
      "verses": 406
    },
    "MAT": {
      "words": 13979,
      "verses": 1071
    },
    "MRK": {
      "words": 8793,
      "verses": 678
    },
    "LUK": {
      "words": 15234,
      "verses": 1151
    },
    "JHN": {
      "words": 12408,
      "verses": 879
    },
    "ACT": {
      "words": 15383,
      "verses": 1007
    },
    "ROM": {
      "words": 5768,
      "verses": 433
    },
    "1CO": {
      "words": 5986,
      "verses": 437
    },
    "2CO": {
      "words": 3737,
      "verses": 257
    },
    "GAL": {
      "words": 1940,
      "verses": 149
    },
    "EPH": {
      "words": 1774,
      "verses": 155
    },
    "PHP": {
      "words": 1326,
      "verses": 104
    },
    "COL": {
      "words": 1133,
      "verses": 95
    },
    "1TH": {
      "words": 1117,
      "verses": 89
    },
    "2TH": {
      "words": 609,
      "verses": 47
    },
    "1TI": {
      "words": 1507,
      "verses": 113
    },
    "2TI": {
      "words": 1040,
      "verses": 83
    },
    "TIT": {
      "words": 644,
      "verses": 46
    },
    "PHM": {
      "words": 277,
      "verses": 25
    },
    "HEB": {
      "words": 4288,
      "verses": 303
    },
    "JAS": {
      "words": 1444,
      "verses": 108
    },
    "1PE": {
      "words": 1535,
      "verses": 105
    },
    "2PE": {
      "words": 1028,
      "verses": 61
    },
    "1JN": {
      "words": 1547,
      "verses": 105
    },
    "2JN": {
      "words": 197,
      "verses": 13
    },
    "3JN": {
      "words": 211,
      "verses": 15
    },
    "JUD": {
      "words": 415,
      "verses": 25
    },
    "REV": {
      "words": 6320,
      "verses": 403
    }
  },
  "swete_lxx": {
    "GEN": {
      "words": 32566,
      "verses": 1531
    },
    "EXO": {
      "words": 24816,
      "verses": 1163
    },
    "LEV": {
      "words": 19082,
      "verses": 859
    },
    "NUM": {
      "words": 25059,
      "verses": 1287
    },
    "DEU": {
      "words": 22990,
      "verses": 959
    },
    "JOS": {
      "words": 13670,
      "verses": 596
    },
    "JDG": {
      "words": 15947,
      "verses": 618
    },
    "RUT": {
      "words": 2072,
      "verses": 85
    },
    "1SA": {
      "words": 20131,
      "verses": 772
    },
    "2SA": {
      "words": 17927,
      "verses": 695
    },
    "1KI": {
      "words": 20803,
      "verses": 756
    },
    "2KI": {
      "words": 18853,
      "verses": 719
    },
    "1CH": {
      "words": 16244,
      "verses": 930
    },
    "2CH": {
      "words": 21353,
      "verses": 821
    },
    "1ES": {
      "words": 8994,
      "verses": 434
    },
    "EZR": {
      "words": 5586,
      "verses": 280
    },
    "NEH": {
      "words": 7676,
      "verses": 392
    },
    "PSA": {
      "words": 34964,
      "verses": 2533
    },
    "PRO": {
      "words": 10524,
      "verses": 846
    },
    "ECC": {
      "words": 4546,
      "verses": 222
    },
    "SNG": {
      "words": 2025,
      "verses": 117
    },
    "JOB": {
      "words": 13561,
      "verses": 1069
    },
    "WIS": {
      "words": 6943,
      "verses": 435
    },
    "SIR": {
      "words": 18658,
      "verses": 1402
    },
    "EST": {
      "words": 5843,
      "verses": 164
    },
    "JDT": {
      "words": 9174,
      "verses": 340
    },
    "TOB": {
      "words": 12736,
      "verses": 480
    },
    "HOS": {
      "words": 3941,
      "verses": 197
    },
    "AMO": {
      "words": 3210,
      "verses": 146
    },
    "MIC": {
      "words": 2368,
      "verses": 105
    },
    "JOL": {
      "words": 1580,
      "verses": 73
    },
    "OBA": {
      "words": 472,
      "verses": 21
    },
    "JON": {
      "words": 1090,
      "verses": 48
    },
    "NAM": {
      "words": 937,
      "verses": 47
    },
    "HAB": {
      "words": 1105,
      "verses": 56
    },
    "ZEP": {
      "words": 1223,
      "verses": 53
    },
    "HAG": {
      "words": 947,
      "verses": 38
    },
    "ZEC": {
      "words": 4963,
      "verses": 211
    },
    "MAL": {
      "words": 1416,
      "verses": 55
    },
    "ISA": {
      "words": 27075,
      "verses": 1289
    },
    "JER": {
      "words": 28948,
      "verses": 1298
    },
    "BAR": {
      "words": 3869,
      "verses": 213
    },
    "LAM": {
      "words": 2391,
      "verses": 151
    },
    "LJE": {
      "words": 24,
      "verses": 1
    },
    "EZK": {
      "words": 29658,
      "verses": 1267
    },
    "DAG": {
      "words": 10781,
      "verses": 406
    },
    "DAN": {
      "words": 10453,
      "verses": 424
    },
    "SUG": {
      "words": 792,
      "verses": 36
    },
    "SUS": {
      "words": 1134,
      "verses": 64
    },
    "BLG": {
      "words": 901,
      "verses": 37
    },
    "BEL": {
      "words": 871,
      "verses": 42
    },
    "1MA": {
      "words": 18292,
      "verses": 924
    },
    "2MA": {
      "words": 11917,
      "verses": 555
    },
    "3MA": {
      "words": 5110,
      "verses": 228
    },
    "4MA": {
      "words": 7859,
      "verses": 479
    },
    "PSS": {
      "words": 4926,
      "verses": 310
    },
    "ODA": {
      "words": 4187,
      "verses": 288
    }
  },
  "wlc": {
    "GEN": {
      "words": 28478,
      "verses": 1533
    },
    "EXO": {
      "words": 23385,
      "verses": 1213
    },
    "LEV": {
      "words": 16759,
      "verses": 859
    },
    "NUM": {
      "words": 22812,
      "verses": 1289
    },
    "DEU": {
      "words": 19812,
      "verses": 959
    },
    "JOS": {
      "words": 14307,
      "verses": 658
    },
    "JDG": {
      "words": 13899,
      "verses": 618
    },
    "1SA": {
      "words": 18665,
      "verses": 811
    },
    "2SA": {
      "words": 15453,
      "verses": 695
    },
    "1KI": {
      "words": 18408,
      "verses": 817
    },
    "2KI": {
      "words": 17107,
      "verses": 719
    },
    "ISA": {
      "words": 22501,
      "verses": 1291
    },
    "JER": {
      "words": 29261,
      "verses": 1364
    },
    "EZK": {
      "words": 25746,
      "verses": 1273
    },
    "HOS": {
      "words": 3086,
      "verses": 197
    },
    "JOL": {
      "words": 1297,
      "verses": 73
    },
    "AMO": {
      "words": 2726,
      "verses": 146
    },
    "OBA": {
      "words": 387,
      "verses": 21
    },
    "JON": {
      "words": 977,
      "verses": 48
    },
    "MIC": {
      "words": 1868,
      "verses": 105
    },
    "NAM": {
      "words": 725,
      "verses": 47
    },
    "HAB": {
      "words": 879,
      "verses": 56
    },
    "ZEP": {
      "words": 1014,
      "verses": 53
    },
    "HAG": {
      "words": 860,
      "verses": 38
    },
    "ZEC": {
      "words": 4392,
      "verses": 211
    },
    "MAL": {
      "words": 1168,
      "verses": 55
    },
    "PSA": {
      "words": 24964,
      "verses": 2527
    },
    "PRO": {
      "words": 8725,
      "verses": 915
    },
    "JOB": {
      "words": 10737,
      "verses": 1070
    },
    "SNG": {
      "words": 1632,
      "verses": 117
    },
    "RUT": {
      "words": 1787,
      "verses": 85
    },
    "LAM": {
      "words": 1893,
      "verses": 154
    },
    "ECC": {
      "words": 4144,
      "verses": 222
    },
    "EST": {
      "words": 4551,
      "verses": 167
    },
    "DAN": {
      "words": 8021,
      "verses": 357
    },
    "EZR": {
      "words": 5217,
      "verses": 280
    },
    "NEH": {
      "words": 7717,
      "verses": 405
    },
    "1CH": {
      "words": 15333,
      "verses": 943
    },
    "2CH": {
      "words": 19448,
      "verses": 822
    }
  }
};

export function getStaticCorpusTotalWords(corpusId: string): number {
	const c = corpusId.toLowerCase();
	return CORPUS_TOTAL_WORDS[c] || 0;
}

export function getStaticBookWordStats(corpusId: string, bookCode: string): BookWordStat | null {
	const c = corpusId.toLowerCase();
	const b = (bookCode || '').toUpperCase();
	return CORPUS_BOOK_STATS[c]?.[b] || null;
}
