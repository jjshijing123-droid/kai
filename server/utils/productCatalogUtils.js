const path = require('path')
const fs = require('fs')
const ProductRepository = require('../database/productRepository')
const syncService = require('../database/sync')

/**
 * 产品目录管理工具类
 *
 * 内部数据源：SQLite（通过 ProductRepository）
 * 接口保持不变，确保前端和其他模块无需改动
 */
class ProductCatalogUtils {
  constructor() {
    this.serverPath = path.resolve(__dirname, '../../')
    this.catalogDir = path.join(this.serverPath, 'data')
    this.catalogPath = path.join(this.catalogDir, 'product-catalog.json')
    this.isProduction = process.env.NODE_ENV === 'production';
    this.productRepo = ProductRepository
  }

  /**
   * 获取 catalog 文件路径（统一路径）
   */
  getCatalogPath() {
    return this.catalogPath
  }

  /**
   * 同步更新产品目录 —— 操作 SQLite
   */
  updateProductCatalog(oldName, action = 'delete', newName = null) {
    try {
      if (action === 'delete') {
        syncService.removeProduct(oldName)
        console.log(`✅ 已从 SQLite 删除产品: ${oldName}`)
      } else if (action === 'rename') {
        syncService.renameProduct(oldName, newName)
        console.log(`✅ 已在 SQLite 重命名产品: ${oldName} -> ${newName}`)
      }
    } catch (error) {
      console.error('更新产品目录失败:', error);
    }
  }

  /**
   * 将产品目录保存到所有相关目录 —— 兼容性保留，写入 SQLite
   */
  saveCatalogToAllPaths(catalogData) {
    try {
      if (!catalogData || !Array.isArray(catalogData.products)) {
        console.warn('saveCatalogToAllPaths: 无效的 catalog 数据')
        return false
      }

      // 写入 SQLite
      this.productRepo.batchUpsert(catalogData.products)

      // 同时保留 JSON 文件写入（兼容性，可后续移除）
      const catalogPath = this.getCatalogPath()
      const dir = path.dirname(catalogPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      catalogData.lastUpdated = new Date().toISOString()
      catalogData.version = '2.0'

      const tempPath = catalogPath + '.tmp.' + process.pid
      fs.writeFileSync(tempPath, JSON.stringify(catalogData, null, 2), 'utf8')
      fs.renameSync(tempPath, catalogPath)

      return true
    } catch (error) {
      console.error('保存产品目录到所有路径失败:', error);
      return false
    }
  }

  /**
   * 获取产品目录数据 —— 从 SQLite 读取
   */
  getProductCatalog() {
    try {
      return this.productRepo.getCatalogFormat()
    } catch (error) {
      console.error('获取产品目录失败:', error);
      return {
        products: [],
        totalProducts: 0,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };
    }
  }

  /**
   * 保存产品目录数据 —— 写入 SQLite
   */
  saveProductCatalog(catalogData) {
    try {
      if (!catalogData || !Array.isArray(catalogData.products)) {
        return false
      }
      this.productRepo.batchUpsert(catalogData.products)
      console.log(`✅ 产品目录保存成功（SQLite），共 ${catalogData.products.length} 个产品`);
      return true
    } catch (error) {
      console.error('保存产品目录失败:', error);
      return false
    }
  }

  /**
   * 验证产品目录数据完整性
   */
  validateProductCatalog(catalogData) {
    const errors = [];

    if (!catalogData) {
      errors.push('产品目录数据为空');
      return { isValid: false, errors };
    }

    if (!Array.isArray(catalogData.products)) {
      errors.push('产品列表格式不正确');
    }

    if (typeof catalogData.totalProducts !== 'number') {
      errors.push('产品总数格式不正确');
    }

    // 验证每个产品数据
    if (Array.isArray(catalogData.products)) {
      catalogData.products.forEach((product, index) => {
        if (!product.folderName) {
          errors.push(`产品 ${index} 缺少文件夹名称`);
        }
        if (!product.path && !product.folder) {
          errors.push(`产品 ${product.folderName || index} 缺少路径信息`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      productCount: catalogData.products?.length || 0
    };
  }

  /**
   * 根据ID获取产品名称 —— 从 SQLite 查询
   */
  getProductNameById(productId) {
    try {
      const product = this.productRepo.getProductById(parseInt(productId))
      if (product) {
        console.log(`🔍 ID ${productId} 对应产品: ${product.folderName}`);
        return product.folderName
      } else {
        console.warn(`未找到 ID ${productId} 对应的产品`);
        return null
      }
    } catch (error) {
      console.error('获取产品名称失败:', error);
      return null
    }
  }
}

// 创建一个实例并导出实例方法，方便直接调用
const productCatalogUtilsInstance = new ProductCatalogUtils();

module.exports = {
  ProductCatalogUtils,
  productCatalogUtils: productCatalogUtilsInstance,
  updateProductCatalog: productCatalogUtilsInstance.updateProductCatalog.bind(productCatalogUtilsInstance)
};
