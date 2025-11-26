const path = require('path');
const fs = require('fs');

/**
 * 产品目录管理工具类
 */
class ProductCatalogUtils {
  constructor() {
    this.serverPath = __dirname.replace(/server\/utils$/, '');
  }

  /**
   * 同步更新product-catalog.json文件的辅助函数
   */
  updateProductCatalog(oldName, action = 'delete', newName = null) {
    try {
      const catalogPath = path.join(this.serverPath, 'public/data/product-catalog.json');
      
      if (!fs.existsSync(catalogPath)) {
        console.warn('产品目录文件不存在，跳过同步更新');
        return;
      }
      
      const catalogData = require(catalogPath);
      
      if (action === 'delete') {
        // 从产品目录中删除对应记录
        const originalLength = catalogData.products.length;
        catalogData.products = catalogData.products.filter(product =>
          product.folderName !== oldName
        );
        
        // 更新总数
        catalogData.totalProducts = catalogData.products.length;
        catalogData.lastUpdated = new Date().toISOString();
        
        if (catalogData.products.length < originalLength) {
          // 写回文件
          fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
          console.log(`✅ 已从 product-catalog.json 中删除产品: ${oldName}`);
        } else {
          console.warn(`在 product-catalog.json 中未找到产品: ${oldName}`);
        }
      } else if (action === 'rename') {
        // 重命名产品记录 - 增强的匹配逻辑
        let updated = false;
        let matchedProduct = null;
        
        console.log(`🔍 开始查找要重命名的产品: ${oldName} -> ${newName}`);
        
        // 首先尝试精确匹配 folderName
        for (let i = 0; i < catalogData.products.length; i++) {
          const product = catalogData.products[i];
          if (product.folderName === oldName) {
            matchedProduct = product;
            matchedProduct.index = i; // 记录索引位置
            console.log(`✅ 精确匹配找到产品: ${oldName}`);
            break;
          }
        }
        
        // 如果精确匹配失败，尝试模糊匹配
        if (!matchedProduct) {
          console.log(`⚠️ 精确匹配失败，尝试模糊匹配: ${oldName}`);
          for (let i = 0; i < catalogData.products.length; i++) {
            const product = catalogData.products[i];
            // 检查名称是否相似（可能是重命名后的记录）
            if (product.folderName === newName) {
              matchedProduct = product;
              matchedProduct.index = i;
              console.log(`✅ 模糊匹配找到产品（新名称已存在）: ${product.folderName}`);
              break;
            }
            // 检查前缀匹配
            if (product.folderName && oldName &&
                product.folderName.startsWith(oldName.substring(0, Math.min(3, oldName.length)))) {
              matchedProduct = product;
              matchedProduct.index = i;
              console.log(`✅ 前缀匹配找到产品: ${product.folderName}`);
              break;
            }
          }
        }
        
        // 执行更新
        if (matchedProduct) {
          console.log(`🔄 开始更新产品记录: ${matchedProduct.folderName} -> ${newName}`);
          
          // 直接更新数组中的对象
          catalogData.products[matchedProduct.index] = {
            ...matchedProduct,
            folderName: newName,
            name: newName, // 同时更新name字段
            folder: `Product/${newName}/`,
            path: `Product/${newName}`,
            // 保持其他字段不变
            id: matchedProduct.id,
            model: matchedProduct.model || newName,
            category: matchedProduct.category || 'general',
            description: matchedProduct.description || `Product model: ${newName}`,
            totalSize: matchedProduct.totalSize,
            fileCount: matchedProduct.fileCount
          };
          
          // 如果存在mainImage，也更新路径
          if (catalogData.products[matchedProduct.index].mainImage) {
            catalogData.products[matchedProduct.index].mainImage = `/Product/${newName}/image_00.webp`;
          }
          
          // 如果存在views，更新所有视图路径
          if (catalogData.products[matchedProduct.index].views) {
            Object.keys(catalogData.products[matchedProduct.index].views).forEach(viewKey => {
              catalogData.products[matchedProduct.index].views[viewKey] = `/Product/${newName}/${viewKey}/`;
            });
          }
          
          // 如果存在additionalImages，更新路径
          if (catalogData.products[matchedProduct.index].additionalImages) {
            Object.keys(catalogData.products[matchedProduct.index].additionalImages).forEach(key => {
              catalogData.products[matchedProduct.index].additionalImages[key] = `/Product/${newName}/${key}/`;
            });
          }
          
          updated = true;
          console.log(`✅ 产品记录更新完成: ${newName}`);
        }
        
        if (updated) {
          // 更新总数和时间戳
          catalogData.totalProducts = catalogData.products.length;
          catalogData.lastUpdated = new Date().toISOString();
          
          // 写回文件
          fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
          console.log(`✅ 已在 product-catalog.json 中重命名产品: ${oldName} -> ${newName}`);
        } else {
          console.warn(`❌ 在 product-catalog.json 中未找到要重命名的产品: ${oldName}`);
          console.warn(`尝试查找可能的匹配项...`);
          
          // 调试信息：显示当前所有产品名称
          const currentNames = catalogData.products.map(p => p.folderName);
          console.log(`当前JSON中的产品名称: ${currentNames.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('更新产品目录文件失败:', error);
    }
  }

  /**
   * 获取产品目录数据
   */
  getProductCatalog() {
    try {
      const catalogPath = path.join(this.serverPath, 'public/data/product-catalog.json');
      
      if (!fs.existsSync(catalogPath)) {
        return {
          products: [],
          totalProducts: 0,
          lastUpdated: new Date().toISOString(),
          version: '2.0'
        };
      }
      
      return require(catalogPath);
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
   * 保存产品目录数据
   */
  saveProductCatalog(catalogData) {
    try {
      const catalogPath = path.join(this.serverPath, 'public/data/product-catalog.json');
      
      // 确保目录存在
      const dir = path.dirname(catalogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 添加时间戳
      catalogData.lastUpdated = new Date().toISOString();
      catalogData.version = '2.0';
      
      fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
      console.log(`✅ 产品目录保存成功，共 ${catalogData.products.length} 个产品`);
      
      return true;
    } catch (error) {
      console.error('保存产品目录失败:', error);
      return false;
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
   * 根据ID获取产品名称
   */
  getProductNameById(productId) {
    try {
      const catalogData = this.getProductCatalog();
      const product = catalogData.products.find(p => p.id === parseInt(productId));
      
      if (product) {
        console.log(`🔍 ID ${productId} 对应产品: ${product.folderName}`);
        return product.folderName;
      } else {
        console.warn(`未找到 ID ${productId} 对应的产品`);
        return null;
      }
    } catch (error) {
      console.error('获取产品名称失败:', error);
      return null;
    }
  }
}

module.exports = ProductCatalogUtils;