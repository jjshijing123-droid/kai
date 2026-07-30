# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ICE 图片查看器 — 基于文件系统 + SQLite 的产品管理系统，前后端分离架构。产品图片以文件夹形式存储在 `Product/` 目录下，元数据、翻译数据和用户凭据持久化到 `data/products.db`（SQLite）。支持中英文国际化、bcrypt 管理员认证、批量上传、多角度图片查看（4 个视角）、产品目录自动同步。

## 常用命令

```bash
# 前端开发服务器
npm run dev

# 后端服务器
npm run server

# 同时启动前后端（开发模式，默认启动 dev + server）
npm run start

# 初始化第一个管理员账户（仅当用户表为空时可用）
node server.js init-admin

# 生产构建并启动
npm run build
npm run prod
```

- `npm run start` 使用 concurrently 同时运行后端（Express，端口 3010）和前端（Vite，端口 5173）
- 生产环境后端端口为 8000，前端静态资源由 Express 直接服务（SPA 路由回退）
- `init-admin` 是交互式 CLI 命令，用于创建第一个管理员账户

## 架构概览

### 前端（Vue 3 + Vite）

- **路由**：`src/router/index.js` — 6 个路由，`Product_list`（首页）、`Product_nav`（产品详情）、`Product3DViewer`（3D展示）、`Product_Viewimages`（图片查看）、`I18nManagementPanel`（翻译管理）、`Product_Management`（产品管理）
- **国际化**：`src/i18n/` — 自定义 I18nService 类，中英文切换。翻译完全由 SQLite 驱动，`src/i18n/translations.js` 仅作为种子数据源，后端首次启动时自动导入 SQLite。运行时所有翻译从 `/api/i18n/translations` 加载
- **Composables**：`src/composables/` — 8 个可组合函数（useAdminAuth、useDataFetch、useErrorMonitoring、useI18n、useKeyboardShortcuts、useNotifications、useTheme、useTooltip）
- **组件分层**：`src/components/ui/` 是基础 UI 组件（24 个组件），`src/components/` 是业务组件
- **状态管理**：`src/stores/` — Pinia（themeStore、notificationStore）
- **样式**：Tailwind CSS 3.4 + 自定义 CSS 变量主题，颜色变量统一在 `tailwind.config.js` 的 theme 中定义，避免硬编码
- **路径别名**：`@` → `./src`

### 后端（Express + SQLite）

- **入口**：`server/server.js` — Express 应用，CORS、静态文件服务、API 路由挂载、`init-admin` CLI 命令
- **数据层**：`server/database/` — SQLite 连接管理（index.js）、产品 Repository（productRepository.js）、用户 Repository（usersRepository.js，bcrypt 密码验证）、翻译 Repository（translationsRepository.js）、文件系统同步（sync.js）
- **认证中间件**：`server/middleware/auth.js` — JWT 生成/验证、authMiddleware、optionalAuth
- **路由层**：`server/routes/` — products.js、folders.js、files.js、uploads.js
- **服务层**：`server/services/` — productService、folderService、fileService、uploadService（业务逻辑全部在此层）
- **工具层**：`server/utils/` — 产品目录生成、路径安全校验、工具函数
- **数据目录**：`Product/`（产品图片）、`data/`（SQLite 数据库）、`uploads/`（临时上传），均在 `.gitignore` 中

### 前后端通信

- API 基址：`/api`（开发环境通过 Vite proxy 转发到 `localhost:3010`）
- 产品图片/文件：`/Product`（由后端 `express.static` 直接服务）
- 前端 API 调用使用原生 `fetch`（封装在 `src/services/apiService.js`），不使用 axios
- 认证：JWT Bearer Token，24 小时有效期，密码 bcrypt 哈希存储在 SQLite
- 响应格式统一：`{ success, message, data, timestamp }`

### 数据存储

- **SQLite 数据库**（`data/products.db`）：产品元数据（products 表）、翻译数据（translations 表）、管理员账户（users 表，bcrypt 密码哈希）
- **文件系统**（`Product/`）：产品图片文件，启动时自动扫描同步到 SQLite
- **兼容层**：`server/utils/productCatalogUtils.js` 仍兼容写入 JSON 格式，但主要数据源为 SQLite

### 文档

项目文档位于 `docs/` 目录，详见 [docs/README.md](docs/README.md)。

**文档同步规则**: 任何代码改动（新增/修改/删除文件、API 端点、功能、路由、依赖等）完成后，**必须同步更新相关文档**。在交付代码改动时，文档同步是必须完成的步骤，不是可选的。以下表格列出了各文档的同步触发条件。

## 文档同步规则

| 文档 | 文档内容描述 | 同步更新条件 |
|------|------|------|
| `CLAUDE.md` | 项目开发规范、工作流规则、文档同步规则、禁止事项、常用命令、架构概览 | 新增/修改/删除 开发规范或约束规则、文档同步规则变更、禁止事项变更、新增/修改/删除 常用命令、架构概览变更 |
| `README.md` | 项目首页说明、项目简介、主要功能列表、技术栈版本表、快速开始指南、环境变量配置表、开发流程 | 项目整体描述变更、功能特性增减、技术栈版本变更、安装/启动步骤变更、环境变量变更、Node.js 版本要求变更 |
| `docs/api/reference.md` | 所有后端 API 端点的详细说明，包括请求方法、路径、请求参数/请求体、响应格式与示例 | 新增/修改/删除 API 路由端点、请求/响应格式、认证方式、限流策略、请求参数或字段 |
| `docs/architecture/structure.md` | 项目完整目录树、代码分层架构、组件/模块组织方式、文件与组件命名规范 | 新增/删除/移动文件或组件、新增/修改/删除路由、新增 composable/service/utils 工具、目录结构变更 |
| `docs/architecture/overview.md` | 项目整体架构概览、前后端技术栈版本、核心功能特性、数据存储方案、SQLite 表结构、安全特性 | 修改技术栈版本（package.json）、核心功能变更、数据存储方案变更、SQLite 表结构变更、安全策略变更 |
| `docs/deployment/guide.md` | 开发/生产环境部署步骤、环境变量配置、启动流程、Docker/PM2/Nginx 配置 | 修改部署方式（Docker/PM2/直接运行）、环境变量变更、启动/初始化流程变更、端口或域名变更 |
| `docs/design/colors.md` | CSS 变量颜色体系、Tailwind 主题配置、设计 token、颜色使用规范 | 修改 CSS 变量、新增/修改颜色主题、Tailwind 配置变更、设计系统 token 变更 |

## 主题系统

- 颜色通过 CSS 变量定义，在 `tailwind.config.js` 的 theme 中引用
- 不要硬编码颜色值（如 `#fff`、`#000`），应使用 CSS 变量或 Tailwind 主题色
- 自定义颜色映射详见 [docs/design/colors.md](docs/design/colors.md)

## 禁止事项

- **不要自动提交 git commit** — 只有在用户明确要求时才执行 `git commit` 或 `git push`
- 修改文件后不要主动创建 commit，将变更留在工作区等待用户决定
- **禁止使用 `Get-Process -Name "node" | Stop-Process` 或类似命令杀掉所有 Node 进程** — 本机可能同时运行其他项目。如需重启后端，只杀掉占用端口 3010 的进程（例如 `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue).OwningProcess`），不要影响其他端口上的服务
