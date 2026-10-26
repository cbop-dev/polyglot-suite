export const prerender = true;

export function entries() {
	return [
		{ tfdata: 'lxx' },
		{ tfdata: 'bhs' },
		{ tfdata: 'sblgnt' }
	];
}

export async function load({ params }) {
	return { tfdataName: params.tfdata };
}
