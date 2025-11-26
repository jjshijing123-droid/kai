// const ProductCatalogGenerator = require('./generate-product-catalog');
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 递归计算文件夹大小的辅助函数
function calculateFolderSize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;
    
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                // 递归计算子文件夹
                const subResult = calculateFolderSize(itemPath);
                totalSize += subResult.totalSize;
                fileCount += subResult.fileCount;
            } else if (item.isFile()) {
                // 计算文件大小
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

// API路由 - 获取产品列表（从文件系统直接读取）
app.get('/api/products', (req, res) => {
    try {
        const productPath = path.join(__dirname, 'Product');
        
        if (!fs.existsSync(productPath)) {
            return res.json([]);
        }
        
        const products = [];
        const items = fs.readdirSync(productPath, { withFileTypes: true });
        
        console.log('🔍 开始计算产品文件夹大小...');
        
        for (const item of items) {
            if (item.isDirectory()) {
                const folderPath = path.join(productPath, item.name);
                const stats = fs.statSync(folderPath);
                
                console.log(`📁 计算文件夹: ${item.name}`);
                
                // 计算文件夹大小和文件数量
                const folderInfo = calculateFolderSize(folderPath);
                
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

// API路由 - 从数据库/JSON获取产品目录（兼容性）
app.get('/api/db/products', (req, res) => {
    try {
        const catalogPath = path.join(__dirname, 'public/data/product-catalog.json');
        
        if (!fs.existsSync(catalogPath)) {
            return res.json({
                success: true,
                products: []
            });
        }
        
        const catalogData = require(catalogPath);
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

// 创建新产品的API
app.post('/api/products', async (req, res) => {
    try {
        const { productName, folderName } = req.body;
        
        if (!productName || !folderName) {
            return res.status(400).json({
                success: false,
                message: '产品名称和文件夹名称不能为空'
            });
        }
        
        console.log(`创建新产品: ${productName}`);
        
        // 构建文件夹路径
        const productFolderPath = path.join(__dirname, 'Product', folderName);
        
        // 检查文件夹是否已存在
        if (fs.existsSync(productFolderPath)) {
            return res.status(409).json({
                success: false,
                message: '文件夹已存在'
            });
        }
        
        // 创建产品文件夹结构
        const subfolders = ['images_6Views', 'images_other', 'view1', 'view2', 'view3', 'view4'];
        
        for (const subfolder of subfolders) {
            const subfolderPath = path.join(productFolderPath, subfolder);
            fs.mkdirSync(subfolderPath, { recursive: true });
        }
        
        console.log(`产品文件夹创建成功: ${productFolderPath}`);
        
        res.json({
            success: true,
            message: `产品文件夹 "${productName}" 创建成功`,
            data: {
                productName,
                folderName,
                path: `Product/${folderName}`
            }
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

// 重命名产品的API
app.put('/api/products/:productName', async (req, res) => {
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
        
        // 构建新旧路径
        const oldFolderPath = path.join(__dirname, 'Product', productName);
        const newFolderPath = path.join(__dirname, 'Product', newFolderName);
        
        // 检查旧文件夹是否存在
        if (!fs.existsSync(oldFolderPath)) {
            return res.status(404).json({
                success: false,
                message: '原产品文件夹不存在'
            });
        }
        
        // 检查新文件夹名称是否已存在
        if (fs.existsSync(newFolderPath)) {
            return res.status(409).json({
                success: false,
                message: '新文件夹名称已存在'
            });
        }
        
        // 重命名文件夹
        fs.renameSync(oldFolderPath, newFolderPath);
        
        console.log(`产品重命名成功: ${productName} -> ${newFolderName}`);
            
            // 同步更新 product-catalog.json 文件
            console.log('🔄 同步更新产品目录文件...');
            updateProductCatalog(productName, 'rename', newFolderName);
            
            res.json({
                success: true,
                message: `产品重命名成功`,
                data: {
                    oldName: productName,
                    newName: newFolderName,
                    oldPath: `Product/${productName}`,
                    newPath: `Product/${newFolderName}`
                }
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

// 同步更新product-catalog.json文件的辅助函数
function updateProductCatalog(oldName, action = 'delete', newName = null) {
    try {
        const catalogPath = path.join(__dirname, 'public/data/product-catalog.json');
        
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

// 删除产品的API
app.delete('/api/products/:productName', async (req, res) => {
    try {
        const { productName } = req.params;
        console.log(`删除产品: ${productName}`);
        
        // 构建物理文件夹路径
        const productFolderPath = path.join(__dirname, 'Product', productName);
        console.log('物理文件夹路径:', productFolderPath);
        
        let physicalFolderDeleted = false;
        
        // 检查并删除物理文件夹
        if (fs.existsSync(productFolderPath)) {
            // 递归删除文件夹及其所有内容
            fs.rmSync(productFolderPath, { recursive: true, force: true });
            console.log(`已删除物理文件夹: ${productFolderPath}`);
            physicalFolderDeleted = true;
        } else {
            console.warn(`物理文件夹不存在: ${productFolderPath}`);
        }
        
        // 同步更新 product-catalog.json 文件
        console.log('🔄 同步更新产品目录文件...');
        updateProductCatalog(productName, 'delete');
        
        res.json({
            success: true,
            message: `产品 "${productName}" 删除成功`,
            physicalFolderDeleted,
            deletedProduct: {
                name: productName,
                path: `Product/${productName}`
            }
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

// 获取文件夹详情的API
app.get('/api/folder/:folderPath/details', async (req, res) => {
    try {
        const { folderPath } = req.params;
        console.log(`获取文件夹详情: ${folderPath}`);
        
        // 构建完整的文件夹路径
        const fullPath = path.join(__dirname, folderPath.startsWith('Product/') ? folderPath : `Product/${folderPath}`);
        console.log('完整路径:', fullPath);
        
        // 检查文件夹是否存在
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: '文件夹不存在'
            });
        }
        
        // 读取文件夹内容
        const folders = {};
        const files = [];
        
        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        
        for (const item of items) {
            if (item.isDirectory()) {
                const subFolderPath = path.join(fullPath, item.name);
                const subItems = fs.readdirSync(subFolderPath, { withFileTypes: true });
                
                folders[item.name] = {
                    path: path.join(folderPath, item.name),
                    fileCount: subItems.filter(subItem => subItem.isFile()).length,
                    totalSize: 0 // 简化实现
                };
            } else if (item.isFile()) {
                const filePath = path.join(fullPath, item.name);
                const stats = fs.statSync(filePath);
                
                files.push({
                    name: item.name,
                    size: stats.size,
                    modified: stats.mtime,
                    path: path.join(folderPath, item.name)
                });
            }
        }
        
        res.json({
            success: true,
            folder: {
                name: path.basename(fullPath),
                path: folderPath,
                folders,
                files
            }
        });
        
    } catch (error) {
        console.error('获取文件夹详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取文件夹详情失败',
            error: error.message
        });
    }
});

// 删除文件的API
app.post('/api/delete-file', async (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: '文件路径不能为空'
            });
        }
        
        console.log(`删除文件: ${filePath}`);
        
        // 构建完整的文件路径
        const fullPath = path.join(__dirname, filePath.startsWith('Product/') ? filePath : `Product/${filePath}`);
        console.log('文件完整路径:', fullPath);
        
        // 检查文件是否存在
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            });
        }
        
        // 删除文件
        fs.unlinkSync(fullPath);
        
        console.log(`文件删除成功: ${fullPath}`);
        
        res.json({
            success: true,
            message: '文件删除成功'
        });
        
    } catch (error) {
        console.error('删除文件失败:', error);
        res.status(500).json({
            success: false,
            message: '删除文件失败',
            error: error.message
        });
    }
});

// Multer配置 - 用于批量上传
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/zip' || file.originalname.toLowerCase().endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('只支持ZIP格式的压缩包'));
        }
    }
});

// 批量替换产品API
app.post('/api/batch-replace-products', upload.single('zipFile'), async (req, res) => {
    try {
        console.log('收到批量替换请求');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传ZIP文件'
            });
        }
        
        const uploadedFile = req.file;
        const tempZipPath = uploadedFile.path;
        const targetProductPath = path.join(__dirname, 'Product');
        
        console.log('📦 开始处理ZIP文件:', uploadedFile.originalname);
        
        // 检查Product文件夹是否存在
        if (!fs.existsSync(targetProductPath)) {
            fs.mkdirSync(targetProductPath, { recursive: true });
        }
        
// 1. 备份现有的Product文件夹（可选）
        const backupPath = path.join(__dirname, 'Product_backup_' + Date.now());
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
            // 检查文件/文件夹名称是否以点开头（隐藏文件）
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
        await regenerateProductCatalog();
        
        // 7. 立即清理备份文件夹
        console.log('🧹 立即清理备份文件夹...');
        if (fs.existsSync(backupPath)) {
            try {
                execPromise(`rm -rf "${backupPath}"`).then(() => {
                    console.log('✅ 备份文件夹清理成功:', backupPath);
                }).catch(err => {
                    console.warn('清理备份文件夹失败:', err.message);
                });
            } catch (cleanupError) {
                console.warn('清理备份文件夹时发生错误:', cleanupError.message);
            }
        }
        
        console.log('🎉 批量替换完成!');
        
        res.json({
            success: true,
            message: `批量替换完成，处理了 ${extractedCount} 个文件，创建了 ${folderCount} 个文件夹${skippedHiddenFiles > 0 ? `，跳过 ${skippedHiddenFiles} 个隐藏文件` : ''}，备份文件夹已立即清理`,
            fileCount: extractedCount,
            folderCount: folderCount,
            skippedHiddenFiles: skippedHiddenFiles,
            replacedProducts: replacedProducts,
            backupPath: backupPath
        });
        
    } catch (error) {
        console.error('批量替换失败:', error);
        res.status(500).json({
            success: false,
            message: '批量替换失败: ' + error.message,
            error: error.message
        });
    }
});

// 重新生成产品目录的辅助函数
async function regenerateProductCatalog() {
    try {
        console.log('🔄 开始重新生成产品目录...');
        
        const productPath = path.join(__dirname, 'Product');
        const products = [];
        
        if (!fs.existsSync(productPath)) {
            console.log('Product文件夹不存在，创建空目录');
            return;
        }
        
        const items = fs.readdirSync(productPath, { withFileTypes: true });
        
        for (const item of items) {
            if (item.isDirectory()) {
                const folderPath = path.join(productPath, item.name);
                const folderInfo = calculateFolderSize(folderPath);
                
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
        const catalogPath = path.join(__dirname, 'public/data/product-catalog.json');
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

// 单个产品文件夹上传API
app.post('/api/upload-product-folder', upload.single('file'), async (req, res) => {
    try {
        console.log('收到单个产品文件夹上传请求');
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请上传ZIP文件'
            });
        }
        
        const { folderName } = req.body;
        const uploadedFile = req.file;
        const tempZipPath = uploadedFile.path;
        const targetProductPath = path.join(__dirname, 'Product');
        
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
                        const type = entry.type; // 'Directory' or 'File'
                        
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
        await regenerateProductCatalog();
        
        console.log('🎉 单个产品文件夹上传完成!');
        
        res.json({
            success: true,
            message: `产品文件夹上传成功`,
            originalName: folderName,
            actualName: actualFolderName,
            fileCount: extractedCount,
            folderCount: folderCount,
            path: `Product/${actualFolderName}`
        });
        
    } catch (error) {
        console.error('单个产品文件夹上传失败:', error);
        res.status(500).json({
            success: false,
            error: '单个产品文件夹上传失败: ' + error.message
        });
    }
});

// 手动重新生成产品目录的API
app.post('/api/regenerate-catalog', async (req, res) => {
    try {
        console.log('手动重新生成产品目录...');
        await regenerateProductCatalog();
        
        res.json({
            success: true,
            message: '产品目录重新生成成功',
            data: {}
        });
    } catch (error) {
        console.error('重新生成产品目录失败:', error);
        res.status(500).json({
            success: false,
            message: '重新生成产品目录失败',
            error: error.message
        });
    }
});

// 静态文件服务 - 必须在所有API路由之后
app.use(express.static(path.join(__dirname, 'public')));

// ID到产品名称映射的辅助函数
function getProductNameById(productId) {
    try {
        const catalogPath = path.join(__dirname, 'public/data/product-catalog.json');
        
        if (!fs.existsSync(catalogPath)) {
            console.warn('产品目录文件不存在');
            return null;
        }
        
        const catalogData = require(catalogPath);
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

// 根据ID获取产品详情的API
app.get('/api/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 获取产品详情, ID: ${id}`);
        
        // 获取产品名称
        const productName = getProductNameById(id);
        if (!productName) {
            return res.status(404).json({
                success: false,
                message: '产品不存在'
            });
        }
        
        // 构建完整的产品数据
        const productPath = path.join(__dirname, 'Product', productName);
        
        if (!fs.existsSync(productPath)) {
            return res.status(404).json({
                success: false,
                message: '产品文件夹不存在'
            });
        }
        
        // 计算文件夹大小
        const folderInfo = calculateFolderSize(productPath);
        
        const productData = {
            id: parseInt(id),
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

// 检测文件夹文件存在性的API
app.get('/api/check-folder/:folderPath', (req, res) => {
    try {
        const { folderPath } = req.params;
        console.log(`🔍 检测文件夹文件: ${folderPath}`);
        
        // 构建完整的文件夹路径
        const fullPath = path.join(__dirname, folderPath);
        console.log('完整路径:', fullPath);
        
        // 检查文件夹是否存在
        if (!fs.existsSync(fullPath)) {
            console.log(`❌ 文件夹不存在: ${fullPath}`);
            return res.json({
                hasFiles: false,
                message: '文件夹不存在'
            });
        }
        
        // 检查是否为目录
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            console.log(`❌ 不是目录: ${fullPath}`);
            return res.json({
                hasFiles: false,
                message: '不是目录'
            });
        }
        
        // 读取文件夹内容，检查是否有文件
        let fileCount = 0;
        try {
            const items = fs.readdirSync(fullPath, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isFile()) {
                    fileCount++;
                    break; // 找到至少一个文件就退出循环
                }
            }
        } catch (error) {
            console.error(`读取文件夹失败: ${fullPath}`, error);
            return res.status(500).json({
                success: false,
                message: '读取文件夹失败',
                error: error.message
            });
        }
        
        const hasFiles = fileCount > 0;
        
        console.log(`📁 文件夹: ${folderPath}`);
        console.log(`📊 文件数量: ${fileCount}`);
        console.log(`✅ 是否有文件: ${hasFiles}`);
        
        res.json({
            hasFiles,
            fileCount,
            folderPath,
            message: hasFiles ? '文件夹中存在文件' : '文件夹中无文件'
        });
        
    } catch (error) {
        console.error('检测文件夹失败:', error);
        res.status(500).json({
            success: false,
            message: '检测文件夹失败',
            error: error.message
        });
    }
});

// 根据产品名称获取产品详情的API (修复Product3DViewer路由)
app.get('/api/db/products/name/:productName', (req, res) => {
    try {
        const { productName } = req.params;
        console.log(`🔍 根据名称获取产品详情: ${productName}`);
        
        // 构建完整的产品数据
        const productPath = path.join(__dirname, 'Product', productName);
        
        if (!fs.existsSync(productPath)) {
            return res.status(404).json({
                success: false,
                message: '产品不存在'
            });
        }
        
        // 计算文件夹大小
        const folderInfo = calculateFolderSize(productPath);
        
        const productData = {
            id: null, // 根据名称查找，ID可能在JSON中存在
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

/**
 * 启动服务器并生成产品目录
 */
async function startServer() {
    try {
        console.log('='.repeat(50));
        console.log('启动产品管理服务器');
        console.log('='.repeat(50));
        
        // 在服务器启动时生成产品目录
        console.log('正在生成产品目录...');
        // const generator = new ProductCatalogGenerator();
        // await generator.generateCatalog();
        
        // 启动Express服务器
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`服务器已启动，端口: ${PORT}`);
            console.log(`产品列表API: http://localhost:${PORT}/api/products`);
            console.log(`产品目录API: http://localhost:${PORT}/api/db/products`);
            console.log(`创建产品API: POST http://localhost:${PORT}/api/products`);
            console.log(`重命名产品API: PUT http://localhost:${PORT}/api/products/:productName`);
            console.log(`删除产品API: DELETE http://localhost:${PORT}/api/products/:productName`);
            console.log(`文件夹详情API: http://localhost:${PORT}/api/folder/:folderPath/details`);
            console.log(`删除文件API: POST http://localhost:${PORT}/api/delete-file`);
            console.log(`检测文件夹API: GET http://localhost:${PORT}/api/check-folder/:folderPath`);
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