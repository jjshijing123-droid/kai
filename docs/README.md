# ICE 图片查看器 - 文档索引

## 快速导航

| 类别 | 文档 | 路径 |
|------|------|------|
| 概览 | 架构总览 | [architecture/overview.md](architecture/overview.md) |
| 概览 | 目录结构 | [architecture/structure.md](architecture/structure.md) |
| 开发 | API 参考 | [api/reference.md](api/reference.md) |
| 运维 | 部署指南 | [deployment/guide.md](deployment/guide.md) |
| 设计 | 设计系统 / 颜色变量 | [design/colors.md](design/colors.md) |
| 归档 | 历史文档（旧版本） | [archive/README.md](archive/README.md) |

## 文档列表

### 架构文档

#### [架构总览](architecture/overview.md)
- 技术栈详情（前端/后端/工具）
- 核心功能模块说明
- 后端服务架构和分层设计
- 数据存储方案
- 国际化系统
- 性能优化策略
- 安全特性
**适用对象**: 开发人员、技术管理员
**阅读时间**: 20-30 分钟

#### [目录结构说明](architecture/structure.md)
- 完整目录树和每个文件/文件夹的用途
- 代码组织原则
- 文件命名规范
- 扩展性考虑
**适用对象**: 开发人员、项目维护者
**阅读时间**: 15-20 分钟

### API 文档

#### [API 参考](api/reference.md)
- 产品管理接口（6 个端点）
- 文件夹管理接口（6 个端点）
- 文件操作接口（4 个端点）
- 文件上传接口（4 个端点）
- 国际化接口（4 个端点）
- 静态资源访问方式
- 统一响应格式和错误代码
**适用对象**: 开发者、API 使用者
**阅读时间**: 15-25 分钟

### 运维文档

#### [部署指南](deployment/guide.md)
- 系统硬件/软件要求
- 开发环境启动
- 生产环境部署流程
- 环境变量和配置
- 监控和维护策略
- 故障排除
**适用对象**: 运维人员、系统管理员
**阅读时间**: 20-30 分钟

### 设计文档

#### [设计系统 - 颜色变量](design/colors.md)
- 完整的 CSS 变量定义（neutral、primary、orange、green、red）
- 每种颜色的 12 级色阶 + 透明度变体
- 变量在 Tailwind CSS 和 Vue 组件中的使用方式
**适用对象**: 前端开发、UI 设计
**阅读时间**: 10-15 分钟

### 归档

#### [历史文档](archive/README.md)
- 迁移前的原始文档，已保留归档
- 包含：项目详细文档、目录结构说明、API 接口文档、部署和配置指南、对应颜色变量、文档索引
**注意**: 这些文档为旧版本，内容可能已过时，以当前 docs/ 目录下的文档为准。

## 阅读路径

### 新成员入门
1. [架构总览](architecture/overview.md) - 了解项目全貌
2. [目录结构说明](architecture/structure.md) - 熟悉代码组织
3. [API 参考](api/reference.md) - 掌握接口规范

### 日常开发
1. [架构总览](architecture/overview.md) - 快速回顾
2. [API 参考](api/reference.md) - 接口调用参考
3. [设计系统](design/colors.md) - 样式开发参考

### 部署上线
1. [部署指南](deployment/guide.md) - 部署流程
2. [架构总览](architecture/overview.md) - 理解系统架构
3. [API 参考](api/reference.md) - 接口验证

---

**文档版本**: v1.0.0
**最后更新**: 2026-07-01
**维护**: ICE 开发团队
