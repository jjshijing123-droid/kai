# ICE 图片查看器 - 架构总览

## 项目概述

ICE 图片查看器是一个基于文件系统驱动的现代化产品管理系统，采用前后端分离架构，提供直观的产品展示界面和强大的文件管理功能。系统基于 Vue 3 + Express 构建，无数据库依赖。

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.5.24 | 渐进式 JavaScript 框架 |
| Vite | 4.5.14 | 前端构建工具 |
| Vue Router | 4.6.3 | 路由管理 |
| Pinia | 3.0.0 | 状态管理 |
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
| Archiver | 7.0.1 | 压缩文件处理 |
| Unzipper | 0.12.3 | ZIP 文件解压 |
| cors | 2.8.5 | 跨域资源共享 |

### 开发工具

| 工具 | 用途 |
|------|------|
| ESBuild | JavaScript 打包 |
| PostCSS + Autoprefixer | CSS 处理 |
| Concurrently | 并行运行 npm 脚本 |

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

中英文翻译的完整 CRUD 管理界面。

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
| generateProductCatalog | `server/utils/generateProductCatalog.js` | 扫描文件系统生成产品目录 |
| productCatalogUtils | `server/utils/productCatalogUtils.js` | 目录数据的读写和更新 |
| fsHelpers | `server/utils/fsHelpers.js` | 文件系统辅助函数 |

## 数据存储方案

系统采用文件系统作为数据存储，无需数据库。

### 产品目录结构

```
Product/
└── {产品文件夹}/
    ├── images_6Views/     # 6 视图图片
    ├── images_other/      # 其他图片
    ├── view1/             # 视角1（32帧）
    ├── view2/             # 视角2（32帧）
    ├── view3/             # 视角3（32帧）
    └── view4/             # 视角4（32帧）
```

### 产品目录文件

`public/data/product-catalog.json` 由后端自动生成，包含所有产品的元数据、视图路径、图片路径等。

## 国际化系统

自定义 I18nService 类（非 vue-i18n），支持中英文实时切换。

- **翻译存储**: `src/i18n/translations.js`（前端）+ 后端文件读写
- **支持语言**: `zh-CN`、`en`
- **管理界面**: `I18nManagementPanel.vue` 提供完整 CRUD
- **持久化**: 前端 localStorage + 后端文件系统

## 性能优化

### 前端

- 图片懒加载和预加载
- 3D 查看器批量并发加载
- 代码分割（Vite 手动 chunk 配置）
- 浏览器缓存策略

### 后端

- express.static 静态文件服务
- 并发上传支持
- 临时文件自动清理

## 安全特性

- 路径验证，防止目录遍历
- 文件类型和大小检查
- 管理员认证（JWT + Bearer Token，24小时有效期）
- 登录限流（5次/分钟）、API限流（100次/分钟）、上传限流（10次/分钟）
- CORS 域名白名单
- ZIP 符号链接检测
- 原子写入防竞态
