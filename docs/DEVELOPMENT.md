# 产品管理系统 - 开发文档

## 项目概述

本项目是一个现代化的产品管理系统，采用前后端分离架构，提供了完整的产品、文件、文件夹管理功能。系统具备高性能、高可用性和良好的用户体验。

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI库**: Ant Design Vue
- **状态管理**: Pinia
- **路由**: Vue Router
- **国际化**: 自定义国际化系统
- **样式**: CSS3 + 响应式设计
- **测试**: Vitest + Vue Test Utils

### 后端技术栈
- **运行环境**: Node.js
- **框架**: Express.js
- **数据结构**: JSON文件存储
- **认证**: JWT Token
- **文件上传**: Multer
- **日志**: Winston
- **测试**: Jest + Supertest

### 架构特点
- **模块化设计**: 前后端均采用模块化架构
- **RESTful API**: 标准REST接口设计
- **响应式界面**: 支持多端适配
- **错误处理**: 完善的错误处理机制
- **性能优化**: 缓存、懒加载、虚拟滚动等优化
- **国际化**: 支持多语言切换

## 项目结构

```
product-management-system/
├── frontend/                    # 前端代码
│   ├── src/
│   │   ├── components/         # Vue组件
│   │   │   ├── ui/            # 通用UI组件
│   │   │   ├── forms/         # 表单组件
│   │   │   └── layout/        # 布局组件
│   │   ├── composables/       # 组合式函数
│   │   ├── services/          # API服务
│   │   ├── stores/           # Pinia状态管理
│   │   ├── utils/            # 工具函数
│   │   ├── styles/           # 样式文件
│   │   ├── i18n/             # 国际化
│   │   └── tests/            # 测试文件
│   ├── public/               # 静态资源
│   └── docs/                 # 前端文档
├── backend/                   # 后端代码
│   ├── routes/               # 路由定义
│   ├── services/             # 业务逻辑
│   ├── middleware/           # 中间件
│   ├── utils/                # 工具函数
│   ├── uploads/              # 文件上传目录
│   └── tests/                # 后端测试
├── docs/                     # 项目文档
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 核心功能

### 1. 产品管理
- **产品CRUD**: 创建、读取、更新、删除产品
- **分类管理**: 产品分类和标签管理
- **搜索筛选**: 支持多条件搜索和排序
- **批量操作**: 批量更新、删除产品
- **库存管理**: 库存数量和状态管理

### 2. 文件管理
- **文件上传**: 支持多种文件格式
- **文件夹组织**: 层级文件夹管理
- **文件预览**: 在线预览图片、PDF等
- **文件下载**: 安全的文件下载
- **文件操作**: 重命名、移动、删除

### 3. 3D产品展示
- **3D模型渲染**: WebGL 3D模型展示
- **交互控制**: 旋转、缩放、平移
- **材质贴图**: 支持多材质展示
- **动画效果**: 产品动画播放

### 4. 用户体验优化
- **响应式设计**: 适配多种屏幕尺寸
- **国际化支持**: 多语言界面
- **快捷键**: 常用操作快捷键
- **主题切换**: 深色/浅色主题
- **通知系统**: 实时操作反馈

### 5. 错误处理与监控
- **全局错误处理**: 统一的错误捕获
- **日志系统**: 分级日志记录
- **错误监控**: 实时错误统计
- **自动恢复**: 错误自动恢复机制
- **健康检查**: 系统状态监控

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
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..
```

3. **配置环境变量**
```bash
# 复制环境配置
cp .env.example .env

# 编辑配置文件
nano .env
```

4. **启动开发服务器**
```bash
# 启动后端服务器
npm run server

# 新终端窗口启动前端开发服务器
npm run dev
```

5. **访问应用**
- 前端: http://localhost:5173
- 后端API: http://localhost:3000/api
- API文档: http://localhost:3000/api-docs

### 开发工具推荐

#### 前端开发
- **VSCode**: 主要开发工具
- **Vue DevTools**: Vue调试插件
- **Volar**: Vue 3语言支持
- **Prettier**: 代码格式化
- **ESLint**: 代码检查

#### 后端开发
- **Nodemon**: 监听文件变化重启
- **Postman**: API测试工具
- **Winston**: 日志查看
- **Jest**: 单元测试

## 核心代码说明

### 前端核心组件

#### 1. 组合式函数 (Composables)

**useDataFetch.js** - 数据获取抽象
```javascript
// 统一的数据获取模式
export function useDataFetch(url, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const fetch = async () => {
    // 加载状态、重试机制、错误处理
  }
  
  return { data, loading, error, fetch, retry }
}
```

**useNotifications.js** - 通知系统
```javascript
// 丰富的通知功能
export function useNotifications() {
  const notifySuccess = (message) => // 成功通知
  const notifyError = (message) =>   // 错误通知
  const notifyConfirm = (message) => // 确认对话框
}
```

**useErrorMonitoring.js** - 错误监控
```javascript
// 错误统计和恢复
export function useErrorMonitoring() {
  const errorStats = reactive({})  // 错误统计
  const registerErrorType = () =>  // 注册错误类型
  const attemptRecovery = () =>    // 尝试恢复
}
```

#### 2. 通用UI组件

**LoadingState.vue** - 加载状态组件
- 支持多种加载样式
- 可自定义消息和图标
- 性能优化，内存占用低

**ErrorState.vue** - 错误状态组件
- 友好的错误提示
- 自动重试功能
- 错误详情展开

**VirtualList.vue** - 虚拟列表组件
- 大数据量高性能渲染
- 支持自定义行高
- 内存使用优化

### 后端核心服务

#### 1. 模块化架构

**productService.js** - 产品业务逻辑
```javascript
// 单一职责的产品服务
class ProductService {
  async createProduct(data) {
    // 验证、创建、缓存
  }
  
  async getProducts(filters) {
    // 搜索、分页、排序
  }
  
  async updateProduct(id, data) {
    // 更新、版本控制
  }
}
```

**fileService.js** - 文件管理服务
```javascript
// 文件操作抽象
class FileService {
  async uploadFile(file, options) {
    // 文件验证、上传、压缩
  }
  
  async deleteFile(id) {
    // 软删除、清理缓存
  }
  
  async getFilePreview(id) {
    // 缩略图生成、缓存
  }
}
```

#### 2. 中间件系统

**错误处理中间件**
```javascript
// 统一错误处理
const errorHandler = (err, req, res, next) => {
  // 错误分类、日志记录、用户友好提示
}
```

**认证中间件**
```javascript
// JWT认证
const authMiddleware = (req, res, next) => {
  // Token验证、权限检查
}
```

## 性能优化

### 前端优化

1. **代码分割**
   - 路由懒加载
   - 组件按需加载
   - 动态import

2. **缓存策略**
   - 浏览器缓存
   - Service Worker
   - 内存缓存

3. **渲染优化**
   - 虚拟滚动
   - 图片懒加载
   - 防抖节流

4. **包体积优化**
   - Tree Shaking
   - 压缩混淆
   - CDN加速

### 后端优化

1. **数据库优化**
   - 索引优化
   - 查询优化
   - 连接池

2. **缓存机制**
   - Redis缓存
   - 文件缓存
   - API响应缓存

3. **文件处理**
   - 压缩算法
   - 分片上传
   - CDN分发

## 安全措施

### 前端安全

1. **XSS防护**
   - 输入转义
   - CSP策略
   - 安全的模板渲染

2. **CSRF防护**
   - Token验证
   - SameSite Cookie
   - Origin检查

3. **数据验证**
   - 前端验证
   - 类型检查
   - 长度限制

### 后端安全

1. **认证授权**
   - JWT Token
   - 权限控制
   - 会话管理

2. **输入验证**
   - 数据验证
   - SQL注入防护
   - 文件上传安全

3. **访问控制**
   - IP白名单
   - 频率限制
   - 敏感操作审计

## 监控与维护

### 系统监控

1. **性能监控**
   - 响应时间
   - 错误率
   - 资源使用

2. **业务监控**
   - 用户行为
   - 功能使用
   - 业务指标

3. **日志管理**
   - 结构化日志
   - 日志聚合
   - 实时告警

### 维护策略

1. **定期检查**
   - 依赖更新
   - 安全补丁
   - 性能优化

2. **备份策略**
   - 数据备份
   - 配置备份
   - 快速恢复

3. **灾难恢复**
   - 多活部署
   - 自动故障转移
   - 数据同步

## 部署指南

### 生产环境部署

1. **环境准备**
```bash
# 服务器要求
CPU: 2核心以上
内存: 4GB以上
存储: 50GB以上
系统: Ubuntu 20.04+
```

2. **安装依赖**
```bash
# Node.js环境
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2进程管理
sudo npm install -g pm2

# Nginx反向代理
sudo apt install nginx
```

3. **部署应用**
```bash
# 构建前端
npm run build

# 配置PM2
pm2 start ecosystem.config.js

# 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/product-management
sudo ln -s /etc/nginx/sites-available/product-management /etc/nginx/sites-enabled/
```

4. **SSL证书配置**
```bash
# Let's Encrypt证书
sudo certbot --nginx -d your-domain.com
```

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 常见问题

### 开发问题

**Q: 前端热更新不生效？**
A: 检查Vite配置，确保文件监控正常，重启开发服务器。

**Q: API请求404错误？**
A: 确认后端服务正常运行，检查路由配置和CORS设置。

**Q: 文件上传失败？**
A: 检查文件大小限制、格式支持和存储权限。

### 性能问题

**Q: 页面加载慢？**
A: 启用代码分割、优化图片、使用CDN、检查网络请求。

**Q: 内存占用高？**
A: 检查内存泄漏、优化图片加载、使用虚拟列表。

**Q: API响应慢？**
A: 优化数据库查询、启用缓存、检查网络延迟。

### 安全问题

**Q: XSS攻击防护？**
A: 启用CSP、使用安全的模板引擎、输入验证和转义。

**Q: CSRF攻击防护？**
A: 使用CSRF Token、SameSite Cookie、验证Origin。

**Q: 文件上传安全？**
A: 文件类型验证、病毒扫描、大小限制、隔离存储。

## 贡献指南

### 代码规范

1. **代码风格**
   - 使用ESLint和Prettier
   - 遵循Vue.js风格指南
   - 统一的命名规范

2. **提交规范**
   - 使用Conventional Commits
   - 清晰的提交信息
   - 关联相关Issue

3. **分支策略**
   - main分支：生产代码
   - develop分支：开发分支
   - feature/*：功能分支
   - hotfix/*：修复分支

### 提交流程

1. **创建分支**
```bash
git checkout -b feature/your-feature-name
```

2. **开发测试**
```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

3. **提交代码**
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

4. **创建PR**
   - 填写PR模板
   - 关联相关Issue
   - 请求代码审查

## 许可证

本项目采用MIT许可证。详见LICENSE文件。

## 联系方式

- **项目地址**: [GitHub Repository]
- **问题反馈**: [Issues]
- **文档地址**: [Documentation]
- **邮箱**: support@example.com

---

感谢使用产品管理系统！如有任何问题，欢迎反馈和建议。