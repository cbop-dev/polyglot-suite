import { base } from '$app/paths';
import type { WorkerHttpvfs } from 'sql.js-httpvfs';
import type { SplitFileConfig } from 'sql.js-httpvfs/dist/sqlite.worker';

let workerPromise: Promise<WorkerHttpvfs> | null = null;

export async function getDbWorker(): Promise<WorkerHttpvfs> {
	if (typeof window === 'undefined') {
		throw new Error('Database worker can only run in the browser.');
	}

	if (workerPromise) {
		return workerPromise;
	}

	workerPromise = (async () => {
		const sqlHttpvfs = await import('sql.js-httpvfs');
		const createDbWorker =
			(sqlHttpvfs as any).createDbWorker || (sqlHttpvfs as any).default?.createDbWorker;

		if (!createDbWorker) {
			throw new Error('Failed to load createDbWorker from sql.js-httpvfs');
		}

		const origin = window.location.origin;
		const normalizedBase = base.endsWith('/') ? base : `${base}/`;
		const rootUrl = `${origin}${normalizedBase}`;

		const workerUrl = new URL('sqlite/sqlite.worker.js', rootUrl).toString();
		const wasmUrl = new URL('sqlite/sql-wasm.wasm', rootUrl).toString();
		const configUrl = new URL('db/config.json', rootUrl).toString();

		console.info('[AF-DB] Initializing sql.js-httpvfs worker:', { workerUrl, wasmUrl, configUrl });
		const config: SplitFileConfig = {
			from: 'jsonconfig',
			configUrl
		};

		const worker = await createDbWorker([config], workerUrl, wasmUrl);
		console.info('[AF-DB] Worker initialized successfully.');
		return worker;
	})();

	return workerPromise;
}

if (typeof window !== 'undefined') {
	getDbWorker().catch((err) => console.warn('[AF-DB] Eager init failed:', err));
}
