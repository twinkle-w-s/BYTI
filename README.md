# BYTI

> 一个赛博风格的保研人格测试页。

BYTI 是一个基于原版 SBTI 二次改造的娱乐向前端项目，围绕“保研人精神状态诊断”主题做了重新设计，包含答题流程、五维雷达图、结果终端页与分享图片导出。

## 项目概览

- 主题：保研人格 / 精神状态娱乐测试
- 技术栈：Vite + 原生 JavaScript + Canvas
- 形式：纯前端静态站点
- 结果页：诊断终端风格
- 分享图：与站内视觉统一的赛博归档卡片

## 当前内容结构

```text
├── data/
│   ├── config.json
│   ├── dimensions.json
│   ├── questions.json
│   └── types.json
├── src/
│   ├── chart.js
│   ├── engine.js
│   ├── main.js
│   ├── quiz.js
│   ├── result.js
│   ├── share.js
│   ├── style.css
│   └── utils.js
├── index.html
├── netlify.toml
├── package.json
└── vite.config.js
```

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
npm run preview
```

## 可调整内容

### 题目与选项
编辑 `data/questions.json`

### 维度定义
编辑 `data/dimensions.json`

### 类型结果与匹配模式
编辑 `data/types.json`

### 文案与显示参数
编辑 `data/config.json`

### 页面视觉样式
编辑 `src/style.css`

## 部署说明

项目已适配静态部署，可直接部署到 Netlify、Vercel 或其他静态托管平台。

其中 Netlify 可配合根目录下的 `netlify.toml` 使用。

## 说明

- 本项目仅供娱乐展示
- 不提供任何现实决策建议
- 当前版本为定制化前端页面，不再保留页面内的“一键复制搭建命令”展示

## 致谢

- 原始测试灵感来源：B站 UP 主 `@蛆肉儿串儿`
- 当前页面为二次创作与视觉重构版本
