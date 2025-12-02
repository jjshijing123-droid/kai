const express = require('express');
const ProductService = require('../services/productService');
const router = express.Router();
const productService = new ProductService();

/**
 * 产品管理路由
 */

// 获取产品列表
router.get('/', async (req, res) => {
  try {
    const products = await productService.getProducts();
    
    // 添加汇总日志
    const summary = products.map(p => ({
      name: p.name,
      totalSize: p.totalSize,
      fileCount: p.fileCount
    }));
    console.log('📋 产品大小汇总:', summary);
    
    res.json(products);
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
});

// 创建新产品
router.post('/', async (req, res) => {
  try {
    const { productName, folderName } = req.body;
    
    if (!productName || !folderName) {
      return res.status(400).json({
        success: false,
        message: '产品名称和文件夹名称不能为空'
      });
    }
    
    console.log(`创建新产品: ${productName}`);
    
    const result = await productService.createProduct(productName, folderName);
    
    // 同步更新 product-catalog.json 文件
    console.log('🔄 同步更新产品目录文件...');
    const { updateProductCatalog } = require('../utils/productCatalogUtils');
    
    // 先读取产品目录，获取新创建的产品的详细信息
    const products = await productService.getProducts();
    const newProduct = products.find(p => p.folderName === folderName);
    
    if (newProduct) {
      // 添加新产品到目录文件
      const { productCatalogUtils } = require('../utils/productCatalogUtils');
      const catalogData = productCatalogUtils.getProductCatalog();
      
      catalogData.products.push({
        id: newProduct.id || catalogData.products.length + 1,
        name: newProduct.name,
        folderName: newProduct.folderName,
        model: newProduct.model || newProduct.name,
        category: newProduct.category || 'general',
        description: newProduct.description || `Product model: ${newProduct.name}`,
        path: newProduct.path,
        folder: newProduct.path + '/',
        totalSize: newProduct.totalSize || 0,
        fileCount: newProduct.fileCount || 0,
        mainImage: `/Product/${newProduct.name}/image_00.webp`,
        views: {
          view1: `/Product/${newProduct.name}/view1/`,
          view2: `/Product/${newProduct.name}/view2/`,
          view3: `/Product/${newProduct.name}/view3/`,
          view4: `/Product/${newProduct.name}/view4/`
        },
        additionalImages: {
          sixViews: `/Product/${newProduct.name}/images_6Views/`,
          other: `/Product/${newProduct.name}/images_other/`
        }
      });
      
      // 更新总数和时间戳
      catalogData.totalProducts = catalogData.products.length;
      catalogData.lastUpdated = new Date().toISOString();
      
      // 保存更新的目录文件
      const saved = productCatalogUtils.saveProductCatalog(catalogData);
      
      if (saved) {
        console.log(`✅ 已同步更新产品目录文件，新增产品: ${productName}`);
      } else {
        console.warn('⚠️ 同步更新产品目录文件失败');
      }
    }
    
    res.json({
      success: true,
      message: `产品文件夹 "${productName}" 创建成功`,
      data: result
    });
    
  } catch (error) {
    console.error('创建产品失败:', error);
    res.status(500).json({
      success: false,
      message: '创建产品失败',
      error: error.message
    });
  }
});

// 重命名产品
router.put('/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    const { newProductName, newFolderName } = req.body;
    
    if (!newProductName || !newFolderName) {
      return res.status(400).json({
        success: false,
        message: '新产品名称和新文件夹名称不能为空'
      });
    }
    
    console.log(`重命名产品: ${productName} -> ${newFolderName}`);
    
    const result = await productService.renameProduct(productName, newProductName, newFolderName);
    
    // 同步更新 product-catalog.json 文件
    console.log('🔄 同步更新产品目录文件...');
    const { updateProductCatalog } = require('../utils/productCatalogUtils');
    updateProductCatalog(productName, 'rename', newFolderName);
    
    res.json({
      success: true,
      message: `产品重命名成功`,
      data: result
    });
    
  } catch (error) {
    console.error('重命名产品失败:', error);
    res.status(500).json({
      success: false,
      message: '重命名产品失败',
      error: error.message
    });
  }
});

// 删除产品
router.delete('/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    console.log(`删除产品: ${productName}`);
    
    const result = await productService.deleteProduct(productName);
    
    // 同步更新 product-catalog.json 文件
    console.log('🔄 同步更新产品目录文件...');
    const { updateProductCatalog } = require('../utils/productCatalogUtils');
    updateProductCatalog(productName, 'delete');
    
    res.json({
      success: true,
      message: `产品 "${productName}" 删除成功`,
      ...result
    });
    
  } catch (error) {
    console.error('删除产品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除产品失败',
      error: error.message
    });
  }
});

// 获取产品详情（通过ID）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 获取产品详情, ID: ${id}`);
    
    const productData = await productService.getProductById(id);
    
    console.log(`✅ 产品详情获取成功:`, productData);
    
    res.json({
      success: true,
      product: productData
    });
    
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
});

// 根据产品名称获取产品详情
router.get('/name/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    console.log(`🔍 根据名称获取产品详情: ${productName}`);
    
    const productData = await productService.getProductByName(productName);
    
    console.log(`✅ 根据名称获取产品详情成功:`, productData);
    
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

// 根据产品名称获取产品详情
router.get('/name/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    console.log(`🔍 根据名称获取产品详情: ${productName}`);
    
    const productData = await productService.getProductByName(productName);
    
    console.log(`✅ 根据名称获取产品详情成功:`, productData);
    
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

module.exports = router;