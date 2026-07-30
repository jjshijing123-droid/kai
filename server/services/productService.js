const path = require('path')
const fs = require('fs')
const { safeJoin } = require('../utils/safePath')
const ProductRepository = require('../database/productRepository')
const SyncService = require('../database/sync')

/**
 * 产品管理服务类 - 负责所有产品相关的业务逻辑
 *
 * 数据层：SQLite（主要）+ 文件系统（图片文件）
 * ProductService 通过 ProductRepository 访问 SQLite，
 * 文件系统操作仅用于创建/删除文件夹和读取图片列表。
 */
class ProductService {
  constructor(productRepo = null) {
    this.serverPath = path.resolve(__dirname, '../../')
    this.productBasePath = safeJoin(this.serverPath, 'Product')
    this.productRepo = productRepo || ProductRepository
    this.syncService = SyncService
  }

  /**
   * 获取产品列表（从 SQLite 读取）
   */
  async getProducts() {
    try {
      // 先从 SQLite 获取所有产品
      let products = this.productRepo.getAllProducts()

      // 如果 SQLite 为空，启动时已通过 syncService 同步，
      // 但作为兜底，仍检查文件系统
      if (products.length === 0 && fs.existsSync(this.productBasePath)) {
        console.log('⚠️ SQLite 无数据，从文件系统同步...')
        this.syncService.syncAll()
        products = this.productRepo.getAllProducts()
      }

      return products
    } catch (error) {
      console.error('获取产品列表失败:', error)
      throw new Error(`获取产品列表失败: ${error.message}`)
    }
  }

  /**
   * 创建新产品文件夹
   */
  async createProduct(productName, folderName) {
    if (!productName || !folderName) {
      throw new Error('产品名称和文件夹名称不能为空');
    }
    
    console.log(`创建新产品: ${productName}`);

    const productFolderPath = safeJoin(this.productBasePath, folderName);
    
    if (fs.existsSync(productFolderPath)) {
      throw new Error('文件夹已存在');
    }
    
    const subfolders = ['images_6Views', 'images_other', 'view1', 'view2', 'view3', 'view4'];
    
    for (const subfolder of subfolders) {
      const subfolderPath = path.join(productFolderPath, subfolder);
      fs.mkdirSync(subfolderPath, { recursive: true });
    }
    
    console.log(`产品文件夹创建成功: ${productFolderPath}`);
    
    const result = {
      productName,
      folderName,
      path: `Product/${folderName}`
    };

    // 同步到 SQLite
    this.syncService.syncProduct(folderName)

    return result;
  }

  /**
   * 重命名产品或文件
   */
  async renameProduct(productName, newProductName, newFolderName) {
    if (!newProductName || !newFolderName) {
      throw new Error('新产品名称和新文件夹名称不能为空');
    }
    
    console.log(`重命名项目: ${productName} -> ${newFolderName}`);

    const oldItemPath = safeJoin(this.productBasePath, productName);
    const newItemPath = safeJoin(this.productBasePath, newFolderName);
    
    if (!fs.existsSync(oldItemPath)) {
      throw new Error('原项目不存在');
    }
    
    if (fs.existsSync(newItemPath)) {
      throw new Error('新项目名称已存在');
    }
    
    fs.renameSync(oldItemPath, newItemPath);

    // 同步到 SQLite
    this.syncService.renameProduct(productName, newFolderName)

    console.log(`项目重命名成功: ${productName} -> ${newFolderName}`);
    
    return {
      oldName: productName,
      newName: newFolderName,
      oldPath: `Product/${productName}`,
      newPath: `Product/${newFolderName}`
    };
  }

  /**
   * 删除产品或文件
   */
  async deleteProduct(productName) {
    console.log(`删除项目: ${productName}`);

    const productItemPath = safeJoin(this.productBasePath, productName);
    
    let physicalItemDeleted = false;

    if (fs.existsSync(productItemPath)) {
      fs.rmSync(productItemPath, { recursive: true, force: true });
      console.log(`已删除物理项目: ${productItemPath}`);
      physicalItemDeleted = true;
    } else {
      console.warn(`物理项目不存在: ${productItemPath}`);
    }

    // 从 SQLite 中删除记录
    if (physicalItemDeleted) {
      this.syncService.removeProduct(productName)
    }

    return {
      physicalItemDeleted,
      deletedProduct: {
        name: productName,
        path: `Product/${productName}`
      }
    };
  }

  /**
   * 获取产品详情（从 SQLite 读取）
   */
  async getProductById(productId) {
    try {
      const product = this.productRepo.getProductById(productId)

      if (!product) {
        // 兜底：尝试按 ID 作为文件夹名查找
        const byName = this.productRepo.getProductByFolderName(String(productId))
        if (!byName) {
          throw new Error('产品不存在')
        }
        return byName
      }

      return product
    } catch (error) {
      console.error('获取产品详情失败:', error);
      throw new Error(`获取产品详情失败: ${error.message}`);
    }
  }

  /**
   * 根据产品名称获取产品详情（从 SQLite 读取）
   */
  async getProductByName(productName) {
    try {
      const product = this.productRepo.getProductByFolderName(productName)

      if (!product) {
        throw new Error('产品不存在')
      }

      return product
    } catch (error) {
      console.error('根据名称获取产品详情失败:', error);
      throw new Error(`获取产品详情失败: ${error.message}`);
    }
  }

  /**
   * 获取产品图片列表
   */
  async getProductImages(productName, imageType) {
    try {
      // 确定图片文件夹类型
      const folderType = imageType === '6views' ? 'images_6Views' : 'images_other';
      const productImagesPath = safeJoin(this.productBasePath, productName, folderType);
      
      if (!fs.existsSync(productImagesPath)) {
        throw new Error('图片文件夹不存在');
      }
      
      // 获取文件夹中的所有图片文件
      const items = fs.readdirSync(productImagesPath, { withFileTypes: true });
      const images = [];
      
      for (const item of items) {
        if (item.isFile()) {
          // 检查是否为图片文件
          const fileExtension = path.extname(item.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
            const filePath = path.join(productImagesPath, item.name);
            const stats = fs.statSync(filePath);
            
            images.push({
              name: item.name,
              url: `/Product/${productName}/${folderType}/${item.name}`,
              path: `Product/${productName}/${folderType}/${item.name}`,
              size: stats.size,
              modified: stats.mtime,
              format: fileExtension.slice(1) // 去掉点号，获取格式
            });
          }
        }
      }
      
      // 按文件名排序
      images.sort((a, b) => a.name.localeCompare(b.name));
      
      return images;
    } catch (error) {
      console.error('获取产品图片列表失败:', error);
      throw new Error(`获取产品图片列表失败: ${error.message}`);
    }
  }
}

module.exports = ProductService;