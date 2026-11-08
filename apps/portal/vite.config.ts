import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		port: 5170
	},
	define: {
		__SUITE_VERSION__: JSON.stringify(pkg.version),
		__SUITE_REPO__: JSON.stringify('https://github.com/cbop-dev/polyglot-suite')
	},
});
