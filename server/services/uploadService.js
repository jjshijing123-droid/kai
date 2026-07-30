const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { calculateFolderSize } = require('../utils/fsHelpers');
const { safeJoin, sanitizeZipEntry } = require('../utils/safePath');
const { buildProductObject } = require('../utils/buildProductObject');
const ProductService = require('./productService');
const FolderService = require('./folderService');

// 修复中文文件名乱码
// Multer 2.x / Busboy 1.6.x 将 multipart header 中的文件名按 Latin-1 解码，
// 导致中文文件名变成乱码。这里通过 Buffer 字节转换恢复 UTF-8 编码。
function fixFileName(originalName) {
  if (!originalName) return originalName
  try {
    const fixed = Buffer.from(originalName, 'latin1').toString('utf-8')
    // 验证结果不包含 NUL 字节（乱码恢复失败时可能产生）
    if (!fixed.includes('\x00')) {
      return fixed
    }
  } catch (e) {}
  return originalName
}

/**
 * 上传管理服务类 - 负责文件上传和批量操作
 */
class UploadService {
  // 挂载 fixFileName 到类上，供 routes/uploads.js 解构导入
  static fixFileName = fixFileName

  constructor() {
    this.serverPath = path.resolve(__dirname, '../../')
    this.productBasePath = safeJoin(this.serverPath, 'Product')
    this.productService = new ProductService();
    this.folderService = new FolderService();
    this.productRepo = require('../database/productRepository');
  }

  /**
   * 批量替换产品（危险操作）— 清空 Product/ 后解压 ZIP
   */
  async batchReplaceProducts(uploadedFile) {
    try {
      if (!uploadedFile) {
        throw new Error('请上传ZIP文件')
      }

      const tempZipPath = uploadedFile.path
      const targetProductPath = this.productBasePath
      const serverPath = this.serverPath

      console.log('📦 开始批量替换产品目录:', fixFileName(uploadedFile.originalname))

      // 1. 解压 ZIP 到临时目录
      const tempExtractPath = safeJoin(serverPath, `Product_temp_${Date.now()}`)
      if (fs.existsSync(tempExtractPath)) {
        fs.rmSync(tempExtractPath, { recursive: true, force: true })
      }
      fs.mkdirSync(tempExtractPath, { recursive: true })

      console.log('📦 解压到临时目录:', tempExtractPath)

      let extractedCount = 0
      let folderCount = 0

      await new Promise((resolve, reject) => {
        fs.createReadStream(tempZipPath)
          .pipe(unzipper.Parse())
          .on('entry', function (entry) {
            const fileName = entry.path

            // 只处理文件，跳过所有目录条目（包括空文件夹）
            // 文件写入时通过 mkdirSync(recursive) 自动创建父目录
            if (entry.type === 'Directory') {
              entry.autodrain()
              return
            }

            // 过滤隐藏文件
            if (path.basename(fileName).startsWith('.')) {
              entry.autodrain()
              return
            }

            // 拒绝符号链接条目（防止路径穿越攻击）
            if (entry.type === 'SymbolicLink') {
              entry.autodrain()
              return
            }

            const sanitizedName = sanitizeZipEntry(fileName)
            const filePath = safeJoin(tempExtractPath, sanitizedName)
            const dir = path.dirname(filePath)
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            entry.pipe(fs.createWriteStream(filePath))
            extractedCount++
          })
          .on('close', () => {
            console.log(`✅ 解压完成: ${extractedCount} 个文件, ${folderCount} 个文件夹`)
            resolve()
          })
          .on('error', (err) => {
            console.error('❌ 解压失败:', err)
            reject(err)
          })
      })

      // 2. 清理临时 ZIP 文件
      fs.unlinkSync(tempZipPath)

      // 3. 清空 Product 目录
      console.log('🗑️ 清空 Product 目录...')
      if (fs.existsSync(targetProductPath)) {
        const items = fs.readdirSync(targetProductPath, { withFileTypes: true })
        for (const item of items) {
          const itemPath = path.join(targetProductPath, item.name)
          try {
            fs.rmSync(itemPath, { recursive: true, force: true })
          } catch (e) {
            console.warn(`⚠️ 删除 ${item.name} 失败，重试: ${e.message}`)
            fs.rmSync(itemPath, { recursive: true, force: true })
          }
        }
      }

      // 4. 将解压内容复制到 Product 目录（Windows 下 rename 跨目录可能 EPERM）
      console.log('📋 复制文件到 Product 目录...')
      fs.cpSync(tempExtractPath, targetProductPath, { recursive: true })

      // 5. 清理临时目录
      fs.rmSync(tempExtractPath, { recursive: true, force: true })
      console.log('🧹 临时目录已清理')

      // 6. 同步产品目录到 SQLite
      console.log('🔄 同步产品数据到 SQLite...')
      await this.regenerateProductCatalog()

      console.log('🎉 批量替换完成!')

      return {
        success: true,
        message: `批量替换完成，共处理 ${extractedCount} 个文件，${folderCount} 个文件夹`,
        fileCount: extractedCount,
        folderCount: folderCount
      }

    } catch (error) {
      console.error('批量替换失败:', error)
      throw new Error(`批量替换失败: ${error.message}`)
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
      const targetProductPath = this.productBasePath;
      
      console.log('📦 开始处理ZIP文件:', fixFileName(uploadedFile.originalname));
      
      // 检查Product文件夹是否存在
      if (!fs.existsSync(targetProductPath)) {
        fs.mkdirSync(targetProductPath, { recursive: true });
      }
      
      // 生成实际的文件夹名称（避免冲突）
      let actualFolderName = folderName;
      let counter = 1;
      while (fs.existsSync(safeJoin(this.productBasePath, actualFolderName))) {
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

              // 拒绝符号链接条目（防止路径穿越攻击）
              if (entry.type === 'SymbolicLink') {
                console.warn('⛔ 拒绝符号链接条目:', fileName)
                entry.autodrain()
                return
              }

              console.log('📄 处理文件:', fileName);

              if (type === 'Directory') {
                // 清理目录名并使用 safeJoin 验证
                const safeDirName = sanitizeZipEntry(fileName);
                const dirPath = safeJoin(productFolderPath, safeDirName);
                fs.mkdirSync(dirPath, { recursive: true });
                folderCount++;
                entry.autodrain();
              } else {
                // 使用 sanitizeZipEntry 清理文件名并用 safeJoin 验证路径
                const sanitizedName = sanitizeZipEntry(fileName);
                const filePath = safeJoin(productFolderPath, sanitizedName);
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
   * 重新生成产品目录 —— 写入 SQLite（替代旧的 JSON 文件写入）
   */
  async regenerateProductCatalog() {
    try {
      console.log('🔄 开始重新生成产品目录到 SQLite...');

      const productPath = safeJoin(this.serverPath, 'Product');

      if (!fs.existsSync(productPath)) {
        console.log('Product文件夹不存在，跳过');
        return;
      }

      const items = fs.readdirSync(productPath, { withFileTypes: true });
      const products = [];

      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = path.join(productPath, item.name);
          const folderInfo = calculateFolderSize(folderPath);
          const itemStat = fs.statSync(folderPath);

          products.push(buildProductObject({
            name: item.name,
            folderName: item.name,
            id: null,
            category: 'general',
            description: `Product model: ${item.name}`,
            totalSize: folderInfo.totalSize,
            fileCount: folderInfo.fileCount,
            modified: itemStat.mtime.toISOString(),
            isDirectory: true
          }));

          console.log(`✅ 添加产品: ${item.name} (${folderInfo.fileCount} 个文件)`);
        }
      }

      // 批量写入 SQLite
      this.productRepo.batchUpsert(products);
      console.log(`✅ 产品目录更新完成（SQLite），共 ${products.length} 个产品`);

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

  /**
   * 上传文件到指定文件夹
   */
  async uploadFiles(files, folderPath) {
    try {
      console.log('收到文件上传请求');
      
      if (!files || !files.length) {
        throw new Error('请选择要上传的文件');
      }
      
      if (!folderPath) {
        throw new Error('文件夹路径不能为空');
      }
      
      const targetFolderPath = safeJoin(this.productBasePath, folderPath.replace(/^Product(\/|$)/, ''));
      console.log('📁 目标文件夹:', targetFolderPath);
      
      // 检查目标文件夹是否存在
      if (!fs.existsSync(targetFolderPath)) {
        fs.mkdirSync(targetFolderPath, { recursive: true });
      }
      
      const uploadedFiles = [];
      
      // 逐个处理文件
      for (const file of files) {
        try {
          const fileName = fixFileName(file.originalname);
          const filePath = path.join(targetFolderPath, fileName);
          
          // 检查文件是否已存在
          let actualFileName = fileName;
          let counter = 1;
          
          while (fs.existsSync(path.join(targetFolderPath, actualFileName))) {
            const fileExt = path.extname(fileName);
            const baseName = path.basename(fileName, fileExt);
            actualFileName = `${baseName}_副本${counter}${fileExt}`;
            counter++;
          }
          
          const finalFilePath = path.join(targetFolderPath, actualFileName);
          
          // 读取上传的文件并写入目标位置
          const fileContent = fs.readFileSync(file.path);
          fs.writeFileSync(finalFilePath, fileContent);
          
          // 记录上传的文件信息
          uploadedFiles.push({
            originalName: fileName,
            actualName: actualFileName,
            path: finalFilePath,
            relativePath: path.join(folderPath, actualFileName),
            size: file.size
          });
          
          console.log(`✅ 文件上传成功: ${actualFileName}`);
          
        } catch (fileError) {
          console.error(`文件上传失败: ${fixFileName(file.originalname)}`, fileError);
          // 继续处理其他文件，不中断整个上传过程
        }
      }
      
      // 清理临时文件
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      // 如果上传的是产品文件夹下的文件，同步到 SQLite
      if (folderPath.startsWith('Product/')) {
        console.log('🔄 同步产品目录到 SQLite...');
        await this.regenerateProductCatalog();
      }
      
      console.log(`🎉 文件上传完成! 成功上传 ${uploadedFiles.length}/${files.length} 个文件`);
      
      return {
        success: true,
        message: `文件上传完成，成功上传 ${uploadedFiles.length}/${files.length} 个文件`,
        uploadedFiles: uploadedFiles,
        successfulCount: uploadedFiles.length,
        failedCount: files.length - uploadedFiles.length
      };
      
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(`文件上传失败: ${error.message}`);
    }
  }
}

module.exports = UploadService;