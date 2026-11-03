import { base } from '$app/paths';
import { createHttpVfsWorker, type WorkerHttpvfs } from '@polyglot/db-vfs';
import type { AncientCorpusId } from '@polyglot/ancient-languages';

const workerMap = new Map<AncientCorpusId, Promise<WorkerHttpvfs>>();

export function getDbWorker(corpusId: AncientCorpusId): Promise<WorkerHttpvfs> {
	if (typeof window === 'undefined') {
		throw new Error('Database worker can only run in the browser environment.');
	}

	const existing = workerMap.get(corpusId);
	if (existing) {
		return existing;
	}

	const origin = window.location.origin;
	const normalizedBase = base.endsWith('/') ? base : `${base}/`;
	const rootUrl = `${origin}${normalizedBase}`;

	const workerUrl = new URL('sqlite/sqlite.worker.js', rootUrl).toString();
	const wasmUrl = new URL('sqlite/sql-wasm.wasm', rootUrl).toString();
	const configUrl = new URL(`db/${corpusId}/config.json`, rootUrl).toString();

	const promise = createHttpVfsWorker({
		workerUrl,
		wasmUrl,
		configUrl,
		logPrefix: `[ANCIENT-DB:${corpusId.toUpperCase()}]`
	});

	workerMap.set(corpusId, promise);
	return promise;
}

export function resetDbWorker(corpusId?: AncientCorpusId) {
	if (corpusId) {
		workerMap.delete(corpusId);
	} else {
		workerMap.clear();
	}
}
