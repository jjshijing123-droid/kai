# 项目文件目录说明

## 项目基本信息

- **项目名称**: product-management-system
- **版本**: 1.0.0
- **描述**: 基于文件系统的产品管理系统
- **技术栈**: Vue 3 + Express + Tailwind CSS

## 根目录结构

| 目录/文件 | 说明 |
|----------|------|
| `.figma` | Figma设计文件相关资源 |
| `.git` | Git版本控制目录 |
| `.vscode` | VS Code配置文件 |
| `Product` | 产品相关资源目录 |
| `docs` | 项目文档目录 |
| `examples` | 示例代码目录 |
| `node_modules` | Node.js依赖包目录 |
| `public` | 静态资源目录，用于存放不需要经过构建处理的文件 |
| `server` | 后端Express服务代码 |
| `src` | 前端Vue应用代码 |
| `uploads` | 文件上传目录 |
| `.DS_Store` | macOS系统文件 |
| `.gitignore` | Git忽略文件配置 |
| `index.html` | 应用入口HTML文件 |
| `package-lock.json` | 依赖版本锁定文件 |
| `package.json` | 项目配置和依赖管理文件 |
| `postcss.config.js` | PostCSS配置文件 |
| `server.js` | 后端服务入口文件 |
| `tailwind.config.js` | Tailwind CSS配置文件 |
| `tailwind-shorthand-cheatsheet.md` | Tailwind CSS简写速查表 |
| `tailwind-theme-guide-additions.md` | Tailwind主题扩展指南 |
| `tailwind-theme-guide.md` | Tailwind主题指南 |
| `vite.config.js` | Vite构建工具配置文件 |

## 前端目录结构 (src/)

| 目录/文件 | 说明 |
|----------|------|
| `components/` | Vue组件目录 |
| `composables/` | Vue 3组合式API函数目录 |
| `i18n/` | 国际化相关配置和资源 |
| `images/` | 图片资源目录 |
| `lib/` | 第三方库或自定义库 |
| `router/` | Vue Router配置目录 |
| `services/` | API服务和业务逻辑 |
| `stores/` | 状态管理目录 |
| `styles/` | 全局样式文件 |
| `tests/` | 测试文件目录 |
| `theme/` | 主题相关配置 |
| `utils/` | 工具函数目录 |
| `App.vue` | 应用根组件 |
| `main.js` | 应用入口文件 |

### 组件目录 (src/components/)

| 组件名称 | 说明 |
|---------|------|
| `AdminAccessDenied.vue` | 管理员访问拒绝组件 |
| `AdminLoginModal.vue` | 管理员登录模态框组件 |
| `Drawer.vue` | 抽屉式侧边栏组件 |
| `FileUploader.vue` | 文件上传组件 |
| `FolderManager.vue` | 文件夹管理组件 |xxxxx
| `Header.vue` | 页面头部组件 |
| `I18nManagementPanel.vue` | 国际化管理面板组件 |
| `Product3DHeader.vue` | 3D产品头部组件 |
| `Product3DViewer.vue` | 3D产品查看器组件 |
| `ProductDetailManagement.vue` | 产品详情管理组件 |xxxx
| `ProductFileUploader.vue` | 产品文件上传组件 |
| `ProductFolderUploader.vue` | 产品文件夹上传组件 |
| `ProductListOptimized.vue` | 优化的产品列表组件 |xxx
| `Product_Management.vue` | 产品管理主组件 |
| `Product_Viewimages.vue` | 产品图片查看组件 |
| `Product_list.vue` | 产品列表组件 |
| `Product_nav.vue` | 产品导航组件 |
| `ZipUploadZone.vue` | ZIP文件上传区域组件 |
| `ui/` | UI组件子目录 |

#### UI组件子目录详情 (src/components/ui/)

| 组件名称 | 说明 |
|---------|------|
| `EmptyState.vue` | 空状态展示组件 |
| `ErrorHandler.vue` | 错误处理组件 |
| `ErrorState.vue` | 错误状态展示组件 |
| `LazyImage.vue` | 图片懒加载组件 |
| `LoadingState.vue` | 加载状态展示组件 |
| `LucideIcon.vue` | Lucide图标组件封装 |
| `NotificationContainer.vue` | 通知容器组件 |
| `ShortcutHelp.vue` | 快捷键帮助组件 |
| `VirtualList.vue` | 虚拟列表组件，用于高效渲染大量数据 |
| `alert.vue` | 警告提示组件 |
| `badge.vue` | 徽章组件 |
| `breadcrumb.vue` | 面包屑导航组件 |
| `button.vue` | 按钮组件 |
| `card-header.vue` | 卡片头部组件 |
| `card.vue` | 卡片容器组件 |
| `drawer.vue` | 抽屉组件 |
| `input.vue` | 输入框组件 |
| `modal.vue` | 模态框组件 |
| `pagination.vue` | 分页组件 |
| `password` | 密码相关组件目录 |
| `password-input.vue` | 密码输入框组件 |
| `progress.vue` | 进度条组件 |
| `search-input.vue` | 搜索输入框组件 |
| `table.vue` | 表格组件 |
| `tabs.vue` | 标签页组件 |

## 后端目录结构 (server/)

| 目录/文件 | 说明 |
|----------|------|
| `routes/` | 后端路由配置 |
| `services/` | 后端服务逻辑 |
| `utils/` | 后端工具函数 |

## 主要配置文件说明

### package.json
- 项目基本信息配置
- 依赖包管理
- 脚本命令配置（开发、构建、启动等）

### vite.config.js
- Vite构建工具配置
- 开发服务器配置
- 插件配置

### tailwind.config.js
- Tailwind CSS主题配置
- 自定义样式扩展
- 插件配置

### postcss.config.js
- PostCSS插件配置

### server.js
- Express服务入口文件
- 中间件配置
- 路由注册

## 主要功能模块

1. **产品管理**
   - 产品列表展示
   - 产品详情管理
   - 产品3D预览
   - 产品文件上传与管理

2. **文件系统管理**
   - 文件夹管理
   - 文件上传与下载
   - ZIP文件处理

3. **国际化支持**
   - 多语言切换
   - 国际化资源管理

4. **管理员功能**
   - 管理员登录
   - 访问权限控制

5. **响应式设计**
   - 适配不同屏幕尺寸
   - 移动端支持

## 开发与构建

- **开发模式**: `npm run dev` - 启动前端开发服务器
- **后端服务**: `npm run server` - 启动后端Express服务
- **完整启动**: `npm run start` - 同时启动前端和后端服务

## 技术栈

- **前端框架**: Vue 3
- **路由**: Vue Router 4
- **状态管理**: 未明确指定（可能使用Pinia或Vuex）
- **UI框架**: Tailwind CSS
- **构建工具**: Vite
- **后端**: Express.js
- **文件上传**: Multer
- **国际化**: Vue I18n
- **3D预览**: 未明确指定
- **HTTP客户端**: Axios

## 项目特点

1. **基于文件系统**: 产品数据和文件直接存储在文件系统中
2. **响应式设计**: 适配各种设备尺寸
3. **国际化支持**: 多语言切换功能
4. **3D产品预览**: 支持3D模型查看
5. **管理员权限控制**: 限制敏感操作的访问
6. **文件上传管理**: 支持多种文件类型和ZIP文件处理
7. **现代化技术栈**: 使用最新的Vue 3和Express技术

## 部署说明

1. 安装依赖: `npm install`
2. 构建前端: `npm run build`
3. 启动服务: `npm run server`
4. 访问应用: 浏览器访问指定端口（默认3000）

## 注意事项

1. 确保`uploads`目录存在且有写入权限
2. 根据实际部署环境配置端口和路径
3. 生产环境建议使用反向代理（如Nginx）
4. 定期备份`Product`和`uploads`目录的数据