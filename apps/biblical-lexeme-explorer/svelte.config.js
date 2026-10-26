import { mdsvex } from 'mdsvex';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapterType = process.env.ADAPTER || 'node';
const isGitHub = adapterType === 'gh' || adapterType === 'github';
const isStatic = isGitHub || adapterType === 'static';

let defaultOutDir = 'build/node';
if (isGitHub) {
	defaultOutDir = 'build/github';
} else if (isStatic) {
	defaultOutDir = 'build/www';
}

const outDir = process.env.BUILD_DIR || defaultOutDir;
const defaultBase = isGitHub ? '/biblical-lexeme-explorer' : '';
const basePath = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : defaultBase;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isStatic
			? adapterStatic({
					pages: outDir,
					assets: outDir,
					fallback: '404.html',
					precompress: false,
					strict: false
			  })
			: adapterNode({
					out: outDir,
					precompress: false
			  }),
		paths: {
			base: basePath
		}
	},

	preprocess: [mdsvex(), vitePreprocess()],
	extensions: ['.svelte', '.svx']
};

export default config;
