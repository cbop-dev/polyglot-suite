import {test,expect} from 'vitest'
import * as obj from '$lib/lxx/lxxLexes6.json' with {type: 'json'};

test('test',()=>{
// expect(obj.lex.length > 1000).toBe(true);
//console.debug(Object.keys(obj));
expect(Object.keys(obj.greek).length > 14000).toBe(true);
 expect(true).toBe(true);
})
   