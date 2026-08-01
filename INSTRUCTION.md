Agent 无需阅读，修改本文件。

编译
```bash
npx vite build apps/web_extension/
```
生成 dist/ 

---

pnpm
```bash
pnpm run build

# 等价与 pnpm build
# run 会自动补充
```
由于根目录的 package.json 已经配好了 "build": "pnpm --filter @clear-vibe/web_extension build"，你现在只需简单敲 pnpm run build 即可

现在不需要传入路径了，利用的是Monorepo的包名陆游机制

在根目录使用 `pnpm run build`，会发生以下情况：
1. pnpm会查看根目录的package.json 中的 scripts,找到了 build 指令。
2. pnpm 会通过 --filter 过滤定位
    - --filter @clear-vibe/web_extension 的意思是：“请在整个工作区（apps/ 和 packages/）里找到 package.json 中 "name": "@clear-vibe/web_extension" 的那个子项目”。
3. pnpm会自动切换到子项目 apps/web_extension/ 目录下，并执行该子包 package.json 里定义好的 "build" 脚本："build": "vite build"
4. 因为 vite build 是在 apps/web_extension/ 目录下被调用的，Vite 会自动加载当前目录下的 vite.config.ts。
vite.config.ts 里写了打包入口是 index.html 和 src/popup/popup.html，Vite 就会把打包好的产物统统输出到 apps/web_extension/dist/。


---

