import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

function acceptRangesPlugin(): Plugin {
	return {
		name: 'accept-ranges-plugin',
		configureServer(server) {
			server.middlewares.use((_req, res, next) => {
				res.setHeader('Accept-Ranges', 'bytes');
				next();
			});
		},
		configurePreviewServer(server) {
			server.middlewares.use((_req, res, next) => {
				res.setHeader('Accept-Ranges', 'bytes');
				next();
			});
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		acceptRangesPlugin()
	]
});
