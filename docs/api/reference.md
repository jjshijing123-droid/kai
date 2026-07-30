# ICE 图片查看器 - API 参考文档

## 基础信息

- **Base URL**: `http://localhost:3010`（开发）/ `http://localhost:8000`（生产）
- **协议**: HTTP/HTTPS
- **数据格式**: JSON (UTF-8)
- **前端调用**: 通过 `src/services/apiService.js` 统一封装，基址为 `/api`

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息（仅开发环境）",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

---

## 认证接口

### 0.1 管理员登录

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**认证方式**: 无（公开端点，但有限流保护）

**限流**: 5 次/分钟

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "username": "admin",
    "role": "admin"
  }
}
```

**说明**: 密码通过 bcrypt 哈希比对，凭据存储在 SQLite 数据库的 `users` 表中。

### 0.2 验证 Token

```http
GET /api/auth/verify
```

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "username": "admin",
    "role": "admin"
  }
}
```

---

## 产品管理接口

> **数据源说明**: 产品元数据（名称、大小、文件数、路径等）存储于 SQLite 数据库 (`data/products.db`)。启动时自动扫描 `Product/` 目录同步到 SQLite，CRUD 操作后实时同步。图片文件本身仍存储在文件系统，通过 `express.static('/Product')` 提供服务。

所有产品路由挂载在 `/api/products` 下。

### 1.1 获取产品列表

```http
GET /api/products
```

**功能**: 获取所有产品的列表信息

**响应示例**:
```json
[
  {
    "name": "cobi18",
    "folderName": "cobi18",
    "id": 1,
    "category": "general",
    "description": "Product model: cobi18",
    "path": "Product/cobi18",
    "totalSize": 1024000,
    "fileCount": 128,
    "modified": "2026-07-01T00:00:00.000Z",
    "isDirectory": true
  }
]
```

### 1.2 创建新产品

```http
POST /api/products
```

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "productName": "新产品名称",
  "folderName": "产品文件夹名"
}
```

### 1.3 重命名产品

```http
PUT /api/products/{productName}
```

**认证**: 需要 Bearer Token

**路径参数**: `productName` (原产品名称)

**请求体**:
```json
{
  "newProductName": "新产品名称",
  "newFolderName": "新文件夹名"
}
```

### 1.4 删除产品

```http
DELETE /api/products/{productName}
```

**认证**: 需要 Bearer Token

### 1.5 根据 ID 获取产品详情

```http
GET /api/products/{id}
```

**响应示例**:
```json
{
  "success": true,
  "product": {
    "id": "1",
    "name": "cobi18",
    "folderName": "cobi18",
    "category": "general",
    "description": "Product model: cobi18",
    "path": "Product/cobi18",
    "mainImage": "/Product/cobi18/image_00.webp",
    "views": {
      "view1": "/Product/cobi18/view1/",
      "view2": "/Product/cobi18/view2/",
      "view3": "/Product/cobi18/view3/",
      "view4": "/Product/cobi18/view4/"
    },
    "additionalImages": {
      "sixViews": "/Product/cobi18/images_6Views/",
      "other": "/Product/cobi18/images_other/"
    }
  }
}
```

### 1.6 根据名称获取产品详情

```http
GET /api/products/name/{productName}
```

### 1.7 获取产品图片列表

```http
GET /api/products/{productName}/images/{imageType}
```

**imageType 可选值**: `6views`、`other`

### 1.8 重新生成产品目录

```http
POST /api/products/refresh-catalog
```

**认证**: 需要 Bearer Token

**响应示例**:
```json
{
  "success": true,
  "message": "产品目录重新生成成功",
  "productCount": 5
}
```

### 1.9 获取产品目录（统一接口）

```http
GET /api/products/catalog
```

**说明**: 开发/生产环境统一使用此接口获取产品目录。

**响应示例**:
```json
{
  "products": [
    {
      "id": 1,
      "name": "cobi18",
      "folderName": "cobi18",
      "category": "general",
      "totalSize": 9441264,
      "fileCount": 137,
      "mainImage": "/Product/cobi18/image_00.webp",
      "views": { "view1": "/Product/cobi18/view1/" },
      "additionalImages": { "sixViews": "/Product/cobi18/images_6Views/" }
    }
  ],
  "totalProducts": 3,
  "lastUpdated": "2026-07-03T19:50:52.488Z",
  "version": "2.0"
}
```

### 1.10 数据库兼容 - 获取产品列表

```http
GET /api/db/products
```

**响应示例**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "cobi18",
      "folderName": "cobi18",
      "category": "general",
      "description": "Product model: cobi18",
      "path": "Product/cobi18",
      "totalSize": 1024000,
      "fileCount": 128
    }
  ]
}
```

### 1.11 数据库兼容 - 根据名称获取产品详情

```http
GET /api/db/products/name/{productName}
```

---

## 文件夹管理接口

所有文件夹路由挂载在 `/api/folder` 下，写操作需要 Bearer Token 认证。

> **多级路径支持**: 以下文件夹路由均使用 `(.*)` 路径参数，支持多级子目录路径（如 `Product/cobi18/subfolder/view1`）。`{folderPath}` 和 `{parentPath}` 可以包含斜杠分隔的多级目录。

### 2.1 获取文件夹详情

```http
GET /api/folder/{folderPath(.*)}/details
```

**路径参数**: `folderPath` — 文件夹相对路径，支持多级（如 `Product/cobi18/view1`）

### 2.2 创建子文件夹

```http
POST /api/folder/{parentPath(.*)}/create-subfolder
```

**认证**: 需要 Bearer Token

**路径参数**: `parentPath` — 父文件夹相对路径，支持多级

**请求体**:
```json
{
  "folderName": "新子文件夹名称"
}
```

### 2.3 删除子文件夹

```http
DELETE /api/folder/{parentPath(.*)}/subfolder/{folderName}
```

**认证**: 需要 Bearer Token

**路径参数**: `parentPath` — 父文件夹相对路径（支持多级），`folderName` — 子文件夹名称

### 2.4 重命名子文件夹

```http
PUT /api/folder/{parentPath(.*)}/subfolder/{folderName}
```

**认证**: 需要 Bearer Token

**路径参数**: `parentPath` — 父文件夹相对路径（支持多级），`folderName` — 原子文件夹名称

**请求体**:
```json
{
  "newFolderName": "新文件夹名称"
}
```

### 2.5 获取文件夹树结构

```http
GET /api/folder/{folderPath(.*)}/tree?maxDepth=3
```

**路径参数**: `folderPath` — 文件夹相对路径，支持多级

### 2.6 搜索文件

```http
GET /api/folder/{folderPath(.*)}/search?searchTerm=关键词&fileTypes=jpg,png
```

**路径参数**: `folderPath` — 文件夹相对路径，支持多级

### 2.7 导出文件夹为 ZIP

```http
GET /api/folder/export/{folderPath(.*)}
```

**认证**: 需要 Bearer Token

**路径参数**: `folderPath` — 要导出的文件夹相对路径，支持多级

**响应**: 流式返回 ZIP 文件下载，`Content-Type: application/zip`

**响应头**: `Content-Disposition: attachment; filename="{文件夹名}.zip"`

---

## 文件操作接口

写操作需要 Bearer Token 认证。

### 3.1 删除文件

```http
POST /api/delete-file
```

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "filePath": "Product/文件夹/文件名.jpg"
}
```

### 3.2 重命名文件

```http
POST /api/rename-file
```

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "filePath": "Product/文件夹/旧文件名.jpg",
  "newFileName": "新文件名.jpg"
}
```

**说明**: `filePath` 使用完整路径（含 `Product/` 前缀），`newFileName` 仅包含新文件名（不含路径）。重命名后自动同步产品目录。

### 3.3 检查文件夹是否有文件

```http
GET /api/check-folder/{folderPath}
```

**响应示例**:
```json
{
  "hasFiles": true,
  "fileCount": 5,
  "folderPath": "Product/文件夹",
  "message": "文件夹中存在文件"
}
```

### 3.3 获取文件信息

```http
GET /api/file-info/{filePath}
```

### 3.4 获取文件下载链接

```http
GET /api/download/{filePath}/{fileName}
```

---

## 文件上传接口

大部分上传路由需要 Bearer Token 认证，进度查询端点公开。

### 4.1 上传文件到指定文件夹

```http
POST /api/upload-files
```

**认证**: 需要 Bearer Token

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File[]): 上传的文件列表（支持多文件，最多 50 个）
- `folderPath` (string): 目标文件夹路径

**限流**: 10 次/分钟

### 4.2 上传单个产品文件夹

```http
POST /api/upload-product-folder
```

**认证**: 需要 Bearer Token

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File): ZIP 文件
- `folderName` (string): 目标文件夹名称

### 4.3 批量替换产品

```http
POST /api/batch-replace-products
```

**认证**: 需要 Bearer Token

**请求类型**: `multipart/form-data`

**请求参数**:
- `zipFile` (File): 包含所有产品的 ZIP 文件

### 4.4 手动重新生成产品目录

```http
POST /api/regenerate-catalog
```

**认证**: 需要 Bearer Token

### 4.5 获取上传进度

```http
GET /api/upload-progress/{uploadId}
```

---

## 国际化接口

所有国际化路由挂载在 `/api/i18n` 下。GET 请求公开，写操作需要 Bearer Token 认证。

> **数据源说明**: 翻译数据存储于 SQLite 数据库 (`data/products.db`) 的 `translations` 表。`src/i18n/translations.js` 作为种子数据源，首次启动时后端自动导入 SQLite。若数据库为空，GET `/api/i18n/translations` 会在返回数据前自动触发播种。运行时所有写操作直接读写 SQLite。

### 5.1 获取所有翻译

```http
GET /api/i18n/translations
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "en": {
      "productList_title": "Product List"
    },
    "zh-CN": {
      "productList_title": "产品列表"
    }
  }
}
```

### 5.2 更新翻译

```http
POST /api/i18n/translations
```

**认证**: 需要 Bearer Token

**请求体**: 完整的 translations 对象

### 5.3 添加翻译键

```http
POST /api/i18n/translations/keys
```

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "key": "new_key",
  "translations": {
    "en": "English text",
    "zh-CN": "中文文本"
  }
}
```

### 5.4 更新翻译键

```http
POST /api/i18n/translations/keys/{key}
```

**认证**: 需要 Bearer Token

**请求体**:
```json
{
  "translations": {
    "en": "English text",
    "zh-CN": "中文文本"
  }
}
```

### 5.5 删除翻译键

```http
DELETE /api/i18n/translations/keys/{key}
```

**认证**: 需要 Bearer Token

---

## 系统端点

### 健康检查

```http
GET /api/health
```

**响应**:
```json
{ "success": true, "message": "服务器运行正常", "timestamp": "..." }
```

### 客户端日志上报

```http
POST /api/logs
```

**请求体**: `{ "level": "error", "message": "...", "source": "client" }`

### 批量日志上报

```http
POST /api/logs/batch
```

**请求体**: `{ "logs": [...] }`

### 错误上报

```http
POST /api/error-report
```

**请求体**: `{ "message": "...", "stack": "...", "source": "client" }`

---

## 静态资源

### 产品图片访问

```http
GET /Product/{productName}/{viewType}/image_{frame}.webp
```

**viewType 示例**: `view1`、`view2`、`view3`、`view4`、`images_6Views`、`images_other`

**frame 范围**: `00` - `31`（共 32 帧）

---

## 错误代码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 无效 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（限流） |
| 500 | 服务器内部错误 |

## 速率限制

| 端点 | 限制 | 窗口 |
|------|------|------|
| `POST /api/auth/login` | 5 次 | 每分钟 |
| 通用 API | 100 次 | 每分钟 |
| 上传接口 | 10 次 | 每分钟 |
