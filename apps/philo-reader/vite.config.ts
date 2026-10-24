import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { sqliteVfsPlugin } from '@polyglot/db-vfs/vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		sqliteVfsPlugin()
	],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__APP_REPO__: JSON.stringify('https://github.com/cbop-dev/polyglot-suite/tree/main/apps/philo-reader')
	}
});
