import { build, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/** Build the recovery UI without sharing the potentially broken app chunks. */
export function startupRecoveryPlugin(): Plugin {
    return {
        name: 'cnma-startup-recovery',
        apply: 'build',
        async closeBundle() {
            await build({
                configFile: false,
                base: './',
                publicDir: false,
                define: { 'process.env.NODE_ENV': JSON.stringify('production') },
                plugins: [react(), tailwindcss()],
                resolve: {
                    alias: { '@': path.resolve('src') },
                    dedupe: ['react', 'react-dom'],
                },
                build: {
                    outDir: 'dist',
                    emptyOutDir: false,
                    lib: {
                        entry: path.resolve('src/startupRecovery.tsx'),
                        name: 'CNMAStartupRecovery',
                        formats: ['iife'],
                        fileName: () => 'startup-recovery.js',
                        cssFileName: 'startup-recovery',
                    },
                    rollupOptions: { output: { inlineDynamicImports: true } },
                },
            });
        },
    };
}
