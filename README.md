# clearvibe-extension - 产品说明与开发契约
## 基础配置
### 构建包
本项目使用 **pnpm workspace** 管理依赖。根目录已包含 `package.json`、`pnpm-workspace.yaml` 和 `pnpm-lock.yaml`，因此克隆项目后**不要**再执行 `npm init`，也不要混用 npm 或生成 `package-lock.json`。

#### 环境要求

- Node.js：`^20.19.0` 或 `>=22.12.0`（当前 Vite 8 的要求）。建议安装 [Node.js LTS](https://nodejs.org/en/download) 的 Windows Installer，并在安装完成后关闭、重新打开 PowerShell，使 PATH 更新生效。
- pnpm：执行 `pnpm --version` 确认可用。

在 Windows 上完成 Node.js LTS 安装并重新打开 PowerShell 后，依次执行：

```bash
# 确认 Node.js 已升级到项目所需版本
node --version

# 安装 pnpm 11（本项目当前使用 pnpm 11 生成锁文件）
npm install --global pnpm@11

# 确认 pnpm 已加入 PATH
pnpm --version
```

若 `node --version` 仍显示旧版本或 `pnpm` 仍提示“未识别”，请关闭所有 PowerShell 窗口后重新打开；仍无效时，重启 Windows 后再检查。不要在 Node.js 16 环境中安装或构建本项目。

#### 安装依赖与构建

在项目根目录执行：

```bash
# 按 pnpm-lock.yaml 安装全部 workspace 依赖
pnpm install --frozen-lockfile

# 构建浏览器扩展
pnpm run build
```

#### 可选：网页 UI 预览

```bash
# 启动 apps/web_extension 的本地 Vite 开发服务器；不会生成 dist
pnpm run dev
```

该命令通常会在 `http://localhost:5173` 启动普通网页服务器（端口被占用时会自动改用其他端口）：浏览器访问页面时，Vite 按需编译 TypeScript/React，并在修改页面代码后自动刷新。这只适合预览不依赖扩展 API 的 UI，不能代替扩展调试；它不会执行构建，也不会生成可加载的扩展包。

#### 在 Chrome 中调试扩展

需要验证 Popup、新标签页或 `chrome.storage` 等扩展 API 时，每次修改后执行：

```bash
pnpm run build
```

然后打开 `chrome://extensions`，开启“开发者模式”，点击“加载已解压的扩展程序”，选择 `apps/web_extension/dist`。之后每次重新构建，回到该页面点击扩展的刷新按钮，再测试更新后的功能。当前 Vite 配置未集成扩展专用的热更新插件，因此 `pnpm run dev` 不会自动更新已加载的 Chrome 扩展。

仅在需要新增依赖时才使用 `pnpm add`（运行时依赖）或 `pnpm add -D`（开发依赖）；已有依赖无需重复安装。

`pnpm build` 与 `pnpm run build` 等价，前者是 pnpm 对同名脚本提供的简写(指令运行时会自动补充 run)。为明确表示正在执行 `package.json` 中的脚本，本文档统一使用 `pnpm run <脚本名>`。

### 修改 package.json
Node.js 默认把项目当成老式的 CommonJS 模块（使用 require()）。但是，我们的架构基于 Vite + React，并且 TS 开启了 verbatimModuleSyntax，这要求项目必须是现代的 ECMAScript 模块（ESM，使用 import/export）。
操作步骤：
打开根目录的 `package.json`，在最外层设置 `"type": "module"`。pnpm 的 workspace 范围由根目录的 `pnpm-workspace.yaml` 配置，而不是 `package.json` 的 `workspaces` 字段。

`package.json` 中应包含：
```json
{
  // 其他 ...

  "main": "index.js",
  "type": "module",
  
  // 其他 ...
}
```

`pnpm-workspace.yaml` 应配置为：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 调整 tsconfig
在 Vite 环境下，项目是由 Bundler（打包器）来处理模块的，而不是由 Node.js 直接运行的。NodeNext 标准会强制进行非常复杂的 CommonJS/ESM 校验，导致 export class 被误判。
修复步骤：
我们需要把 TypeScript 的模块解析策略切换为现代前端 Vite 专用的 "bundler" 模式。这不仅能彻底解决这个报错，还能让你在写 import 语句时不需要加上扩展名（如 .ts 或 .js）。
tsconfig.json，修改 "compilerOptions" 中的以下两行：
```json
{
  "compilerOptions": {
    // 1. 将 "module": "nodenext" 改为：
    "module": "ESNext",
    
    // 2. 新增下面这一行，告诉 TS 我们使用 Vite 等现代打包工具：
    "moduleResolution": "bundler",

    // ... 保持其他配置不变 ...
    "target": "esnext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["chrome"],
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    // ...
  }
}
```
修改完 tsconfig.json 后，由于 VSCode 等编辑器的 TypeScript 服务器有缓存，有时候不会立刻生效。
如果你用的是 VSCode：请按下 Ctrl + Shift + P (Mac 是 Cmd + Shift + P)，输入 Restart TS Server (重启 TS 服务器)，点击执行。或者直接关掉 VSCode 重新打开。

## 0. 文档边界与角色定义 (Document Boundary)

在阅读或参与本项目开发之前，请务必明确本文档（`README.md`）的定位：

*   **`README.md` (本文档) 的角色**：**解释“是什么” (What) 与“怎么做” (How to develop)**。本文档聚焦于产品功能定义、用户场景 (User Cases)、演进路线，以及针对当前技术栈（React + Vite + MV3）的具体开发规约与契约。
*   **与其他文档的边界**：关于项目物理目录树是如何划分的、为何采用 Monorepo 结构以及依赖注入的底层架构哲学，**严禁在本文档中赘述**，请移步阅读 `ARCHITECTURE.md`。

## 1.1 核心功能详述平：是一款极简的沉浸式浏览器美化扩展。
**核心场景**：用户上传一张本地高清图片，插件接管浏览器的“新标签页”以及“Google 搜索结果页”。

*   **功能一：沉浸式氛围背景 (Ambient Background)**
    *   **机制**：用户可上传一张高清图片作为全局背景。
    *   **视觉效果（核心亮点）**：通过特定的渲染逻辑处理图片。页面的中央（如搜索框、内容展示区）呈高度透明，确保用户能看清交互内容，专注当前工作内容；从中央向屏幕四周，透明度逐渐降低；到达屏幕边缘时，展示完全清晰的图片原貌。即**“中央透明，四周清晰的平滑过渡”**。形成一种完美的过渡氛围。
*   **功能二：跨页面的视觉统一 (Unified Search Vibe)**
    *   不仅接管浏览器的**新标签页 (New Tab Page)** 提供纯净搜索入口，更将同样的视觉遮罩与背景效果无缝注入到 **Google 搜索结果页 (Google.com)**，确保从搜索到浏览结果的视觉体验完全一致。
*   **功能三：极简配置面板 (Minimalist Settings)**
    *   通过扩展图标的 Popup 弹出面板，提供极简的操作：上传/更换背景图、实时拖拽调节中央区域的“透明度”与“过渡范围”。

*   **后续扩展**：未来计划在此框架上无缝叠加“简单的页面广告过滤”以进一步增强沉浸感。

---

## 技术栈
本项目技术栈为：**React + CSS + TypeScript + Vite (Manifest V3)**。

---

## 2. 用户场景 (Use Cases)

*   **Use Case 1：首次安装与初始化**
    *   用户安装 Clear Vibe 后，打开新标签页，看到的是默认的轻量级氛围渐变背景和一个极简的 Google 搜索框。
*   **Use Case 2：个性化美化**
    *   用户点击浏览器右上角的 Clear Vibe 图标，打开配置面板（Popup）。
    *   用户点击“上传图片”，选择了一张高分辨率的赛博朋克风景图。
    *   瞬间，新标签页的背景切换为该图片，且应用了“中央透明，四周清晰”的 CSS 遮罩。用户拖动面板上的“透明度”滑块，实时预览并调整到既能看清搜索框，又能欣赏边缘风景的最佳状态。
*   **Use Case 3：沉浸式搜索**
    *   用户在新标签页输入搜索词并回车，跳转到 Google 搜索结果页。由于插件的内容脚本（Content Script）介入，Google 原始的白色/黑色背景被隐藏，替换为用户刚刚配置的赛博朋克氛围背景，且依然保持中间内容区高透、四周清晰的效果，极大地提升了冲浪体验。

---

## 3. 功能演进与扩展方向 (Roadmap)

Clear Vibe 的底层架构已为未来的功能演进做好了隔离铺垫，预期的演进方向包括：

1.  **纯净模式扩展（页面清洗器 / Page Cleaner）**
    *   **描述**：在注入美化效果的同时，提供简单的 DOM 过滤功能，隐藏 Google 搜索结果中的冗余广告和推广链接，进一步增强沉浸感。
2.  **多特效支持 (Effects Library)**
    *   **描述**：除了目前的“径向渐变透明 (Radial Fade)”效果，未来允许用户切换其他算法驱动的视觉遮罩（例如毛玻璃虚化、动态波纹等）。
3.  **多平台迁移 (Cross-Platform Porting)**
    *   **描述**：基于核心业务逻辑与宿主环境解耦的特性，未来计划将 Clear Vibe 的壁纸管理与特效引擎打包，用于开发独立的桌面级专注应用 (Desktop App) 或纯 Web 版本的个人主页。

---

## 4. 开发需求与技术契约 (Development Contracts)

为了保证 `packages/` 下的核心业务逻辑能在未来**直接被复用到桌面端（如 Electron/Tauri）或其他 Web 项目中，做到“一行核心代码不改”**，所有开发者必须严格签署并遵守以下开发契约：

### 4.1 构建基建契约 (Build System)
*   **Vite MV3 插件**：在 `apps/web-extension` 的开发中，**必须使用 `@crxjs/vite-plugin`**（或类似成熟方案）来处理 Manifest V3 的多入口打包与热更新 (HMR)。严禁手写极其复杂的 Rollup 脚本去强行打包 Content Script，保持构建配置的简单可维护。

### 4.2 绝对的“平台无关”与适配器契约 (The Adapter Rule)
这是保证项目“基础框架通用性”的生死线。
*   **核心逻辑（packages）的无知性**：`packages/` 里面的代码是一台“不带电源插头的咖啡机”。它只定义数据的处理规则（比如怎么计算透明度，怎么压缩图片），但**绝对不允许**直接调用任何平台专属的方法（如 `window`, `chrome.storage`, `document`）。
*   **执行工具由 App 传入**：
    *   如果在 Chrome 插件 (`apps/web-extension`) 里使用核心存储包 `core-storage`，那么必须在 App 这一层手写一个基于 `chrome.storage` 的工具函数，通过参数**传递（注入）**给 `core-storage` 去执行。
    *   未来如果在桌面端使用，桌面端 App 就会传一个基于本地硬盘读写的工具函数给它。核心逻辑完全不用改。


### 4.3 强契约与错误处理 (Strict Type & Error Handling)
*   所有数据的读写必须通过明确的 TypeScript Interface 定义。
*   **严禁滥用 `.get(key, defaultValue)` 模式掩盖数据缺失**。例如，如果获取用户的特效配置失败，不要静默返回一个 `{ opacity: 0.5 }`，必须抛出明确的运行时错误（Throw Error），利用严格的强契约在开发阶段把 Bug 暴露出来。

### 4.4 避免过度工程化与兜底
*   代码内容不能出现过度工程化，引入复杂而无意义内容，以最小实现为原则，避免琐碎的 helper 以及模块
*   代码内同允许兜底，但本项目不是给第三方二开使用，每个函数，模块各司其职，不要引入无限过度繁琐的兜底策略。

### 4.5 构建与 UI 契约 (Build & UI Limits)
*   **React 的禁区**：React 及其相关生态仅仅是 UI 呈现工具，**绝对只能**存在于 `apps/` 的入口文件（Popup, New Tab）中。严禁将任何 React 组件写进 `packages/` 里。


## 开发进度

### 2026.7.31
- 基础显示上传图片的功能与基础过渡效果。 

### 2026.8.1

