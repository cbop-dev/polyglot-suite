export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v.?';
import { getBaseurl } from '$lib/utils/ui-utils';
import { createHttpVfsWorker, type WorkerHttpvfs } from '@polyglot/db-vfs';

let workerPromise: Promise<WorkerHttpvfs> | null = null;

/**
 * Returns the singleton sql.js-httpvfs database worker instance.
 * Lazily loads the worker and wasm assets upon first call via @polyglot/db-vfs.
 */
export async function getDbWorker(): Promise<WorkerHttpvfs> {
	if (typeof window === 'undefined') {
		throw new Error('Database worker can only be initialized in the browser environment.');
	}

	if (workerPromise) {
		return workerPromise;
	}

	// Resolve URLs relative to window.location and SvelteKit base path
	const baseUrl = getBaseurl();
	const workerUrl = new URL('sqlite/sqlite.worker.js', baseUrl).toString();
	const wasmUrl = new URL('sqlite/sql-wasm.wasm', baseUrl).toString();
	const configUrl = new URL(`db/config.json${APP_VERSION ? '?v=' + APP_VERSION : ''}`, baseUrl).toString();

	workerPromise = createHttpVfsWorker({
		workerUrl,
		wasmUrl,
		configUrl,
		logPrefix: '[DB]'
	});

	return workerPromise;
}

if (typeof window !== 'undefined') {
	// Start worker & wasm download immediately on script evaluation
	getDbWorker().catch((err) => console.warn('[DB] Eager init failed:', err));
}