# 产品展示系统

一个基于文件系统的现代化产品展示系统，使用 Vue 3 + Node.js 构建，提供完整的产品管理、图片展示和360度旋转查看功能。

## ✨ 特性

### 🎯 核心功能
- **产品管理**: 基于文件系统的产品目录管理，支持产品文件夹的创建、重命名、删除
- **图片展示**: 多视角产品图片展示，支持6视图和其他角度图片
- **360度查看**: WebGL技术实现的360度产品旋转展示
- **文件夹管理**: 产品内部文件夹和文件的管理功能
- **批量上传**: 支持ZIP包批量上传和替换产品数据
- **管理员功能**: 管理员登录认证，用于产品管理和系统设置

### 🚀 用户体验
- **响应式设计**: 完美适配桌面和移动设备
- **国际化**: 支持中文和英文界面切换
- **即时加载**: 基于文件系统的快速数据访问
- **实时通知**: 操作反馈和状态提示
- **图片懒加载**: 优化图片加载性能

### ⚡ 技术特色
- **文件系统存储**: 无需数据库，基于文件系统存储产品数据
- **轻量化架构**: 简单的技术栈，易于部署和维护
- **模块化设计**: 清晰的代码组织和组件分离
- **国际化支持**: 完整的双语翻译系统

## 🏗️ 技术栈

### 前端
- **Vue 3** + Composition API
- **Vite** 构建工具
- **Ant Design Vue** UI组件库
- **Vue Router** 路由管理（配置但未完全使用）

### 后端
- **Node.js** + Express.js
- **文件系统** 数据存储
- **Multer** 文件上传
- **CORS** 跨域处理

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器

### 安装运行

```bash
# 克隆项目
git clone <repository-url>
cd product-management-system

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 启动后端服务

```bash
# 新终端窗口启动后端API服务
npm run server
```

### 访问应用
- **前端**: http://localhost:5173
- **后端API**: http://localhost:3000

## 📁 项目结构

```
product-management-system/
├── src/                        # 前端源码
│   ├── components/            # Vue组件
│   │   ├── ui/               # 通用UI组件
│   │   ├── forms/            # 表单组件
│   │   └── layout/           # 布局组件
│   ├── composables/          # 组合式函数
│   ├── i18n/                 # 国际化系统
│   ├── services/             # API服务
│   ├── router/               # 路由配置
│   └── styles/               # 样式文件
├── server/                    # 后端源码
│   ├── routes/               # 路由定义
│   ├── services/             # 业务逻辑
│   └── utils/                # 工具函数
├── docs/                      # 项目文档
├── public/                    # 静态资源
│   └── data/                 # 产品目录数据
├── Product/                   # 产品文件夹目录
└── package.json
```

## 🎮 使用指南

### 基本操作

#### 产品浏览
1. **产品列表**: 首页展示所有可用产品
2. **产品详情**: 点击产品查看详细信息
3. **图片查看**: 在产品详情页面浏览不同视角图片
4. **360度查看**: 点击"360度旋转"进入交互式查看模式

#### 管理员功能
1. **登录管理**: 点击顶部管理员按钮进行登录
2. **产品管理**: 在产品管理页面创建、编辑、删除产品文件夹
3. **文件夹管理**: 在文件夹页面管理产品内部文件
4. **批量操作**: 使用ZIP包进行批量上传和替换

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + L` | 切换语言 |
| `F5` | 刷新页面 |
| `Ctrl + S` | 保存（表单页面） |

## 📚 功能模块

### 产品展示模块
- **ProductList.vue**: 产品列表展示
- **Product_nav.vue**: 产品详情页面
- **Product3DViewer.vue**: 360度旋转查看器
- **Product_Viewimages.vue**: 图片展示组件

### 管理模块
- **Product_Management.vue**: 产品管理面板
- **FolderManager.vue**: 文件夹管理器
- **ProductDetailManagement.vue**: 产品详情管理

### 系统模块
- **Header.vue**: 系统头部导航
- **I18nManagementPanel.vue**: 国际化管理
- **AdminLoginModal.vue**: 管理员登录

## 🔧 配置说明

### 产品目录结构

每个产品文件夹包含以下标准结构：
```
Product/[产品名称]/
├── image_00.webp           # 产品主图
├── view1/                  # 视角1图片
├── view2/                  # 视角2图片
├── view3/                  # 视角3图片
├── view4/                  # 视角4图片
├── images_6Views/          # 六视图图片
└── images_other/           # 其他图片
```

### 数据文件
- **public/data/product-catalog.json**: 产品目录配置文件
- **server/utils/productCatalogUtils.js**: 产品目录工具类

## 🚀 部署指南

### 本地部署
```bash
# 构建前端
npm run build

# 启动后端
npm run server
```

### 生产环境
```bash
# 安装依赖
npm install --production

# 使用PM2部署
pm2 start server.js --name "product-system"
```

## 🛠️ 开发指南

### 开发命令
```bash
npm run dev          # 启动前端开发服务器
npm run server       # 启动后端服务
```

### 代码规范
- 使用 Vue 3 Composition API
- 遵循 Vue.js 风格指南
- 组件使用 PascalCase 命名
- 文件和目录使用 kebab-case 命名

### 添加新产品
1. 在 `Product/` 目录下创建产品文件夹
2. 按照标准结构添加图片文件
3. 更新 `public/data/product-catalog.json` 文件
4. 重启服务器使变更生效

## 📈 性能优化

### 前端优化
- 路由懒加载
- 组件按需加载
- 图片懒加载
- 代码分割

### 后端优化
- 文件系统缓存
- 静态文件服务
- 压缩响应
- 请求优化

## 🔒 安全特性

- 管理员权限验证
- 文件上传安全检查
- 路径遍历防护
- CORS 跨域控制

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 开启 Pull Request

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件至项目维护者

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by [Your Team Name]

</div>