/** apps/web_extension/vite.config.ts */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './', // 强制 Vite 使用相对路径引用 JS 和 CSS
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                // 在 Vite 中，直接写相对于 vite.config.ts 的文件名即可
                // 新标签页的挂载点
                new_tab: 'index.html',
                // Popup 的挂载点
                popup: 'src/popup/popup.html'
            }
        }
    }
});