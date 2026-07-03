# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ICE 图片查看器 — 基于文件系统的产品管理系统，前后端分离架构。无数据库，产品数据以文件夹形式存储在 `Product/` 目录下。支持中英文国际化、管理员认证、批量上传、多角度图片查看（4个视角）、产品目录动态生成。

## 常用命令

```bash
# 前端开发服务器
npm run dev

# 后端服务器
npm run server

# 同时启动前后端（开发模式，默认启动 dev + server）
npm run start

# 生产构建并启动
npm run prod

# Docker 开发环境
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down

# Docker 生产环境
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml down
```

- `npm run start` 使用 concurrently 同时运行后端（Express，端口 3000）和前端（Vite，端口 5173）
- 生产环境后端端口为 8000，通过 Vite 代理 `/api` 和 `/Product` 到 `localhost:3000`

## 架构概览

### 前端（Vue 3 + Vite）

- **路由**：`src/router/index.js` — 6 个路由，`Product_list`（首页）、`Product_nav`（产品详情）、`Product3DViewer`（3D展示）、`Product_Viewimages`（图片查看）、`I18nManagementPanel`（翻译管理）、`Product_Management`（产品管理）
- **国际化**：`src/i18n/` — 自定义 I18nService 类，中英文切换，翻译数据存在 `src/i18n/translations.js`
- **Composables**：`src/composables/` — 7 个可组合函数（useAdminAuth、useDataFetch、useErrorMonitoring、useI18n、useKeyboardShortcuts、useNotifications、useTooltip）
- **组件分层**：`src/components/ui/` 是基础 UI 组件（Button、Card、Modal、Table 等），`src/components/` 是业务组件
- **样式**：Tailwind CSS 3.4 + 自定义 CSS 变量主题，颜色变量统一在 `tailwind.config.js` 的 theme 中定义，避免硬编码
- **路径别名**：`@` → `./src`

### 后端（Express + 文件系统）

- **入口**：`server/server.js` — Express 应用，CORS、静态文件服务、API 路由挂载
- **路由层**：`server/routes/` — products.js、folders.js、files.js、uploads.js
- **服务层**：`server/services/` — productService、folderService、fileService、uploadService（业务逻辑全部在此层）
- **工具层**：`server/utils/` — 产品目录生成和工具函数
- **数据目录**：`Product/`（产品文件）和 `uploads/`（上传文件），均在 `.gitignore` 中

### 前后端通信

- API 基址：`/api`（开发环境通过 Vite proxy 转发到 `localhost:3000`）
- 产品图片/文件：`/Product`（由后端 `express.static` 直接服务）
- 前端 API 调用使用原生 `fetch`（封装在 `src/services/apiService.js`），不使用 axios
- 响应格式统一：`{ success, message, data, timestamp }`

### 文档

项目文档已整理归档到 `docs/` 目录，按需查看：

- [docs/README.md](docs/README.md) — 文档总索引，所有文档的导航入口
- [docs/architecture/overview.md](docs/architecture/overview.md) — 架构总览（技术栈、核心模块、数据存储、国际化）
- [docs/architecture/structure.md](docs/architecture/structure.md) — 目录结构说明（每文件用途、命名规范）
- [docs/api/reference.md](docs/api/reference.md) — API 接口参考（所有 REST 端点、响应格式、错误码）
- [docs/deployment/guide.md](docs/deployment/guide.md) — 部署指南（开发/生产环境、Nginx、Docker）
- [docs/design/colors.md](docs/design/colors.md) — 设计系统（CSS 颜色变量定义和使用方式）

历史文档（迁移前版本，内容可能过时）保留在 `docs/archive/` 中。

## 文档同步规则

- **修改 API 端点时**：同步更新 [docs/api/reference.md](docs/api/reference.md)
- **修改路由、组件、目录结构时**：同步更新 [docs/architecture/structure.md](docs/architecture/structure.md)
- **修改技术栈、核心功能、数据存储时**：同步更新 [docs/architecture/overview.md](docs/architecture/overview.md)
- **修改部署方式、环境配置时**：同步更新 [docs/deployment/guide.md](docs/deployment/guide.md)
- **修改 CSS 变量、颜色主题时**：同步更新 [docs/design/colors.md](docs/design/colors.md)
- **新增或删除文件/组件/路由**：同步更新 [docs/architecture/structure.md](docs/architecture/structure.md) 中的目录树
- **修改技术栈版本（package.json）**：同步更新 [docs/architecture/overview.md](docs/architecture/overview.md) 中的技术栈表格

## 主题系统

- 颜色通过 CSS 变量定义，在 `tailwind.config.js` 的 theme 中引用
- 不要硬编码颜色值（如 `#fff`、`#000`），应使用 CSS 变量或 Tailwind 主题色
- 自定义颜色映射详见 [docs/design/colors.md](docs/design/colors.md)
