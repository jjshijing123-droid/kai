# 将Ant Design替换为Radix UI的迁移计划

## 1. 项目分析
- 项目是基于Vue 3的产品管理系统，当前使用Ant Design Vue作为UI组件库
- 主要使用的Ant Design组件包括：Layout、Button、Drawer、Modal、Form、Input、Message和Icons
- 入口文件main.js中全局注册了Ant Design Vue

## 2. 迁移目标
- 替换所有Ant Design组件为Radix UI组件
- 保持现有的功能和页面样式不变
- 确保良好的可访问性和开发体验

## 3. 迁移步骤

### 3.1 安装Radix UI组件
```bash
npm install radix-ui/vue
```

### 3.2 移除Ant Design Vue依赖
- 从package.json中移除ant-design-vue和@ant-design/icons-vue
- 运行npm install更新依赖

### 3.3 修改main.js
- 移除Ant Design Vue的引入和注册
- 移除相关CSS导入

### 3.4 组件迁移

#### 3.4.1 Layout组件迁移
- 将`a-layout`、`a-layout-header`、`a-layout-content`替换为自定义布局或Radix UI的Layout组件

#### 3.4.2 Button组件迁移
- 将`a-button`替换为Radix UI的Button组件
- 保持相同的样式和功能

#### 3.4.3 Drawer组件迁移
- 将`a-drawer`替换为Radix UI的Drawer组件
- 实现相同的侧边栏菜单功能

#### 3.4.4 Modal组件迁移
- 将`a-modal`替换为Radix UI的Dialog组件
- 实现登录模态框功能

#### 3.4.5 Form组件迁移
- 将`a-form`、`a-form-item`替换为Radix UI的Form组件
- 实现表单验证和提交功能

#### 3.4.6 Input组件迁移
- 将`a-input`、`a-input-password`替换为Radix UI的Input组件
- 实现输入框和密码框功能

#### 3.4.7 Message组件迁移
- 将`message`替换为自定义的消息提示组件或Radix UI的Toast组件
- 实现成功、错误、警告等消息提示

#### 3.4.8 Icons组件迁移
- 将Ant Design图标替换为自定义图标或其他图标库

### 3.5 添加样式
- 为Radix UI组件添加样式，确保与原有样式一致
- 使用现有的CSS变量和样式系统

### 3.6 测试
- 测试所有功能，确保迁移后正常工作
- 检查页面样式是否保持一致
- 测试响应式设计

## 4. 迁移注意事项
- Radix UI是无样式组件，需要自己添加样式
- 迁移过程中需要注意组件API的差异
- 确保可访问性保持不变
- 测试所有交互功能

## 5. 预期结果
- 项目成功迁移到Radix UI
- 保持现有的功能和页面样式
- 提高组件的可定制性和性能
- 改善开发体验