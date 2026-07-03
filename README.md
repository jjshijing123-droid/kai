# ICE 图片查看器 - 产品管理系统

基于文件系统的产品管理系统，提供产品展示、文件管理和图片查看功能。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Vue](https://img.shields.io/badge/vue-3.5.24-blue.svg)

## 📋 项目简介

ICE图片查看器是一个现代化的产品管理系统，采用前后端分离架构，基于文件系统进行产品数据管理。系统提供直观的产品展示界面，支持多角度图片查看、批量文件管理、实时翻译管理等功能。

## ✨ 主要功能

### 🎯 核心功能
- **产品展示管理** - 基于文件系统的产品目录展示
- **多角度图片查看** - 支持产品4个视角的图片查看
- **文件批量上传** - 支持批量文件上传和文件夹上传
- **产品目录管理** - 动态生成和管理产品目录
- **实时翻译管理** - 支持中英文切换和翻译键管理

### 🛠️ 管理功能
- **管理员登录** - 安全的管理员认证系统
- **文件操作** - 文件的增删改查操作
- **文件夹管理** - 灵活的文件夹结构管理
- **错误监控** - 完善的错误处理和监控机制
- **响应式设计** - 适配各种设备尺寸

### 🔧 技术特性
- **文件系统驱动** - 基于文件系统，无需数据库
- **RESTful API** - 标准化的API接口设计
- **实时数据更新** - 支持产品目录实时刷新
- **CORS 域名白名单** - 通过 `CORS_ORIGIN` 环境变量配置，支持逗号分隔多域名
- **现代化UI** - 基于Tailwind CSS的美观界面

## 🏗️ 技术栈

### 前端技术
- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js官方路由管理器
- **Tailwind CSS** - 实用优先的CSS框架
- **lucide-vue-next** - 现代化图标库
- **class-variance-authority** - 组件变体管理
- **clsx** - 条件类名工具
- **tailwind-merge** - Tailwind类名合并
- **tailwindcss-animate** - Tailwind动画扩展
- **axios** - HTTP客户端
- **file-saver** - 文件下载工具
- **JSZip** - 前端ZIP文件处理

### 后端技术
- **Node.js** - JavaScript运行时环境
- **Express.js** - Node.js Web应用框架
- **Multer** - Node.js文件上传中间件
- **CORS** - 跨域资源共享中间件
- **Archiver** - 压缩文件处理
- **Unzipper** - ZIP文件解压
- **node-fetch** - HTTP客户端

### 开发工具
- **ESBuild** - 极快的JavaScript打包器
- **PostCSS** - CSS后处理器
- **Autoprefixer** - CSS浏览器兼容性处理
- **Concurrently** - 并行运行多个npm脚本
- **terser** - JavaScript压缩器

## 📚 文档

项目文档位于 `docs/` 目录：

- [文档总索引](docs/README.md) — 所有文档的导航入口
- [架构总览](docs/architecture/overview.md) — 技术栈和核心模块
- [API 参考](docs/api/reference.md) — RESTful 接口文档
- [部署指南](docs/deployment/guide.md) — 生产环境部署
- [设计系统](docs/design/colors.md) — 颜色变量和主题配置

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn
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

3. **启动开发服务器**
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器
npm run server

# 同时启动前后端（推荐）
npm run start
```

4. **访问应用**
- 前端地址: http://localhost:5173
- 后端API: http://localhost:3000
- 产品查看器: http://localhost:3000

### 生产环境部署

1. **构建前端**
```bash
npm run build
```

2. **启动生产环境**
```bash
npm run prod
```

## 📁 项目结构

```
kai/
├── server/                # Express 后端
│   ├── routes/            # API 路由（products, folders, files, uploads）
│   ├── services/          # 业务逻辑层
│   └── utils/             # 工具函数
├── src/                   # Vue 3 前端
│   ├── components/        # 组件（ui/ 基础组件 + 业务组件）
│   ├── composables/       # 组合式函数（7 个）
│   ├── i18n/              # 国际化
│   ├── router/            # 路由（6 个路由）
│   ├── services/          # 前端 API 服务
│   ├── stores/            # 状态管理
│   └── utils/             # 工具函数
├── Product/               # 产品文件存储（gitignore）
├── data/                  # 产品目录数据（自动生成，gitignore）
├── public/                # 静态资源
├── docs/                  # 📖 项目文档
└── uploads/               # 临时上传目录（gitignore）
```

## 🔌 API接口

### 产品管理 API

#### 获取所有产品
```http
GET /api/products
```

#### 创建新产品
```http
POST /api/products
```

#### 重命名产品
```http
PUT /api/products/{productName}
```

#### 删除产品
```http
DELETE /api/products/{productName}
```

#### 根据ID获取产品详情
```http
GET /api/products/{id}
```

#### 根据产品名称获取详情
```http
GET /api/products/name/{productName}
```

#### 获取产品图片列表
```http
GET /api/products/{productName}/images/{imageType}
```

#### 重新生成产品目录
```http
POST /api/products/refresh-catalog
```

#### 获取产品目录（统一接口）
```http
GET /api/products/catalog
```
**说明**: 开发/生产环境统一使用此接口，替代直接读取静态 JSON 文件。

#### 从数据库获取产品（兼容模式）
```http
GET /api/db/products
```

#### 根据名称获取产品详情（兼容模式）
```http
GET /api/db/products/name/{productName}
```

### 文件夹管理 API

#### 获取文件夹详情
```http
GET /api/folder/{folderPath}/details
```

#### 创建子文件夹
```http
POST /api/folder/{parentPath}/create-subfolder
```

#### 删除子文件夹
```http
DELETE /api/folder/{parentPath}/subfolder/{folderName}
```

#### 重命名子文件夹
```http
PUT /api/folder/{parentPath}/subfolder/{folderName}
```

#### 获取文件夹树结构
```http
GET /api/folder/{folderPath}/tree?maxDepth=3
```

#### 搜索文件
```http
GET /api/folder/{folderPath}/search?searchTerm=关键词&fileTypes=jpg,png
```

### 文件操作 API

#### 删除文件
```http
POST /api/delete-file
```

#### 检查文件夹是否有文件
```http
GET /api/check-folder/{folderPath}
```

#### 获取文件信息
```http
GET /api/file-info/{filePath}
```

#### 获取文件下载链接
```http
GET /api/download/{filePath}/{fileName}
```

### 文件上传 API

#### 上传文件到指定文件夹
```http
POST /api/upload-files
```

#### 上传单个产品文件夹
```http
POST /api/upload-product-folder
```

#### 批量替换产品
```http
POST /api/batch-replace-products
```

#### 手动重新生成产品目录
```http
POST /api/regenerate-catalog
```

#### 获取上传进度
```http
GET /api/upload-progress/{uploadId}
```

### 国际化 API

#### 获取所有翻译
```http
GET /api/i18n/translations
```

#### 更新翻译
```http
POST /api/i18n/translations
```

#### 添加翻译键
```http
POST /api/i18n/translations/keys
```

#### 更新翻译键
```http
PUT /api/i18n/translations/keys/{key}
```

#### 删除翻译键
```http
DELETE /api/i18n/translations/keys/{key}
```

## 🎮 使用说明

### 产品管理

1. **查看产品列表**
   - 访问首页查看所有产品
   - 使用搜索功能快速定位产品
   - 点击产品卡片查看详细信息

2. **产品图片查看**
   - 支持4个视角的图片切换
   - 点击图片可放大查看
   - 支持键盘快捷键操作

3. **产品上传**
   - 使用批量上传功能
   - 支持文件夹结构上传
   - 自动生成产品目录

### 管理功能

1. **管理员登录**
   - 点击右上角管理员按钮
   - 输入管理员凭据
   - 获得管理权限

2. **文件管理**
   - 上传、删除、重命名文件
   - 创建和管理文件夹
   - 批量操作支持

3. **翻译管理**
   - 实时编辑翻译内容
   - 添加新的翻译键
   - 多语言内容管理

### 快捷键

- `Ctrl/Cmd + K` - 打开快捷键帮助
- `Escape` - 关闭模态框
- `F11` - 全屏查看图片

## 🔧 配置说明

### 环境变量

```bash
PORT=3000                    # 服务器端口
NODE_ENV=development         # 运行环境
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com  # CORS 白名单（逗号分隔多域名）
ADMIN_USER=admin             # 管理员用户名
ADMIN_PASS=admin123          # 管理员密码
JWT_SECRET=change-me-in-prod # JWT 密钥
```

### 配置文件

- `vite.config.js` - Vite构建配置
- `tailwind.config.js` - Tailwind CSS配置
- `postcss.config.js` - PostCSS配置

## 🛠️ 开发指南

### 开发环境设置

1. **安装开发依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run start
```

3. **代码格式化和检查**
```bash
# 使用ESLint检查代码
npm run lint

# 自动修复代码格式
npm run lint:fix
```

### 添加新功能

1. **前端组件开发**
   - 在 `src/components/` 创建Vue组件
   - 使用组合式API
   - 遵循项目命名规范

2. **后端API开发**
   - 在 `server/routes/` 添加路由
   - 在 `server/services/` 实现业务逻辑
   - 添加相应的错误处理

3. **样式开发**
   - 使用Tailwind CSS类
   - 保持设计一致性
   - 支持响应式设计

## 🐛 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 查看端口使用情况
   lsof -i :3000
   # 终止占用端口的进程
   kill -9 <PID>
   ```

2. **文件权限问题**
   ```bash
   # 修复上传目录权限
   chmod 755 uploads/
   chmod 755 Product/
   ```

3. **依赖安装失败**
   ```bash
   # 清除npm缓存
   npm cache clean --force
   # 删除node_modules重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

### 调试模式

1. **启用详细日志**
```bash
NODE_ENV=development npm run server
```

2. **前端调试**
- 使用浏览器开发者工具
- Vue DevTools扩展
- Network面板查看API请求

## 📈 性能优化

- **文件压缩** - 生产环境自动压缩静态资源
- **图片优化** - 支持WebP格式
- **懒和组件懒加载加载** - 图片
- **缓存策略** - 合理的浏览器缓存设置

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目基于MIT许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 作者

- **项目开发** - ICE开发团队

## 🙏 致谢

- Vue.js团队提供的优秀框架
- Tailwind CSS提供的实用样式解决方案
- Express.js提供的强大后端支持

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](issues-url)
- 邮箱: support@iceviewer.com

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！