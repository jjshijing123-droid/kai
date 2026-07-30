const fs = require('fs')
const path = require('path')
const { calculateFolderSize } = require('../utils/fsHelpers')
const { buildProductObject } = require('../utils/buildProductObject')
const { safeJoin } = require('../utils/safePath')
const ProductRepository = require('./productRepository')

/**
 * 文件系统与 SQLite 同步服务
 *
 * 职责：
 * 1. 启动时扫描 Product/ 目录，将产品元数据同步到 SQLite
 * 2. 提供增量同步能力（通过 mtime 判断是否需要更新）
 */

const productRepo = ProductRepository

class SyncService {
  constructor() {
    this.serverPath = path.resolve(__dirname, '../..')
    this.productBasePath = safeJoin(this.serverPath, 'Product')
  }

  /**
   * 全量同步 Product/ 目录到 SQLite
   * 使用 INSERT OR REPLACE，已有记录更新，新记录插入
   */
  syncAll() {
    console.log('🔄 开始同步产品目录到 SQLite...')

    // 确保数据库已初始化（ProductRepository 构造函数已触发 getDatabase()）

    // 确保 Product 目录存在
    if (!fs.existsSync(this.productBasePath)) {
      fs.mkdirSync(this.productBasePath, { recursive: true })
      console.log('✅ Product 目录已创建')
      return { added: 0, updated: 0, total: 0 }
    }

    const items = fs.readdirSync(this.productBasePath, { withFileTypes: true })
    const products = []
    const folderNames = []

    for (const item of items) {
      if (!item.isDirectory()) continue

      const folderName = item.name
      folderNames.push(folderName)

      const folderPath = path.join(this.productBasePath, folderName)
      const stats = fs.statSync(folderPath)
      const folderInfo = calculateFolderSize(folderPath)

      products.push(buildProductObject({
        name: folderName,
        folderName: folderName,
        id: null,  // 让 SQLite AUTOINCREMENT 处理
        totalSize: folderInfo.totalSize,
        fileCount: folderInfo.fileCount,
        modified: stats.mtime.toISOString()
      }))
    }

    // 先批量 upsert（已有更新，新的插入）
    productRepo.batchUpsert(products)

    // 再清理文件系统中已不存在的残留记录
    productRepo.deleteProductsNotIn(folderNames)

    const count = productRepo.getProductCount()
    console.log(`✅ 同步完成，共 ${products.length} 个产品（数据库共 ${count} 条）`)

    return {
      scanned: products.length,
      totalInDb: count
    }
  }

  /**
   * 同步单个产品（创建/更新后调用）
   */
  syncProduct(folderName) {
    const folderPath = path.join(this.productBasePath, folderName)

    if (!fs.existsSync(folderPath)) {
      console.warn(`⚠️ 产品文件夹不存在: ${folderName}`)
      return null
    }

    const stats = fs.statSync(folderPath)
    const folderInfo = calculateFolderSize(folderPath)

    const product = buildProductObject({
      name: folderName,
      folderName: folderName,
      id: null,
      totalSize: folderInfo.totalSize,
      fileCount: folderInfo.fileCount,
      modified: stats.mtime.toISOString()
    })

    productRepo.upsertProduct(product)
    console.log(`✅ 已同步产品: ${folderName}`)

    return productRepo.getProductByFolderName(folderName)
  }

  /**
   * 删除 SQLite 中的产品记录
   */
  removeProduct(folderName) {
    productRepo.deleteProduct(folderName)
    console.log(`✅ 已从 SQLite 删除产品: ${folderName}`)
  }

  /**
   * 重命名 SQLite 中的产品记录
   */
  renameProduct(oldName, newName) {
    productRepo.renameProduct(oldName, newName)
    console.log(`✅ 已在 SQLite 重命名产品: ${oldName} → ${newName}`)
  }
}

module.exports = new SyncService()
