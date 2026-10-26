import { LexAppOptions, getRequestParamsObj } from '$lib/options/urlOptions.js';

export const prerender = true;

export async function load({ url }) {
	const myoptions = LexAppOptions.fromURLParams(getRequestParamsObj(url.searchParams));
	return { options: myoptions };
}
