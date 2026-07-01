const express = require('express');
const multer = require('multer');
const UploadService = require('../services/uploadService');
const router = express.Router();
const uploadService = new UploadService();

// 修复 Multer 中文文件名乱码
// Multer 2.x / Busboy 1.6.x 将 multipart header 中的文件名按 Latin-1 解码，
// 导致中文文件名变成乱码。这里通过 Buffer 字节转换恢复 UTF-8 编码。
function fixFileName(originalName) {
  if (!originalName) return originalName
  // 尝试将 Latin-1 解码的字符串转回原始字节，再用 UTF-8 解码
  try {
    const fixed = Buffer.from(originalName, 'latin1').toString('utf-8')
    // 验证修复后的文件名不包含 NUL 字节
    if (!fixed.includes('\x00')) {
      return fixed
    }
  } catch (e) {
    // 转换失败，返回原始名称
  }
  return originalName
}

// Multer磁盘存储引擎 - 修复文件名编码
const diskStorage = multer.diskStorage({
  filename: (req, file, cb) => {
    const fixedName = fixFileName(file.originalname)
    cb(null, fixedName)
  }
})

// Multer配置 - 用于批量上传
const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const fixedName = fixFileName(file.originalname)
    if (file.mimetype === 'application/zip' || fixedName.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只支持ZIP格式的压缩包'));
    }
  }
});

// Multer配置 - 用于文件上传（支持多文件）
const fileUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB per file
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

// 上传文件到指定文件夹
router.post('/upload-files', fileUpload.array('file'), async (req, res) => {
  try {
    const files = req.files;
    const { folderPath } = req.body;
    
    console.log('📁 收到文件上传请求');
    console.log('📄 文件数量:', files.length);
    console.log('📁 目标路径:', folderPath);
    
    const result = await uploadService.uploadFiles(files, folderPath);
    
    res.json(result);
    
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败: ' + error.message,
      error: error.message
    });
  }
});

module.exports = router;