import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	base: '/js-game-tf-lang-run/',
	plugins: [react()],
	build: {
		rolldownOptions: {
			output: {
				// Babylon engine modules contain circular inheritance paths; keep them in one production chunk.
				codeSplitting: false,
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	optimizeDeps: {
		exclude: ['@babylonjs/havok'],
	},
});
