export const prerender = true;

export function entries() {
	return [
		{ db: 'lxx' },
		{ db: 'bhs' },
		{ db: 'sblgnt' }
	];
}

const defaultDB='lxx'

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	const theDB= params.db ? params.db : defaultDB;
    
    return {
            db: params.db
    };
}