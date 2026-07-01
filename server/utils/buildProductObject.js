const path = require('path')
const fs = require('fs')

/**
 * 统一的产品数据对象构建工具
 * 所有产品数据的构造都应通过此函数，避免分散在各处手拼
 */

function buildProductObject({ name, folderName, totalSize, fileCount, id, category, description, modified, isDirectory }) {
  const safeFolderName = folderName || name
  return {
    id: id || 0,
    name,
    folderName: safeFolderName,
    category: category || 'general',
    description: description || `Product model: ${name}`,
    path: `Product/${safeFolderName}`,
    folder: `Product/${safeFolderName}/`,
    totalSize: totalSize || 0,
    fileCount: fileCount || 0,
    modified,
    isDirectory: isDirectory ?? true,
    mainImage: `/Product/${safeFolderName}/image_00.webp`,
    views: {
      view1: `/Product/${safeFolderName}/view1/`,
      view2: `/Product/${safeFolderName}/view2/`,
      view3: `/Product/${safeFolderName}/view3/`,
      view4: `/Product/${safeFolderName}/view4/`
    },
    additionalImages: {
      sixViews: `/Product/${safeFolderName}/images_6Views/`,
      other: `/Product/${safeFolderName}/images_other/`
    }
  }
}

module.exports = { buildProductObject }
