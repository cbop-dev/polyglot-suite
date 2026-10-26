import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.deploy (root suite first, then app-local) so PUBLIC_* vars are always available
for (const envPath of [resolve(import.meta.dirname, '../../.env.deploy'), resolve(import.meta.dirname, '.env.deploy')]) {
	if (existsSync(envPath)) {
		const content = readFileSync(envPath, 'utf-8');
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq !== -1) {
				const k = trimmed.slice(0, eq).trim();
				let v = trimmed.slice(eq + 1).trim();
				if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
					v = v.slice(1, -1);
				}
				if (process.env[k] === undefined) {
					process.env[k] = v;
				}
			}
		}
	}
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
	plugins: [
		sveltekit()
	],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__APP_REPO__: JSON.stringify(pkg.repository?.url || pkg.repository || 'https://github.com/cbop-dev/biblical-lexeme-explorer')
	},
	envDir: '../../',
	envPrefix: ['VITE_', 'PUBLIC_'],
	server: {
		port: 5174,
		fs: {
			allow: ['.', '../../packages']
		}
	},
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}']
	}
});
