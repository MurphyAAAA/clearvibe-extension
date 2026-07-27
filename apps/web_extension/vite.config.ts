import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        rollupOptions: {
        input: {
            // 在 Vite 中，直接写相对于 vite.config.ts 的文件名即可
            new_tab: 'index.html' 
        }
        }
    }
});