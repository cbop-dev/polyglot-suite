export const prerender = true;

/** @type {import('./$types').PageLoad} */
export function load({ url }) {
    const sections = url.searchParams.getAll('sections');
    const refs = url.searchParams.getAll('refs');
    return { sections, refs };
}