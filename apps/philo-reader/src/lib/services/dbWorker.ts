import { base } from '$app/paths';
import { createHttpVfsWorker, type WorkerHttpvfs } from '@polyglot/db-vfs';

let workerPromise: Promise<WorkerHttpvfs> | null = null;

export async function getDbWorker(): Promise<WorkerHttpvfs> {
	if (typeof window === 'undefined') {
		throw new Error('Database worker can only run in the browser.');
	}

	if (workerPromise) {
		return workerPromise;
	}

	const origin = window.location.origin;
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const rootUrl = `${origin}${normalizedBase}`;

	const workerUrl = new URL('sqlite/sqlite.worker.js', rootUrl).toString();
	const wasmUrl = new URL('sqlite/sql-wasm.wasm', rootUrl).toString();
	const configUrl = new URL('db/config.json', rootUrl).toString();

	workerPromise = createHttpVfsWorker({
		workerUrl,
		wasmUrl,
		configUrl,
		logPrefix: '[PHILO-DB]'
	});

	return workerPromise;
}

if (typeof window !== 'undefined') {
	getDbWorker().catch((err) => console.warn('[PHILO-DB] Eager init failed:', err));
}
