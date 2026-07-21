
# Clear Vibe - 架构设计文档 (Architecture)

## 0. 文档边界与角色定义 (Document Boundary)

在阅读或修改本项目代码之前，请首先明确本文档（`ARCHITECTURE.md`）与 `README.md` 的定位差异，严禁将两者的内容混杂。

*   **`ARCHITECTURE.md` (本文档) 的角色**：**解释“如何实现” (How) 以及“为什么这么设计” (Why)**。它是针对 AI Agent 和底层开发者的“架构宪法”，侧重于代码的物理结构、依赖关系、跨平台隔离原则、演进推演以及命名规范。目的是防止代码腐化和架构越界。
*   **`README.md` 的角色**：**解释“是什么” (What)**。侧重于项目的核心功能描述、用户场景 (User Cases)、未来的产品规划方向以及基础的开发/运行指南。

---

## 1. 核心架构设计原则 (Design Principles)
本项目的架构不仅仅是为了完成当前的 Clear Vibe 浏览器插件，其**最核心的动机是：打造一套极其简单、边界清晰、未来可直接用于“桌面应用 + 浏览器插件”练手与开发的基础通用框架**。

本项目的架构严格遵循以下四大基本原则。任何 Agent 或开发者在提交新代码或创建新文件时，必须验证是否违反以下原则：

1.  **简单 (Simplicity)**：只为核心功能（视觉氛围美化）和已明确的演进方向设计，坚决杜绝为了“可能存在”的需求而引入空泛、复杂的通用设计（如过度封装的中间件、多余的生命周期钩子）。

2.  **结构清晰 (Clarity)**：层级分明，看一眼目录就能精准定位业务逻辑所属的位置。
    *   `apps/` 目录代表**“特定的运行环境”**（如 Chrome 扩展、未来的 Electron 桌面端），这里充斥着平台特有 API。
    *   `packages/` 目录代表**“绝对纯净的业务核心能力”**（如存储逻辑、特效算法），这里是对外面的世界一无所知的纯粹计算域。

3.  **易扩展 (Extensibility)**：功能模块化，采用“乐高积木”式的设计。新增一个特效或功能（如广告过滤），不需要修改现有的核心运行逻辑，而是通过在 `packages/` 增加一个独立的“积木块”，然后在 `apps/` 对应的环境入口（如 content_script）中把这个积木拼装上去。原有核心逻辑（如壁纸渲染）必须做到 0 修改。

4.  **语义清楚 (Semantic Naming)**：文件与文件夹的命名必须直白、准确地反映其实际承担的职责，严禁使用模棱两可的缩写或毫无边界的宽泛词汇（如 `utils`, `common`）。

---

## 2. 目录结构与层级含义 (Directory Structure & Layers)

项目采用 **Monorepo (单体仓库)** 架构。
宏观上划分为 `apps/`（宿主环境）和 `packages/`（可复用核心能力）两大部分。
**以下结构为完整约束，未经讨论严禁擅自新增根级目录。**

```text
clear-vibe/
├── apps/
│   └── web-extension/                     # 【宿主层】Chrome/Edge MV3 扩展环境
│       ├── public/                        # 静态资源 (Vite 自动打包到根目录)
│       │   ├── icons/                     # 扩展图标 (16/48/128px)
│       │   └── manifest.json              # MV3 核心清单 (定义 action, background, permissions)
│       ├── src/
│       │   ├── new-tab/                   # 【入口 1】新标签页 (React SPA)
│       │   │   ├── new-tab.html           # Vite 构建入口 / React 挂载点 (<div id="root">)
│       │   │   ├── new-tab-main.tsx       # React 渲染入口 (createRoot)
│       │   │   ├── NewTabApp.tsx          # React 根组件 (在此调用 packages 的能力)
│       │   │   └── new-tab.css            # 该入口专属全局样式
│       │   │
│       │   ├── content-script/            # 【入口 2】注入 Google 网页的脚本 (无 React UI，纯 DOM 操作)
│       │   │   ├── google-content-script.ts # 核心注入逻辑 (调用 packages/vibe-effects)
│       │   │   └── google-content-script.css# 注入到目标网页的纯净样式
│       │   │
│       │   ├── popup/                     # 【入口 3】扩展图标点击弹窗 (React SPA)
│       │   │   ├── popup.html             # Vite 构建入口 / React 挂载点
│       │   │   ├── popup-main.tsx         # React 渲染入口
│       │   │   ├── PopupApp.tsx           # React 根组件 (设置面板、图片上传 UI)
│       │   │   └── popup.css              # 弹窗专属样式
│       │   │
│       │   └── background/                # 【入口 4】MV3 Service Worker (后台守护进程)
│       │       └── service-worker.ts      # 处理扩展级事件 (如安装、网络请求拦截)、无 DOM 访问权限
│       │
│       ├── vite.config.ts                 # Vite 构建配置 (多入口 rollupOptions 配置)
│       ├── tsconfig.json                  # React + 宿主环境的 TS 配置
│       └── package.json                   # 宿主依赖 (React, Vite 等)
│
├── packages/                              # 【核心业务层】纯净的 TS 环境，与 React/浏览器环境解耦
│   ├── core-settings/                     # 【状态层】配置管理
│   │   ├── src/
│   │   │   ├── settings-manager.ts        # 配置管理逻辑 (依赖注入 storageAdapter)
│   │   │   └── types.ts                   # 配置项的 TS 接口定义
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── core-storage/                      # 【数据层】资产存储
│   │   ├── src/
│   │   │   ├── storage-manager.ts         # 图片流处理与存储调度 (依赖注入 indexedDB/MV3 适配器)
│   │   │   └── types.ts                   # 存储相关 TS 接口
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── vibe-effects/                      # 【渲染层】视觉特效引擎
│       ├── src/
│       │   ├── effect-engine.ts           # 纯函数计算：接收配置与图片 URL，返回 CSS Mask 等样式规则
│       │   └── types.ts                   # 特效参数 TS 接口
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                           # Workspace 根配置，统一定义 Monorepo 脚本
└── tsconfig.base.json                     # 所有 TypeScript 包共用的严谨类型基础配置
```

### 目录与技术栈的设计映射关系说明：
1. **React 的边界**：在这个架构中，React 仅存在于 `apps/web-extension/src/new-tab` 和 `popup` 中，作为**UI 呈现层**。核心的存储逻辑、特效计算（`packages/`）绝对不能包含任何 React 代码或 Hook（如 `useState`）。这保证了如果未来你要用 Vue 或者原生桌面环境，`packages/` 完全不需改动。
2. **Vite 多入口**：扩展有三个独立的 HTML 页面/运行环境（Popup, New Tab, Content Script）。在 `vite.config.ts` 中必须通过 Rollup 的多入口（Multiple Entry Points）进行分别打包。
3. **Manifest V3 的限制**：`background/service-worker.ts` 在 MV3 中没有 DOM 访问权限，因此它绝不能直接调用 `packages/vibe-effects` 去操作 DOM，它只能作为后台事件中转站。这也是为什么文件结构必须将其与其他 UI 入口严格隔离开。

### 层级规范：
*   **宿主层 (`apps/`)**：负责“与世界交互”。所有的平台特有 API（如 `chrome.storage`, `window`, `document`）只能生存在这一层。
*   **核心业务层 (`packages/`)**：负责“纯粹的逻辑计算与数据转换”。这一层是绝对纯净的 JS/TS 环境，**严禁直接调用任何环境特有的全局变量**。

---

## 3. 核心设计理念：

采用 Monorepo 也是为了后续扩展例如桌面端，网站等。我可能在这个插件本身不会扩展，但这个项目是我之后打算一个桌面应用+谷歌插件的练手，我也提到了，我希望后续开发也可以直接使用固定下来的同一套基础框架。在满足我这些要求情况下，越简单越好，不要增加很多空泛通用的东西，只要核心框架思路是通的，就能通用。

---

## 4. 功能沙盘推演与扩展指南 (Scenario Walkthroughs)

为了验证架构的合理性，并为 AI Agent 提供开发参照，以下是两个核心场景的架构级推演。

### 推演 1：实现核心功能“边缘清晰，中央透明的氛围过渡效果”
1.  **交互触发**：用户在 `apps/.../popup` 面板上传图片并拖动透明度滑块。
2.  **数据流转**：`popup` 调用 `packages/core-storage` 处理图片逻辑，但向其传入 Web 环境的 Storage Adapter 完成物理存盘；同时调用 `packages/core-settings` 更新特效配置参数。
3.  **渲染呈现**：用户打开 `apps/.../new_tab`。该页面读取出配置和图片，将其作为**纯数据**传入 `packages/vibe-effects`。
4.  **纯函数计算**：`vibe-effects` 内部的算法（无需知道当前是网页还是桌面软件）计算并返回一段包含 `mask-image: radial-gradient(...)` 的 CSS 代码字符串或样式对象。
5.  **挂载**：`new_tab` 拿到这段 CSS，将其应用到自己的 DOM 上。

### 推演 2：未来新增功能“隐藏 Google 搜索结果页的广告”
1.  **新增包**：在 `packages/` 下新建 `packages/page-cleaner`。该包暴露出纯粹的 DOM 清洗逻辑，如 `removeAdNodes(domRoot: HTMLElement)`。
2.  **接入宿主**：在 `apps/web-extension/src/content_script`（因为广告只在特定网页存在）中引入该包。
3.  **执行**：Content Script 监听到页面加载完毕，将当前的 `document` 作为参数传给 `removeAdNodes`。
**结论**：原有的特效引擎、存储逻辑完全不用触碰，通过新增高内聚的模块在宿主层按需组装，完美符合易扩展原则。

---

## 5. 命名规范 (Naming Conventions)

为保证语义清晰 (原则4)，项目强制采用以下命名规范：

*   **包名 (Package Names)**：使用 `名词-名词` 或 `核心概念-职责` 格式。全小写，用连字符（kebab-case）。
    *   🟢 正确：`vibe-effects`, `core-storage`, `page-cleaner`
    *   🔴 错误：`utils`, `common`, `extension-logic` (过于宽泛)
*   **文件与文件夹**：强制使用连字符格式（kebab-case），如 `apply-radial-mask.ts`。禁止在同一目录下混用驼峰和连字符。
*   **类与接口**：强制使用大驼峰（PascalCase），如 `VibeEffectEngine`, `StorageAdapter`。
*   **函数与变量**：强制使用小驼峰（camelCase），且函数名必须为**动宾结构**，明确表达动作。
    *   🟢 正确：`generateMaskCss`, `saveUserImage`
    *   🔴 错误：`mask`, `handleImage`




