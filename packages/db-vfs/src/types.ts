import type { WorkerHttpvfs } from 'sql.js-httpvfs';
import type { SplitFileConfig } from 'sql.js-httpvfs/dist/sqlite.worker';

export type { WorkerHttpvfs, SplitFileConfig };

export interface HttpVfsWorkerConfig {
	workerUrl: string;
	wasmUrl: string;
	configUrl: string;
	logPrefix?: string;
}
