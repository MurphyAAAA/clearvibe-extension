/** apps/web_extension/vite.config.ts */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

export default defineConfig({
    // Manifest 是扩展入口的唯一来源；CRXJS 负责打包与开发热更新。
    plugins: [react(), crx({ manifest })],
    base: './', // 强制 Vite 使用相对路径引用 JS 和 CSS
    build: {
        outDir: 'dist'
    }
});
