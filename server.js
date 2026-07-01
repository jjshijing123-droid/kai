const express = require('express')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const { buildProductObject } = require('./server/utils/buildProductObject')

const ProductService = require('./server/services/productService')

// 导入路由
const productsRouter = require('./server/routes/products')
const foldersRouter = require('./server/routes/folders')
const filesRouter = require('./server/routes/files')
const uploadsRouter = require('./server/routes/uploads')

// 导入工具
const { ProductCatalogUtils, productCatalogUtils } = require('./server/utils/productCatalogUtils')

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = process.env.PORT || (isProduction ? 8000 : 3000);

// 初始化服务实例
const productService = new ProductService()

// 中间件配置
const corsOptions = {
  origin: isProduction ? ['http://localhost:3000', 'https://yourdomain.com'] : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 生产环境安全配置
if (isProduction) {
  app.set('trust proxy', 1);
  // 隐藏Express版本信息
  app.disable('x-powered-by');
}

// 静态文件服务 - 必须在API路由之前
if (isProduction) {
  // 生产环境使用dist目录
  app.use(express.static(path.join(__dirname, 'dist')));
} else {
  // 开发环境使用public目录
  app.use(express.static(path.join(__dirname, 'public')));
}
// 产品图片静态文件服务
app.use('/Product', express.static(path.join(__dirname, 'Product')));

// ========== API路由 ==========

// 产品管理路由
app.use('/api/products', productsRouter);

// 数据库兼容性路由 - 从数据库/JSON获取产品目录
app.get('/api/db/products', (req, res) => {
  try {
    const catalogData = productCatalogUtils.getProductCatalog();
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

// 根据产品名称获取产品详情（数据库兼容）
app.get('/api/db/products/name/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    console.log(`🔍 根据名称获取产品详情: ${productName}`);
    
    const productData = await productService.getProductByName(productName);
    
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

// 文件夹管理路由
app.use('/api/folder', foldersRouter);

// 文件操作路由
app.use('/api', filesRouter);

// 上传管理路由
app.use('/api', uploadsRouter);

// 重新生成产品目录 - 新增
app.post('/api/products/refresh-catalog', async (req, res) => {
  try {
    console.log('🔄 开始重新生成产品目录...');
    
    // 使用已创建的productService实例获取所有产品
    const products = await productService.getProducts();
    
    // 生成新的产品目录
    const catalogData = {
      products: [],
      totalProducts: 0,
      lastUpdated: new Date().toISOString(),
      version: '2.0'
    };
    
    products.forEach((product, index) => {
      catalogData.products.push(buildProductObject({
        id: product.id || index + 1,
        name: product.name,
        folderName: product.folderName,
        category: product.category || 'general',
        description: product.description || `Product model: ${product.name}`,
        totalSize: product.totalSize || 0,
        fileCount: product.fileCount || 0
      }))
    });
    
    // 更新总数
    catalogData.totalProducts = catalogData.products.length;
    
    // 保存产品目录
    const saved = productCatalogUtils.saveProductCatalog(catalogData);
    
    if (saved) {
      console.log(`✅ 产品目录重新生成成功，共 ${catalogData.products.length} 个产品`);
      res.json({
        success: true,
        message: '产品目录重新生成成功',
        productCount: catalogData.products.length
      });
    } else {
      throw new Error('保存产品目录失败');
    }
  } catch (error) {
    console.error('重新生成产品目录失败:', error);
    res.status(500).json({
      success: false,
      message: '重新生成产品目录失败',
      error: error.message
    });
  }
});

// 翻译管理路由 - 新增
app.use('/api/i18n', (req, res, next) => {
  const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
  req.translationsPath = translationsPath;
  next();
});

// 获取所有翻译
app.get('/api/i18n/translations', (req, res) => {
  try {
    const content = fs.readFileSync(req.translationsPath, 'utf8');
    // 提取baseTranslations对象
    const baseMatch = content.match(/const baseTranslations = (\{[\s\S]*?\});/);
    if (!baseMatch) {
      return res.status(500).json({ success: false, message: 'Failed to parse translations' });
    }
    const translations = eval(`(${baseMatch[1]})`);
    res.json({ success: true, data: translations });
  } catch (error) {
    console.error('Failed to get translations:', error);
    res.status(500).json({ success: false, message: 'Failed to get translations', error: error.message });
  }
});

// 更新翻译
app.post('/api/i18n/translations', (req, res) => {
  try {
    const translationsData = req.body;
    
    // 构建完整的translations.js文件内容
    const fileContent = `// 基础翻译配置 - 按组件组织翻译键
const baseTranslations = ${JSON.stringify(translationsData, null, 2)};

// 动态翻译对象 - 直接使用基础翻译，不再从localStorage加载
export let translations = { ...baseTranslations }

// 更新翻译对象（用于保存后更新）
export function updateTranslations(newTranslations) {
  // 深度合并新翻译到现有翻译中
  Object.keys(newTranslations).forEach(lang => {
    if (!translations[lang]) {
      translations[lang] = {}
    }
    Object.assign(translations[lang], newTranslations[lang])
  })
  console.log('Translations updated:', translations)
}

// 重新加载翻译数据（用于保存后刷新）
export function reloadTranslations() {
  // 不重新加载基础翻译，保持现有翻译
  console.log('Reloading translations skipped, keeping existing data')
}

// 获取翻译函数
export function getTranslation(key, language = 'en') {
  const langTranslations = translations[language] || translations['en']
  return langTranslations[key] || key
}

// 获取所有翻译键
export function getTranslationKeys() {
  const keys = new Set()
  Object.keys(translations).forEach(lang => {
    Object.keys(translations[lang]).forEach(key => keys.add(key))
  })
  return Array.from(keys).sort()
}

// 语言配置
export const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}`;
    
    // 写入文件
    fs.writeFileSync(req.translationsPath, fileContent, 'utf8');
    res.json({ success: true, message: 'Translations updated successfully' });
  } catch (error) {
    console.error('Failed to update translations:', error);
    res.status(500).json({ success: false, message: 'Failed to update translations', error: error.message });
  }
});

// 添加单个翻译键
app.post('/api/i18n/translations/keys', (req, res) => {
  try {
    const { key, translations: newTranslations } = req.body;
    
    // 读取现有翻译
    const content = fs.readFileSync(req.translationsPath, 'utf8');
    const baseMatch = content.match(/const baseTranslations = (\{[\s\S]*?\});/);
    if (!baseMatch) {
      return res.status(500).json({ success: false, message: 'Failed to parse translations' });
    }
    const translations = eval(`(${baseMatch[1]})`);
    
    // 添加新翻译键
    Object.keys(newTranslations).forEach(lang => {
      if (!translations[lang]) {
        translations[lang] = {}
      }
      translations[lang][key] = newTranslations[lang];
    });
    
    // 重新构建文件内容
    const fileContent = `// 基础翻译配置 - 按组件组织翻译键
const baseTranslations = ${JSON.stringify(translations, null, 2)};

// 动态翻译对象 - 直接使用基础翻译，不再从localStorage加载
export let translations = { ...baseTranslations }

// 更新翻译对象（用于保存后更新）
export function updateTranslations(newTranslations) {
  // 深度合并新翻译到现有翻译中
  Object.keys(newTranslations).forEach(lang => {
    if (!translations[lang]) {
      translations[lang] = {}
    }
    Object.assign(translations[lang], newTranslations[lang])
  })
  console.log('Translations updated:', translations)
}

// 重新加载翻译数据（用于保存后刷新）
export function reloadTranslations() {
  // 不重新加载基础翻译，保持现有翻译
  console.log('Reloading translations skipped, keeping existing data')
}

// 获取翻译函数
export function getTranslation(key, language = 'en') {
  const langTranslations = translations[language] || translations['en']
  return langTranslations[key] || key
}

// 获取所有翻译键
export function getTranslationKeys() {
  const keys = new Set()
  Object.keys(translations).forEach(lang => {
    Object.keys(translations[lang]).forEach(key => keys.add(key))
  })
  return Array.from(keys).sort()
}

// 语言配置
export const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}`;
    
    // 写入文件
    fs.writeFileSync(req.translationsPath, fileContent, 'utf8');
    res.json({ success: true, message: 'Translation key added successfully' });
  } catch (error) {
    console.error('Failed to add translation key:', error);
    res.status(500).json({ success: false, message: 'Failed to add translation key', error: error.message });
  }
});

// 更新单个翻译键
app.put('/api/i18n/translations/keys/:key', (req, res) => {
  try {
    const key = req.params.key;
    const { translations: updatedTranslations } = req.body;
    
    // 读取现有翻译
    const content = fs.readFileSync(req.translationsPath, 'utf8');
    const baseMatch = content.match(/const baseTranslations = (\{[\s\S]*?\});/);
    if (!baseMatch) {
      return res.status(500).json({ success: false, message: 'Failed to parse translations' });
    }
    const translations = eval(`(${baseMatch[1]})`);
    
    // 更新翻译键
    Object.keys(updatedTranslations).forEach(lang => {
      if (!translations[lang]) {
        translations[lang] = {}
      }
      translations[lang][key] = updatedTranslations[lang];
    });
    
    // 重新构建文件内容
    const fileContent = `// 基础翻译配置 - 按组件组织翻译键
const baseTranslations = ${JSON.stringify(translations, null, 2)};

// 动态翻译对象 - 直接使用基础翻译，不再从localStorage加载
export let translations = { ...baseTranslations }

// 更新翻译对象（用于保存后更新）
export function updateTranslations(newTranslations) {
  // 深度合并新翻译到现有翻译中
  Object.keys(newTranslations).forEach(lang => {
    if (!translations[lang]) {
      translations[lang] = {}
    }
    Object.assign(translations[lang], newTranslations[lang])
  })
  console.log('Translations updated:', translations)
}

// 重新加载翻译数据（用于保存后刷新）
export function reloadTranslations() {
  // 不重新加载基础翻译，保持现有翻译
  console.log('Reloading translations skipped, keeping existing data')
}

// 获取翻译函数
export function getTranslation(key, language = 'en') {
  const langTranslations = translations[language] || translations['en']
  return langTranslations[key] || key
}

// 获取所有翻译键
export function getTranslationKeys() {
  const keys = new Set()
  Object.keys(translations).forEach(lang => {
    Object.keys(translations[lang]).forEach(key => keys.add(key))
  })
  return Array.from(keys).sort()
}

// 语言配置
export const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}`;
    
    // 写入文件
    fs.writeFileSync(req.translationsPath, fileContent, 'utf8');
    res.json({ success: true, message: 'Translation key updated successfully' });
  } catch (error) {
    console.error('Failed to update translation key:', error);
    res.status(500).json({ success: false, message: 'Failed to update translation key', error: error.message });
  }
});

// 删除单个翻译键
app.delete('/api/i18n/translations/keys/:key', (req, res) => {
  try {
    const key = req.params.key;
    
    // 读取现有翻译
    const content = fs.readFileSync(req.translationsPath, 'utf8');
    const baseMatch = content.match(/const baseTranslations = (\{[\s\S]*?\});/);
    if (!baseMatch) {
      return res.status(500).json({ success: false, message: 'Failed to parse translations' });
    }
    const translations = eval(`(${baseMatch[1]})`);
    
    // 删除翻译键
    Object.keys(translations).forEach(lang => {
      if (translations[lang] && translations[lang][key] !== undefined) {
        delete translations[lang][key];
      }
    });
    
    // 重新构建文件内容
    const fileContent = `// 基础翻译配置 - 按组件组织翻译键
const baseTranslations = ${JSON.stringify(translations, null, 2)};

// 动态翻译对象 - 直接使用基础翻译，不再从localStorage加载
export let translations = { ...baseTranslations }

// 更新翻译对象（用于保存后更新）
export function updateTranslations(newTranslations) {
  // 深度合并新翻译到现有翻译中
  Object.keys(newTranslations).forEach(lang => {
    if (!translations[lang]) {
      translations[lang] = {}
    }
    Object.assign(translations[lang], newTranslations[lang])
  })
  console.log('Translations updated:', translations)
}

// 重新加载翻译数据（用于保存后刷新）
export function reloadTranslations() {
  // 不重新加载基础翻译，保持现有翻译
  console.log('Reloading translations skipped, keeping existing data')
}

// 获取翻译函数
export function getTranslation(key, language = 'en') {
  const langTranslations = translations[language] || translations['en']
  return langTranslations[key] || key
}

// 获取所有翻译键
export function getTranslationKeys() {
  const keys = new Set()
  Object.keys(translations).forEach(lang => {
    Object.keys(translations[lang]).forEach(key => keys.add(key))
  })
  return Array.from(keys).sort()
}

// 语言配置
export const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-CN': { name: '中文', flag: '🇨🇳' }
}`;
    
    // 写入文件
    fs.writeFileSync(req.translationsPath, fileContent, 'utf8');
    res.json({ success: true, message: 'Translation key deleted successfully' });
  } catch (error) {
    console.error('Failed to delete translation key:', error);
    res.status(500).json({ success: false, message: 'Failed to delete translation key', error: error.message });
  }
});

// ========== 错误处理 ==========

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 前端路由处理 - 对于非API请求，返回index.html
app.use((req, res, next) => {
  // 如果请求不是API请求，且不是静态资源，返回index.html
  if (!req.url.startsWith('/api') && 
      !req.url.startsWith('/Product') && 
      !req.url.startsWith('/data') && 
      !req.url.startsWith('/assets') && 
      !req.url.startsWith('/@vite') && 
      req.method === 'GET') {
    // 根据环境选择index.html路径
    const indexPath = isProduction 
      ? path.join(__dirname, 'dist', 'index.html') 
      : path.join(__dirname, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// 404处理
app.use((req, res) => {
  console.log(`404 - 请求的资源不存在: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// ========== 服务启动 ==========

/**
 * 启动服务器并生成产品目录
 */
async function startServer() {
  try {
    console.log('='.repeat(60));
    console.log(`启动产品管理服务器 - 环境: ${NODE_ENV}`);
    console.log('='.repeat(60));
    
    // 验证产品目录数据
    const catalogData = productCatalogUtils.getProductCatalog();
    const validation = productCatalogUtils.validateProductCatalog(catalogData);
    
    if (!validation.isValid) {
      console.warn('⚠️ 产品目录数据验证失败:', validation.errors);
    } else {
      console.log(`✅ 产品目录验证成功，共 ${validation.productCount} 个产品`);
    }
    
    // 启动Express服务器
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`服务器已启动，端口: ${PORT}`);
      console.log(`环境: ${NODE_ENV}`);
      console.log(`静态文件目录: ${isProduction ? 'dist/' : 'public/'}`);
      console.log(`服务访问地址: http://localhost:${PORT}`);
      console.log(`产品列表API: http://localhost:${PORT}/api/products`);
      console.log(`产品目录API: http://localhost:${PORT}/api/db/products`);
      console.log('='.repeat(60));
      
      // 检查服务器是否真正在监听端口
      const address = server.address();
      if (address) {
        console.log(`✅ 服务器确实在监听 ${address.address === '::' ? '0.0.0.0' : address.address}:${address.port}`);
      } else {
        console.error('❌ 服务器未能获取监听地址');
      }
    });
    
    // 添加错误处理
    server.on('error', (error) => {
      console.error('服务器启动错误:', error);
      process.exit(1);
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