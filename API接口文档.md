# ICE图片查看器 - API接口文档

## 概述

本文档详细描述了ICE图片查看器产品管理系统的RESTful API接口。系统采用基于文件系统的数据存储，提供完整的产品管理、文件操作和国际化功能。

### 基础信息
- **Base URL**: `http://localhost:3000`
- **API版本**: v1.0
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式
所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 认证和授权

### 管理员认证
系统使用会话基础的认证方式，管理员登录后会获得管理权限。

**注意**: 当前版本认证机制简化，生产环境建议实现完整的JWT或Session认证。

## API接口列表

### 1. 产品管理接口

#### 1.1 获取产品列表
```http
GET /api/products
```

**描述**: 获取所有产品的列表信息

**请求参数**: 无

**响应示例**:
```json
[
  {
    "name": "产品文件夹1",
    "folderName": "产品文件夹1",
    "id": 1,
    "category": "general",
    "description": "Product model: 产品文件夹1",
    "path": "Product/产品文件夹1",
    "totalSize": 1024000,
    "fileCount": 128,
    "modified": "2024-01-01T00:00:00.000Z",
    "isDirectory": true
  }
]
```

#### 1.2 创建新产品
```http
POST /api/products
```

**描述**: 创建一个新的产品文件夹

**请求体**:
```json
{
  "productName": "新产品名称",
  "folderName": "产品文件夹名"
}
```

**参数说明**:
- `productName` (string, required): 产品显示名称
- `folderName` (string, required): 产品文件夹名称

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

#### 1.3 重命名产品
```http
PUT /api/products/{productName}
```

**描述**: 重命名指定的产品

**路径参数**:
- `productName` (string): 原产品名称

**请求体**:
```json
{
  "newProductName": "新产品名称",
  "newFolderName": "新文件夹名"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "产品重命名成功",
  "data": {
    "oldName": "原产品名称",
    "newName": "新文件夹名",
    "oldPath": "Product/原产品名称",
    "newPath": "Product/新文件夹名"
  }
}
```

#### 1.4 删除产品
```http
DELETE /api/products/{productName}
```

**描述**: 删除指定的产品

**路径参数**:
- `productName` (string): 要删除的产品名称

**响应示例**:
```json
{
  "success": true,
  "message": "产品 \"产品名称\" 删除成功",
  "physicalItemDeleted": true,
  "deletedProduct": {
    "name": "产品名称",
    "path": "Product/产品名称"
  }
}
```

#### 1.5 根据名称获取产品详情
```http
GET /api/products/name/{productName}
```

**描述**: 根据产品名称获取详细信息

**路径参数**:
- `productName` (string): 产品名称

**响应示例**:
```json
{
  "success": true,
  "product": {
    "id": null,
    "name": "产品名称",
    "folderName": "产品名称",
    "category": "general",
    "description": "Product model: 产品名称",
    "path": "Product/产品名称",
    "totalSize": 1024000,
    "fileCount": 128,
    "mainImage": "/Product/产品名称/image_00.webp",
    "folder": "Product/产品名称/",
    "views": {
      "view1": "/Product/产品名称/view1/",
      "view2": "/Product/产品名称/view2/",
      "view3": "/Product/产品名称/view3/",
      "view4": "/Product/产品名称/view4/"
    },
    "additionalImages": {
      "sixViews": "/Product/产品名称/images_6Views/",
      "other": "/Product/产品名称/images_other/"
    }
  }
}
```

#### 1.6 获取产品图片列表
```http
GET /api/products/{productName}/images/{imageType}
```

**描述**: 获取指定产品的图片列表

**路径参数**:
- `productName` (string): 产品名称
- `imageType` (string): 图片类型，支持 `6views` 或 `other`

**响应示例**:
```json
{
  "success": true,
  "images": [
    {
      "name": "image_00.webp",
      "url": "/Product/产品名称/images_6Views/image_00.webp",
      "path": "Product/产品名称/images_6Views/image_00.webp",
      "size": 15360,
      "modified": "2024-01-01T00:00:00.000Z",
      "format": "webp"
    }
  ],
  "total": 1,
  "productName": "产品名称",
  "imageType": "6views"
}
```

#### 1.7 重新生成产品目录
```http
POST /api/products/refresh-catalog
```

**描述**: 手动重新生成产品目录文件

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "message": "产品目录重新生成成功",
  "productCount": 5
}
```

### 2. 文件夹管理接口

#### 2.1 获取文件夹详情
```http
GET /api/folder/{folderPath}/details
```

**描述**: 获取指定路径文件夹的详细内容

**路径参数**:
- `folderPath` (string): 文件夹路径

**响应示例**:
```json
{
  "success": true,
  "folder": {
    "name": "文件夹名称",
    "path": "Product/文件夹名称",
    "folders": {
      "子文件夹1": {
        "path": "Product/文件夹名称/子文件夹1",
        "fileCount": 3,
        "totalSize": 307200
      }
    },
    "files": [
      {
        "name": "file.txt",
        "size": 1024,
        "modified": "2024-01-01T00:00:00.000Z",
        "path": "Product/文件夹名称/file.txt"
      }
    ]
  }
}
```

#### 2.2 创建子文件夹
```http
POST /api/folder/{parentPath}/create-subfolder
```

**描述**: 在指定父文件夹下创建子文件夹

**路径参数**:
- `parentPath` (string): 父文件夹路径

**请求体**:
```json
{
  "folderName": "新子文件夹名称"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹创建成功",
  "data": {
    "name": "新子文件夹名称",
    "path": "父路径/新子文件夹名称",
    "created": true
  }
}
```

#### 2.3 删除子文件夹
```http
DELETE /api/folder/{parentPath}/subfolder/{folderName}
```

**描述**: 删除指定的子文件夹

**路径参数**:
- `parentPath` (string): 父文件夹路径
- `folderName` (string): 要删除的文件夹名称

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹删除成功",
  "data": {
    "name": "文件夹名称",
    "path": "父路径/文件夹名称",
    "deleted": true
  }
}
```

#### 2.4 重命名子文件夹
```http
PUT /api/folder/{parentPath}/subfolder/{folderName}
```

**描述**: 重命名指定的子文件夹

**路径参数**:
- `parentPath` (string): 父文件夹路径
- `folderName` (string): 原文件夹名称

**请求体**:
```json
{
  "newFolderName": "新文件夹名称"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "子文件夹重命名成功",
  "data": {
    "oldName": "原文件夹名称",
    "newName": "新文件夹名称",
    "oldPath": "父路径/原文件夹名称",
    "newPath": "父路径/新文件夹名称",
    "renamed": true
  }
}
```

#### 2.5 获取文件夹树结构
```http
GET /api/folder/{folderPath}/tree?maxDepth=3
```

**描述**: 获取指定路径的文件夹树结构

**路径参数**:
- `folderPath` (string): 文件夹路径

**查询参数**:
- `maxDepth` (integer): 最大深度，默认为3

**响应示例**:
```json
{
  "success": true,
  "tree": {
    "name": "根文件夹",
    "path": "Product/根文件夹",
    "type": "directory",
    "children": [
      {
        "name": "子文件夹1",
        "path": "Product/根文件夹/子文件夹1",
        "type": "directory",
        "children": []
      },
      {
        "name": "文件.txt",
        "path": "Product/根文件夹/文件.txt",
        "type": "file",
        "size": 1024,
        "modified": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 2.6 搜索文件
```http
GET /api/folder/{folderPath}/search?searchTerm=关键词&fileTypes=jpg,png
```

**描述**: 在指定文件夹中搜索文件

**路径参数**:
- `folderPath` (string): 搜索文件夹路径

**查询参数**:
- `searchTerm` (string, required): 搜索关键词
- `fileTypes` (string): 文件类型过滤，多个类型用逗号分隔

**响应示例**:
```json
{
  "success": true,
  "results": [
    {
      "name": "图片文件.jpg",
      "path": "Product/文件夹/图片文件.jpg",
      "size": 204800,
      "modified": "2024-01-01T00:00:00.000Z",
      "type": "file"
    }
  ],
  "searchTerm": "关键词",
  "count": 1
}
```

### 3. 文件操作接口

#### 3.1 删除文件
```http
POST /api/delete-file
```

**描述**: 删除指定的文件

**请求体**:
```json
{
  "filePath": "Product/文件夹/文件名.jpg"
}
```

**参数说明**:
- `filePath` (string, required): 文件路径

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

#### 3.2 检查文件夹是否有文件
```http
GET /api/check-folder/{folderPath}
```

**描述**: 检查指定文件夹中是否有文件

**路径参数**:
- `folderPath` (string): 文件夹路径

**响应示例**:
```json
{
  "hasFiles": true,
  "fileCount": 5,
  "folderPath": "Product/文件夹",
  "message": "文件夹中存在文件"
}
```

#### 3.3 获取文件信息
```http
GET /api/file-info/{filePath}
```

**描述**: 获取指定文件的详细信息

**路径参数**:
- `filePath` (string): 文件路径

**响应示例**:
```json
{
  "success": true,
  "fileInfo": {
    "name": "文件名.jpg",
    "size": 102400,
    "modified": "2024-01-01T00:00:00.000Z",
    "isFile": true,
    "isDirectory": false
  }
}
```

#### 3.4 获取文件下载链接
```http
GET /api/download/{filePath}/{fileName}
```

**描述**: 获取文件的下载链接

**路径参数**:
- `filePath` (string): 文件路径
- `fileName` (string): 文件名

**响应示例**:
```json
{
  "success": true,
  "downloadUrl": "/Product/文件夹路径/文件名",
  "fileName": "文件名.jpg"
}
```

### 4. 文件上传接口

#### 4.1 上传文件
```http
POST /api/upload-files
```

**描述**: 上传文件到指定文件夹

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File): 上传的文件
- `folderPath` (string): 目标文件夹路径

**响应示例**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "uploadedFiles": [
    {
      "originalName": "原始文件名.jpg",
      "actualName": "实际文件名.jpg",
      "path": "/完整/文件/路径.jpg",
      "relativePath": "文件夹/实际文件名.jpg",
      "size": 102400
    }
  ],
  "successfulCount": 1,
  "failedCount": 0
}
```

#### 4.2 上传文件夹
```http
POST /api/upload-folder
```

**描述**: 上传产品文件夹（ZIP格式）

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File): ZIP文件

**响应示例**:
```json
{
  "success": true,
  "message": "产品文件夹上传成功",
  "originalName": "产品文件夹",
  "actualName": "产品文件夹_副本1",
  "fileCount": 25,
  "folderCount": 6,
  "path": "Product/产品文件夹_副本1"
}
```

#### 4.3 批量替换产品
```http
POST /api/upload/batch-replace
```

**描述**: 批量替换所有产品（危险操作）

**请求类型**: `multipart/form-data`

**请求参数**:
- `file` (File): 包含所有产品的ZIP文件

**响应示例**:
```json
{
  "success": true,
  "message": "批量替换完成，处理了 128 个文件，创建了 8 个文件夹，备份文件夹已立即清理",
  "fileCount": 128,
  "folderCount": 8,
  "skippedHiddenFiles": 0,
  "replacedProducts": [
    {
      "name": "产品1",
      "path": "Product/产品1",
      "type": "directory"
    }
  ],
  "backupPath": "Product_backup_1704067200000"
}
```

### 5. 国际化接口

#### 5.1 获取所有翻译
```http
GET /api/i18n/translations
```

**描述**: 获取所有翻译内容

**响应示例**:
```json
{
  "success": true,
  "data": {
    "en": {
      "productList_title": "Product List",
      "productManagement_title": "Product Management"
    },
    "zh-CN": {
      "productList_title": "产品列表",
      "productManagement_title": "产品管理"
    }
  }
}
```

#### 5.2 更新翻译
```http
POST /api/i18n/translations
```

**描述**: 更新翻译内容

**请求体**:
```json
{
  "en": {
    "new_key": "New Translation"
  },
  "zh-CN": {
    "new_key": "新翻译"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Translations updated successfully"
}
```

#### 5.3 添加翻译键
```http
POST /api/i18n/translations/keys
```

**描述**: 添加新的翻译键

**请求体**:
```json
{
  "key": "new_translation_key",
  "translations": {
    "en": "New Translation",
    "zh-CN": "新翻译"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Translation key added successfully"
}
```

#### 5.4 更新翻译键
```http
PUT /api/i18n/translations/keys/{key}
```

**描述**: 更新指定翻译键的内容

**路径参数**:
- `key` (string): 翻译键

**请求体**:
```json
{
  "translations": {
    "en": "Updated Translation",
    "zh-CN": "更新的翻译"
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Translation key updated successfully"
}
```

#### 5.5 删除翻译键
```http
DELETE /api/i18n/translations/keys/{key}
```

**描述**: 删除指定的翻译键

**路径参数**:
- `key` (string): 要删除的翻译键

**响应示例**:
```json
{
  "success": true,
  "message": "Translation key deleted successfully"
}
```

### 6. 兼容性接口

#### 6.1 获取数据库产品列表（兼容性）
```http
GET /api/db/products
```

**描述**: 从数据库兼容模式获取产品列表

**响应示例**:
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "产品名称",
      "folderName": "产品文件夹",
      "category": "general",
      "description": "Product model: 产品名称",
      "path": "Product/产品文件夹",
      "totalSize": 1024000,
      "fileCount": 128
    }
  ]
}
```

#### 6.2 根据名称获取产品详情（兼容性）
```http
GET /api/db/products/name/{productName}
```

**描述**: 兼容性模式下的产品详情获取

**路径参数**:
- `productName` (string): 产品名称

**响应示例**:
```json
{
  "success": true,
  "product": {
    "name": "产品名称",
    "folderName": "产品文件夹",
    "category": "general",
    "description": "Product model: 产品名称",
    "path": "Product/产品文件夹",
    "totalSize": 1024000,
    "fileCount": 128,
    "mainImage": "/Product/产品文件夹/image_00.webp"
  }
}
```

## 静态资源接口

### 产品图片访问
```http
GET /Product/{productName}/{viewType}/image_{frame}.webp
```

**描述**: 直接访问产品图片文件

**路径参数**:
- `productName` (string): 产品名称
- `viewType` (string): 视图类型 (view1, view2, view3, view4, images_6Views, images_other)
- `frame` (string): 帧数 (00-31)

**示例**:
- `/Product/产品名称/view1/image_00.webp`
- `/Product/产品名称/images_6Views/image_00.webp`

### 产品目录数据
```http
GET /data/product-catalog.json
```

**描述**: 获取产品目录JSON文件

**响应示例**:
```json
{
  "products": [
    {
      "id": 1,
      "name": "产品名称",
      "folderName": "产品文件夹",
      "model": "产品型号",
      "category": "general",
      "description": "产品描述",
      "path": "Product/产品文件夹/",
      "folder": "Product/产品文件夹/",
      "totalSize": 1024000,
      "fileCount": 128,
      "mainImage": "/Product/产品文件夹/image_00.webp",
      "views": {
        "view1": "/Product/产品文件夹/view1/",
        "view2": "/Product/产品文件夹/view2/",
        "view3": "/Product/产品文件夹/view3/",
        "view4": "/Product/产品文件夹/view4/"
      },
      "additionalImages": {
        "sixViews": "/Product/产品文件夹/images_6Views/",
        "other": "/Product/产品文件夹/images_other/"
      }
    }
  ],
  "totalProducts": 1,
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "version": "2.0"
}
```

## 错误代码说明

### 通用错误代码
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未授权访问
- `403 Forbidden` - 禁止访问
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

### 业务错误代码
- `FOLDER_EXISTS` - 文件夹已存在
- `FILE_NOT_FOUND` - 文件不存在
- `INVALID_PATH` - 无效路径
- `UPLOAD_FAILED` - 文件上传失败
- `INVALID_FILE_TYPE` - 无效文件类型
- `FILE_TOO_LARGE` - 文件过大
- `PRODUCT_NOT_FOUND` - 产品不存在

## 速率限制

当前版本未实现速率限制，生产环境建议：
- IP级别：1000请求/小时
- 用户级别：500请求/小时

## 接口变更日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的产品管理API
- 文件夹管理API
- 文件上传API
- 国际化API
- 兼容性API

---

**文档维护**: 此文档应随着API的变更而更新，确保开发者能够获取最新的接口信息。

**技术支持**: 如有API相关问题，请联系开发团队或查看项目Issues。