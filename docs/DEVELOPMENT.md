# 产品展示系统 - 开发文档

## 项目概述

本项目是一个基于文件系统的现代化产品展示系统，采用前后端分离架构，基于 Vue 3 + Node.js 构建。系统主要提供产品图片展示、360度旋转查看、产品文件夹管理等功能，无需传统数据库，完全基于文件系统进行数据存储。

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI库**: Ant Design Vue
- **路由**: Vue Router
- **国际化**: 自定义国际化系统
- **样式**: CSS3 + 响应式设计
- **状态管理**: 原生Vue响应式（未使用Pinia）

### 后端技术栈
- **运行环境**: Node.js
- **框架**: Express.js
- **数据结构**: 文件系统 + JSON文件
- **文件上传**: Multer
- **跨域**: CORS
- **日志**: 控制台日志

### 架构特点
- **文件系统存储**: 无需数据库，基于文件系统存储产品数据
- **前后端分离**: RESTful API设计
- **响应式界面**: 支持多端适配
- **轻量化设计**: 简单易维护的技术栈
- **国际化支持**: 中英双语界面

## 项目结构

```
product-management-system/
├── src/                        # 前端源码
│   ├── components/            # Vue组件
│   │   ├── ui/               # 通用UI组件
│   │   │   ├── ErrorState.vue
│   │   │   ├── LoadingState.vue
│   │   │   ├── NotificationContainer.vue
│   │   │   ├── ShortcutHelp.vue
│   │   │   └── VirtualList.vue
│   │   ├── AdminAccessDenied.vue
│   │   ├── AdminLoginModal.vue
│   │   ├── Drawer.vue
│   │   ├── FileUploader.vue
│   │   ├── FolderManager.vue
│   │   ├── Header.vue
│   │   ├── I18nManagementPanel.vue
│   │   ├── Product3DHeader.vue
│   │   ├── Product3DViewer.vue
│   │   ├── ProductDetailManagement.vue
│   │   ├── ProductFolderUploader.vue
│   │   ├── Product_list.vue
│   │   ├── Product_Management.vue
│   │   ├── Product_nav.vue
│   │   └── Product_Viewimages.vue
│   ├── composables/           # 组合式函数
│   │   ├── useAdminAuth.js
│   │   ├── useDataFetch.js
│   │   ├── useErrorMonitoring.js
│   │   ├── useI18n.js
│   │   ├── useKeyboardShortcuts.js
│   │   ├── useNotifications.js
│   │   └── useTooltip.js
│   ├── i18n/                 # 国际化系统
│   │   ├── advancedI18n.js
│   │   ├── index.js
│   │   ├── translations.js
│   │   ├── common/
│   │   └── components/
│   ├── services/             # API服务层
│   │   ├── apiService.js
│   │   └── productService.js
│   ├── router/               # 路由配置
│   │   └── index.js
│   ├── stores/              # 状态管理（目前只有一个notificationStore）
│   ├── styles/              # 样式文件
│   ├── tests/               # 测试文件
│   └── utils/               # 工具函数
├── server/                   # 后端源码
│   ├── routes/              # 路由定义
│   │   ├── products.js      # 产品管理路由
│   │   ├── files.js         # 文件操作路由
│   │   ├── folders.js       # 文件夹管理路由
│   │   └── uploads.js       # 上传管理路由
│   ├── services/            # 业务逻辑
│   │   ├── productService.js
│   │   ├── fileService.js
│   │   ├── folderService.js
│   │   └── uploadService.js
│   └── utils/               # 工具函数
│       └── productCatalogUtils.js
├── docs/                     # 项目文档
├── public/                   # 静态资源
│   └── data/                # 产品目录数据
│       └── product-catalog.json
├── Product/                  # 产品文件夹目录
└── package.json
```

## 核心功能

### 1. 产品展示
- **产品列表**: 基于JSON配置文件的动态产品列表
- **产品详情**: 多视角产品图片展示
- **360度查看**: 使用WebGL技术实现的旋转查看
- **图片管理**: 支持多种图片格式的展示和管理

### 2. 产品管理
- **文件夹管理**: 产品文件夹的创建、重命名、删除
- **文件管理**: 产品内部文件的上传、删除、重命名
- **批量操作**: ZIP包批量上传和替换功能
- **权限控制**: 管理员权限验证

### 3. 文件系统架构
- **产品目录**: Product/目录下存储所有产品文件夹
- **标准结构**: 每个产品包含image_00.webp主图和view1-4视角图
- **图片分类**: 支持6视图、其他图片等分类存储
- **数据文件**: product-catalog.json配置文件

### 4. 国际化系统
- **双语支持**: 中文和英文界面
- **动态切换**: 实时语言切换
- **翻译管理**: 管理员可编辑翻译内容
- **本地存储**: 翻译内容保存在localStorage

### 5. 用户体验优化
- **响应式设计**: 适配多种屏幕尺寸
- **图片懒加载**: 优化页面加载性能
- **实时通知**: 操作反馈和状态提示
- **错误处理**: 友好的错误提示和恢复机制

## 开发环境搭建

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd product-management-system
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
# 启动前端开发服务器
npm run dev

# 新终端窗口启动后端服务器
npm run server
```

4. **访问应用**
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

### 开发工具推荐

#### 前端开发
- **VSCode**: 主要开发工具
- **Volar**: Vue 3语言支持
- **Prettier**: 代码格式化
- **Vue DevTools**: Vue调试插件

#### 后端开发
- **Nodemon**: 监听文件变化重启（需要单独安装）
- **Postman**: API测试工具
- **Node.js内置调试器**: 断点调试

## 核心代码说明

### 前端核心组件

#### 1. 组合式函数 (Composables)

**useI18n.js** - 国际化系统
```javascript
export function useI18n() {
  const currentLanguage = ref('en')
  const t = (key) => {
    // 获取翻译文本
  }
  const setLanguage = (lang) => {
    // 设置语言
  }
  return { currentLanguage, t, setLanguage }
}
```

**useDataFetch.js** - 数据获取
```javascript
export function useDataFetch(url, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const fetch = async () => {
    // 数据获取逻辑
  }
  
  return { data, loading, error, fetch }
}
```

**useAdminAuth.js** - 管理员认证
```javascript
export function useAdminAuth() {
  const isAdminLoggedIn = ref(false)
  
  const login = (credentials) => {
    // 管理员登录逻辑
  }
  
  const logout = () => {
    // 登出逻辑
  }
  
  return { isAdminLoggedIn, login, logout }
}
```

#### 2. 主要组件

**ProductList.vue** - 产品列表
- 从product-catalog.json或API获取产品数据
- 展示产品缩略图和基本信息
- 支持搜索和筛选功能

**Product3DViewer.vue** - 360度查看器
- 使用Canvas技术实现图片序列播放
- 支持鼠标交互控制旋转
- 包含自动旋转和手动控制功能

**Product_Management.vue** - 产品管理
- 管理员专用的产品管理界面
- 支持产品文件夹的CRUD操作
- 包含批量上传功能

### 后端核心服务

#### 1. 产品服务 (productService.js)

```javascript
class ProductService {
  async getProducts() {
    // 读取Product/目录下的所有产品文件夹
    // 计算每个产品的文件数量和大小
    // 返回产品列表数据
  }
  
  async createProduct(productName, folderName) {
    // 创建新的产品文件夹结构
    // 生成标准子文件夹
  }
  
  async renameProduct(productName, newProductName, newFolderName) {
    // 重命名产品文件夹
    // 更新product-catalog.json配置
  }
  
  async deleteProduct(productName) {
    // 删除产品文件夹
    // 从配置文件中移除
  }
}
```

#### 2. 文件服务 (fileService.js)

```javascript
class FileService {
  async deleteFile(filePath) {
    // 删除指定文件
  }
  
  async getFileInfo(filePath) {
    // 获取文件信息
  }
  
  async checkFolderHasFiles(folderPath) {
    // 检查文件夹是否包含文件
  }
}
```

#### 3. 上传服务 (uploadService.js)

```javascript
class UploadService {
  async uploadZipFile(file, options) {
    // 解压ZIP文件
    // 移动文件到产品目录
    // 处理重名冲突
  }
  
  async batchReplaceProducts(zipFile) {
    // 批量替换产品文件夹
    // 创建备份
    // 验证文件结构
  }
}
```

## 数据结构

### 产品目录配置 (product-catalog.json)
```json
{
  "products": [
    {
      "id": 1,
      "name": "产品名称",
      "folderName": "文件夹名称",
      "category": "general",
      "description": "产品描述",
      "path": "Product/文件夹名称/",
      "mainImage": "/Product/文件夹名称/image_00.webp",
      "totalSize": 1234567,
      "fileCount": 135,
      "views": {
        "view1": "/Product/文件夹名称/view1/",
        "view2": "/Product/文件夹名称/view2/",
        "view3": "/Product/文件夹名称/view3/",
        "view4": "/Product/文件夹名称/view4/"
      },
      "additionalImages": {
        "sixViews": "/Product/文件夹名称/images_6Views/",
        "other": "/Product/文件夹名称/images_other/"
      }
    }
  ],
  "totalProducts": 1,
  "lastUpdated": "2025-11-26T03:10:30.899Z",
  "version": "2.0"
}
```

### 文件夹结构标准
```
Product/[产品名称]/
├── image_00.webp           # 产品主图（必须）
├── view1/                  # 视角1图片目录
│   ├── image_01.webp
│   ├── image_02.webp
│   └── ...
├── view2/                  # 视角2图片目录
├── view3/                  # 视角3图片目录
├── view4/                  # 视角4图片目录
├── images_6Views/          # 六视图图片目录
└── images_other/           # 其他图片目录
```

## 性能优化

### 前端优化
1. **图片懒加载**: 使用Intersection Observer API
2. **组件按需加载**: Vue路由懒加载
3. **虚拟滚动**: 大列表性能优化
4. **图片压缩**: WebP格式优化

### 后端优化
1. **静态文件服务**: Express静态文件中间件
2. **缓存策略**: 文件系统缓存
3. **文件压缩**: Gzip压缩响应
4. **请求优化**: 批量操作API

## 部署指南

### 本地开发部署
```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev          # 前端
npm run server       # 后端
```

### 生产环境部署
```bash
# 构建前端
npm run build

# 使用PM2部署后端
pm2 start server.js --name "product-system"

# Nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker部署
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "server"]
```

## 常见问题

### 开发问题

**Q: 前端热更新不生效？**
A: 检查Vite配置，确保文件监控正常，重启开发服务器。

**Q: API请求404错误？**
A: 确认后端服务正常运行，检查路由配置和CORS设置。

**Q: 产品图片不显示？**
A: 检查图片路径是否正确，确认文件存在于Product目录下。

**Q: 管理员权限验证失败？**
A: 检查localStorage中的admin_session值，确认登录状态。

### 性能问题

**Q: 页面加载缓慢？**
A: 优化图片大小，启用代码分割，检查网络请求。

**Q: 360度查看器卡顿？**
A: 减少图片数量，优化图片格式，使用WebP格式。

**Q: 批量上传失败？**
A: 检查ZIP文件格式和大小限制，确认服务器磁盘空间。

### 部署问题

**Q: 静态资源404？**
A: 配置正确的静态文件路径，检查Nginx配置。

**Q: API跨域问题？**
A: 配置CORS设置，确保前后端域名匹配。

**Q: 文件上传权限问题？**
A: 检查服务器文件系统权限，确保uploads目录可写。

## 开发规范

### 代码规范
1. **组件命名**: 使用PascalCase命名
2. **文件命名**: 使用kebab-case命名
3. **变量命名**: 使用camelCase命名
4. **常量命名**: 使用UPPER_SNAKE_CASE命名

### Git提交规范
```
feat: 添加新功能
fix: 修复Bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### 分支管理
- **main**: 主分支，用于生产环境
- **develop**: 开发分支
- **feature/***: 功能分支
- **hotfix/***: 修复分支

## 贡献指南

### 提交流程
1. 创建功能分支
2. 开发测试
3. 提交代码
4. 创建Pull Request
5. 代码审查
6. 合并到主分支

### 代码审查要点
- 代码质量和可读性
- 功能完整性
- 测试覆盖率
- 性能影响
- 安全考虑

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 联系方式

- **项目地址**: [GitHub Repository]
- **问题反馈**: [Issues]
- **文档地址**: [Documentation]
- **邮箱**: support@example.com

---

感谢使用产品展示系统！如有任何问题，欢迎反馈和建议。