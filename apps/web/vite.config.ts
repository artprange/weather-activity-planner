import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const viteConfig = defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			'/graphql': {
				target: 'http://127.0.0.1:4000',
				changeOrigin: true,
			},
		},
	},
});

export default viteConfig;
