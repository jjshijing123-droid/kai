# ICE 图片查看器 - 部署指南

## 系统要求

### 最低配置

- CPU: 2 核心
- 内存: 4GB RAM
- 存储: 20GB 可用空间
- Node.js >= 16.0.0

### 推荐配置

- CPU: 4 核心+
- 内存: 8GB+ RAM
- 存储: 100GB+ SSD

## 开发环境启动

```bash
# 安装依赖
npm install

# 初始化第一个管理员账户（仅首次）
node server.js init-admin

# 同时启动前后端
npm run start
```

- 前端: http://localhost:5173
- 后端: http://localhost:3010

## 生产环境部署

### 1. 构建前端

```bash
npm run build
```

### 2. 启动生产环境

```bash
npm run prod
```

生产环境默认端口 8000，服务地址 http://localhost:8000。

### 3. Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|webp|ico|css|js)$ {
        root /path/to/kai/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 产品文件访问
    location /Product/ {
        root /path/to/kai;
        expires 1M;
    }

    # 单页应用
    location / {
        root /path/to/kai/dist;
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 100M;
}
```

## 环境变量（可选）

项目无需 `.env` 即可运行。可选环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 开发 3010，生产 8000 | 服务器端口 |
| `NODE_ENV` | `development` | 运行环境（`production` 启用安全优化） |
| `CORS_ORIGIN` | 允许所有 | CORS 白名单（逗号分隔多域名） |
| `JWT_SECRET` | 自动生成随机密钥 | JWT 签名密钥（生产环境建议手动设置持久化密钥） |

> **注意**: 管理员账户通过 `node server.js init-admin` 初始化，不再依赖 `.env` 中的凭据。如果设置 `JWT_SECRET`，重启后已有 Token 仍然有效；如果不设置，每次重启自动生成新密钥，导致已有 Token 全部失效。

## 数据目录

| 目录/文件 | 说明 | 是否 gitignore |
|-----------|------|---------------|
| `data/products.db` | SQLite 数据库（产品元数据 + 翻译 + 用户） | 是 |
| `Product/` | 产品图片文件存储 | 是 |
| `uploads/` | 临时上传文件 | 是 |

### 数据持久化

- **SQLite 数据库** (`data/products.db`) 应纳入备份计划，包含产品元数据、翻译数据和管理员账户
- **产品图片** (`Product/`) 是核心数据，定期备份
- **翻译数据** 可通过管理界面导出，也可直接从 SQLite 数据库备份
- 首次启动时，`src/i18n/translations-seed.json` 中的种子数据自动导入 SQLite，后续无需该文件参与运行

## 日常维护

- 定期备份 `Product/` 目录和 `data/products.db`
- 监控磁盘空间（产品图片占用较大）
- 清理 `uploads/` 临时文件

## 初始化管理员账户

### 首次部署

```bash
node server.js init-admin
```

按提示交互式创建第一个管理员。仅当用户表为空时可用。

### 重置

如需重置所有数据（包括管理员），删除 `data/products.db` 文件后重新运行 `init-admin`。

## 故障排除

### 端口占用

```bash
# Windows
netstat -ano | findstr :3010

# Linux/macOS
lsof -i :3010
```

### 权限问题

确保 `Product/` 和 `uploads/` 目录有读写权限。

### 依赖安装失败

```bash
npm cache clean --force
rm -rf node_modules
npm install
```
