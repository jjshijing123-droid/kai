# 产品管理系统 API 文档

## 概述

本文档描述了产品管理系统的 REST API 接口。API 基于 Node.js + Express 构建，提供产品、文件、文件夹等资源的完整管理功能。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入验证失败",
    "details": {}
  },
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

### 分页响应
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 认证

### 获取访问令牌
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

### 使用访问令牌
```http
Authorization: Bearer <your-jwt-token>
```

## 产品管理 API

### 获取产品列表

```http
GET /api/products
```

**查询参数**:
- `page` (number): 页码，默认 1
- `limit` (number): 每页数量，默认 10
- `search` (string): 搜索关键词
- `category` (string): 分类筛选
- `status` (string): 状态筛选 (active, inactive)
- `sort` (string): 排序字段 (name, price, createdAt)
- `order` (string): 排序方向 (asc, desc)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "iPhone 15",
      "description": "最新款iPhone",
      "price": 5999,
      "category": "电子产品",
      "status": "active",
      "createdAt": "2023-12-07T10:30:00.000Z",
      "updatedAt": "2023-12-07T10:30:00.000Z",
      "images": ["iphone15-1.jpg"],
      "tags": ["手机", "苹果"],
      "stock": 100,
      "rating": 4.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### 获取单个产品

```http
GET /api/products/{id}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "iPhone 15",
    "description": "最新款iPhone",
    "price": 5999,
    "category": "电子产品",
    "status": "active",
    "specifications": {
      "screen": "6.1英寸",
      "storage": "128GB",
      "camera": "4800万像素"
    },
    "images": ["iphone15-1.jpg", "iphone15-2.jpg"],
    "tags": ["手机", "苹果"],
    "stock": 100,
    "rating": 4.5,
    "reviews": [
      {
        "id": 1,
        "user": "张三",
        "rating": 5,
        "comment": "非常好用",
        "createdAt": "2023-12-06T15:20:00.000Z"
      }
    ],
    "createdAt": "2023-12-07T10:30:00.000Z",
    "updatedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 创建产品

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "最新款iPhone",
  "price": 5999,
  "category": "电子产品",
  "status": "active",
  "specifications": {
    "screen": "6.1英寸",
    "storage": "128GB"
  },
  "images": ["iphone15-1.jpg"],
  "tags": ["手机", "苹果"],
  "stock": 100,
  "sku": "IP15-128-BLK"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "iPhone 15",
    "price": 5999,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 更新产品

```http
PUT /api/products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "price": 6999,
  "stock": 50
}
```

### 删除产品

```http
DELETE /api/products/{id}
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "产品已删除",
  "data": {
    "id": 1,
    "deletedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 批量操作

```http
POST /api/products/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "updateStatus",
  "ids": [1, 2, 3],
  "data": {
    "status": "inactive"
  }
}
```

## 文件管理 API

### 获取文件列表

```http
GET /api/files
```

**查询参数**:
- `folderId` (number): 文件夹ID
- `type` (string): 文件类型筛选
- `page` (number): 页码
- `limit` (number): 每页数量

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "product-image.jpg",
      "originalName": "IMG_001.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "url": "/uploads/files/product-image.jpg",
      "folderId": 1,
      "folderName": "产品图片",
      "uploadedBy": "admin",
      "createdAt": "2023-12-07T10:30:00.000Z"
    }
  ]
}
```

### 上传文件

```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary data>
folderId: 1
description: "产品主图"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "new-image.jpg",
    "url": "/uploads/files/new-image.jpg",
    "size": 512000,
    "createdAt": "2023-12-07T10:30:00.000Z"
  }
}
```

### 删除文件

```http
DELETE /api/files/{id}
Authorization: Bearer <token>
```

### 预览文件

```http
GET /api/files/{id}/preview
```

返回文件的预览内容（图片、PDF等）

### 下载文件

```http
GET /api/files/{id}/download
Authorization: Bearer <token>
```

返回文件的下载流

## 文件夹管理 API

### 获取文件夹列表

```http
GET /api/folders
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "产品图片",
      "description": "存储所有产品图片",
      "parentId": null,
      "path": "/产品图片",
      "fileCount": 25,
      "createdAt": "2023-12-07T10:30:00.000Z"
    }
  ]
}
```

### 创建文件夹

```http
POST /api/folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新文件夹",
  "parentId": 1,
  "description": "文件夹描述"
}
```

### 更新文件夹

```http
PUT /api/folders/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "重命名文件夹",
  "description": "更新后的描述"
}
```

### 删除文件夹

```http
DELETE /api/folders/{id}
Authorization: Bearer <token>
```

**注意**: 只有空文件夹才能被删除

### 获取文件夹内容

```http
GET /api/folders/{id}/content
```

返回指定文件夹下的所有文件和子文件夹

## 系统 API

### 健康检查

```http
GET /api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "storage": "available",
    "cache": "healthy"
  },
  "uptime": 3600,
  "memory": {
    "used": "45MB",
    "total": "128MB",
    "usage": "35.2%"
  }
}
```

### 错误报告

```http
POST /api/error-report
Content-Type: application/json

{
  "type": "CLIENT_ERROR",
  "message": "产品加载失败",
  "severity": "medium",
  "context": {
    "url": "/products/1",
    "userAgent": "Mozilla/5.0...",
    "userId": 123
  },
  "stack": "Error: 产品加载失败..."
}
```

### 批量日志

```http
POST /api/logs/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "logger": "frontend",
  "logs": [
    {
      "level": "error",
      "message": "加载失败",
      "timestamp": "2023-12-07T10:30:00.000Z"
    }
  ]
}
```

## 上传 API

### 产品文件夹上传

```http
POST /api/uploads/product-folder
Authorization: Bearer <token>
Content-Type: multipart/form-data

productId: 1
folder: <zip文件>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "uploadedFiles": [
      {
        "name": "image1.jpg",
        "url": "/uploads/products/1/image1.jpg",
        "size": 512000
      }
    ],
    "failedFiles": []
  }
}
```

## 错误码说明

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| `VALIDATION_ERROR` | 400 | 输入验证失败 |
| `UNAUTHORIZED` | 401 | 未授权或token无效 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `VALIDATION_FAILED` | 422 | 数据验证失败 |
| `TOO_MANY_REQUESTS` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

## 限制和约束

### 文件上传限制
- **最大文件大小**: 50MB
- **支持的文件类型**: 
  - 图片: jpg, jpeg, png, gif, webp
  - 文档: pdf, doc, docx, xls, xlsx
  - 压缩文件: zip, rar, 7z
- **单次上传文件数**: 最多20个

### 请求限制
- **API调用频率**: 每分钟最多100次
- **分页最大限制**: 最多100条记录
- **搜索关键词长度**: 最多100个字符

### 安全限制
- **JWT Token有效期**: 24小时
- **密码最小长度**: 8位字符
- **文件扫描**: 所有上传文件都会进行病毒扫描

## WebSocket 连接

### 实时通知

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// 监听产品更新
socket.on('product:updated', (data) => {
  console.log('产品已更新:', data);
});

// 监听文件上传进度
socket.on('upload:progress', (data) => {
  console.log(`上传进度: ${data.progress}%`);
});
```

## SDK 和代码示例

### JavaScript/Node.js 客户端

```javascript
const apiClient = {
  baseURL: 'http://localhost:3000/api',
  token: null,

  setToken(token) {
    this.token = token;
  },

  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    return response.json();
  },

  // 产品相关
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/products?${query}`);
  },

  async getProduct(id) {
    return this.request('GET', `/products/${id}`);
  },

  async createProduct(data) {
    return this.request('POST', '/products', data);
  },

  // 文件相关
  async uploadFile(file, folderId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    return fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: formData
    }).then(res => res.json());
  }
};
```

### Python 客户端示例

```python
import requests
import json

class ProductAPIClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        
        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            })
    
    def get_products(self, **params):
        response = self.session.get(f'{self.base_url}/products', params=params)
        return response.json()
    
    def create_product(self, product_data):
        response = self.session.post(f'{self.base_url}/products', json=product_data)
        return response.json()
    
    def upload_file(self, file_path, folder_id=None):
        with open(file_path, 'rb') as f:
            files = {'file': f}
            if folder_id:
                data = {'folderId': folder_id}
                return self.session.post(
                    f'{self.base_url}/files/upload', 
                    files=files, 
                    data=data
                ).json()
            return self.session.post(
                f'{self.base_url}/files/upload', 
                files=files
            ).json()
```

## 更新日志

### v1.0.0 (2023-12-07)
- 初始版本发布
- 产品管理功能
- 文件和文件夹管理
- 用户认证和授权
- 错误处理和日志记录
- 健康检查和监控
- WebSocket 实时通知

---

如有任何问题或建议，请联系开发团队或提交 Issue。