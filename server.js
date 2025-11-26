const express = require('express');
const path = require('path');
const cors = require('cors');

const ProductService = require('./server/services/productService');
const FileService = require('./server/services/fileService');
const FolderService = require('./server/services/folderService');
const UploadService = require('./server/services/uploadService');

// 导入路由
const productsRouter = require('./server/routes/products');
const foldersRouter = require('./server/routes/folders');
const filesRouter = require('./server/routes/files');
const uploadsRouter = require('./server/routes/uploads');

// 导入工具
const { ProductCatalogUtils, productCatalogUtils } = require('./server/utils/productCatalogUtils');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化服务实例
const productService = new ProductService();
const fileService = new FileService();
const folderService = new FolderService();
const uploadService = new UploadService();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 必须在所有API路由之后
app.use(express.static(path.join(__dirname, 'public')));

// ========== API路由 ==========

// 产品管理路由
app.use('/api/products', productsRouter);

// 数据库兼容性路由 - 从数据库/JSON获取产品目录
app.get('/api/db/products', (req, res) => {
  try {
    const catalogData = productCatalogUtils.getProductCatalog();
    res.json({
      success: true,
      products: catalogData.products || []
    });
  } catch (error) {
    console.error('获取产品目录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品目录失败',
      error: error.message
    });
  }
});

// 根据产品名称获取产品详情（数据库兼容）
app.get('/api/db/products/name/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    console.log(`🔍 根据名称获取产品详情: ${productName}`);
    
    const productData = await productService.getProductByName(productName);
    
    res.json({
      success: true,
      product: productData
    });
    
  } catch (error) {
    console.error('根据名称获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
});

// 文件夹管理路由
app.use('/api/folder', foldersRouter);

// 文件操作路由
app.use('/api', filesRouter);

// 上传管理路由
app.use('/api', uploadsRouter);

// ========== 错误处理 ==========

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use((req, res) => {
  console.log(`404 - 请求的资源不存在: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// ========== 服务启动 ==========

/**
 * 启动服务器并生成产品目录
 */
async function startServer() {
  try {
    console.log('='.repeat(50));
    console.log('启动产品管理服务器');
    console.log('='.repeat(50));
    
    // 验证产品目录数据
    const catalogData = productCatalogUtils.getProductCatalog();
    const validation = productCatalogUtils.validateProductCatalog(catalogData);
    
    if (!validation.isValid) {
      console.warn('⚠️ 产品目录数据验证失败:', validation.errors);
    } else {
      console.log(`✅ 产品目录验证成功，共 ${validation.productCount} 个产品`);
    }
    
    // 启动Express服务器
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`服务器已启动，端口: ${PORT}`);
      console.log(`产品列表API: http://localhost:${PORT}/api/products`);
      console.log(`产品目录API: http://localhost:${PORT}/api/db/products`);
      console.log(`创建产品API: POST http://localhost:${PORT}/api/products`);
      console.log(`重命名产品API: PUT http://localhost:${PORT}/api/products/:productName`);
      console.log(`删除产品API: DELETE http://localhost:${PORT}/api/products/:productName}`);
      console.log(`文件夹详情API: http://localhost:${PORT}/api/folder/:folderPath/details`);
      console.log(`删除文件API: POST http://localhost:${PORT}/api/delete-file`);
      console.log(`检测文件夹API: http://localhost:${PORT}/api/check-folder/:folderPath`);
      console.log(`批量替换API: POST http://localhost:${PORT}/api/batch-replace-products`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到终止信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;