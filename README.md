# clearvibe-extension
谷歌美化插件，氛围背景
支持自己上传图片，在主页，搜索页面都可以渲染背景

Monorepo 架构

技术栈
React TailwindCSS TypeScript

```
├── apps                              # 可运行的产品入口
│   ├── desktop_app                   # 占位
│   └── web_extension
│       ├── index.html
│       ├── manifest.json
│       ├── package.json
│       └── src
│           ├── content_scripts       # 注入到网页的入口
│           ├── settings              # 右键 -> 选项/设置
│           └── popup                 # 点击图标的弹窗入口
├── package.json
│
├── packages                          # 可复用的业务能力/核心库
│   
└── README.md
```