/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const ppJwt = env.VITE_PP_JWT?.trim();
    const inboxAuthHeaders = ppJwt
        ? { Authorization: `Bearer ${ppJwt}` }
        : { Authorization: 'Basic YWRtaW46' };

    return {
        base: './',
        plugins: [
            react(),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
            // Prevent duplicate React when external packages resolve from root node_modules
            dedupe: ['react', 'react-dom'],
        },
        publicDir: 'public',
        server: {
            port: 3000,
            proxy: {
                '/api/cnma/APPROVAL_SRV': {
                    target: 'http://localhost:4005',
                    changeOrigin: true,
                    headers: inboxAuthHeaders,
                },
                '/api/cnma': {
                    target: 'http://localhost:4005',
                    changeOrigin: true,
                    headers: { Authorization: 'Basic YWRtaW46' },
                },
                '/browse': {
                    target: 'http://localhost:4005',
                    changeOrigin: true,
                    headers: { Authorization: 'Basic YWRtaW46' },
                },
                '/admin': {
                    target: 'http://localhost:4005',
                    changeOrigin: true,
                    headers: { Authorization: 'Basic YWRtaW46' },
                },
                '/odata': {
                    target: 'http://localhost:4005',
                    changeOrigin: true,
                    secure: false,
                    headers: { Authorization: 'Basic YWRtaW46' },
                }
            }
        },
        test: {
            globals: true,
            environment: 'node',
        },
    };
});
