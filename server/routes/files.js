const express = require('express');
const FileService = require('../services/fileService');
const UploadService = require('../services/uploadService');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
const fileService = new FileService();
const uploadService = new UploadService();

/**
 * 文件操作路由
 */

// 删除文件
router.post('/delete-file', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径不能为空'
      });
    }
    
    await fileService.deleteFile(filePath);
    
    // 如果删除的是Product目录下的文件，重新生成产品目录
    if (filePath.startsWith('Product/')) {
      console.log('🔄 检测到删除Product目录下的文件，重新生成产品目录...');
      await uploadService.regenerateProductCatalog();
    }
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
    
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
});

// 重命名文件
router.post('/rename-file', authMiddleware, async (req, res) => {
  try {
    const { filePath, newFileName } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: '文件路径不能为空'
      });
    }

    if (!newFileName) {
      return res.status(400).json({
        success: false,
        message: '新文件名不能为空'
      });
    }

    const result = await fileService.renameFile(filePath, newFileName);

    // 如果重命名的是 Product 目录下的文件，重新生成产品目录
    if (filePath.startsWith('Product/')) {
      await uploadService.regenerateProductCatalog();
    }

    res.json({
      success: true,
      message: '文件重命名成功',
      ...result
    });

  } catch (error) {
    console.error('重命名文件失败:', error);
    res.status(500).json({
      success: false,
      message: '重命名文件失败',
      error: error.message
    });
  }
});

// 检查文件夹中是否有文件（公开只读，不需要认证）
router.get('/check-folder/:folderPath', async (req, res) => {
  try {
    const { folderPath } = req.params;
    console.log(`🔍 检测文件夹文件: ${folderPath}`);
    
    const result = await fileService.checkFolderHasFiles(folderPath);
    
    console.log(`📁 文件夹: ${folderPath}`);
    console.log(`📊 文件数量: ${result.fileCount}`);
    console.log(`✅ 是否有文件: ${result.hasFiles}`);
    
    res.json(result);
    
  } catch (error) {
    console.error('检测文件夹失败:', error);
    res.status(500).json({
      success: false,
      message: '检测文件夹失败',
      error: error.message
    });
  }
});

// 获取文件信息（公开只读，不需要认证）
router.get('/file-info/:filePath', async (req, res) => {
  try {
    const { filePath } = req.params;
    
    const fileInfo = await fileService.getFileInfo(filePath);
    
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    res.json({
      success: true,
      fileInfo: fileInfo
    });
    
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文件信息失败',
      error: error.message
    });
  }
});

// 下载文件（公开只读，不需要认证）
router.get('/download/:filePath/:fileName', async (req, res) => {
  try {
    const { filePath, fileName } = req.params;
    
    // 验证文件是否存在
    const fileExists = await fileService.checkFileExists(`Product/${filePath}/${fileName}`);
    
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    
    const fileUrl = fileService.getFileUrl(filePath, fileName);
    
    res.json({
      success: true,
      downloadUrl: fileUrl,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('获取下载链接失败:', error);
    res.status(500).json({
      success: false,
      message: '获取下载链接失败',
      error: error.message
    });
  }
});

module.exports = router;