import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

export interface SqliteVfsPluginOptions {
	/** Custom path to the directory containing sqlite.worker.js and sql-wasm.wasm */
	assetsDir?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ASSETS_DIR = path.resolve(__dirname, '../assets/sqlite');

/**
 * Vite plugin for @polyglot/db-vfs:
 * 1. Automatically intercepts and serves `/sqlite/sqlite.worker.js` and `/sqlite/sql-wasm.wasm`
 *    directly from @polyglot/db-vfs during development (`vite dev`) and preview (`vite preview`).
 * 2. Emits `sqlite.worker.js` and `sql-wasm.wasm` as client assets during production build (`vite build`).
 * 3. Injects the `Accept-Ranges: bytes` header across all responses, enabling byte-range queries
 *    for chunked SQLite database files in dev and preview.
 */
export function sqliteVfsPlugin(options?: SqliteVfsPluginOptions): Plugin {
	const assetsDir = options?.assetsDir || DEFAULT_ASSETS_DIR;
	const workerFile = path.join(assetsDir, 'sqlite.worker.js');
	const wasmFile = path.join(assetsDir, 'sql-wasm.wasm');

	function handleSqliteRequest(req: any, res: any, next: () => void): boolean {
		const rawUrl = req.url || '';
		const urlPath = rawUrl.split('?')[0];

		// Ensure Accept-Ranges is always set for byte-range database queries
		res.setHeader('Accept-Ranges', 'bytes');

		if (urlPath.endsWith('/sqlite/sqlite.worker.js') || urlPath === '/sqlite.worker.js') {
			if (fs.existsSync(workerFile)) {
				res.setHeader('Content-Type', 'application/javascript');
				res.setHeader('Cache-Control', 'no-cache');
				res.end(fs.readFileSync(workerFile));
				return true;
			}
		}

		if (urlPath.endsWith('/sqlite/sql-wasm.wasm') || urlPath === '/sql-wasm.wasm') {
			if (fs.existsSync(wasmFile)) {
				res.setHeader('Content-Type', 'application/wasm');
				res.setHeader('Cache-Control', 'no-cache');
				res.end(fs.readFileSync(wasmFile));
				return true;
			}
		}

		next();
		return false;
	}

	return {
		name: 'polyglot-sqlite-vfs-plugin',

		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				handleSqliteRequest(req, res, next);
			});
		},

		configurePreviewServer(server) {
			server.middlewares.use((req, res, next) => {
				handleSqliteRequest(req, res, next);
			});
		},

		generateBundle() {
			if (fs.existsSync(workerFile)) {
				this.emitFile({
					type: 'asset',
					fileName: 'sqlite/sqlite.worker.js',
					source: fs.readFileSync(workerFile)
				});
			}

			if (fs.existsSync(wasmFile)) {
				this.emitFile({
					type: 'asset',
					fileName: 'sqlite/sql-wasm.wasm',
					source: fs.readFileSync(wasmFile)
				});
			}
		},

		closeBundle() {
			// Redundant safety copy into known adapter output directories if they exist
			const candidateDirs = [
				process.env.BUILD_DIR,
				'build/www',
				'build/github',
				'build/node',
				'dist'
			].filter(Boolean) as string[];

			for (const dir of candidateDirs) {
				const resolvedDir = path.resolve(process.cwd(), dir);
				if (fs.existsSync(resolvedDir)) {
					const targetSqliteDir = path.join(resolvedDir, 'sqlite');
					if (!fs.existsSync(targetSqliteDir)) {
						fs.mkdirSync(targetSqliteDir, { recursive: true });
					}

					const targetWorker = path.join(targetSqliteDir, 'sqlite.worker.js');
					if (!fs.existsSync(targetWorker) && fs.existsSync(workerFile)) {
						fs.copyFileSync(workerFile, targetWorker);
					}

					const targetWasm = path.join(targetSqliteDir, 'sql-wasm.wasm');
					if (!fs.existsSync(targetWasm) && fs.existsSync(wasmFile)) {
						fs.copyFileSync(wasmFile, targetWasm);
					}
				}
			}
		}
	};
}

export default sqliteVfsPlugin;
