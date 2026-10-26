import { mylog } from '$lib/env/env.js'
import { json } from '@sveltejs/kit';
import { LexAppOptions,URLParam,getRequestParamsObj } from '$lib/options/urlOptions.js';
//import { goto } from '$app/navigation';


export const prerender = true;

export function entries() {
	return [
		{ tfdata: 'lxx' },
		{ tfdata: 'bhs' },
		{ tfdata: 'sblgnt' }
	];
}

export async function load({ url, params }) {
	mylog(`load(): ${url.searchParams.get("panel")}`);
//    mylog(`load[bible/tfdata]: ${params.tfdata}`,true)
  /**
   *
   */
  //const theOpts = getRequestParamsObj2(url.searchParams);
  //mylog(theOpts)
 // mylog(`Server got options type:${typeof theOpts}`, true)
  //mylog(theOpts);
  /**
   * @type {LexAppOptions}
   */
  const myoptions=LexAppOptions.fromURLParams(getRequestParamsObj(url.searchParams));
  //goto(url.pathname,{replaceState:true});
  //mylog("+page.js: options-- similarPhrases="+myoptions.viewOptions.similarPhrases)
  return {options: myoptions,tfdataName:params.tfdata}
}
