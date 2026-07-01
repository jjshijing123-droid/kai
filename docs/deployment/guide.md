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

# 同时启动前后端
npm run start
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 生产环境部署

### 1. 构建前端

```bash
npm run build
```

### 2. 启动生产环境

```bash
npm run prod
```

生产环境后端端口为 8000，服务地址 http://localhost:8000。

### 3. Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|webp|ico|css|js|woff2)$ {
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

## 环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=https://yourdomain.com
```

## 数据目录

| 目录 | 说明 | 是否 gitignore |
|------|------|---------------|
| `Product/` | 产品文件存储 | 是 |
| `uploads/` | 临时上传文件 | 是 |
| `public/data/product-catalog.json` | 产品目录（自动生成） | 否 |

## 日常维护

- 定期备份 `Product/` 目录
- 监控磁盘空间（产品图片占用较大）
- 清理 `uploads/` 临时文件

## Docker 部署

参考根目录的 CLAUDE.md 中的 Docker 部署说明：

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 故障排除

### 端口占用

```bash
# Windows
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000
```

### 权限问题

确保 `Product/` 和 `uploads/` 目录有读写权限。

### 依赖安装失败

```bash
npm cache clean --force
rm -rf node_modules
npm install
```
