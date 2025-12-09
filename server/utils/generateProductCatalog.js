const path = require('path');
const fs = require('fs');

/**
 * 生成产品目录JSON文件
 * 该脚本会遍历Product文件夹，生成最新的产品目录数据
 */
class ProductCatalogGenerator {
  constructor() {
    this.serverPath = __dirname.replace(/server\/utils$/, '');
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
   * 生成产品目录数据
   */
  generateCatalog() {
    try {
      const productPath = path.join(this.serverPath, 'Product');
      const catalogPath = path.join(this.serverPath, 'public', 'data', 'product-catalog.json');
      
      console.log('='.repeat(60));
      console.log('开始生成产品目录');
      console.log('='.repeat(60));
      
      if (!fs.existsSync(productPath)) {
        console.error('Product文件夹不存在:', productPath);
        return false;
      }
      
      // 创建public/data目录（如果不存在）
      const dataDir = path.dirname(catalogPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('创建数据目录:', dataDir);
      }
      
      const products = [];
      const items = fs.readdirSync(productPath, { withFileTypes: true });
      
      // 只处理目录，不处理文件
      const directories = items.filter(item => item.isDirectory());
      
      console.log(`找到 ${directories.length} 个产品文件夹`);
      
      for (let i = 0; i < directories.length; i++) {
        const item = directories[i];
        const folderPath = path.join(productPath, item.name);
        
        console.log(`\n🔍 处理产品: ${item.name} (${i + 1}/${directories.length})`);
        
        const folderInfo = this.calculateFolderSize(folderPath);
        
        const productData = {
          id: i + 1,
          name: item.name,
          folderName: item.name,
          category: 'general',
          description: `Product model: ${item.name}`,
          path: `Product/${item.name}/`,
          folder: `Product/${item.name}/`,
          mainImage: `/Product/${item.name}/image_00.webp`,
          totalSize: folderInfo.totalSize,
          fileCount: folderInfo.fileCount,
          views: {
            view1: `/Product/${item.name}/view1/`,
            view2: `/Product/${item.name}/view2/`,
            view3: `/Product/${item.name}/view3/`,
            view4: `/Product/${item.name}/view4/`
          },
          additionalImages: {
            sixViews: `/Product/${item.name}/images_6Views/`,
            other: `/Product/${item.name}/images_other/`
          }
        };
        
        products.push(productData);
        console.log(`✅ 生成产品数据: ${item.name}`);
      }
      
      // 生成完整的产品目录数据
      const catalogData = {
        products: products,
        totalProducts: products.length,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };
      
      // 保存产品目录数据
      fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
      
      console.log('\n='.repeat(60));
      console.log('产品目录生成成功');
      console.log(`📁 保存位置: ${catalogPath}`);
      console.log(`📊 产品数量: ${products.length}`);
      console.log(`⏱️  生成时间: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
      
      return true;
    } catch (error) {
      console.error('生成产品目录失败:', error);
      return false;
    }
  }
}

// 执行脚本
const generator = new ProductCatalogGenerator();
generator.generateCatalog();
