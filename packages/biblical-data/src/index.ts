/**
 * @biblical-data/corpora - Biblical Corpora Data Client SDK & Types.
 */

export * from './types.js';
import type {
  CorpusName,
  LexemesDict,
  BooksDict,
  SectionsDict,
  ConcordanceDict,
  VersesDict,
  DictionaryShard,
  DictionaryEntry,
  Lexeme,
  BookInfo,
} from './types.js';

export class CorpusReader {
  public readonly corpus: CorpusName;
  public readonly basePath: string;
  private _lexemes: LexemesDict | null = null;
  private _books: BooksDict | null = null;
  private _sections: SectionsDict | null = null;
  private _concordance: ConcordanceDict | null = null;
  private _verses: VersesDict | null = null;

  constructor(corpus: CorpusName, basePath: string = `/data/${corpus}`) {
    this.corpus = corpus;
    this.basePath = basePath.replace(/\/+$/, '');
  }

  private async fetchJson<T>(filename: string): Promise<T> {
    const url = `${this.basePath}/${filename}`;
    if (typeof fetch !== 'undefined') {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Failed to load ${url}: ${resp.statusText}`);
      }
      return (await resp.json()) as T;
    } else {
      // Node.js fallback
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const filePath = path.resolve(this.basePath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  }

  async getLexemes(): Promise<LexemesDict> {
    if (!this._lexemes) {
      this._lexemes = await this.fetchJson<LexemesDict>('lexemes.json');
    }
    return this._lexemes;
  }

  async getBooks(): Promise<BooksDict> {
    if (!this._books) {
      this._books = await this.fetchJson<BooksDict>('books.json');
    }
    return this._books;
  }

  async getSections(): Promise<SectionsDict> {
    if (!this._sections) {
      this._sections = await this.fetchJson<SectionsDict>('sections.json');
    }
    return this._sections;
  }

  async getConcordance(): Promise<ConcordanceDict> {
    if (!this._concordance) {
      this._concordance = await this.fetchJson<ConcordanceDict>('concordance.json');
    }
    return this._concordance;
  }

  async getVerses(): Promise<VersesDict> {
    if (!this._verses) {
      this._verses = await this.fetchJson<VersesDict>('verses.json');
    }
    return this._verses;
  }

  async getBookVerses(bookAbbrev: string): Promise<Record<string, Record<string, string>>> {
    return this.fetchJson<Record<string, Record<string, string>>>(`books/${bookAbbrev}.json`);
  }

  async findLexemeByLemma(lemma: string): Promise<Lexeme | null> {
    const lexemes = await this.getLexemes();
    for (const item of Object.values(lexemes)) {
      if (item.lemma === lemma || item.plain === lemma) {
        return item;
      }
    }
    return null;
  }
}

export class LsjDictionaryReader {
  public readonly basePath: string;
  private _cache: Map<string, DictionaryShard> = new Map();

  constructor(basePath: string = '/data/dictionary') {
    this.basePath = basePath.replace(/\/+$/, '');
  }

  private getBucket(text: string): string {
    if (!text) return 'other';
    const first = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().charAt(0);
    const letterMap: Record<string, string> = {
      'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
      'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta', 'θ': 'theta',
      'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu',
      'ν': 'nu', 'ξ': 'xi', 'ο': 'omicron', 'π': 'pi',
      'ρ': 'rho', 'σ': 'sigma', 'ς': 'sigma', 'τ': 'tau',
      'υ': 'upsilon', 'φ': 'phi', 'χ': 'chi', 'ψ': 'psi',
      'ω': 'omega',
    };
    return letterMap[first] || 'other';
  }

  async getShard(bucket: string): Promise<DictionaryShard> {
    if (this._cache.has(bucket)) {
      return this._cache.get(bucket)!;
    }
    const url = `${this.basePath}/${bucket}.json`;
    let shard: DictionaryShard;
    if (typeof fetch !== 'undefined') {
      const resp = await fetch(url);
      if (!resp.ok) return {};
      shard = (await resp.json()) as DictionaryShard;
    } else {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      try {
        const content = await fs.readFile(path.resolve(this.basePath, `${bucket}.json`), 'utf-8');
        shard = JSON.parse(content);
      } catch {
        shard = {};
      }
    }
    this._cache.set(bucket, shard);
    return shard;
  }

  async lookup(headwordOrPlain: string): Promise<DictionaryEntry | null> {
    const bucket = this.getBucket(headwordOrPlain);
    const shard = await this.getShard(bucket);
    const key = headwordOrPlain.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');
    return shard[key] || shard[headwordOrPlain] || null;
  }
}
