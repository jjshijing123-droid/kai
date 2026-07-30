# ICE 图片查看器 - 架构总览

## 项目概述

ICE 图片查看器是一个基于文件系统 + SQLite 的现代化产品管理系统，采用前后端分离架构。图片文件存储在文件系统，产品元数据、翻译数据和用户凭据持久化到 SQLite 数据库。系统基于 Vue 3 + Express + better-sqlite3 构建，支持中英文国际化、管理员认证和限流保护。

## 技术栈

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
| bcrypt | 6.0.0 | 密码哈希（管理员认证） |
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
| npm-run-all | 并行运行 npm 脚本（start 命令） |

## 核心功能模块

### 1. 产品展示模块 (Product_list.vue)

网格布局展示所有产品，支持懒加载、搜索和响应式布局。

- 图片懒加载优化性能
- 响应式网格布局
- 加载状态和错误处理

### 2. 产品管理模块 (Product_Management.vue)

管理员界面的产品文件夹管理。

- 文件夹的增删改查
- 批量文件上传
- 文件夹结构管理
- 搜索和过滤功能

### 3. 3D 查看器模块 (Product3DViewer.vue)

基于 32 帧图片序列的伪 3D 产品查看器。

- 4 个视角切换（view1-view4）
- 自动旋转和手动拖拽
- 图片预加载和缓存
- 批量下载功能

### 4. 图片查看模块 (Product_Viewimages.vue)

多角度产品图片查看，支持放大查看和键盘快捷键。

### 5. 翻译管理模块 (I18nManagementPanel.vue)

中英文翻译的完整 CRUD 管理界面，数据存储于 SQLite。

### 6. 管理员认证模块

JWT + bcrypt 认证系统。

- 密码 bcrypt 哈希存储，数据库管理
- JWT Token 24 小时有效期
- 登录限流（5 次/分钟）
- `node server.js init-admin` 初始化命令

## 后端服务架构

采用分层架构，业务逻辑在 `server/services/` 中实现，路由在 `server/routes/` 中定义。

### 服务层

| 服务 | 文件 | 职责 |
|------|------|------|
| ProductService | `server/services/productService.js` | 产品的增删改查、图片列表获取 |
| FileService | `server/services/fileService.js` | 文件删除、信息获取、存在性检查 |
| FolderService | `server/services/folderService.js` | 文件夹详情、子文件夹管理、树结构、文件搜索 |
| UploadService | `server/services/uploadService.js` | 文件上传、批量替换、目录重新生成 |

### 路由层

| 模块 | 路径 | 功能 |
|------|------|------|
| 产品路由 | `server/routes/products.js` | 产品 CRUD、图片列表、目录刷新 |
| 文件夹路由 | `server/routes/folders.js` | 文件夹详情、创建/删除/重命名子文件夹 |
| 文件路由 | `server/routes/files.js` | 文件删除、信息获取、下载链接 |
| 上传路由 | `server/routes/uploads.js` | 文件上传、批量上传、进度查询 |

### 工具层

| 工具 | 文件 | 职责 |
|------|------|------|
| buildProductObject | `server/utils/buildProductObject.js` | 构建产品数据结构 |
| generateProductCatalog | `server/utils/generateProductCatalog.js` | 扫描文件系统生成产品目录（输出到 SQLite） |
| productCatalogUtils | `server/utils/productCatalogUtils.js` | 目录数据的读写和更新（内部操作 SQLite） |
| fsHelpers | `server/utils/fsHelpers.js` | 文件系统辅助函数 |
| safePath | `server/utils/safePath.js` | 路径安全校验，防止目录遍历 |

### 认证中间件

| 中间件 | 文件 | 职责 |
|--------|------|------|
| authMiddleware | `server/middleware/auth.js` | JWT Token 验证（必须认证） |
| optionalAuth | `server/middleware/auth.js` | 可选认证（有 Token 则验证） |

## 数据层

### SQLite 数据库

`data/products.db` 是应用数据的主要持久化存储，包含 4 张表：

| 表 | 用途 | 关键字段 |
|----|------|----------|
| `products` | 产品元数据 | folder_name(UNIQUE), name, total_size, file_count, views(JSON), additional_images(JSON) |
| `translations` | 翻译键值对 | PRIMARY KEY(lang, key) |
| `users` | 管理员账户 | username(UNIQUE), password_hash(bcrypt), role, is_active |

**同步机制**: 启动时自动扫描 `Product/` 目录，将产品元数据 upsert 到 SQLite。创建/删除/重命名产品后自动同步。

**优势**:
- 产品列表查询从文件系统遍历（O(n) 磁盘 IO）降为 SQLite 索引查询（O(1) 内存查找）
- 数据一致性由数据库 ACID 保证
- 管理员凭据 bcrypt 哈希存储，不再明文比对
- 为未来搜索、标签等功能提供基础

### 文件系统存储

```
Product/
└── {产品文件夹}/
    ├── images_6Views/     # 6 视图图片
    ├── images_other/      # 其他图片
    ├── view1/             # 视角1（32帧 image_00 ~ image_31）
    ├── view2/             # 视角2（32帧）
    ├── view3/             # 视角3（32帧）
    └── view4/             # 视角4（32帧）
```

### 数据目录

| 目录/文件 | 说明 | gitignore |
|-----------|------|-----------|
| `data/products.db` | SQLite 数据库（产品元数据 + 翻译 + 用户） | 是 |
| `Product/` | 产品图片文件存储 | 是 |
| `uploads/` | 临时上传文件 | 是 |

## 国际化系统

自定义 I18nService 类（非 vue-i18n），支持中英文实时切换。

- **完全由 SQLite 驱动**: 翻译数据仅存储于 `data/products.db` 的 `translations` 表，前端不维护本地翻译数据
- **数据流向**: 启动时后端从 `src/i18n/translations.js` 自动导入种子数据到 SQLite（首次启动时）；运行时前端通过 `/api/i18n/` 读写 SQLite
- **响应式更新**: 前端使用 Vue `reactive()` 对象持有翻译状态，API 数据加载后 Vue Proxy 自动触发重渲染
- **支持语言**: `zh-CN`、`en`
- **管理界面**: `I18nManagementPanel.vue` 提供完整 CRUD

## 性能优化

### 前端

- 图片懒加载和预加载
- 3D 查看器批量并发加载
- 代码分割（Vite 手动 chunk 配置）
- 浏览器缓存策略

### 后端

- express.static 静态文件服务
- SQLite WAL 模式，提升并发读性能
- 并发上传支持
- 临时文件自动清理

## 安全特性

- 路径验证（safePath），防止目录遍历
- 文件类型和大小检查
- 管理员认证（JWT + bcrypt，24小时有效期）
- 登录限流（5次/分钟）、API限流（100次/分钟）、上传限流（10次/分钟）
- CORS 域名白名单（通过 `CORS_ORIGIN` 环境变量配置）
- ZIP 符号链接检测
- 原子写入防竞态
- 密码 bcrypt 哈希存储，数据库管理
