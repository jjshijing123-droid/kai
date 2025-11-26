const express = require('express');
const FolderService = require('../services/folderService');
const { ProductCatalogUtils, productCatalogUtils } = require('../utils/productCatalogUtils');
const router = express.Router();
const folderService = new FolderService();

/**
 * 文件夹管理路由
 */

/**
 * 检查是否为产品文件夹（位于Product目录下）
 */
function isProductFolder(parentPath, folderName) {
  return parentPath.includes('Product/') && folderName;
}

/**
 * 获取完整的产品文件夹名称
 */
function getFullProductFolderName(parentPath, folderName) {
  // 从Product/路径中提取产品名称
  const productMatch = parentPath.match(/Product\/(.+)/);
  if (productMatch) {
    return productMatch[1]; // 返回产品名称
  }
  return null;
}

// 获取文件夹详情
router.get('/:folderPath/details', async (req, res) => {
  try {
    const { folderPath } = req.params;
    
    const folderDetails = await folderService.getFolderDetails(folderPath);
    
    res.json({
      success: true,
      folder: folderDetails
    });
    
  } catch (error) {
    console.error('获取文件夹详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文件夹详情失败',
      error: error.message
    });
  }
});

// 创建子文件夹
router.post('/:parentPath/create-subfolder', async (req, res) => {
  try {
    const { parentPath } = req.params;
    const { folderName } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: '文件夹名称不能为空'
      });
    }
    
    const result = await folderService.createSubfolder(parentPath, folderName);
    
    res.json({
      success: true,
      message: '子文件夹创建成功',
      data: result
    });
    
  } catch (error) {
    console.error('创建子文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '创建子文件夹失败',
      error: error.message
    });
  }
});

// 删除子文件夹
router.delete('/:parentPath/subfolder/:folderName', async (req, res) => {
  try {
    const { parentPath, folderName } = req.params;
    
    const result = await folderService.deleteSubfolder(parentPath, folderName);
    
    // 检查是否需要同步产品目录
    if (isProductFolder(parentPath, folderName)) {
      const productFolderName = getFullProductFolderName(parentPath, folderName);
      if (productFolderName) {
        console.log(`🔄 检测到删除产品文件夹，同步更新产品目录: ${productFolderName}`);
        productCatalogUtils.updateProductCatalog(productFolderName, 'delete');
      }
    }
    
    res.json({
      success: true,
      message: '子文件夹删除成功',
      data: result
    });
    
  } catch (error) {
    console.error('删除子文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '删除子文件夹失败',
      error: error.message
    });
  }
});

// 重命名子文件夹
router.put('/:parentPath/subfolder/:folderName', async (req, res) => {
  try {
    const { parentPath, folderName } = req.params;
    const { newFolderName } = req.body;
    
    if (!newFolderName) {
      return res.status(400).json({
        success: false,
        message: '新文件夹名称不能为空'
      });
    }
    
    const result = await folderService.renameSubfolder(parentPath, folderName, newFolderName);
    
    // 检查是否需要同步产品目录
    if (isProductFolder(parentPath, folderName)) {
      const productFolderName = getFullProductFolderName(parentPath, folderName);
      if (productFolderName) {
        console.log(`🔄 检测到重命名产品文件夹，同步更新产品目录: ${productFolderName} -> ${newFolderName}`);
        productCatalogUtils.updateProductCatalog(productFolderName, 'rename', newFolderName);
      }
    }
    
    res.json({
      success: true,
      message: '子文件夹重命名成功',
      data: result
    });
    
  } catch (error) {
    console.error('重命名子文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '重命名子文件夹失败',
      error: error.message
    });
  }
});

// 获取文件夹树结构
router.get('/:folderPath/tree', async (req, res) => {
  try {
    const { folderPath } = req.params;
    const maxDepth = parseInt(req.query.maxDepth) || 3;
    
    const tree = await folderService.getFolderTree(folderPath, maxDepth);
    
    res.json({
      success: true,
      tree: tree
    });
    
  } catch (error) {
    console.error('获取文件夹树失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文件夹树失败',
      error: error.message
    });
  }
});

// 搜索文件
router.get('/:folderPath/search', async (req, res) => {
  try {
    const { folderPath } = req.params;
    const { searchTerm, fileTypes } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: '搜索词不能为空'
      });
    }
    
    let types = null;
    if (fileTypes) {
      types = fileTypes.split(',').map(ext => ext.trim().toLowerCase());
    }
    
    const results = await folderService.searchFiles(folderPath, searchTerm, types);
    
    res.json({
      success: true,
      results: results,
      searchTerm: searchTerm,
      count: results.length
    });
    
  } catch (error) {
    console.error('搜索文件失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索文件失败',
      error: error.message
    });
  }
});

module.exports = router;