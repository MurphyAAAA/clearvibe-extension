
# Clear Vibe - 架构设计文档 (Architecture)

## 0. 文档边界与角色定义 (Document Boundary)

在阅读或修改本项目代码之前，请首先明确本文档（`ARCHITECTURE.md`）与 `README.md` 的定位差异，严禁将两者的内容混杂。

*   **`ARCHITECTURE.md` (本文档) 的角色**：记录核心设计理念、职责与依赖边界、目录结构和命名要求，不展开操作教程或实现细节。
*   **`README.md` 的角色**：**解释“是什么” (What)**。侧重于项目的核心功能描述、用户场景 (User Cases)、未来的产品规划方向以及基础的开发/运行指南。

---

## 1. 核心架构设计原则 (Design Principles)
本项目的架构不仅仅是为了完成当前的 Clear Vibe 浏览器插件，其**最核心的动机是：打造一套极其简单、边界清晰、未来可直接用于“桌面应用 + 浏览器插件”练手与开发的基础通用框架**。

本项目的架构严格遵循以下四大基本原则。任何 Agent 或开发者在提交新代码或创建新文件时，必须验证是否违反以下原则：

1.  **简单 (Simplicity)**：只为核心功能（视觉氛围美化）和已明确的演进方向设计，坚决杜绝为了“可能存在”的需求而引入空泛、复杂的通用设计（如过度封装的中间件、多余的生命周期钩子）。

2.  **结构清晰 (Clarity)**：层级分明，看一眼目录就能精准定位业务逻辑所属的位置。
    *   `apps/` 目录代表**“特定的运行环境”**（如 Chrome 扩展、未来的 Electron 桌面端），这里充斥着平台特有 API。
    *   `packages/` 目录代表**“绝对纯净的业务核心能力”**（如存储逻辑、特效算法），这里是对外面的世界一无所知的纯粹计算域。

3.  **易扩展 (Extensibility)**：核心能力通过明确的接口与宿主适配器解耦，由 `apps/` 组装。可复用的纯逻辑放入 `packages/`，平台交互留在 `apps/`；仅在职责确实独立时新增模块，独立功能不应要求修改无关的核心逻辑。

4.  **语义清楚 (Semantic Naming)**：文件与文件夹的命名必须直白、准确地反映其实际承担的职责，严禁使用模棱两可的缩写或毫无边界的宽泛词汇（如 `utils`, `common`）。

---

## 2. 目录结构与层级含义 (Directory Structure & Layers)

项目采用 **Monorepo (单体仓库)** 架构。
宏观上划分为 `apps/`（宿主环境）和 `packages/`（可复用核心能力）两大部分。
**以下为目标职责与目录结构，不表示所有文件已经实现，也不要求创建空文件占位。新增文件必须先讨论确认，未经讨论严禁擅自新增根级目录。**

当前已实现 Popup、新标签页、Google 页面 Content Script 与后台 Service Worker 四个入口，使用 CRXJS 构建和分包 TypeScript 配置。Google 主页与搜索结果页复用同一内容脚本，通过远程图片适配器读取后台图片。下面标明规划部分的结构不要求占位实现，也不授权新增产品功能。

```text
clear-vibe/
├── apps/
│   └── web_extension/                     # 【宿主层】Chrome/Edge MV3 扩展环境
│       ├── public/                        # 静态资源 (Vite 自动打包到根目录)
│       │   ├── icons/                     # 【规划】扩展图标 (16/48/128px)
│       │   └── manifest.json              # MV3 核心清单 (定义 action, background, permissions)
│       ├── src/
│       │   ├── adapters/                  # 专门用于存放“为核心业务层注入的特定环境实现代码”
│       │   │   ├── image_adapter.ts       # 扩展 Origin 下基于 IndexedDB 的完整图片读写适配器
│       │   │   ├── remote_image_adapter.ts# Content Script 通过扩展内部消息读取图片的只读适配器
│       │   │   └── settings_adapter.ts    # 基于 chrome.storage.local 的配置读写适配器
│       │   │
│       │   ├── new_tab/                   # 【入口 1】新标签页 (React SPA)
│       │   │   ├── new_tab.html           # Vite 构建入口 / React 挂载点 (<div id="root">)
│       │   │   ├── new_tab_main.tsx       # React 渲染入口 (createRoot)
│       │   │   ├── new_tab_app.tsx         # React 根组件 (在此调用 packages 的能力)
│       │   │   └── new_tab.css            # 该入口专属全局样式
│       │   │
│       │   ├── content_script/            # 【入口 2】注入 Google 主页与搜索结果页的脚本 (无 React UI，纯 DOM 操作)
│       │   │   ├── google_content_script.ts # 核心注入逻辑 (调用 packages/vibe_effects)
│       │   │   └── google_content_script.css# 注入到目标网页的纯净样式
│       │   │
│       │   ├── popup/                     # 【入口 3】扩展图标点击弹窗 (React SPA)
│       │   │   ├── popup.html             # Vite 构建入口 / React 挂载点
│       │   │   ├── popup_main.tsx         # React 渲染入口
│       │   │   ├── popup_app.tsx           # React 根组件 (设置面板、图片上传 UI)
│       │   │   └── popup.css              # 弹窗专属样式
│       │   │
│       │   └── background/                # 【入口 4】MV3 后台 Service Worker
│       │       └── service_worker.ts      # 处理扩展级事件与图片读取消息，无 DOM 访问权限
│       │
│       ├── vite.config.ts                 # Vite 构建配置 (集成 @crxjs/vite-plugin，免手动配置 Rollup 多入口)
│       ├── tsconfig.json                  # React + 宿主环境的 TS 配置
│       └── package.json                   # 宿主依赖 (React, Vite 等)
│
├── packages/                              # 【核心业务层】纯净的 TS 环境，与 React/浏览器环境解耦
│   ├── core_settings/                     # 【状态层】配置管理
│   │   ├── src/
│   │   │   ├── index.ts                   # 包的公开导出入口
│   │   │   ├── settings_manager.ts        # 配置管理逻辑 (依赖注入 storageAdapter)
│   │   │   └── types.ts                   # 配置项的 TS 接口定义
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── core_storage/                      # 【数据层】资产存储
│   │   ├── src/
│   │   │   ├── index.ts                   # 包的公开导出入口
│   │   │   ├── storage_manager.ts         # ImageReader 只读管家与 StorageManager 完整读写管家
│   │   │   └── types.ts                   # IImageReaderAdapter 与 IImageStorageAdapter 能力契约
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── vibe_effects/                      # 【渲染层】视觉特效引擎
│       ├── src/
│       │   ├── index.ts                   # 包的公开导出入口
│       │   ├── effect_engine.ts           # 纯函数计算：接收配置与图片 URL，返回 CSS Mask 等样式规则
│       │   └── types.ts                   # 特效参数 TS 接口
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                           # Workspace 根配置，统一定义 Monorepo 脚本
├── tsconfig.json                          # 编辑器默认配置，指向扩展应用配置
└── tsconfig.base.json                     # 公共类型规则，不包含宿主环境类型
```

### 目录与技术栈的设计映射关系说明：
1. **React 的边界**：在这个架构中，React 仅存在于 `apps/web_extension/src/new_tab` 和 `popup` 中，作为**UI 呈现层**。核心的存储逻辑、特效计算（`packages/`）绝对不能包含任何 React 代码或 Hook（如 `useState`）。这保证了如果未来你要用 Vue 或者原生桌面环境，`packages/` 完全不需改动。
2. **构建入口**：目标扩展包含 Popup、新标签页两个 HTML 页面，以及 Content Script、Service Worker 脚本入口。通过 `@crxjs/vite-plugin`（或类似成熟方案）管理 Manifest 声明的入口，不自行维护复杂的多入口构建逻辑。
3. **后台边界**：Service Worker 不操作 DOM，负责后台事件与扩展 Origin 下的图片读取；可以调用纯计算能力，不承担页面挂载职责。

### 层级规范：
*   **宿主层 (`apps/`)**：负责“与世界交互”。所有的平台特有 API（如 `chrome.storage`, `window`, `document`）只能生存在这一层。
*   **核心业务层 (`packages/`)**：负责“纯粹的逻辑计算与数据转换”。这一层是绝对纯净的 JS/TS 环境，**严禁直接调用任何环境特有的全局变量**。
*   **图片访问边界**：扩展页面直接使用 IndexedDB 图片适配器；Content Script 通过只读远程适配器向后台读取图片。消息传输与 IndexedDB 实现均属于宿主层，核心包只依赖图片能力接口。

---

## 3. 核心职责与依赖

*   `core_settings` 管理配置的装载、校验、保存与变更订阅，通过宿主适配器访问配置存储。
*   `core_storage` 管理图片数据的读取与保存契约，不依赖 IndexedDB 或扩展消息 API；只读消费者依赖读取能力，不承担写入职责。
*   `vibe_effects` 接收图片 URL 与特效参数，返回样式数据，不访问存储、不挂载 DOM。
*   宿主入口组装上述能力，负责用户交互、平台事件与页面呈现；核心包不反向依赖宿主代码。

---

## 4. 命名规范 (Naming Conventions)

为保证语义清晰 (原则4)，项目强制采用以下命名规范：

*   **包名 (Package Names)**：使用 `名词_名词` 或 `核心概念_职责` 格式。全小写，用下划线。
    *   🟢 正确：`vibe_effects`, `core_storage`, `core_settings`
    *   🔴 错误：`utils`, `common`, `extension_logic` (过于宽泛)
*   **源码文件与文件夹**：统一使用小写下划线格式，如 `new_tab_app.tsx`、`apply_radial_mask.ts`，React 组件源码文件也不例外。类、组件与函数的标识符按下面的规则命名，不因文件名格式而改变。
*   **类、接口与 React 组件标识符**：强制使用大驼峰（PascalCase），如 `VibeEffectEngine`, `StorageAdapter`。文件名仍遵守下划线规则。
*   **函数与变量**：强制使用小驼峰（camelCase），且函数名必须为**动宾结构**，明确表达动作。
    *   🟢 正确：`generateMaskCss`, `saveUserImage`
    *   🔴 错误：`mask`, `handleImage`




