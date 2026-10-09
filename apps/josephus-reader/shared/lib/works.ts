export interface TranslationRef {
  id: string;
  name: string;
}

export interface Work {
  id: string;
  title: string;
  abbrev: string;
  englishTitle: string;
  author: string;
  tlgAuthor: string;
  tlgWork: string;
  greekEdition: string;
  translations: TranslationRef[];
  booksCount: number;
  citation?: {
    scheme: string;
    hideLineNumbers?: boolean;
  };
}

export const HOUSE_AUTHOR = 'Flavius Josephus';

export const WORKS: Work[] = [
  {
    id: "Antiquities",
    title: "Antiquitates Judaicae",
    abbrev: "Ant. Iud.",
    englishTitle: "Antiquities of the Jews",
    author: HOUSE_AUTHOR,
    tlgAuthor: "0526",
    tlgWork: "001",
    greekEdition: "B. Niese, Flavii Iosephi Opera (Weidmann, 1887)",
    booksCount: 20,
    translations: [
      { id: "whiston", name: "William Whiston (1856)" }
    ],
    citation: { scheme: "niese", hideLineNumbers: true }
  },
  {
    id: "War",
    title: "Bellum Judaicum",
    abbrev: "Bel. Iud.",
    englishTitle: "The Jewish War",
    author: HOUSE_AUTHOR,
    tlgAuthor: "0526",
    tlgWork: "004",
    greekEdition: "B. Niese, Flavii Iosephi Opera (Weidmann, 1895)",
    booksCount: 7,
    translations: [
      { id: "whiston", name: "William Whiston (1856)" }
    ],
    citation: { scheme: "niese", hideLineNumbers: true }
  },
  {
    id: "Life",
    title: "Vita",
    abbrev: "Vita",
    englishTitle: "The Life of Flavius Josephus",
    author: HOUSE_AUTHOR,
    tlgAuthor: "0526",
    tlgWork: "002",
    greekEdition: "B. Niese, Flavii Iosephi Opera (Weidmann, 1890)",
    booksCount: 1,
    translations: [
      { id: "whiston", name: "William Whiston (1856)" }
    ],
    citation: { scheme: "niese", hideLineNumbers: true }
  },
  {
    id: "Apion",
    title: "Contra Apionem",
    abbrev: "Con. Ap.",
    englishTitle: "Against Apion",
    author: HOUSE_AUTHOR,
    tlgAuthor: "0526",
    tlgWork: "003",
    greekEdition: "B. Niese, Flavii Iosephi Opera (Weidmann, 1889)",
    booksCount: 2,
    translations: [
      { id: "whiston", name: "William Whiston (1856)" }
    ],
    citation: { scheme: "niese", hideLineNumbers: true }
  }
];

export const BY_ID: Map<string, Work> = new Map(WORKS.map(w => [w.id, w]));

export function getWork(id: string | null | undefined): Work | undefined {
  if (!id) return undefined;
  const direct = BY_ID.get(id);
  if (direct) return direct;
  const lower = id.toLowerCase();
  return WORKS.find(w => w.id.toLowerCase() === lower);
}

export function isBookless(work: Work): boolean {
  return false; // All Josephus works use book-based routing (Book 1, etc.)
}

export function bookLabel(work: Work, n: number): string {
  return `Book ${n}`;
}

export function workPath(workId: string, book = 1): string {
  return `/${workId}/book/${book}/`;
}

export function workLanding(workId: string): string {
  return `/${workId}/`;
}

export interface ShelfWork {
  id: string;
}

export interface Shelf {
  numeral: string;
  title: string;
  works: ShelfWork[];
}

export const SHELVES: Shelf[] = [
  {
    numeral: "1",
    title: "Histories",
    works: [{ id: "Antiquities" }, { id: "War" }]
  },
  {
    numeral: "2",
    title: "Autobiography & Apologetics",
    works: [{ id: "Life" }, { id: "Apion" }]
  }
];

export const START_HERE: string[] = ["Antiquities", "War", "Life", "Apion"];

export const WORK_ORDER: Map<string, number> = new Map(WORKS.map((w, i) => [w.id, i]));
