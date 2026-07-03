# 项目目录结构说明

## 完整目录树

```
kai/
├── .claude/                      # Claude Code 项目设置
│   └── settings.json             # 权限和配置
├── Product/                      # 产品文件存储目录（gitignore）
│   └── {产品文件夹}/              # 每个产品一个文件夹
│       ├── images_6Views/        # 6 视图图片
│       ├── images_other/         # 其他图片
│       ├── view1/ - view4/       # 4 个视角的 32 帧图片序列
├── public/                       # 前端静态资源
│   └── data/
│       └── product-catalog.json  # 后端生成的产品目录
├── server/                       # Express 后端
│   ├── routes/                   # API 路由
│   │   ├── files.js              # 文件操作路由
│   │   ├── folders.js            # 文件夹管理路由
│   │   ├── products.js           # 产品管理路由
│   │   └── uploads.js            # 文件上传路由
│   ├── services/                 # 业务逻辑层
│   │   ├── fileService.js        # 文件操作业务逻辑
│   │   ├── folderService.js      # 文件夹管理业务逻辑
│   │   ├── productService.js     # 产品业务逻辑
│   │   └── uploadService.js      # 上传业务逻辑
│   └── utils/                    # 工具函数
│       ├── buildProductObject.js # 构建产品对象
│       ├── fsHelpers.js          # 文件系统辅助函数
│       ├── generateProductCatalog.js  # 生成产品目录
│       └── productCatalogUtils.js     # 目录数据工具
├── src/                          # Vue 前端源码
│   ├── App.vue                   # 根组件
│   ├── main.js                   # 应用入口
│   ├── components/               # Vue 组件
│   │   ├── ui/                   # 基础 UI 组件库
│   │   │   ├── alert.vue
│   │   │   ├── badge.vue
│   │   │   ├── breadcrumb.vue
│   │   │   ├── button.vue
│   │   │   ├── card.vue
│   │   │   ├── card-header.vue
│   │   │   ├── drawer.vue
│   │   │   ├── empty-state.vue
│   │   │   ├── error-handler.vue
│   │   │   ├── error-state.vue
│   │   │   ├── input.vue
│   │   │   ├── lazy-image.vue
│   │   │   ├── loading-state.vue
│   │   │   ├── lucide-icon.vue
│   │   │   ├── modal.vue
│   │   │   ├── notification-container.vue
│   │   │   ├── pagination.vue
│   │   │   ├── password-input.vue
│   │   │   ├── progress.vue
│   │   │   ├── search-input.vue
│   │   │   ├── shortcut-help.vue
│   │   │   ├── table.vue
│   │   │   ├── tabs.vue
│   │   │   └── virtual-list.vue
│   │   ├── admin-login-modal.vue         # 管理员登录
│   │   ├── batch-upload-modal.vue        # 批量上传
│   │   ├── drawer.vue                    # 侧边栏抽屉
│   │   ├── functional-description.vue    # 功能说明
│   │   ├── header.vue                    # 页面头部
│   │   ├── i18n-management-panel.vue     # 翻译管理
│   │   ├── product-3d-header.vue         # 3D 查看器头部
│   │   ├── product-3d-viewer.vue         # 3D 查看器
│   │   ├── product-folder-uploader.vue   # 文件夹上传
│   │   ├── product-management.vue        # 产品管理
│   │   ├── product-viewimages.vue        # 图片查看
│   │   ├── product-list.vue              # 产品列表
│   │   └── product-nav.vue               # 产品详情
│   ├── composables/                     # 组合式函数
│   │   ├── useAdminAuth.js
│   │   ├── useDataFetch.js
│   │   ├── useErrorMonitoring.js
│   │   ├── useI18n.js
│   │   ├── useKeyboardShortcuts.js
│   │   ├── useNotifications.js
│   │   ├── useTheme.js                  # 共享主题管理
│   │   └── useTooltip.js
│   ├── i18n/                            # 国际化
│   │   ├── index.js                     # 插件初始化
│   │   └── translations.js              # 翻译内容
│   ├── images/                          # 静态图片
│   │   ├── logo.png
│   │   └── icelogo.webp
│   ├── lib/                             # 通用工具库
│   │   ├── toast.js                     # Toast 通知
│   │   └── utils.js                     # 通用工具函数
│   ├── router/                          # 路由配置
│   │   └── index.js                     # 6 个路由定义
│   ├── services/                        # 前端服务层
│   │   ├── apiService.js                # HTTP 请求封装
│   │   └── productService.js            # 产品 API 调用
│   ├── stores/                          # 状态管理
│   │   ├── notificationStore.js         # 通知状态（Pinia）
│   ├── styles/                          # 全局样式
│   │   └── globals.css
│   ├── theme/                           # 主题配置
│   │   └── index.js                     # 主题定义和切换
│   └── utils/                           # 前端工具
│       ├── errorHandler.js
│       ├── logger.js
│       └── responsive.js
├── uploads/                     # 临时上传目录（gitignore）
├── index.html                   # HTML 入口
├── package.json                 # 项目依赖和脚本
├── vite.config.js               # Vite 构建配置
├── tailwind.config.js           # Tailwind CSS 配置
├── postcss.config.js            # PostCSS 配置
├── server.js                    # Express 入口
├── CLAUDE.md                    # Claude Code 指引
└── README.md                    # 项目说明
```

## 代码组织原则

### 分层架构

- **表现层**: Vue 组件负责 UI 渲染
- **业务层**: Service 类处理业务逻辑
- **数据层**: 直接文件系统操作
- **工具层**: 通用工具函数

### 模块化设计

- **组件复用**: UI 组件在 `components/ui/` 高度可复用
- **功能封装**: 每个 Service 专注特定功能
- **工具集成**: 通用工具函数集中管理

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件（业务） | kebab-case | `product-list.vue` |
| Vue 组件（UI） | kebab-case | `button.vue` |
| JS 模块 | camelCase / PascalCase | `useAdminAuth.js` / `ProductService.js` |
| 图片文件 | `image_XX.webp` | `image_00.webp` |
| 产品文件夹 | 英文、数字、下划线 | `cobi18` |

## 扩展性

- 新的 API 功能：在 `server/routes/` 添加路由，在 `server/services/` 添加业务逻辑
- 新的前端页面：在 `src/components/` 添加组件，在 `src/router/index.js` 添加路由
- 新的 UI 组件：在 `src/components/ui/` 添加基础组件
- 新的翻译键：通过管理界面或直接修改 `src/i18n/translations.js`
