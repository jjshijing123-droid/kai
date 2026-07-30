const express = require('express')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
require('dotenv').config()

const ProductService = require('./server/services/productService')

// 导入路由
const productsRouter = require('./server/routes/products')
const foldersRouter = require('./server/routes/folders')
const filesRouter = require('./server/routes/files')
const uploadsRouter = require('./server/routes/uploads')

// 导入工具
const { ProductCatalogUtils, productCatalogUtils } = require('./server/utils/productCatalogUtils')
const { generateToken, authMiddleware } = require('./server/middleware/auth')

// 导入 SQLite 数据库
const { initDatabase } = require('./server/database/index')
const usersRepo = require('./server/database/usersRepository')
const syncService = require('./server/database/sync')
const translationsRepo = require('./server/database/translationsRepository')

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = process.env.PORT || (isProduction ? 8000 : 3010);

// 初始化服务实例
const productService = new ProductService()

// 中间件配置
// 从环境变量读取 CORS 来源，支持逗号分隔的多个域名
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== 限流中间件 =====
const rateLimit = require('express-rate-limit');

// 登录接口限流 - 5次/分钟
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '登录尝试过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// API 限流 - 100次/分钟
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 上传接口限流 - 10次/分钟
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: '上传过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// ===== 认证路由 =====

// 管理员登录 — 从 SQLite 数据库验证凭据
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 确保数据库已初始化
    initDatabase()

    // 从数据库验证用户名和密码（bcrypt 哈希比对）
    const user = usersRepo.verifyPassword(username, password)

    if (user) {
      const token = generateToken({
        username: user.username,
        role: user.role
      });

      return res.json({
        success: true,
        message: '登录成功',
        data: { token, username: user.username, role: user.role }
      });
    }

    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 验证 token 有效性
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      username: req.user.username,
      role: req.user.role
    }
  });
});

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

// ========== 系统端点 ==========

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务器运行正常', timestamp: new Date().toISOString() })
})

// 服务器日志端点
app.post('/api/logs', (req, res) => {
  const { level, message, source, stack } = req.body || {}
  console.log(`[${level || 'info'}] ${source || 'client'}: ${message}`)
  if (stack) console.log(stack)
  res.json({ success: true })
})

// 批量日志端点
app.post('/api/logs/batch', (req, res) => {
  const logs = req.body?.logs || []
  logs.forEach(log => {
    console.log(`[${log.level || 'info'}] ${log.source || 'client'}: ${log.message}`)
    if (log.stack) console.log(log.stack)
  })
  res.json({ success: true, received: logs.length })
})

// 错误上报端点
app.post('/api/error-report', (req, res) => {
  const { message, stack, source, userAgent } = req.body || {}
  console.error('客户端错误上报:', { message, stack, source, userAgent })
  res.json({ success: true })
})

// ========== API路由 ==========

// 产品管理路由（全局限流，写操作认证在路由文件内）
app.use('/api/products', apiLimiter, productsRouter);

// 数据库兼容性路由 - 从 SQLite 获取产品目录
app.get('/api/db/products', (req, res) => {
  try {
    // 确保数据库已初始化
    initDatabase()

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

// 重新生成产品目录 - 需要管理员认证
app.post('/api/products/refresh-catalog', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 开始重新生成产品目录到 SQLite...');

    // 初始化数据库并同步
    initDatabase()
    const result = syncService.syncAll()

    res.json({
      success: true,
      message: '产品目录重新生成成功',
      productCount: result.totalInDb
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

// 翻译管理路由 - 基于 SQLite（翻译数据存储在 data/products.db）
app.use('/api/i18n', (req, res, next) => {
  if (req.method === 'GET') {
    return next()
  }
  authMiddleware(req, res, next)
})

// 获取所有翻译
app.get('/api/i18n/translations', (req, res) => {
  try {
    initDatabase()
    const translations = translationsRepo.getAllTranslations()
    res.json({ success: true, data: translations })
  } catch (error) {
    console.error('Failed to get translations:', error)
    res.status(500).json({ success: false, message: 'Failed to get translations', error: error.message })
  }
})

// 更新全部翻译
app.post('/api/i18n/translations', (req, res) => {
  try {
    const translationsData = req.body
    initDatabase()
    translationsRepo.replaceAll(translationsData)
    res.json({ success: true, message: 'Translations updated successfully' })
  } catch (error) {
    console.error('Failed to update translations:', error)
    res.status(500).json({ success: false, message: 'Failed to update translations', error: error.message })
  }
})

// 添加单个翻译键
app.post('/api/i18n/translations/keys', (req, res) => {
  try {
    const { key, translations: newTranslations } = req.body
    initDatabase()
    for (const lang of Object.keys(newTranslations)) {
      translationsRepo.upsertTranslation(lang, key, newTranslations[lang])
    }
    res.json({ success: true, message: 'Translation key added successfully' })
  } catch (error) {
    console.error('Failed to add translation key:', error)
    res.status(500).json({ success: false, message: 'Failed to add translation key', error: error.message })
  }
})

// 更新单个翻译键
app.post('/api/i18n/translations/keys/:key', (req, res) => {
  try {
    const key = req.params.key
    const { translations: updatedTranslations } = req.body
    initDatabase()
    for (const lang of Object.keys(updatedTranslations)) {
      translationsRepo.upsertTranslation(lang, key, updatedTranslations[lang])
    }
    res.json({ success: true, message: 'Translation key updated successfully' })
  } catch (error) {
    console.error('Failed to update translation key:', error)
    res.status(500).json({ success: false, message: 'Failed to update translation key', error: error.message })
  }
})

// 删除单个翻译键
app.delete('/api/i18n/translations/keys/:key', (req, res) => {
  try {
    const key = req.params.key
    initDatabase()
    const deleted = translationsRepo.deleteKey(key)
    res.json({ success: true, message: 'Translation key deleted successfully', deleted })
  } catch (error) {
    console.error('Failed to delete translation key:', error)
    res.status(500).json({ success: false, message: 'Failed to delete translation key', error: error.message })
  }
})

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

// ========== 优雅关闭处理 ==========

const gracefulShutdown = (signal) => {
  console.log(`\n收到 ${signal}，正在关闭服务器...`)
  server.close(() => {
    console.log('HTTP 服务器已关闭，所有连接已排空')
    process.exit(0)
  })
  // 强制关闭超时
  setTimeout(() => {
    console.error('强制关闭：未完成的请求已超时')
    process.exit(1)
  }, 30000)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// ========== 翻译数据种子导入 ==========

/**
 * 从 translations.js 静态文件中提取翻译数据并导入 SQLite
 * 仅在翻译表为空时调用（启动时自动触发一次）
 */
function seedTranslationsFromFile() {
  try {
    const translationsPath = path.join(__dirname, 'src', 'i18n', 'translations.js')
    if (!fs.existsSync(translationsPath)) {
      console.warn('⚠️ translations.js 文件不存在，跳过初始数据导入')
      return
    }

    const content = fs.readFileSync(translationsPath, 'utf8')
    // 提取 baseTranslations 对象
    const baseMatch = content.match(/const baseTranslations = (\{[\s\S]*?\});/)
    if (!baseMatch) {
      console.warn('⚠️ 无法解析 translations.js 中的 baseTranslations')
      return
    }

    const translationsObj = JSON.parse(baseMatch[1])
    translationsRepo.replaceAll(translationsObj)
    const count = translationsRepo.getTranslationCount()
    console.log(`✅ 翻译种子数据已导入 SQLite，共 ${count} 条记录`)
  } catch (error) {
    console.error('导入翻译种子数据失败:', error)
  }
}

// ========== 服务启动 ==========

/**
 * 启动服务器并同步产品目录到 SQLite
 */
async function startServer() {
  try {
    console.log('='.repeat(60));
    console.log(`启动产品管理服务器 - 环境: ${NODE_ENV}`);
    console.log('='.repeat(60));

    // 初始化 SQLite 数据库
    console.log('🔧 初始化 SQLite 数据库...');
    initDatabase()

    // 初始化默认管理员账户（首次启动时从 .env 凭据创建）
    if (usersRepo.getUserCount() === 0) {
      console.log('👤 检测到用户表为空，初始化默认管理员...')
      usersRepo.seedDefaultAdmin()
    }

    // 首次启动时，将 translations.js 中的翻译种子数据导入 SQLite
    if (!translationsRepo.hasTranslations('en')) {
      console.log('📥 检测到翻译数据为空，尝试从 translations.js 导入初始数据...')
      seedTranslationsFromFile()
    }

    // 启动前同步产品目录到 SQLite，确保与文件系统一致
    console.log('🔄 同步产品目录到 SQLite...');
    const syncResult = syncService.syncAll()

    // 验证产品目录数据
    const catalogData = productCatalogUtils.getProductCatalog();
    const validation = productCatalogUtils.validateProductCatalog(catalogData);

    if (!validation.isValid) {
      console.warn('⚠️ 产品目录数据验证失败:', validation.errors);
    } else {
      console.log(`✅ 产品目录验证成功，共 ${validation.productCount} 个产品（扫描 ${syncResult.scanned} 个文件夹）`);
    }

    // 启动Express服务器
    server = app.listen(PORT, () => {
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

// 服务器实例（模块级别声明，供 gracefulShutdown 使用）
let server;

// 启动服务器
startServer();

module.exports = app;

// ===== CLI 命令 =====

// 用法: node server.js init-admin
// 交互式创建第一个管理员账户（仅在用户表为空时可用）
if (process.argv[2] === 'init-admin') {
  // 仅初始化数据库，不启动 Express 服务器
  initDatabase()
  const readline = require('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const prompt = (question) => new Promise(resolve => rl.question(question, resolve))

  ;(async () => {
    // 检查是否已有用户
    const count = usersRepo.getUserCount()
    if (count > 0) {
      console.log(`❌ 用户表已有 ${count} 条记录，init-admin 仅能在用户表为空时使用`)
      console.log('   如需重置，请手动删除 data/products.db 后重试')
      process.exit(1)
    }

    console.log('👤 创建第一个管理员账户\n')

    let username, password, displayName

    username = await prompt('用户名: ')
    if (!username.trim()) {
      console.log('❌ 用户名不能为空')
      rl.close()
      process.exit(1)
    }

    // 检查用户名是否已存在
    if (usersRepo.userExists(username.trim())) {
      console.log('❌ 用户名已存在')
      rl.close()
      process.exit(1)
    }

    password = await prompt('密码: ')
    if (!password.trim()) {
      console.log('❌ 密码不能为空')
      rl.close()
      process.exit(1)
    }

    if (password.length < 6) {
      console.log('⚠️ 密码长度至少 6 位')
    }

    displayName = await prompt('显示名称（可选，直接回车跳过）: ')

    const user = usersRepo.createUser(username.trim(), password, 'admin', displayName.trim() || username.trim())

    console.log(`\n✅ 管理员创建成功！`)
    console.log(`   用户名: ${user.username}`)
    console.log(`   角色:   ${user.role}`)
    console.log(`   ID:     ${user.id}`)
    console.log('\n现在可以启动服务器进行登录了:')
    console.log('   node server.js')

    rl.close()
  })()
}