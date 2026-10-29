/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import { startupRecoveryPlugin } from './scripts/startupRecoveryPlugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const ppJwt = env.VITE_PP_JWT?.trim();
    const inboxAuthHeaders: Record<string, string> = ppJwt
        ? { Authorization: `Bearer ${ppJwt}` }
        : {};

    return {
        base: './',
        plugins: [
            react(),
            tailwindcss(),
            startupRecoveryPlugin(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
            // Prevent duplicate React when external packages resolve from root node_modules
            dedupe: ['react', 'react-dom'],
        },
        publicDir: 'public',
        build: {
            rollupOptions: {
                output: {
                    experimentalMinChunkSize: 15_000,
                    manualChunks(id) {
                        if (id.includes('commonjsHelpers')) {
                            return 'vendor-react';
                        }
                        if (!id.includes('node_modules')) return undefined;
                        if (
                            id.includes('/recharts/') ||
                            id.includes('\\recharts\\') ||
                            id.includes('/d3-') ||
                            id.includes('\\d3-') ||
                            id.includes('/victory-vendor/') ||
                            id.includes('\\victory-vendor\\') ||
                            id.includes('/decimal.js-light/') ||
                            id.includes('\\decimal.js-light\\')
                        ) {
                            return 'vendor-charts';
                        }
                        if (
                            id.includes('/react/') ||
                            id.includes('\\react\\') ||
                            id.includes('/react-dom/') ||
                            id.includes('\\react-dom\\') ||
                            id.includes('/scheduler/') ||
                            id.includes('\\scheduler\\') ||
                            id.includes('/react-router') ||
                            id.includes('\\react-router') ||
                            id.includes('/@tanstack/react-query') ||
                            id.includes('\\@tanstack\\react-query') ||
                            id.includes('/clsx/') ||
                            id.includes('\\clsx\\')
                        ) {
                            return 'vendor-react';
                        }
                        if (
                            id.includes('/@cnma/react-ui/') ||
                            id.includes('\\@cnma\\react-ui\\') ||
                            id.includes('/@radix-ui/') ||
                            id.includes('\\@radix-ui\\') ||
                            id.includes('/radix-ui/') ||
                            id.includes('\\radix-ui\\') ||
                            id.includes('/framer-motion/') ||
                            id.includes('\\framer-motion\\') ||
                            id.includes('/lucide-react/') ||
                            id.includes('\\lucide-react\\') ||
                            id.includes('/vaul/') ||
                            id.includes('\\vaul\\') ||
                            id.includes('/react-day-picker/') ||
                            id.includes('\\react-day-picker\\') ||
                            id.includes('/date-fns/') ||
                            id.includes('\\date-fns\\') ||
                            id.includes('/tailwind-merge/') ||
                            id.includes('\\tailwind-merge\\') ||
                            id.includes('/class-variance-authority/') ||
                            id.includes('\\class-variance-authority\\')
                        ) {
                            return 'vendor-ui';
                        }
                        return undefined;
                    },
                },
            },
        },
        server: {
            port: 3000,
            proxy: {
                '/api/cnma/APPROVAL_SRV': {
                    target: 'http://127.0.0.1:4005',
                    changeOrigin: true,
                    headers: inboxAuthHeaders,
                },
                '/api/cnma': {
                    target: 'http://127.0.0.1:4005',
                    changeOrigin: true,
                    headers: inboxAuthHeaders,
                },
                '/browse': {
                    target: 'http://127.0.0.1:4005',
                    changeOrigin: true,
                    headers: inboxAuthHeaders,
                },
                '/admin': {
                    target: 'http://127.0.0.1:4005',
                    changeOrigin: true,
                    headers: inboxAuthHeaders,
                },
                '/odata': {
                    target: 'http://127.0.0.1:4005',
                    changeOrigin: true,
                    secure: false,
                    headers: inboxAuthHeaders,
                }
            }
        },
        test: {
            globals: true,
            environment: 'node',
        },
    };
});
