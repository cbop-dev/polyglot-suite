import type { WorkerHttpvfs, SplitFileConfig, HttpVfsWorkerConfig } from './types.js';

/**
 * Initializes a sql.js-httpvfs database worker instance in the browser.
 * Handles dynamic import, CJS/ESM interop, and JSON config setup.
 */
export async function createHttpVfsWorker(options: HttpVfsWorkerConfig): Promise<WorkerHttpvfs> {
	if (typeof window === 'undefined') {
		throw new Error('Database worker can only be initialized in the browser environment.');
	}

	const sqlHttpvfs = await import('sql.js-httpvfs');
	const createDbWorker =
		(sqlHttpvfs as any).createDbWorker || (sqlHttpvfs as any).default?.createDbWorker;

	if (!createDbWorker) {
		throw new Error('Failed to load createDbWorker from sql.js-httpvfs');
	}

	const { workerUrl, wasmUrl, configUrl, logPrefix = '[DB]' } = options;

	console.info(`${logPrefix} Initializing sql.js-httpvfs worker:`, {
		workerUrl,
		wasmUrl,
		configUrl
	});

	const config: SplitFileConfig = {
		from: 'jsonconfig',
		configUrl
	};

	const worker = await createDbWorker([config], workerUrl, wasmUrl);

	// Serialize all queries across callers to avoid overlapping Web Worker messages,
	// read-head thrashing, and HTTP connection congestion.
	let queryQueue: Promise<unknown> = Promise.resolve();
	const remoteDb = worker.db;

	const serializedQuery = (sql: string, ...params: any[]) => {
		const execute = () => remoteDb.query(sql, ...params);
		const result = queryQueue.then(execute, execute);
		// Keep queue chain resilient against query failures
		queryQueue = result.catch(() => {});
		return result;
	};

	worker.db = new Proxy(remoteDb, {
		get(target, prop, receiver) {
			if (prop === 'query') {
				return serializedQuery;
			}
			return Reflect.get(target, prop, receiver);
		}
	});

	console.info(`${logPrefix} Worker initialized successfully with serialized query queue.`);
	return worker;
}
