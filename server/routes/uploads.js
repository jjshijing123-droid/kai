const express = require('express');
const multer = require('multer');
const UploadService = require('../services/uploadService');
const router = express.Router();
const uploadService = new UploadService();

// Multer配置 - 用于批量上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只支持ZIP格式的压缩包'));
    }
  }
});

/**
 * 上传管理路由
 */

// 批量替换产品
router.post('/batch-replace-products', upload.single('zipFile'), async (req, res) => {
  try {
    const result = await uploadService.batchReplaceProducts(req.file);
    
    res.json(result);
    
  } catch (error) {
    console.error('批量替换失败:', error);
    res.status(500).json({
      success: false,
      message: '批量替换失败: ' + error.message,
      error: error.message
    });
  }
});

// 上传单个产品文件夹
router.post('/upload-product-folder', upload.single('file'), async (req, res) => {
  try {
    const { folderName } = req.body;
    
    if (!folderName) {
      return res.status(400).json({
        success: false,
        error: '文件夹名称不能为空'
      });
    }
    
    const result = await uploadService.uploadProductFolder(req.file, folderName);
    
    res.json(result);
    
  } catch (error) {
    console.error('单个产品文件夹上传失败:', error);
    res.status(500).json({
      success: false,
      error: '单个产品文件夹上传失败: ' + error.message
    });
  }
});

// 手动重新生成产品目录
router.post('/regenerate-catalog', async (req, res) => {
  try {
    console.log('手动重新生成产品目录...');
    const result = await uploadService.regenerateCatalog();
    
    res.json({
      success: true,
      message: '产品目录重新生成成功',
      data: {}
    });
    
  } catch (error) {
    console.error('重新生成产品目录失败:', error);
    res.status(500).json({
      success: false,
      message: '重新生成产品目录失败',
      error: error.message
    });
  }
});

// 获取上传进度（用于大文件上传）
router.get('/upload-progress/:uploadId', (req, res) => {
  // 这里可以实现上传进度跟踪
  res.json({
    success: true,
    progress: 100,
    message: '上传完成'
  });
});

module.exports = router;