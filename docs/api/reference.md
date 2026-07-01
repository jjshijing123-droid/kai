# ICE 图片查看器 - API 参考文档

## 基础信息

- **Base URL**: `http://localhost:3000`
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
  "error": "详细错误信息",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

---

## 产品管理接口

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

**请求体**:
```json
{
  "productName": "新产品名称",
  "folderName": "产品文件夹名"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "产品文件夹 \"新产品名称\" 创建成功",
  "data": {
    "productName": "新产品名称",
    "folderName": "产品文件夹名",
    "path": "Product/产品文件夹名"
  }
}
```

### 1.3 重命名产品

```http
PUT /api/products/{productName}
```

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

**响应示例**:
```json
{
  "success": true,
  "message": "产品目录重新生成成功",
  "productCount": 5
}
```

### 1.9 数据库兼容 - 获取产品列表

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

### 1.10 数据库兼容 - 根据名称获取产品详情

```http
GET /api/db/products/name/{productName}
```

---

## 文件夹管理接口

所有文件夹路由挂载在 `/api/folder` 下。

### 2.1 获取文件夹详情

```http
GET /api/folder/{folderPath}/details
```

### 2.2 创建子文件夹

```http
POST /api/folder/{parentPath}/create-subfolder
```

**请求体**:
```json
{
  "folderName": "新子文件夹名称"
}
```

### 2.3 删除子文件夹

```http
DELETE /api/folder/{parentPath}/subfolder/{folderName}
```

### 2.4 重命名子文件夹

```http
PUT /api/folder/{parentPath}/subfolder/{folderName}
```

**请求体**:
```json
{
  "newFolderName": "新文件夹名称"
}
```

### 2.5 获取文件夹树结构

```http
GET /api/folder/{folderPath}/tree?maxDepth=3
```

### 2.6 搜索文件

```http
GET /api/folder/{folderPath}/search?searchTerm=关键词&fileTypes=jpg,png
```

---

## 文件操作接口

### 3.1 删除文件

```http
POST /api/delete-file
```

**请求体**:
```json
{
  "filePath": "Product/文件夹/文件名.jpg"
}
```

### 3.2 检查文件夹是否有文件

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

### 4.1 上传文件到指定文件夹

```http
POST /api/upload-files
```

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File[]): 上传的文件列表（支持多文件）
- `folderPath` (string): 目标文件夹路径

### 4.2 上传单个产品文件夹

```http
POST /api/upload-product-folder
```

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File): ZIP 文件
- `folderName` (string): 目标文件夹名称

### 4.3 批量替换产品

```http
POST /api/batch-replace-products
```

**请求类型**: `multipart/form-data`

**请求参数**:
- `zipFile` (File): 包含所有产品的 ZIP 文件

### 4.4 重新生成产品目录

```http
POST /api/regenerate-catalog
```

### 4.5 获取上传进度

```http
GET /api/upload-progress/{uploadId}
```

---

## 国际化接口

所有国际化路由挂载在 `/api/i18n` 下。

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

**请求体**: 完整的 translations 对象

### 5.3 添加翻译键

```http
POST /api/i18n/translations/keys
```

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
PUT /api/i18n/translations/keys/{key}
```

### 5.5 删除翻译键

```http
DELETE /api/i18n/translations/keys/{key}
```

---

## 静态资源

### 产品图片访问

```http
GET /Product/{productName}/{viewType}/image_{frame}.webp
```

**viewType 示例**: `view1`、`view2`、`view3`、`view4`、`images_6Views`、`images_other`

**frame 范围**: `00` - `31`（共 32 帧）

### 产品目录数据

```http
GET /data/product-catalog.json
```

---

## 错误代码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 速率限制

当前版本未实现速率限制。生产环境建议：

- IP 级别: 1000 请求/小时
- 用户级别: 500 请求/小时
