const express = require('express');
const FolderService = require('../services/folderService');
const { authMiddleware } = require('../middleware/auth');
const syncService = require('../database/sync')
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const router = express.Router();
const folderService = new FolderService();

/**
 * 文件夹管理路由
 */

/**
 * 检查是否为产品文件夹（位于Product目录下的第一层）
 */
function isProductFolder(parentPath) {
  // 只有直接在 Product/ 下的操作才影响产品目录
  return parentPath === 'Product' || parentPath === 'Product/';
}

// 获取文件夹详情
router.get('/:folderPath(.*)/details', authMiddleware, async (req, res) => {
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
router.post('/:parentPath(.*)/create-subfolder', authMiddleware, async (req, res) => {
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
router.delete('/:parentPath(.*)/subfolder/:folderName', authMiddleware, async (req, res) => {
  try {
    const { parentPath, folderName } = req.params;

    const result = await folderService.deleteSubfolder(parentPath, folderName);

    // 检查是否需要同步产品目录：只在 Product/ 根目录下删除产品时同步
    if (isProductFolder(parentPath)) {
      console.log(`🔄 检测到删除产品目录下的文件夹，同步 SQLite: ${folderName}`);
      syncService.removeProduct(folderName);
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
router.put('/:parentPath(.*)/subfolder/:folderName', authMiddleware, async (req, res) => {
  try {
    const { parentPath, folderName } = req.params;
    const { newFolderName } = req.body;

    const result = await folderService.renameSubfolder(parentPath, folderName, newFolderName);

    // 检查是否需要同步产品目录：只在 Product/ 根目录下重命名产品时同步
    if (isProductFolder(parentPath)) {
      console.log(`🔄 检测到重命名产品目录下的文件夹，同步 SQLite: ${folderName} -> ${newFolderName}`);
      syncService.renameProduct(folderName, newFolderName);
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
router.get('/:folderPath(.*)/tree', authMiddleware, async (req, res) => {
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
router.get('/:folderPath(.*)/search', authMiddleware, async (req, res) => {
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

// 导出文件夹为 ZIP
router.get('/export/:folderPath(.*)', authMiddleware, async (req, res) => {
  try {
    const { folderPath } = req.params;
    const serverPath = path.resolve(__dirname, '../../');
    const productBasePath = path.join(serverPath, 'Product');

    // 安全拼接路径
    const cleanPath = folderPath.startsWith('Product/')
      ? folderPath.replace('Product/', '')
      : folderPath.replace(/^Product\//, '');
    const fullPath = path.join(productBasePath, cleanPath);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      return res.status(404).json({
        success: false,
        message: '文件夹不存在'
      });
    }

    const folderName = path.basename(fullPath);
    const zipFileName = `${folderName}.zip`;

    // 设置响应头为文件下载
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);

    // 创建 archiver 输出流，直接写入 response
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('ZIP 压缩错误:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: '压缩失败', error: err.message });
      }
    });

    archive.pipe(res);

    // 递归添加目录内容
    const addDirectoryToArchive = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const archivePath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          addDirectoryToArchive(itemPath, archivePath);
        } else {
          archive.file(itemPath, { name: archivePath });
        }
      }
    };

    addDirectoryToArchive(fullPath);

    // 完成后缀
    archive.finalize();

    console.log(`📦 导出文件夹: ${folderPath} -> ${zipFileName}`);

  } catch (error) {
    console.error('导出文件夹失败:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '导出文件夹失败',
        error: error.message
      });
    }
  }
});

module.exports = router;