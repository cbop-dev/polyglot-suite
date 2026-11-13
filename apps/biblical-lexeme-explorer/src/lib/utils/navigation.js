import * as bibleUtils from './bible-utils.js';
import {getReaderVerseUrl} from '@polyglot/ui/navigation';

export {getReaderVerseUrl};

/**
 * Generates a deep link URL into the Polyglot Bible Reader for a given reference and database.
 * @param {string} refString - Biblical reference string (e.g. "Gen 1:1", "Exod 3:14", "Matt 5:3")
 * @param {string} [dbAbbrev='lxx'] - Corpus identifier ('lxx', 'bhs', or 'sblgnt')
 * @returns {string} URL to polyglot-bible-reader
 */
