# 产品展示系统 API 文档

## 概述

本文档描述了产品展示系统的 REST API 接口。API 基于 Node.js + Express 构建，提供产品管理、文件操作、文件夹管理等功能的完整API接口。系统采用文件系统存储，无需传统数据库。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **编码**: UTF-8
- **认证**: 管理员权限验证（部分接口需要）
- **跨域**: 已配置CORS支持

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "具体错误信息"
}
```

### 产品列表响应
```json
[
  {
    "name": "产品名称",
    "folderName": "文件夹名称",
    "id": 1,
    "category": "general",
    "description": "产品描述",
    "path": "Product/文件夹名称",
    "totalSize": 1234567,
    "fileCount": 135,
    "modified": "2025-11-26T03:10:30.899Z"
  }
]
```

## 认证

系统采用简单的权限验证机制，主要通过localStorage管理管理员会话状态。

### 管理员登录状态
- 前端通过localStorage存储管理员登录状态
- 受保护的接口包括产品管理、文件操作等

## 产品管理 API

### 获取产品列表

```http
GET /api/products
```

**描述**: 获取所有产品列表，基于文件系统扫描Product目录

**响应示例**:
```json
[
  {
    "name": "Cobi18+",
    "folderName": "Cobi18+",
    "id": 1,
    "category": "general",
    "description": "Product model: Cobi18+",
    "path": "Product/Cobi18+",
    "totalSize": 9167402,
    "fileCount": 135,
    "modified": "2025-11-26T03:10:30.899Z"
  }
]
```

### 创建产品

```http
POST /api/products
Authorization: Bearer <token> (管理员权限)
Content-Type: application/json

{
  "productName": "新产品名称",
  "folderName": "新产品文件夹"
}
```

**描述**: 创建新的产品文件夹，自动生成标准子文件夹结构

**响应示例**:
```json
{
  "success": true,
  "message": "产品文件夹 \"新产品名称\" 创建成功",
  "data": {
    "productName": "新产品名称",
    "folderName": "新产品文件夹",
    "path": "Product/新产品文件夹"
  }
}
```

### 重命名产品

```http
PUT /api/products/{productName}
Authorization: Bearer <token> (管理员权限)
Content-Type: application/json

{
  "newProductName": "新产品名称",
  "newFolderName": "新文件夹名称"
}
```

**描述**: 重命名产品文件夹，同时更新product-catalog.json配置文件

**响应示例**:
```json
{
  "success": true,
  "message": "产品重命名成功",
  "data": {
    "oldName": "旧产品名称",
    "newName": "新文件夹名称",
    "oldPath": "Product/旧产品名称",
    "newPath": "Product/新文件夹名称"
  }
}
```

### 删除产品

```http
DELETE /api/products/{productName}
Authorization: Bearer <token> (管理员权限)
```

**描述**: 删除产品文件夹及其所有内容

**响应示例**:
```json
{
  "success": true,
  "message": "产品 \"产品名称\" 删除成功",
  "physicalFolderDeleted": true,
  "deletedProduct": {
    "name": "产品名称",
    "path": "Product/产品名称"
  }
}
```

### 获取产品详情（通过ID）

```http
GET /api/products/{id}
```

**描述**: 根据产品ID获取产品详细信息

**响应示例**:
```json
{
  "success": true,
  "product": {
    "id": null,
    "name": "Cobi18+",
    "folderName": "Cobi18+",
    "category": "general",
    "description": "Product model: Cobi18+",
    "path": "Product/Cobi18+",
    "totalSize": 9167402,
    "fileCount": 135,
    "mainImage": "/Product/Cobi18+/image_00.webp",
    "folder": "Product/Cobi18+/",
    "views": {
      "view1": "/Product/Cobi18+/view1/",
      "view2": "/Product/Cobi18+/view2/",
      "view3": "/Product/Cobi18+/view3/",
      "view4": "/Product/Cobi18+/view4/"
    },
    "additionalImages": {
      "sixViews": "/Product/Cobi18+/images_6Views/",
      "other": "/Product/Cobi18+/images_other/"
    }
  }
}
```

### 根据产品名称获取产品详情

```http
GET /api/products/name/{productName}
```

**描述**: 根据产品名称获取产品详细信息

**响应示例**:
```json
{
  "success": true,
  "product": {
    "name": "Cobi18+",
    "folderName": "Cobi18+",
    "path": "Product/Cobi18+",
    "totalSize": 9167402,
    "fileCount": 135,
    "mainImage": "/Product/Cobi18+/image_00.webp"
  }
}
```

## 数据库兼容性 API

### 从数据库获取产品列表

```http
GET /api/db/products
```

**描述**: 从product-catalog.json文件获取产品目录数据

**响应示例**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Cobi18+",
      "folderName": "Cobi18+",
      "category": "general",
      "description": "Product model: Cobi18+",
      "path": "Product/Cobi18+/",
      "mainImage": "/Product/Cobi18+/image_00.webp",
      "totalSize": 9167402,
      "fileCount": 135,
      "views": {
        "view1": "/Product/Cobi18+/view1/",
        "view2": "/Product/Cobi18+/view2/",
        "view3": "/Product/Cobi18+/view3/",
        "view4": "/Product/Cobi18+/view4/"
      },
      "additionalImages": {
        "sixViews": "/Product/Cobi18+/images_6Views/",
        "other": "/Product/Cobi18+/images_other/"
      }
    }
  ]
}
```

### 根据产品名称获取产品详情（数据库兼容）

```http
GET /api/db/products/name/{productName}
```

**描述**: 从product-catalog.json文件获取指定产品的详细信息

## 文件夹管理 API

### 获取文件夹详情

```http
GET /api/folder/{folderPath}/details
```

**描述**: 获取指定路径下文件夹的详细信息，包括子文件夹和文件列表

**响应示例**:
```json
{
  "success": true,
  "folder": {
    "path": "Product/Cobi18+",
    "name": "Cobi18+",
    "type": "directory",
    "size": 9167402,
    "modified": "2025-11-26T03:10:30.899Z",
    "subfolders": [
      {
        "name": "view1",
        "path": "Product/Cobi18+/view1",
        "type": "directory",
        "fileCount": 36
      }
    ],
    "files": [
      {
        "name": "image_00.webp",
        "path": "Product/Cobi18+/image_00.webp",
        "type": "file",
        "size": 123456,
        "modified": "2025-11-26T03:10:30.899Z"
      }
    ]
  }
}
```

### 创建子文件夹

```http
POST /api/folder/{parentPath}/create-subfolder
Authorization: Bearer <token> (管理员权限)
Content-Type: application/json

{
  "folderName": "新子文件夹名称"
}
```

**描述**: 在指定路径下创建新的子文件夹

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹创建成功",
  "data": {
    "parentPath": "Product/Cobi18+",
    "folderName": "新子文件夹名称",
    "fullPath": "Product/Cobi18+/新子文件夹名称"
  }
}
```

### 删除子文件夹

```http
DELETE /api/folder/{parentPath}/subfolder/{folderName}
Authorization: Bearer <token> (管理员权限)
```

**描述**: 删除指定路径下的子文件夹，如果删除的是产品文件夹，会同步更新product-catalog.json

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹删除成功",
  "data": {
    "parentPath": "Product/Cobi18+",
    "folderName": "要删除的文件夹",
    "fullPath": "Product/Cobi18+/要删除的文件夹"
  }
}
```

### 重命名子文件夹

```http
PUT /api/folder/{parentPath}/subfolder/{folderName}
Authorization: Bearer <token> (管理员权限)
Content-Type: application/json

{
  "newFolderName": "新文件夹名称"
}
```

**描述**: 重命名指定路径下的子文件夹，如果是产品文件夹会同步更新配置文件

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹重命名成功",
  "data": {
    "parentPath": "Product/Cobi18+",
    "oldName": "旧文件夹名称",
    "newName": "新文件夹名称",
    "fullPath": "Product/Cobi18+/新文件夹名称"
  }
}
```

### 获取文件夹树结构

```http
GET /api/folder/{folderPath}/tree?maxDepth=3
```

**描述**: 获取指定路径下文件夹的树形结构

**响应示例**:
```json
{
  "success": true,
  "tree": {
    "name": "Cobi18+",
    "path": "Product/Cobi18+",
    "type": "directory",
    "children": [
      {
        "name": "view1",
        "path": "Product/Cobi18+/view1",
        "type": "directory",
        "children": [
          {
            "name": "image_01.webp",
            "path": "Product/Cobi18+/view1/image_01.webp",
            "type": "file",
            "size": 12345
          }
        ]
      }
    ]
  }
}
```

### 搜索文件

```http
GET /api/folder/{folderPath}/search?searchTerm=关键字&fileTypes=webp,jpg
```

**描述**: 在指定路径下搜索文件

**响应示例**:
```json
{
  "success": true,
  "results": [
    {
      "name": "image_01.webp",
      "path": "Product/Cobi18+/view1/image_01.webp",
      "type": "file",
      "size": 12345,
      "parentPath": "Product/Cobi18+/view1"
    }
  ],
  "searchTerm": "关键字",
  "count": 1
}
```

## 文件操作 API

### 删除文件

```http
POST /api/delete-file
Authorization: Bearer <token> (管理员权限)
Content-Type: application/json

{
  "filePath": "Product/Cobi18+/view1/image_01.webp"
}
```

**描述**: 删除指定的文件

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 检查文件夹中是否有文件

```http
GET /api/check-folder/{folderPath}
```

**描述**: 检查指定文件夹中是否包含文件

**响应示例**:
```json
{
  "hasFiles": true,
  "fileCount": 36,
  "folderPath": "Product/Cobi18+/view1",
  "message": "文件夹中存在文件"
}
```

### 获取文件信息

```http
GET /api/file-info/{filePath}
```

**描述**: 获取指定文件的详细信息

**响应示例**:
```json
{
  "success": true,
  "fileInfo": {
    "name": "image_01.webp",
    "size": 12345,
    "modified": "2025-11-26T03:10:30.899Z",
    "isFile": true,
    "isDirectory": false
  }
}
```

### 获取文件下载链接

```http
GET /api/download/{filePath}/{fileName}
```

**描述**: 获取文件的下载链接

**响应示例**:
```json
{
  "success": true,
  "downloadUrl": "/Product/Cobi18+/view1/image_01.webp",
  "fileName": "image_01.webp"
}
```

## 上传管理 API

### 批量替换产品

```http
POST /api/batch-replace-products
Authorization: Bearer <token> (管理员权限)
Content-Type: multipart/form-data

zipFile: <binary data>
```

**描述**: 通过ZIP包批量替换所有产品文件夹，会自动创建备份

**响应示例**:
```json
{
  "success": true,
  "message": "批量替换成功",
  "fileCount": 135,
  "folderCount": 11,
  "backupPath": "Product_backup_20251126_032341.zip"
}
```

### 上传单个产品文件夹

```http
POST /api/upload-product-folder
Authorization: Bearer <token> (管理员权限)
Content-Type: multipart/form-data

file: <zip file>
folderName: "新产品文件夹名称"
```

**描述**: 上传单个产品文件夹的ZIP包

**响应示例**:
```json
{
  "success": true,
  "message": "产品文件夹上传成功",
  "result": {
    "actualName": "新产品文件夹名称",
    "path": "Product/新产品文件夹名称",
    "size": 1234567,
    "fileCount": 135
  }
}
```

### 重新生成产品目录

```http
POST /api/regenerate-catalog
Authorization: Bearer <token> (管理员权限)
```

**描述**: 手动重新生成product-catalog.json配置文件

**响应示例**:
```json
{
  "success": true,
  "message": "产品目录重新生成成功",
  "data": {}
}
```

### 获取上传进度

```http
GET /api/upload-progress/{uploadId}
```

**描述**: 获取大文件上传的进度信息

**响应示例**:
```json
{
  "success": true,
  "progress": 100,
  "message": "上传完成"
}
```

## 错误码说明

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| `VALIDATION_ERROR` | 400 | 输入验证失败 |
| `UNAUTHORIZED` | 401 | 未授权或权限不足 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `VALIDATION_FAILED` | 422 | 数据验证失败 |
| `TOO_MANY_REQUESTS` | 429 | 请求过于频繁 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

## 限制和约束

### 文件上传限制
- **最大文件大小**: 500MB (批量上传)
- **支持的文件类型**: ZIP格式压缩包
- **单次上传文件数**: 1个ZIP文件

### 请求限制
- **API调用频率**: 未限制（开发环境）
- **文件路径长度**: 限制在系统文件系统范围内
- **文件夹深度**: 建议不超过10层

### 安全限制
- **管理员权限**: 部分敏感操作需要管理员权限
- **路径遍历**: 防止路径遍历攻击
- **文件类型**: 只允许上传ZIP格式文件

## 使用示例

### JavaScript/Node.js 客户端

```javascript
class ProductAPIClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.adminToken = null;
  }

  setAdminToken(token) {
    this.adminToken = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.adminToken && { Authorization: `Bearer ${this.adminToken}` })
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // 产品相关
  async getProducts() {
    return this.request('/products');
  }

  async createProduct(productName, folderName) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify({ productName, folderName })
    });
  }

  async renameProduct(oldName, newName, newFolderName) {
    return this.request(`/products/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: JSON.stringify({ newProductName: newName, newFolderName })
    });
  }

  async deleteProduct(productName) {
    return this.request(`/products/${encodeURIComponent(productName)}`, {
      method: 'DELETE'
    });
  }

  // 文件夹相关
  async getFolderDetails(folderPath) {
    return this.request(`/folder/${encodeURIComponent(folderPath)}/details`);
  }

  async createSubfolder(parentPath, folderName) {
    return this.request(`/folder/${encodeURIComponent(parentPath)}/create-subfolder`, {
      method: 'POST',
      body: JSON.stringify({ folderName })
    });
  }

  // 文件上传相关
  async batchReplaceProducts(zipFile) {
    const formData = new FormData();
    formData.append('zipFile', zipFile);

    return fetch(`${this.baseURL}/batch-replace-products`, {
      method: 'POST',
      headers: {
        ...(this.adminToken && { Authorization: `Bearer ${this.adminToken}` })
      },
      body: formData
    }).then(res => res.json());
  }
}
```

### Python 客户端示例

```python
import requests
import json

class ProductAPIClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.admin_token = None
    
    def set_admin_token(self, token):
        self.admin_token = token
    
    def _get_headers(self):
        headers = {'Content-Type': 'application/json'}
        if self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        return headers
    
    def get_products(self):
        response = requests.get(f'{self.base_url}/products')
        return response.json()
    
    def create_product(self, product_name, folder_name):
        data = {'productName': product_name, 'folderName': folder_name}
        response = requests.post(
            f'{self.base_url}/products',
            json=data,
            headers=self._get_headers()
        )
        return response.json()
    
    def delete_product(self, product_name):
        response = requests.delete(
            f'{self.base_url}/products/{product_name}',
            headers=self._get_headers()
        )
        return response.json()
    
    def get_folder_details(self, folder_path):
        response = requests.get(
            f'{self.base_url}/folder/{folder_path}/details'
        )
        return response.json()
    
    def batch_replace_products(self, zip_file_path):
        with open(zip_file_path, 'rb') as f:
            files = {'zipFile': f}
            headers = {}
            if self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
            
            response = requests.post(
                f'{self.base_url}/batch-replace-products',
                files=files,
                headers=headers
            )
            return response.json()
```

## 更新日志

### v2.0 (2025-11-26)
- 完善产品管理功能
- 添加文件夹树结构API
- 增强批量操作功能
- 完善错误处理机制
- 添加文件搜索功能

### v1.0 (初始版本)
- 基础产品管理功能
- 简单的文件操作
- 产品目录配置管理
- 基础认证机制

---

如有任何问题或建议，请联系开发团队或提交 Issue。