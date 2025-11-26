const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ProductService = require('./productService');
const FolderService = require('./folderService');

/**
 * 上传管理服务类 - 负责文件上传和批量操作
 */
class UploadService {
  constructor() {
    this.serverPath = __dirname.replace(/server\/services$/, '');
    this.productService = new ProductService();
    this.folderService = new FolderService();
  }

  /**
   * 批量替换产品（危险操作）
   */
  async batchReplaceProducts(uploadedFile) {
    try {
      console.log('收到批量替换请求');
      
      if (!uploadedFile) {
        throw new Error('请上传ZIP文件');
      }
      
      const tempZipPath = uploadedFile.path;
      const targetProductPath = path.join(this.serverPath, 'Product');
      
      console.log('📦 开始处理ZIP文件:', uploadedFile.originalname);
      
      // 检查Product文件夹是否存在
      if (!fs.existsSync(targetProductPath)) {
        fs.mkdirSync(targetProductPath, { recursive: true });
      }
      
      // 1. 备份现有的Product文件夹（可选）
      const backupPath = path.join(this.serverPath, 'Product_backup_' + Date.now());
      if (fs.existsSync(targetProductPath)) {
        console.log('📦 创建备份文件夹...');
        await execPromise(`cp -r "${targetProductPath}" "${backupPath}"`);
        console.log('✅ 备份完成:', backupPath);
      }
      
      // 2. 删除现有的Product文件夹
      console.log('🗑️ 删除现有的Product文件夹...');
      if (fs.existsSync(targetProductPath)) {
        fs.rmSync(targetProductPath, { recursive: true, force: true });
      }
      
      // 3. 重新创建Product文件夹
      fs.mkdirSync(targetProductPath, { recursive: true });
      
      // 4. 解压ZIP文件到Product文件夹
      console.log('📦 开始解压ZIP文件...');
      
      let extractedCount = 0;
      let folderCount = 0;
      let skippedHiddenFiles = 0;
      const replacedProducts = [];
      
      // 隐藏文件过滤函数
      const isHiddenFile = (fileName) => {
        const baseName = path.basename(fileName);
        return baseName.startsWith('.');
      };
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(tempZipPath)
          .pipe(unzipper.Parse())
          .on('entry', async function (entry) {
            try {
              const fileName = entry.path;
              const type = entry.type; // 'Directory' or 'File'
              
              // 过滤隐藏文件
              if (isHiddenFile(fileName)) {
                console.log('⏭️ 跳过隐藏文件:', fileName);
                skippedHiddenFiles++;
                entry.autodrain();
                return;
              }
              
              console.log('📄 处理文件:', fileName);
              
              if (type === 'Directory') {
                // 创建目录
                const dirPath = path.join(targetProductPath, fileName);
                fs.mkdirSync(dirPath, { recursive: true });
                folderCount++;
                
                // 检查是否是产品文件夹（直接位于根目录下的文件夹）
                if (!fileName.includes('/') && fileName.trim()) {
                  replacedProducts.push({
                    name: fileName,
                    path: `Product/${fileName}`,
                    type: 'directory'
                  });
                }
                
                entry.autodrain();
              } else {
                // 创建文件
                const filePath = path.join(targetProductPath, fileName);
                const dir = path.dirname(filePath);
                
                // 确保目录存在
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                
                entry.pipe(fs.createWriteStream(filePath));
                extractedCount++;
                
                // 如果文件在根目录下且是图片文件，检查是否是主图
                if (!fileName.includes('/') && (fileName.endsWith('.webp') || fileName.endsWith('.png') || fileName.endsWith('.jpg'))) {
                  const productName = fileName.replace(/\.(webp|png|jpg|jpeg)$/i, '');
                  if (productName && !replacedProducts.find(p => p.name === productName && p.type === 'file')) {
                    replacedProducts.push({
                      name: productName,
                      path: `Product/${fileName}`,
                      type: 'file',
                      fileName: fileName
                    });
                  }
                }
              }
            } catch (err) {
              console.error('处理文件时出错:', err);
              entry.autodrain();
            }
          })
          .on('close', () => {
            console.log('✅ ZIP文件解压完成');
            console.log(`📊 解压统计: 文件${extractedCount}个, 文件夹${folderCount}个, 跳过隐藏文件${skippedHiddenFiles}个`);
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ ZIP文件解压失败:', err);
            reject(err);
          });
      });
      
      // 5. 清理临时文件
      fs.unlinkSync(tempZipPath);
      console.log('🧹 清理临时文件完成');
      
      // 6. 更新产品目录文件
      console.log('🔄 重新生成产品目录...');
      await this.regenerateProductCatalog();
      
      // 7. 立即清理备份文件夹
      console.log('🧹 立即清理备份文件夹...');
      if (fs.existsSync(backupPath)) {
        try {
          await execPromise(`rm -rf "${backupPath}"`);
          console.log('✅ 备份文件夹清理成功:', backupPath);
        } catch (cleanupError) {
          console.warn('清理备份文件夹失败:', cleanupError.message);
        }
      }
      
      console.log('🎉 批量替换完成!');
      
      return {
        success: true,
        message: `批量替换完成，处理了 ${extractedCount} 个文件，创建了 ${folderCount} 个文件夹${skippedHiddenFiles > 0 ? `，跳过 ${skippedHiddenFiles} 个隐藏文件` : ''}，备份文件夹已立即清理`,
        fileCount: extractedCount,
        folderCount: folderCount,
        skippedHiddenFiles: skippedHiddenFiles,
        replacedProducts: replacedProducts,
        backupPath: backupPath
      };
      
    } catch (error) {
      console.error('批量替换失败:', error);
      throw new Error(`批量替换失败: ${error.message}`);
    }
  }

  /**
   * 上传单个产品文件夹
   */
  async uploadProductFolder(uploadedFile, folderName) {
    try {
      console.log('收到单个产品文件夹上传请求');
      
      if (!uploadedFile) {
        throw new Error('请上传ZIP文件');
      }
      
      const tempZipPath = uploadedFile.path;
      const targetProductPath = path.join(this.serverPath, 'Product');
      
      console.log('📦 开始处理ZIP文件:', uploadedFile.originalname);
      
      // 检查Product文件夹是否存在
      if (!fs.existsSync(targetProductPath)) {
        fs.mkdirSync(targetProductPath, { recursive: true });
      }
      
      // 生成实际的文件夹名称（避免冲突）
      let actualFolderName = folderName;
      let counter = 1;
      while (fs.existsSync(path.join(targetProductPath, actualFolderName))) {
        actualFolderName = `${folderName}_副本${counter}`;
        counter++;
      }
      
      const productFolderPath = path.join(targetProductPath, actualFolderName);
      
      // 创建产品文件夹结构
      const subfolders = ['images_6Views', 'images_other', 'view1', 'view2', 'view3', 'view4'];
      
      // 先解压ZIP文件
      console.log('📦 开始解压ZIP文件...');
      
      let extractedCount = 0;
      let folderCount = 0;
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(tempZipPath)
          .pipe(unzipper.Parse())
          .on('entry', async function (entry) {
            try {
              const fileName = entry.path;
              const type = entry.type;
              
              // 过滤隐藏文件
              const baseName = path.basename(fileName);
              if (baseName.startsWith('.')) {
                console.log('⏭️ 跳过隐藏文件:', fileName);
                entry.autodrain();
                return;
              }
              
              console.log('📄 处理文件:', fileName);
              
              if (type === 'Directory') {
                // 创建目录
                const dirPath = path.join(productFolderPath, fileName);
                fs.mkdirSync(dirPath, { recursive: true });
                folderCount++;
                entry.autodrain();
              } else {
                // 创建文件
                const filePath = path.join(productFolderPath, fileName);
                const dir = path.dirname(filePath);
                
                // 确保目录存在
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                
                entry.pipe(fs.createWriteStream(filePath));
                extractedCount++;
              }
            } catch (err) {
              console.error('处理文件时出错:', err);
              entry.autodrain();
            }
          })
          .on('close', () => {
            console.log('✅ ZIP文件解压完成');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ ZIP文件解压失败:', err);
            reject(err);
          });
      });
      
      // 清理临时文件
      fs.unlinkSync(tempZipPath);
      console.log('🧹 清理临时文件完成');
      
      // 重新生成产品目录
      console.log('🔄 重新生成产品目录...');
      await this.regenerateProductCatalog();
      
      console.log('🎉 单个产品文件夹上传完成!');
      
      return {
        success: true,
        message: `产品文件夹上传成功`,
        originalName: folderName,
        actualName: actualFolderName,
        fileCount: extractedCount,
        folderCount: folderCount,
        path: `Product/${actualFolderName}`
      };
      
    } catch (error) {
      console.error('单个产品文件夹上传失败:', error);
      throw new Error(`单个产品文件夹上传失败: ${error.message}`);
    }
  }

  /**
   * 重新生成产品目录的辅助函数
   */
  async regenerateProductCatalog() {
    try {
      console.log('🔄 开始重新生成产品目录...');
      
      const productPath = path.join(this.serverPath, 'Product');
      const products = [];
      
      if (!fs.existsSync(productPath)) {
        console.log('Product文件夹不存在，创建空目录');
        return;
      }
      
      const items = fs.readdirSync(productPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = path.join(productPath, item.name);
          const folderInfo = this.productService.calculateFolderSize(folderPath);
          
          products.push({
            id: products.length + 1,
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
          });
          
          console.log(`✅ 添加产品: ${item.name} (${folderInfo.fileCount} 个文件)`);
        }
      }
      
      // 更新product-catalog.json
      const catalogPath = path.join(this.serverPath, 'public/data/product-catalog.json');
      const catalogData = {
        products: products,
        totalProducts: products.length,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
      };
      
      fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2), 'utf8');
      console.log(`✅ 产品目录更新完成，共 ${products.length} 个产品`);
      
    } catch (error) {
      console.error('重新生成产品目录失败:', error);
      throw error;
    }
  }

  /**
   * 手动重新生成产品目录的API
   */
  async regenerateCatalog() {
    try {
      console.log('手动重新生成产品目录...');
      await this.regenerateProductCatalog();
      
      return { success: true, message: '产品目录重新生成成功' };
    } catch (error) {
      console.error('重新生成产品目录失败:', error);
      throw new Error(`重新生成产品目录失败: ${error.message}`);
    }
  }
}

module.exports = UploadService;