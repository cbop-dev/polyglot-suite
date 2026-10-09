import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapterType = process.env.ADAPTER || process.env.BUILD_TARGET || '';
const isStatic = adapterType === 'static' || adapterType === 'www' || adapterType === 'github';

let defaultOutDir = isStatic ? 'build/www' : 'build/node';
const outDir = process.env.BUILD_DIR || defaultOutDir;
const basePath = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter({
			pages: outDir,
			assets: outDir,
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: basePath
		}
	}
};

export default config;
