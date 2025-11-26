const path = require('path');
const fs = require('fs');

/**
 * 产品管理服务类 - 负责所有产品相关的业务逻辑
 */
class ProductService {
  constructor() {
    this.serverPath = __dirname.replace(/server\/services$/, '');
  }

  /**
   * 递归计算文件夹大小
   */
  calculateFolderSize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          const subResult = this.calculateFolderSize(itemPath);
          totalSize += subResult.totalSize;
          fileCount += subResult.fileCount;
        } else if (item.isFile()) {
          const stats = fs.statSync(itemPath);
          totalSize += stats.size;
          fileCount += 1;
        }
      }
    } catch (error) {
      console.error(`计算文件夹大小失败: ${dirPath}`, error);
    }
    
    return { totalSize, fileCount };
  }

  /**
   * 获取产品列表
   */
  async getProducts() {
    try {
      const productPath = path.join(this.serverPath, 'Product');
      
      if (!fs.existsSync(productPath)) {
        return [];
      }
      
      const products = [];
      const items = fs.readdirSync(productPath, { withFileTypes: true });
      
      console.log('🔍 开始计算产品文件夹大小...');
      
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = path.join(productPath, item.name);
          const stats = fs.statSync(folderPath);
          
          console.log(`📁 计算文件夹: ${item.name}`);
          
          const folderInfo = this.calculateFolderSize(folderPath);
          
          console.log(`   文件夹: ${item.name}`);
          console.log(`   总大小: ${folderInfo.totalSize} bytes`);
          console.log(`   文件数: ${folderInfo.fileCount}`);
          
          const productData = {
            name: item.name,
            folderName: item.name,
            id: products.length + 1,
            category: 'general',
            description: `Product model: ${item.name}`,
            path: `Product/${item.name}`,
            totalSize: folderInfo.totalSize,
            fileCount: folderInfo.fileCount,
            modified: stats.mtime
          };
          
          products.push(productData);
          console.log(`✅ 产品数据:`, productData);
        }
      }
      
      console.log(`📊 完成产品列表计算，共 ${products.length} 个产品`);
      
      return products;
    } catch (error) {
      console.error('获取产品列表失败:', error);
      throw new Error(`获取产品列表失败: ${error.message}`);
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
    
    const productFolderPath = path.join(this.serverPath, 'Product', folderName);
    
    if (fs.existsSync(productFolderPath)) {
      throw new Error('文件夹已存在');
    }
    
    const subfolders = ['images_6Views', 'images_other', 'view1', 'view2', 'view3', 'view4'];
    
    for (const subfolder of subfolders) {
      const subfolderPath = path.join(productFolderPath, subfolder);
      fs.mkdirSync(subfolderPath, { recursive: true });
    }
    
    console.log(`产品文件夹创建成功: ${productFolderPath}`);
    
    return {
      productName,
      folderName,
      path: `Product/${folderName}`
    };
  }

  /**
   * 重命名产品
   */
  async renameProduct(productName, newProductName, newFolderName) {
    if (!newProductName || !newFolderName) {
      throw new Error('新产品名称和新文件夹名称不能为空');
    }
    
    console.log(`重命名产品: ${productName} -> ${newFolderName}`);
    
    const oldFolderPath = path.join(this.serverPath, 'Product', productName);
    const newFolderPath = path.join(this.serverPath, 'Product', newFolderName);
    
    if (!fs.existsSync(oldFolderPath)) {
      throw new Error('原产品文件夹不存在');
    }
    
    if (fs.existsSync(newFolderPath)) {
      throw new Error('新文件夹名称已存在');
    }
    
    fs.renameSync(oldFolderPath, newFolderPath);
    
    console.log(`产品重命名成功: ${productName} -> ${newFolderName}`);
    
    return {
      oldName: productName,
      newName: newFolderName,
      oldPath: `Product/${productName}`,
      newPath: `Product/${newFolderName}`
    };
  }

  /**
   * 删除产品
   */
  async deleteProduct(productName) {
    console.log(`删除产品: ${productName}`);
    
    const productFolderPath = path.join(this.serverPath, 'Product', productName);
    
    let physicalFolderDeleted = false;
    
    if (fs.existsSync(productFolderPath)) {
      fs.rmSync(productFolderPath, { recursive: true, force: true });
      console.log(`已删除物理文件夹: ${productFolderPath}`);
      physicalFolderDeleted = true;
    } else {
      console.warn(`物理文件夹不存在: ${productFolderPath}`);
    }
    
    return {
      physicalFolderDeleted,
      deletedProduct: {
        name: productName,
        path: `Product/${productName}`
      }
    };
  }

  /**
   * 获取产品详情
   */
  async getProductById(productId) {
    try {
      const productPath = path.join(this.serverPath, 'Product', productId);
      
      if (!fs.existsSync(productPath)) {
        throw new Error('产品不存在');
      }
      
      const folderInfo = this.calculateFolderSize(productPath);
      
      const productData = {
        id: null,
        name: productId,
        folderName: productId,
        category: 'general',
        description: `Product model: ${productId}`,
        path: `Product/${productId}`,
        totalSize: folderInfo.totalSize,
        fileCount: folderInfo.fileCount,
        mainImage: `/Product/${productId}/image_00.webp`,
        folder: `Product/${productId}/`,
        views: {
          view1: `/Product/${productId}/view1/`,
          view2: `/Product/${productId}/view2/`,
          view3: `/Product/${productId}/view3/`,
          view4: `/Product/${productId}/view4/`
        },
        additionalImages: {
          sixViews: `/Product/${productId}/images_6Views/`,
          other: `/Product/${productId}/images_other/`
        }
      };
      
      return productData;
    } catch (error) {
      console.error('获取产品详情失败:', error);
      throw new Error(`获取产品详情失败: ${error.message}`);
    }
  }

  /**
   * 根据产品名称获取产品详情
   */
  async getProductByName(productName) {
    try {
      const productPath = path.join(this.serverPath, 'Product', productName);
      
      if (!fs.existsSync(productPath)) {
        throw new Error('产品不存在');
      }
      
      const folderInfo = this.calculateFolderSize(productPath);
      
      const productData = {
        id: null,
        name: productName,
        folderName: productName,
        category: 'general',
        description: `Product model: ${productName}`,
        path: `Product/${productName}`,
        totalSize: folderInfo.totalSize,
        fileCount: folderInfo.fileCount,
        mainImage: `/Product/${productName}/image_00.webp`,
        folder: `Product/${productName}/`,
        views: {
          view1: `/Product/${productName}/view1/`,
          view2: `/Product/${productName}/view2/`,
          view3: `/Product/${productName}/view3/`,
          view4: `/Product/${productName}/view4/`
        },
        additionalImages: {
          sixViews: `/Product/${productName}/images_6Views/`,
          other: `/Product/${productName}/images_other/`
        }
      };
      
      return productData;
    } catch (error) {
      console.error('根据名称获取产品详情失败:', error);
      throw new Error(`获取产品详情失败: ${error.message}`);
    }
  }
}

module.exports = ProductService;