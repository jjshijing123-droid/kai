# 项目目录结构说明

## 完整目录树

```
kai/
├── .claude/                        # Claude Code 项目设置
│   └── settings.json               # 权限和配置
├── Product/                        # 产品图片文件存储（gitignore）
│   └── {产品文件夹}/
│       ├── image_00.webp           # 产品主图
│       ├── images_6Views/          # 6 视图图片
│       ├── images_other/           # 其他图片
│       ├── view1/                  # 视角1（32帧 image_00 ~ image_31）
│       ├── view2/                  # 视角2（32帧）
│       ├── view3/                  # 视角3（32帧）
│       └── view4/                  # 视角4（32帧）
├── data/                           # 数据目录（gitignore）
│   └── products.db                 # SQLite 数据库
│                                   #   - products 表（产品元数据）
│                                   #   - translations 表（翻译数据）
│                                   #   - users 表（管理员账户）
├── public/                         # 前端静态资源
├── server/                         # Express 后端
│   ├── database/                   # SQLite 数据层
│   │   ├── index.js                # 数据库初始化、连接管理（单例）
│   │   ├── productRepository.js    # 产品数据的 CRUD（预编译语句 + 事务）
│   │   ├── usersRepository.js      # 用户数据的 CRUD + bcrypt 密码验证
│   │   ├── translationsRepository.js  # 翻译数据的 CRUD
│   │   └── sync.js                 # 文件系统 ↔ SQLite 同步
│   ├── middleware/
│   │   └── auth.js                 # JWT 生成、验证、认证中间件
│   ├── routes/                     # API 路由
│   │   ├── products.js             # 产品管理路由
│   │   ├── folders.js              # 文件夹管理路由
│   │   ├── files.js                # 文件操作路由
│   │   └── uploads.js              # 文件上传路由
│   ├── services/                   # 业务逻辑层
│   │   ├── productService.js       # 产品业务逻辑
│   │   ├── folderService.js        # 文件夹业务逻辑
│   │   ├── fileService.js          # 文件业务逻辑
│   │   └── uploadService.js        # 上传业务逻辑
│   └── utils/                      # 工具函数
│       ├── buildProductObject.js   # 构建产品数据结构
│       ├── fsHelpers.js            # 文件系统辅助函数
│       ├── generateProductCatalog.js  # 生成产品目录
│       ├── productCatalogUtils.js  # 目录数据工具
│       └── safePath.js             # 路径安全校验
├── src/                            # Vue 3 前端源码
│   ├── App.vue                     # 根组件
│   ├── main.js                     # 应用入口
│   ├── components/                 # Vue 组件
│   │   ├── ui/                     # 基础 UI 组件库（24 个组件）
│   │   │   ├── alert.vue
│   │   │   ├── badge.vue
│   │   │   ├── breadcrumb.vue
│   │   │   ├── button.vue
│   │   │   ├── card.vue / card-header.vue
│   │   │   ├── drawer.vue
│   │   │   ├── empty-state.vue
│   │   │   ├── error-handler.vue / error-state.vue
│   │   │   ├── input.vue / password-input.vue / search-input.vue
│   │   │   ├── lazy-image.vue
│   │   │   ├── loading-state.vue
│   │   │   ├── lucide-icon.vue
│   │   │   ├── modal.vue
│   │   │   ├── notification-container.vue
│   │   │   ├── pagination.vue
│   │   │   ├── progress.vue
│   │   │   ├── shortcut-help.vue
│   │   │   ├── table.vue / tabs.vue
│   │   │   └── virtual-list.vue
│   │   ├── AdminLoginModal.vue         # 管理员登录
│   │   ├── BatchUploadModal.vue        # 批量上传
│   │   ├── Drawer.vue                  # 侧边栏抽屉
│   │   ├── Functionaldescription.vue   # 功能说明
│   │   ├── Header.vue                  # 页面头部
│   │   ├── I18nManagementPanel.vue     # 翻译管理
│   │   ├── Product3DHeader.vue         # 3D 查看器头部
│   │   ├── Product3DViewer.vue         # 3D 查看器
│   │   ├── ProductFolderUploader.vue   # 文件夹上传
│   │   ├── Product_Management.vue      # 产品管理
│   │   ├── Product_Viewimages.vue      # 图片查看
│   │   ├── Product_list.vue            # 产品列表（首页）
│   │   └── Product_nav.vue             # 产品详情
│   ├── composables/                  # 组合式函数
│   │   ├── useAdminAuth.js           # 管理员认证状态管理
│   │   ├── useDataFetch.js           # 数据获取
│   │   ├── useErrorMonitoring.js     # 错误监控和恢复
│   │   ├── useI18n.js                # 国际化
│   │   ├── useKeyboardShortcuts.js   # 键盘快捷键
│   │   ├── useNotifications.js       # 通知管理
│   │   ├── useTheme.js               # 共享主题管理
│   │   └── useTooltip.js             # 工具提示
│   ├── i18n/                         # 国际化
│   │   ├── index.js                  # 插件初始化
│   │   └── translations.js           # 翻译内容（种子数据）
│   ├── images/                       # 静态图片
│   │   ├── Logo.png
│   │   └── icelogo.webp
│   ├── lib/                          # 通用工具库
│   │   ├── toast.js                  # Toast 通知
│   │   └── utils.js                  # 通用工具函数
│   ├── router/                       # 路由配置
│   │   └── index.js                  # 6 个路由定义
│   ├── services/                     # 前端服务层
│   │   ├── apiService.js             # HTTP 请求封装（原生 fetch）
│   │   └── productService.js         # 产品 API 调用
│   ├── stores/                       # 状态管理（Pinia）
│   │   ├── notificationStore.js      # 通知状态
│   │   └── themeStore.js             # 主题状态
│   ├── styles/
│   │   └── globals.css               # 全局样式
│   ├── theme/                        # 主题配置
│   │   └── index.js                  # CSS 变量主题定义和切换
│   └── utils/                        # 前端工具
│       ├── cache.js                  # 缓存管理
│       ├── errorHandler.js           # 错误处理
│       ├── logger.js                 # 日志
│       └── responsive.js             # 响应式工具
├── uploads/                          # 临时上传目录（gitignore）
├── index.html                        # HTML 入口
├── server.js                         # Express 入口（含 CLI 命令）
├── vite.config.js                    # Vite 构建配置
├── tailwind.config.js                # Tailwind CSS 配置
├── postcss.config.js                 # PostCSS 配置
├── package.json                      # 项目依赖和脚本
├── CLAUDE.md                         # Claude Code 指引
├── README.md                         # 项目说明
├── docs/                             # 📖 项目文档
│   ├── README.md                     # 文档总索引
│   ├── architecture/
│   │   ├── overview.md               # 架构总览
│   │   └── structure.md              # 目录结构说明
│   ├── api/
│   │   └── reference.md              # API 参考文档
│   ├── deployment/
│   │   └── guide.md                  # 部署指南
│   ├── design/
│   │   └── colors.md                 # 设计系统 / 颜色变量
└── nginx.conf                        # Nginx 配置示例（生产环境）
```

## 代码组织原则

### 分层架构

- **表现层**: Vue 组件负责 UI 渲染
- **业务层**: Service 类处理业务逻辑
- **数据层**: SQLite 数据库（产品元数据 + 翻译 + 用户）+ 文件系统（图片文件）
- **工具层**: 通用工具函数

### 模块化设计

- **组件复用**: UI 组件在 `components/ui/` 高度可复用
- **功能封装**: 每个 Service 专注特定功能
- **工具集成**: 通用工具函数集中管理

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件（业务） | PascalCase | `Product_list.vue` |
| Vue 组件（UI） | PascalCase | `button.vue` |
| JS 模块 | camelCase / PascalCase | `useAdminAuth.js` / `ProductService.js` |
| 图片文件 | `image_XX.webp` | `image_00.webp` |
| 产品文件夹 | 英文、数字、下划线 | `cobi18` |

## 扩展性

- 新的 API 功能：在 `server/routes/` 添加路由，在 `server/services/` 添加业务逻辑
- 新的前端页面：在 `src/components/` 添加组件，在 `src/router/index.js` 添加路由
- 新的 UI 组件：在 `src/components/ui/` 添加基础组件
- 新的翻译键：通过翻译管理界面（`I18nManagementPanel.vue`）或直接操作 SQLite（`translations` 表）
- 新的管理员：通过 `node server.js init-admin` CLI 命令或直接操作 SQLite（`users` 表）
