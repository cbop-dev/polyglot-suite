import { base } from '$app/paths';
import type {
    CorpusDb,
    LexemeMetadata,
    SectionQueryOptions,
    SectionQueryResult,
    RefsResult,
    VerseTextResult,
    BookEntry
} from './types.ts';

/**
 * StaticDatasetProvider manages build-time static JSON datasets for BHS, LXX, and SBLGNT.
 * It provides in-memory caching and zero-latency client-side querying.
 */
export class DatasetProvider {
    private cache: Map<string, any>;

    constructor() {
        /**
         * Cache for loaded JSON data: Map<string, any> where key is `${db}:${file}`
         */
        this.cache = new Map<string, any>();
    }

    /**
     * Normalize database abbreviation: 'lxx', 'bhs', 'sblgnt'
     */
    normalizeDb(db?: string | null): CorpusDb {
        if (!db) return 'lxx';
        const d = String(db).toLowerCase().trim();
        if (d.includes('bhs')) return 'bhs';
        if (d.includes('sbl')) return 'sblgnt';
        return 'lxx';
    }

    /**
     * Load a JSON file for a given dataset, with caching.
     */
    async loadData<T = any>(db: string, name: string): Promise<T> {
        const normalizedDb = this.normalizeDb(db);
        const cacheKey = `${normalizedDb}:${name}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey) as T;
        }

        let data: T;
        if (typeof window === 'undefined') {
            // Server / SSR / Vitest environment: read directly from filesystem
            try {
                const fs = await import('node:fs/promises');
                const path = await import('node:path');
                const filePath = path.resolve(process.cwd(), 'static', 'data', normalizedDb, `${name}.json`);
                const content = await fs.readFile(filePath, 'utf-8');
                data = JSON.parse(content) as T;
            } catch {
                // Fallback to fetch if filesystem is not accessible
                const url = `/data/${normalizedDb}/${name}.json`;
                const res = await fetch(url);
                data = (await res.json()) as T;
            }
        } else {
            // Browser environment: fetch from static assets
            const url = `${base}/data/${normalizedDb}/${name}.json`;
            const res = await fetch(url);
            data = (await res.json()) as T;
        }

        this.cache.set(cacheKey, data);
        return data;
    }

    /**
     * Get lexeme metadata by ID.
     */
    async getLexInfo(db: string, lexId: number | string): Promise<LexemeMetadata | null> {
        const lexemes = await this.loadData<Record<string, LexemeMetadata>>(db, 'lexemes');
        return lexemes[String(lexId)] || null;
    }

    /**
     * Query lexical statistics across sections.
     */
    async querySections(db: string, options: SectionQueryOptions = {}): Promise<SectionQueryResult> {
        const normalizedDb = this.normalizeDb(db);
        const [sectionsData, lexemesData, booksData] = await Promise.all([
            this.loadData<Record<string, any>>(normalizedDb, 'sections'),
            this.loadData<Record<string, LexemeMetadata>>(normalizedDb, 'lexemes'),
            this.loadData<Record<string, BookEntry>>(normalizedDb, 'books')
        ]);

        let sections: (number | string)[] = options.sections && options.sections.length ? [...options.sections] : [];
        if (options.refsText && options.refsText.trim() !== '') {
            try {
                const BibleUtils = await import('$lib/utils/bible-utils.js');
                const refsArray = BibleUtils.expandRefs(options.refsText, true);
                for (const ref of refsArray) {
                    const bcv = BibleUtils.getBookChapVerseFromRef(ref);
                    if (bcv && bcv.book) {
                        const bookName = bcv.book;
                        const bookEntry = Object.values(booksData).find(
                            (b) =>
                                b.abbrev?.toLowerCase() === bookName.toLowerCase() ||
                                b.name?.toLowerCase() === bookName.toLowerCase()
                        );
                        if (bookEntry) {
                            if (bcv.chap && bookEntry.chapters) {
                                const chapNode = Object.entries(bookEntry.chapters).find(
                                    ([, c]) => c === String(bcv.chap)
                                );
                                if (chapNode) {
                                    sections.push(chapNode[0]);
                                }
                            } else if (bookEntry.node !== undefined) {
                                sections.push(bookEntry.node);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('Error expanding refsText in querySections:', e);
            }
        }

        if (sections.length === 0) {
            if (options.refsText && options.refsText.trim() !== '') {
                // User provided refsText but none resolved
                return {
                    totalInstances: 0,
                    totalLexemes: 0,
                    totalWords: 0,
                    lexemes: {}
                };
            }
            // Default to the first book in the dataset
            const firstBookNode = Object.keys(booksData)[0];
            sections = firstBookNode ? [firstBookNode] : [];
        }

        const commonRequested = Boolean(options.common);
        const uniqueRequested = Boolean(options.unique);
        const excludedSet = new Set((options.excludePos || []).map(Number));
        const restrictedSet = new Set((options.restrictPos || []).map(Number));

        let totalWords = 0;
        const counts = new Map<string, number>(); // lexId -> count in selected sections
        const presence = new Map<string, number>(); // lexId -> number of queried sections it appears in

        for (const secNode of sections) {
            const secStr = String(secNode);
            const sec = sectionsData[secStr];
            if (!sec) continue;

            totalWords += sec.words || 0;
            if (sec.lex) {
                for (const [lexIdStr, c] of Object.entries(sec.lex)) {
                    const countNum = Number(c);
                    counts.set(lexIdStr, (counts.get(lexIdStr) || 0) + countNum);
                    presence.set(lexIdStr, (presence.get(lexIdStr) || 0) + 1);
                }
            }
        }

        const validSectionsCount = sections.length;
        const resultLexemes: Record<string, LexemeMetadata> = {};
        const commonLemmas: string[] = [];

        for (const [lexIdStr, count] of counts.entries()) {
            const lexMeta = lexemesData[lexIdStr];
            if (!lexMeta) continue;

            // POS filtering
            const posNum = Number(lexMeta.pos);
            if (excludedSet.has(posNum)) continue;
            if (restrictedSet.size > 0 && !restrictedSet.has(posNum)) continue;

            // Common filter: must appear in every queried section
            const isCommon = presence.get(lexIdStr) === validSectionsCount;
            if (commonRequested && !isCommon) continue;

            // Unique filter: count in section must equal total in whole corpus
            if (uniqueRequested && count !== lexMeta.total) continue;

            const lemma = lexMeta.lemma;
            const posDesc = options.posDict && options.posDict[posNum]
                ? (options.posDict[posNum].desc || options.posDict[posNum].abbrev)
                : String(posNum);

            resultLexemes[lemma] = {
                id: lexMeta.id,
                lemma: lemma,
                gloss: lexMeta.gloss || '',
                count: count,
                pos: posNum,
                posNum: posNum,
                posDesc: posDesc,
                total: lexMeta.total,
                beta: lexMeta.beta || '',
                plain: lexMeta.plain || '',
                strongs: lexMeta.strongs || ''
            };

            if (isCommon) {
                commonLemmas.push(lemma);
            }
        }

        // Apply maxWords limit if specified
        if (options.maxWords && options.maxWords > 0) {
            const sortedEntries = Object.entries(resultLexemes)
                .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                .slice(0, options.maxWords);

            const limitedLexemes: Record<string, LexemeMetadata> = {};
            for (const [k, v] of sortedEntries) {
                limitedLexemes[k] = v;
            }
            return {
                totalWords,
                totalLexemes: sortedEntries.length,
                lexemes: limitedLexemes,
                common: commonRequested ? commonLemmas : undefined
            };
        }

        return {
            totalWords,
            totalLexemes: Object.keys(resultLexemes).length,
            lexemes: resultLexemes,
            common: commonRequested ? commonLemmas : undefined
        };
    }

    /**
     * Get verse concordance and references for a specific lexeme.
     */
    async getRefs(
        db: string,
        lexId: number | string,
        theSections: (number | string)[] | null = null
    ): Promise<RefsResult> {
        const normalizedDb = this.normalizeDb(db);
        const [concData, booksData] = await Promise.all([
            this.loadData<Record<string, any>>(normalizedDb, 'concordance'),
            this.loadData<Record<string, BookEntry>>(normalizedDb, 'books')
        ]);

        const conc = concData[String(lexId)];
        if (!conc) {
            return { total: 0, bookcounts: {}, refs: [], nodes: [] };
        }

        if (!theSections || theSections.length === 0) {
            return {
                total: conc.total,
                bookcounts: conc.bookcounts || {},
                refs: conc.refs || [],
                nodes: conc.nodes || []
            };
        }

        // Build prefix matchers for the specified sections
        const secSet = new Set(theSections.map(String));
        const prefixes: string[] = [];

        for (const [bNode, bInfo] of Object.entries(booksData)) {
            const abbrev = bInfo.abbrev || '';
            if (secSet.has(String(bNode))) {
                // Whole book selected
                prefixes.push(`${abbrev} `);
            } else if (bInfo.chapters) {
                // Check if specific chapters of this book are selected
                for (const [cNode, cNum] of Object.entries(bInfo.chapters)) {
                    if (secSet.has(String(cNode))) {
                        prefixes.push(`${abbrev} ${cNum}:`);
                    }
                }
            }
        }

        const filteredRefs: string[] = [];
        const filteredNodes: number[] = [];
        const filteredBookCounts: Record<string | number, number> = {};

        // Helper to find bookNode from ref abbreviation
        const abbrevToBookNode = new Map<string, number>();
        for (const [bNode, bInfo] of Object.entries(booksData)) {
            if (bInfo.abbrev) {
                abbrevToBookNode.set(bInfo.abbrev, Number(bNode));
            }
        }

        for (let i = 0; i < conc.refs.length; i++) {
            const ref = conc.refs[i] as string;
            const node = conc.nodes[i] as number;

            let matches = false;
            for (const p of prefixes) {
                if (ref.startsWith(p)) {
                    matches = true;
                    break;
                }
            }

            if (matches) {
                filteredRefs.push(ref);
                filteredNodes.push(node);

                const refBookAbbrev = ref.split(' ')[0];
                const bNode = abbrevToBookNode.get(refBookAbbrev);
                if (bNode !== undefined) {
                    filteredBookCounts[bNode] = (filteredBookCounts[bNode] || 0) + 1;
                }
            }
        }

        return {
            total: filteredRefs.length,
            bookcounts: filteredBookCounts,
            refs: filteredRefs,
            nodes: filteredNodes
        };
    }

    /**
     * Get verse text for a given verse sectionID.
     */
    async getText(db: string, sectionID: number | string): Promise<VerseTextResult> {
        const normalizedDb = this.normalizeDb(db);
        const versesData = await this.loadData<Record<string, any>>(normalizedDb, 'verses');
        const v = versesData[String(sectionID)];
        if (v) {
            return {
                id: sectionID,
                section: v.section || '',
                text: v.text || ''
            };
        }
        return {
            id: sectionID,
            section: '',
            text: ''
        };
    }
}

export const staticDatasetProvider = new DatasetProvider();
