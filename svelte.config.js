import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';
import sseServerMiddleware from './src/lib/sseServer.js'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',

		adapter: adapter(),

		vite: {
			// This is to ensure `svelte-kit dev` works.
			plugins: [
				(() => ({
					name: 'configure-server',
					configureServer(server) {
						server.middlewares.use(sseServerMiddleware);
					}
				}))()
			],
		},
	},
};

export default config;
