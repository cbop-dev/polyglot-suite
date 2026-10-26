import {TF} from './TF.js';
import { Lexeme,LexStats } from './Lexeme.js';
import { TfDataset } from './data/VocabDataset.js';
import { LexQuery } from './components/LexQuery.svelte.js';
import { mylog } from './env/env.js';


export class LexRefQueries{
    /**
     * @type {number[]} sections
     * @description Node ids of books/chapters, etc., in the TF dataset
     */
    sections=$state([]);
    /**
     * @type {Object<number,LexQuery>} corpusRefsQueries
     */
    corpusRefsQueries=$state({});

    /**
     * @type {Object<number,LexQuery>} sectionRefsQueries
     */
    sectionRefsQueries=$state({});

    

    /**
     * 
     * @param {TfDataset} tfData 
     * @param {number[]} sections 
     */
    constructor(tfData,sections=[]){
        this.tfData = $state(tfData);
        this.sections=sections;
    }

    /**
	 * @param {Lexeme} lex
	*/
	async checkGetLemmaRefs(lex){

		if (!Object.keys(this.corpusRefsQueries).includes(lex.id.toString())
			|| !Object.keys(this.sectionRefsQueries).includes(lex.id.toString()) ||
		!this.corpusRefsQueries[lex.id].ready ||!this.sectionRefsQueries[lex.id]?.ready
		)
		{
			this.corpusRefsQueries[lex.id]=new LexQuery();
            this.sectionRefsQueries[lex.id]=new LexQuery();
			this.fetchLemmaRefs(lex);
		}
		else{
//			mylog(`checkGetLemmaRefs('${lex.lemma}:${lex.id}') did no query!`, true);
		}
	}
	/**
	 * @description fetches the refs of lemma, and optionally calculates books stats (modifies/updates lex.bookStats)
	 * @param {Lexeme} lex
	 * @param {boolean} [calcBookStats=true] 
	*/
	async fetchLemmaRefs(lex,calcBookStats=true){
//		mylog(`Fetching lemma refs for ${lex.lemma}(${lex.id})`, true);
		const sectionQuery=new LexQuery(this.sections);
		const corpusQuery=new LexQuery();
		if (this.sections.length>0){
            TF.fetchRefs(lex.id, this.sections, sectionQuery, this.tfData.dbAbbrev,false).then(()=>{
			this.sectionRefsQueries[lex.id]=sectionQuery;
			sectionQuery.ready=true;
		    });
		}
        else{
//            mylog("fetchLemmaRefs: no sections!", true);
        }
		TF.fetchRefs(lex.id, null, corpusQuery, this.tfData.dbAbbrev,true).then(()=>{
			this.corpusRefsQueries[lex.id]=corpusQuery;
			if (calcBookStats){
				
				Object.entries(corpusQuery.results.bookCounts ).forEach(([bookId, theBookCount]) => {
                    const theBookId = parseInt(bookId);
                    //mylog(`fetchRefs: adding book info for book ${theBookId}: count=${theBookCount}`,true);
                    lex.stats
						.addAndCalcBookSectionStatsIfNeeded('book',
							theBookId,
							theBookCount,
							this.tfData.booksDict.books[theBookId].words,
							lex.stats.total,
							this.tfData.lexStats.totalWords,
							true);
                });
			

			}
			
							
			corpusQuery.ready=true;
		});
			
	}
    
}