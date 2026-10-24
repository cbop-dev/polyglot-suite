import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sqliteVfsPlugin } from '@polyglot/db-vfs/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		sqliteVfsPlugin()
	]
});
