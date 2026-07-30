# ICE 图片查看器 - 产品管理系统

基于文件系统 + SQLite 的产品管理系统，提供产品展示、文件管理和图片查看功能。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Vue](https://img.shields.io/badge/vue-3.5.24-blue.svg)

## 📋 项目简介

ICE 图片查看器是一个现代化的产品管理系统，采用前后端分离架构。产品图片存储在文件系统，产品元数据、翻译数据和用户凭据持久化到 SQLite 数据库。系统提供直观的产品展示界面，支持多角度图片查看、批量文件管理、实时翻译管理和管理员认证。

## ✨ 主要功能

### 🎯 核心功能
- **产品展示管理** — 基于文件系统的产品目录展示，SQLite 加速查询
- **多角度图片查看** — 支持产品 4 个视角的图片查看（32 帧序列）
- **单产品文件夹上传** — 通过 ZIP 压缩包上传单个产品文件夹
- **批量文件上传** — 支持批量文件上传到指定文件夹
- **批量替换产品** — 清空当前产品后解压 ZIP 全量替换
- **产品目录管理** — 动态生成和管理产品目录，启动时自动同步
- **实时翻译管理** — 支持中英文切换和翻译键管理，数据存于 SQLite

### 🛠️ 管理功能
- **管理员认证** — JWT + bcrypt 密码哈希，安全可靠
- **文件操作** — 文件的查看、下载、重命名、删除
- **文件夹管理** — 灵活的文件夹结构管理，支持多级子目录
- **文件夹导出** — 将文件夹内容打包为 ZIP 下载
- **错误监控** — 完善的错误处理和监控机制
- **响应式设计** — 适配各种设备尺寸

### 🔧 技术特性
- **文件系统 + SQLite 混合存储** — 图片存文件系统，元数据存 SQLite
- **RESTful API** — 标准化的 API 接口设计
- **bcrypt 密码哈希** — 管理员密码安全存储
- **JWT 认证** — 24 小时有效期的 Token 机制
- **启动自动同步** — Product/ 目录自动扫描同步到 SQLite
- **限流保护** — 登录 5 次/分钟，API 100 次/分钟，上传 10 次/分钟
- **CORS 域名白名单** — 通过 `CORS_ORIGIN` 环境变量配置，支持逗号分隔多域名
- **现代化 UI** — 基于 Tailwind CSS 的美观界面

## 🏗️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5.24 | 渐进式 JavaScript 框架 |
| Vite | 4.5.14 | 前端构建工具 |
| Vue Router | 4.6.3 | 路由管理 |
| Pinia | 3.0.4 | 状态管理 |
| Tailwind CSS | 3.4.0 | 样式框架 |
| lucide-vue-next | 0.555.0 | 图标库 |
| class-variance-authority | 0.7.0 | 组件变体管理 |
| clsx | 2.0.0 | 条件类名工具 |
| tailwind-merge | 2.2.0 | Tailwind 类名合并 |
| tailwindcss-animate | 1.0.7 | 动画扩展 |
| JSZip | 3.10.1 | ZIP 文件处理 |
| file-saver | 2.0.5 | 文件下载 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.18.2 | Web 框架 |
| Multer | 2.0.2 | 文件上传中间件 |
| better-sqlite3 | 13.0.2 | 嵌入式 SQLite 数据库 |
| bcrypt | 6.0.0 | 密码哈希 |
| Archiver | 7.0.1 | 压缩文件处理 |
| Unzipper | 0.12.3 | ZIP 文件解压 |
| cors | 2.8.5 | 跨域资源共享 |
| express-rate-limit | 8.5.2 | API 限流 |
| dotenv | 17.4.2 | 环境变量加载 |

### 开发工具

| 工具 | 用途 |
|------|------|
| ESBuild | JavaScript 打包 |
| PostCSS + Autoprefixer | CSS 处理 |
| npm-run-all | 并行运行多个 npm 脚本（start 命令使用） |

## 📚 文档

项目文档位于 `docs/` 目录：

- [架构总览](docs/architecture/overview.md) — 技术栈和核心模块
- [目录结构说明](docs/architecture/structure.md) — 代码组织方式
- [API 参考](docs/api/reference.md) — RESTful 接口文档
- [部署指南](docs/deployment/guide.md) — 生产环境部署
- [设计系统](docs/design/colors.md) — 颜色变量和主题配置

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm
- 现代浏览器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd kai
```

2. **安装依赖**
```bash
npm install
```

3. **初始化管理员账户**（首次启动前执行）
```bash
node server.js init-admin
```

按提示输入用户名和密码，创建第一个管理员账户。

4. **启动开发服务器**
```bash
# 同时启动前后端（推荐）
npm run start
```

- 前端: http://localhost:5173
- 后端: http://localhost:3010

### 生产环境部署

1. **构建前端**
```bash
npm run build
```

2. **启动生产环境**
```bash
npm run prod
```

生产环境默认端口 8000，服务地址 http://localhost:8000。

## 📁 项目结构

```
kai/
├── server/                      # Express 后端
│   ├── database/                 # SQLite 数据层
│   │   ├── index.js              # 数据库初始化、连接管理
│   │   ├── productRepository.js  # 产品数据 CRUD
│   │   ├── usersRepository.js    # 用户数据 CRUD + 密码验证
│   │   ├── translationsRepository.js  # 翻译数据 CRUD
│   │   └── sync.js               # 文件系统 ↔ SQLite 同步
│   ├── middleware/
│   │   └── auth.js               # JWT 认证中间件
│   ├── routes/                   # API 路由
│   │   ├── products.js
│   │   ├── folders.js
│   │   ├── files.js
│   │   └── uploads.js
│   ├── services/                 # 业务逻辑层
│   │   ├── productService.js
│   │   ├── folderService.js
│   │   ├── fileService.js
│   │   └── uploadService.js
│   └── utils/                    # 工具函数
│       ├── buildProductObject.js
│       ├── fsHelpers.js
│       ├── generateProductCatalog.js
│       ├── productCatalogUtils.js
│       └── safePath.js
├── src/                          # Vue 3 前端
│   ├── components/               # 组件
│   │   ├── ui/                   # 基础 UI 组件库（24 个组件）
│   │   └── ...                   # 业务组件
│   ├── composables/              # 组合式函数（8 个）
│   ├── i18n/                     # 国际化
│   ├── router/                   # 路由（6 个路由）
│   ├── services/                 # 前端 API 服务
│   ├── stores/                   # 状态管理（Pinia）
│   ├── theme/                    # 主题配置
│   └── utils/                    # 前端工具
├── Product/                      # 产品图片文件（gitignore）
├── data/                         # SQLite 数据库（gitignore）
│   └── products.db
├── public/                       # 前端静态资源
├── docs/                         # 📖 项目文档
└── server.js                     # Express 入口
```

## 📖 API 接口

详见 [docs/api/reference.md](docs/api/reference.md)

涵盖认证（登录/Tok 验证）、产品管理、文件夹管理、文件操作、文件上传、国际化翻译、系统端点共 40+ 个接口。

## 🔧 配置说明

项目无需 `.env` 即可运行。代码中内置了默认值，可直接启动开发环境。

### 环境变量（可选）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 开发 3010，生产 8000 | 服务器端口 |
| `NODE_ENV` | `development` | 运行环境（`production` 启用生产模式） |
| `JWT_SECRET` | 自动生成随机密钥 | JWT 签名密钥（生产环境建议手动设置） |
| `CORS_ORIGIN` | 允许所有 | CORS 域名白名单，逗号分隔多域名，生产环境建议配置 |

> **注意**: 管理员账户通过 `node server.js init-admin` 初始化，不再需要 `.env` 中的 `ADMIN_USER`/`ADMIN_PASS`。

## 🛠️ 开发指南

### 常用命令

```bash
npm run dev          # 启动前端开发服务器（Vite，端口 5173）
npm run server       # 启动后端服务器（Express，端口 3010）
npm run start        # 同时启动前后端
npm run build        # 构建前端生产包
npm run prod         # 构建并启动生产环境
node server.js init-admin  # 初始化第一个管理员账户
```

### 开发流程

1. 前端组件开发 — `src/components/` 和 `src/composables/`
2. 后端 API 开发 — `server/routes/` 添加路由，`server/services/` 实现业务逻辑
3. 数据库变更 — `server/database/` 修改 Repository 和索引

## 🐛 故障排除

### 端口占用

```bash
# Windows
netstat -ano | findstr :3010

# Linux/macOS
lsof -i :3010
```

### 重置管理员密码

删除 `data/products.db` 文件后重新运行 `node server.js init-admin`。

## 📄 许可证

MIT
