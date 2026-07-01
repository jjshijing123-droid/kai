const path = require('path')
const fs = require('fs')
const { calculateFolderSize } = require('../utils/fsHelpers')
const { buildProductObject } = require('../utils/buildProductObject')

/**
 * 产品管理服务类 - 负责所有产品相关的业务逻辑
 */
class ProductService {
  constructor() {
    this.serverPath = path.resolve(__dirname, '../../')
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
      
      console.log('🔍 开始计算产品文件夹内容...');
      
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = path.join(productPath, item.name);
          const stats = fs.statSync(folderPath);
          
          console.log(`📁 计算文件夹: ${item.name}`);
          
          const folderInfo = calculateFolderSize(folderPath);

          console.log(`   文件夹: ${item.name}`);
          console.log(`   总大小: ${folderInfo.totalSize} bytes`);
          console.log(`   文件数: ${folderInfo.fileCount}`);

          products.push(buildProductObject({
            name: item.name,
            folderName: item.name,
            id: products.length + 1,
            totalSize: folderInfo.totalSize,
            fileCount: folderInfo.fileCount,
            modified: stats.mtime,
            isDirectory: true
          }));
          console.log(`✅ 文件夹数据:`, products[products.length - 1]);
        } else if (item.isFile()) {
          const filePath = path.join(productPath, item.name);
          const stats = fs.statSync(filePath);
          
          console.log(`📄 处理文件: ${item.name}`);
          console.log(`   文件: ${item.name}`);
          console.log(`   大小: ${stats.size} bytes`);
          
          const fileData = buildProductObject({
            name: item.name,
            folderName: item.name,
            id: products.length + 1,
            category: 'file',
            description: `Product file: ${item.name}`,
            path: `Product/${item.name}`,
            totalSize: stats.size,
            fileCount: 1,
            modified: stats.mtime,
            isDirectory: false
          })
          
          products.push(fileData);
          console.log(`✅ 文件数据:`, fileData);
        }
      }
      
      console.log(`📊 完成产品列表计算，共 ${products.length} 个项目（包含文件夹和文件）`);
      
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
   * 重命名产品或文件
   */
  async renameProduct(productName, newProductName, newFolderName) {
    if (!newProductName || !newFolderName) {
      throw new Error('新产品名称和新文件夹名称不能为空');
    }
    
    console.log(`重命名项目: ${productName} -> ${newFolderName}`);
    
    const oldItemPath = path.join(this.serverPath, 'Product', productName);
    const newItemPath = path.join(this.serverPath, 'Product', newFolderName);
    
    if (!fs.existsSync(oldItemPath)) {
      throw new Error('原项目不存在');
    }
    
    if (fs.existsSync(newItemPath)) {
      throw new Error('新项目名称已存在');
    }
    
    fs.renameSync(oldItemPath, newItemPath);
    
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
    
    const productItemPath = path.join(this.serverPath, 'Product', productName);
    
    let physicalItemDeleted = false;
    
    if (fs.existsSync(productItemPath)) {
      fs.rmSync(productItemPath, { recursive: true, force: true });
      console.log(`已删除物理项目: ${productItemPath}`);
      physicalItemDeleted = true;
    } else {
      console.warn(`物理项目不存在: ${productItemPath}`);
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
   * 获取产品详情
   */
  async getProductById(productId) {
    try {
      const productPath = path.join(this.serverPath, 'Product', productId);
      
      if (!fs.existsSync(productPath)) {
        throw new Error('产品不存在');
      }
      
      const folderInfo = calculateFolderSize(productPath);
      const stats = fs.statSync(productPath)

      const productData = buildProductObject({
        id: null,
        name: productId,
        folderName: productId,
        totalSize: folderInfo.totalSize,
        fileCount: folderInfo.fileCount,
        modified: stats.mtime
      })
      
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
      
      const folderInfo = calculateFolderSize(productPath);

      const productData = buildProductObject({
        id: null,
        name: productName,
        folderName: productName,
        totalSize: folderInfo.totalSize,
        fileCount: folderInfo.fileCount
      })
      
      return productData;
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
      const productImagesPath = path.join(this.serverPath, 'Product', productName, folderType);
      
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