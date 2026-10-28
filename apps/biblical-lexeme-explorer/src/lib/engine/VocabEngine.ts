import { staticDatasetProvider } from './StaticDatasetProvider.ts';
import { LexQuery } from '../components/LexQuery.svelte.js';
import { Lexeme, LexStats } from '../Lexeme.js';
import type { VerseTextResult, SectionQueryOptions } from './types.ts';

/**
 * VocabEngine replaces the legacy TF / tf-fast client.
 * It queries build-time static JSON datasets completely client-side.
 */
export class VocabEngine {
    /**
     * Legacy URI helper (kept for compatibility if any code checks it)
     */
    static getURI(db: string): string {
        return `/data/${db}/`;
    }

    /**
     * Fetch lexeme metadata by ID and populate blankLemma
     */
    static async fetchLexInfo(
        lexID: number | string,
        blankLemma: any,
        tfDataOrPosDict: any = {},
        dbabbrev: string = 'lxx'
    ): Promise<void> {
        const isDataset = tfDataOrPosDict && (tfDataOrPosDict.dbAbbrev || tfDataOrPosDict.name);
        const db = isDataset ? (tfDataOrPosDict.dbAbbrev || 'lxx') : dbabbrev;
        const lang = isDataset
            ? (tfDataOrPosDict.lang || (db === 'bhs' ? 'hebrew' : 'greek'))
            : (db === 'bhs' ? 'hebrew' : 'greek');
        const posDict = isDataset ? (tfDataOrPosDict.posDict || {}) : tfDataOrPosDict;
        const totalCorpusWords =
            isDataset && tfDataOrPosDict.lexStats?.totalWords ? tfDataOrPosDict.lexStats.totalWords : 0;

        const lexMeta = await staticDatasetProvider.getLexInfo(db, lexID);
        if (lexMeta) {
            const rawPos = lexMeta.posNum !== undefined ? lexMeta.posNum : lexMeta.pos;
            let posEnum = Number(rawPos);
            if (isNaN(posEnum) && typeof rawPos === 'string') {
                posEnum = Lexeme.getPosEnumFromAbbrev(rawPos);
            }
            if (isNaN(posEnum)) {
                posEnum = Lexeme.PosEnum.UNSPECIFIED;
            }
            const stats = new LexStats(lexMeta.total, totalCorpusWords);

            const foundLex = new Lexeme(
                lexMeta.id,
                lang,
                lexMeta.lemma,
                lexMeta.gloss,
                stats,
                [posEnum],
                lexMeta.beta || '',
                lexMeta.strongs || ''
            ).copy();
            (foundLex as any).posDict = posDict;
            blankLemma.copyFrom(foundLex);
        }
    }

    /**
     * Returns a Promise resolving to Lexeme or null.
     */
    static async fetchLemma(lexID: number | string, tfData?: any): Promise<any | null> {
        const id = Number(lexID);
        const lemma = new Lexeme();
        if (id >= 0) {
            await VocabEngine.fetchLexInfo(id, lemma, tfData);
            return lemma.id == id ? lemma : null;
        }
        return null;
    }

    /**
     * Query lexemes for sections with filtering options.
     */
    static async fetchLexemes(
        query: any,
        showGloss: boolean = true,
        tfDataOrPosDict: any = {},
        dbabbrev: string = 'lxx'
    ): Promise<void> {
        query.ready = false;
        query.sent = true;

        const isDataset = tfDataOrPosDict && (tfDataOrPosDict.dbAbbrev || tfDataOrPosDict.name);
        const db = isDataset ? (tfDataOrPosDict.dbAbbrev || 'lxx') : dbabbrev;
        const lang = isDataset
            ? (tfDataOrPosDict.lang || (db === 'bhs' ? 'hebrew' : 'greek'))
            : (db === 'bhs' ? 'hebrew' : 'greek');
        const posDict = isDataset ? (tfDataOrPosDict.posDict || {}) : tfDataOrPosDict;
        const totalCorpusWords =
            isDataset && tfDataOrPosDict.lexStats?.totalWords ? tfDataOrPosDict.lexStats.totalWords : 0;

        const options: SectionQueryOptions = {
            sections: query.sections,
            refsText: query.refsText || '',
            common: query.common,
            unique: query.unique,
            excludePos: query.filter?.getExcluded ? query.filter.getExcluded() : [],
            restrictPos: query.filter?.getRestricted ? query.filter.getRestricted() : [],
            maxWords: query.filter?.maxWords || 0,
            posDict: posDict
        };

        const resultObj = await staticDatasetProvider.querySections(db, options);
        query.response = resultObj;

        query.results.lexemeArray =
            query.common && query.response.common
                ? query.response.common
                      .map((g: string) => {
                          const lex = query.response.lexemes[g];
                          if (!lex) return null;
                          const stats = new LexStats(
                              lex.total,
                              totalCorpusWords,
                              lex.count,
                              query.response.totalWords
                          );
                          const rawPos = lex.posNum !== undefined ? lex.posNum : lex.pos;
                          let posEnum = Number(rawPos);
                          if (isNaN(posEnum) && typeof rawPos === 'string') {
                              posEnum = Lexeme.getPosEnumFromAbbrev(rawPos);
                          }
                          if (isNaN(posEnum)) {
                              posEnum = Lexeme.PosEnum.UNSPECIFIED;
                          }
                          const newLex = new Lexeme(
                              lex.id,
                              lang,
                              g,
                              showGloss ? lex.gloss : '',
                              stats,
                              [posEnum],
                              lex.beta || '',
                              lex.strongs || ''
                          );
                          (newLex as any).posDict = posDict;
                          return newLex;
                      })
                      .filter(Boolean)
                : Object.entries(query.response.lexemes || {}).map(([g, lex]: [string, any]) => {
                      const stats = new LexStats(
                          lex.total,
                          totalCorpusWords,
                          lex.count,
                          query.response.totalWords
                      );
                      const rawPos = lex.posNum !== undefined ? lex.posNum : lex.pos;
                      let posEnum = Number(rawPos);
                      if (isNaN(posEnum) && typeof rawPos === 'string') {
                          posEnum = Lexeme.getPosEnumFromAbbrev(rawPos);
                      }
                      if (isNaN(posEnum)) {
                          posEnum = Lexeme.PosEnum.UNSPECIFIED;
                      }
                      const newLex = new Lexeme(
                          lex.id,
                          lang,
                          g,
                          showGloss ? lex.gloss : '',
                          stats,
                          [posEnum],
                          lex.beta || '',
                          lex.strongs || ''
                      );
                      (newLex as any).posDict = posDict;
                      return newLex;
                  });

        query.results.avgSectionLexCount =
            query.response.totalLexemes > 0
                ? query.response.totalWords / query.response.totalLexemes
                : 0;

        query.makeReady();
    }

    /**
     * Get verse text for a section/verse ID.
     */
    static async fetchText(sectionID: number | string, dbabbrev: string = 'lxx'): Promise<VerseTextResult> {
        return await staticDatasetProvider.getText(dbabbrev, sectionID);
    }

    /**
     * Get references and concordance for a lexeme.
     */
    static async fetchRefs(
        lexID: number | string,
        theSections: (number | string)[] | null = null,
        lexRefQuery: any,
        dbabbrev: string = 'lxx'
    ): Promise<void> {
        if (!lexRefQuery) return;
        if (theSections) {
            lexRefQuery.sections = theSections;
        }
        lexRefQuery.sent = true;

        const res = await staticDatasetProvider.getRefs(dbabbrev, lexID, theSections);
        lexRefQuery.response = {
            ref: res.refs,
            refs: res.refs,
            nodes: res.nodes,
            bookcounts: res.bookcounts,
            total: res.total
        };

        lexRefQuery.results.refs = res.refs;
        lexRefQuery.results.bookCounts = res.bookcounts;
        lexRefQuery.makeReady();
    }
}

// Backward compatibility alias for TF
export const TF = VocabEngine;
export default VocabEngine;
