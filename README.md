# 🛍️ 产品管理系统

一个现代化的产品管理系统，基于Vue 3 + Node.js构建，提供完整的产品、文件、文件夹管理功能。

## ✨ 特性

### 🎯 核心功能
- **产品管理**: 完整的产品CRUD操作、分类管理、库存管理
- **文件管理**: 多格式文件上传、文件夹组织、在线预览
- **3D展示**: WebGL 3D产品模型展示与交互
- **搜索筛选**: 强大的搜索和过滤功能
- **批量操作**: 高效的批量数据处理

### 🚀 用户体验
- **响应式设计**: 完美适配桌面和移动设备
- **国际化**: 支持多语言界面切换
- **主题系统**: 深色/浅色主题自由切换
- **快捷键**: 丰富的键盘快捷键支持
- **实时通知**: 智能的通知系统

### ⚡ 性能优化
- **虚拟滚动**: 大数据量高性能渲染
- **图片懒加载**: 智能图片加载策略
- **代码分割**: 按需加载，减少首屏时间
- **缓存机制**: 多层缓存优化性能

### 🔧 技术特色
- **模块化架构**: 清晰的代码组织和分层
- **错误处理**: 完善的错误监控和恢复机制
- **类型安全**: TypeScript支持（可选）
- **测试覆盖**: 完整的单元测试和集成测试

## 🏗️ 技术栈

### 前端
- **Vue 3** + Composition API
- **Vite** 构建工具
- **Ant Design Vue** UI组件库
- **Pinia** 状态管理
- **Vue Router** 路由管理

### 后端
- **Node.js** + Express.js
- **JSON** 数据存储
- **JWT** 身份认证
- **Multer** 文件上传
- **Winston** 日志系统

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd product-management-system

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用
- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000/api
- **API文档**: http://localhost:3000/api-docs

## 📁 项目结构

```
product-management-system/
├── 📂 src/                    # 前端源码
│   ├── 🧩 components/         # Vue组件
│   │   ├── ui/               # 通用UI组件
│   │   ├── forms/            # 表单组件
│   │   └── layout/           # 布局组件
│   ├── 🔧 composables/       # 组合式函数
│   ├── 🌐 services/          # API服务层
│   ├── 📦 stores/            # Pinia状态管理
│   ├── 🛠️ utils/             # 工具函数
│   ├── 🎨 styles/            # 样式文件
│   ├── 🌐 i18n/              # 国际化文件
│   └── 🧪 tests/             # 测试文件
├── 📂 server/                # 后端源码
│   ├── 🛣️ routes/            # 路由定义
│   ├── ⚙️ services/          # 业务逻辑
│   ├── 🔧 middleware/        # 中间件
│   ├── 🛠️ utils/             # 工具函数
│   └── 🧪 tests/             # 测试文件
├── 📂 docs/                  # 项目文档
│   ├── API.md               # API文档
│   └── DEVELOPMENT.md       # 开发文档
├── 📂 uploads/              # 文件上传目录
└── 📄 package.json          # 项目配置
```

## 🎮 使用指南

### 基本操作

#### 产品管理
1. **添加产品**: 点击"新增产品"按钮，填写产品信息
2. **编辑产品**: 在产品列表中点击编辑按钮
3. **删除产品**: 选择产品后点击删除按钮
4. **搜索筛选**: 使用顶部搜索框和筛选器

#### 文件管理
1. **上传文件**: 拖拽文件到上传区域或点击选择
2. **创建文件夹**: 右键菜单或顶部按钮
3. **文件预览**: 双击文件或使用预览按钮
4. **批量操作**: 选择多个文件进行批量处理

#### 3D展示
1. **模型加载**: 上传3D模型文件（.glb, .gltf格式）
2. **交互控制**: 
   - 鼠标左键：旋转
   - 鼠标右键：平移
   - 滚轮：缩放
3. **材质切换**: 点击材质面板切换不同材质

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存 |
| `Ctrl + N` | 新建 |
| `Ctrl + E` | 编辑 |
| `Delete` | 删除 |
| `F5` | 刷新 |
| `Ctrl + K` | 搜索 |
| `Ctrl + ?` | 快捷键帮助 |
| `Ctrl + L` | 切换语言 |
| `Ctrl + Shift + T` | 切换主题 |

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行前端测试
npm run test:unit

# 运行后端测试
npm run test:api

# 生成测试覆盖率报告
npm run test:coverage
```

### 测试类型
- **单元测试**: 组件和函数级别的测试
- **集成测试**: API接口和业务逻辑测试
- **端到端测试**: 完整的用户流程测试
- **性能测试**: 响应时间和内存使用测试

## 📚 文档

- **[API文档](docs/API.md)**: 详细的API接口文档
- **[开发文档](docs/DEVELOPMENT.md)**: 开发和部署指南
- **[组件文档](src/components/README.md)**: 前端组件说明
- **[架构设计](docs/ARCHITECTURE.md)**: 系统架构设计文档

## 🚀 部署

### 本地部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

### Docker部署
```bash
# 构建Docker镜像
docker build -t product-management .

# 运行容器
docker run -p 3000:3000 -p 5173:5173 product-management
```

### 环境变量
```bash
# 复制环境配置
cp .env.example .env

# 配置关键变量
PORT=3000
JWT_SECRET=your-jwt-secret
UPLOAD_DIR=./uploads
```

## 🛠️ 开发

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run type-check   # 类型检查
```

### 代码规范
- 使用ESLint和Prettier保持代码风格一致
- 遵循Vue.js官方风格指南
- 组件使用PascalCase命名
- 文件和目录使用kebab-case命名

## 📈 性能

### 性能指标
- **首屏加载时间**: < 2秒
- **交互响应时间**: < 100毫秒
- **3D渲染帧率**: > 30fps
- **文件上传速度**: 支持50MB大文件

### 优化策略
- 路由懒加载和代码分割
- 图片压缩和WebP格式支持
- CDN加速和缓存策略
- 虚拟滚动减少DOM节点

## 🔒 安全

### 安全特性
- JWT身份认证和授权
- XSS和CSRF攻击防护
- 文件上传安全验证
- SQL注入攻击防护
- 敏感数据加密存储

### 安全检查
```bash
# 安全漏洞扫描
npm audit

# 依赖安全检查
npm run security-check
```

## 🤝 贡献

### 贡献流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献指南
- 遵循代码规范和测试要求
- 提供清晰的提交信息
- 添加适当的文档和注释
- 确保所有测试通过

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 👥 团队

- **架构师**: 系统设计和架构
- **前端开发**: Vue.js应用开发
- **后端开发**: Node.js API开发
- **UI/UX设计**: 用户界面设计
- **测试工程师**: 质量保证和测试

## 🆘 支持

### 获取帮助
- 📧 邮箱支持: support@example.com
- 💬 在线客服: [Live Chat](https://example.com/chat)
- 📖 用户手册: [User Guide](docs/USER_GUIDE.md)

### 常见问题
- [FAQ](docs/FAQ.md) - 常见问题解答
- [Troubleshooting](docs/TROUBLESHOOTING.md) - 故障排除
- [Changelog](CHANGELOG.md) - 版本更新日志

## 🎯 路线图

### v1.1.0 (计划中)
- [ ] 移动端优化
- [ ] PWA支持
- [ ] 离线功能
- [ ] 更多语言支持

### v1.2.0 (计划中)
- [ ] AI智能推荐
- [ ] 数据分析仪表板
- [ ] 高级权限管理
- [ ] 微服务架构

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by [Your Team Name]

</div>