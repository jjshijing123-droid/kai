const { getDatabase } = require('./index')

/**
 * 产品数据仓库 —— 封装所有 SQLite 操作
 *
 * 设计原则：
 * - 所有写操作在事务中完成
 * - views / additional_images 以 JSON 字符串存储，由调用方负责序列化/反序列化
 * - 方法返回普通 JS 对象，不暴露 SQLite 内部类型
 */

// 解析 JSON 字段的辅助函数
function parseJsonField(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// views 字段的默认值
const DEFAULT_VIEWS = {
  view1: '',
  view2: '',
  view3: '',
  view4: ''
}

// additional_images 字段的默认值
const DEFAULT_ADDITIONAL_IMAGES = {
  sixViews: '',
  other: ''
}

/**
 * 将数据库行转换为产品对象（解析 JSON 字段）
 */
function rowToProduct(row) {
  return {
    id: row.id,
    folderName: row.folder_name,
    name: row.name,
    category: row.category,
    description: row.description,
    path: row.path,
    folder: row.folder,
    totalSize: row.total_size,
    fileCount: row.file_count,
    modified: row.modified,
    isDirectory: Boolean(row.is_directory),
    mainImage: row.main_image,
    views: parseJsonField(row.views, DEFAULT_VIEWS),
    additionalImages: parseJsonField(row.additional_images, DEFAULT_ADDITIONAL_IMAGES),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * 将产品对象转换为插入参数（序列化 JSON 字段）
 */
function productToRow(product) {
  return {
    folder_name: product.folderName || product.name,
    name: product.name,
    category: product.category || 'general',
    description: product.description || '',
    path: product.path,
    folder: product.folder,
    total_size: product.totalSize || 0,
    file_count: product.fileCount || 0,
    modified: product.modified || new Date().toISOString(),
    is_directory: product.isDirectory ? 1 : 0,
    main_image: product.mainImage || '',
    views: JSON.stringify(product.views || DEFAULT_VIEWS),
    additional_images: JSON.stringify(product.additionalImages || DEFAULT_ADDITIONAL_IMAGES)
  }
}

class ProductRepository {
  constructor() {
    this.db = getDatabase()

    // 预编译高频查询语句
    this.stmts = {
      getAll: this.db.prepare('SELECT * FROM products ORDER BY id'),
      getById: this.db.prepare('SELECT * FROM products WHERE id = ?'),
      getByFolderName: this.db.prepare('SELECT * FROM products WHERE folder_name = ?'),
      getCount: this.db.prepare('SELECT COUNT(*) as cnt FROM products'),
      deleteByFolderName: this.db.prepare('DELETE FROM products WHERE folder_name = ?'),
      deleteAll: this.db.prepare('DELETE FROM products'),
      rename: this.db.prepare(`
        UPDATE products
        SET folder_name = @newFolderName,
            name = @newName,
            path = @newPath,
            folder = @newFolder,
            main_image = @newMainImage,
            views = @newViews,
            additional_images = @newAdditionalImages,
            updated_at = datetime('now', 'localtime')
        WHERE folder_name = @oldFolderName
      `)
    }

    // 带事务的批量 upsert
    this.bulkUpsert = this.db.transaction((products) => {
      const upsert = this.db.prepare(`
        INSERT INTO products (
          folder_name, name, category, description,
          path, folder, total_size, file_count, modified,
          is_directory, main_image, views, additional_images
        ) VALUES (
          @folder_name, @name, @category, @description,
          @path, @folder, @total_size, @file_count, @modified,
          @is_directory, @main_image, @views, @additional_images
        )
        ON CONFLICT(folder_name) DO UPDATE SET
          name = excluded.name,
          total_size = excluded.total_size,
          file_count = excluded.file_count,
          modified = excluded.modified,
          main_image = excluded.main_image,
          views = excluded.views,
          additional_images = excluded.additional_images,
          updated_at = datetime('now', 'localtime')
      `)

      for (const product of products) {
        const row = productToRow(product)
        upsert.run(row)
      }
    })
  }

  // ==================== 查询 ====================

  /**
   * 获取所有产品
   */
  getAllProducts() {
    const rows = this.stmts.getAll.all()
    return rows.map(rowToProduct)
  }

  /**
   * 按 ID 获取产品
   */
  getProductById(id) {
    const row = this.stmts.getById.get(id)
    return row ? rowToProduct(row) : null
  }

  /**
   * 按文件夹名获取产品
   */
  getProductByFolderName(folderName) {
    const row = this.stmts.getByFolderName.get(folderName)
    return row ? rowToProduct(row) : null
  }

  /**
   * 获取产品总数
   */
  getProductCount() {
    const row = this.stmts.getCount.get()
    return row.cnt
  }

  // ==================== 写入 ====================

  /**
   * 批量 upsert 产品列表（一个事务）
   * 适合启动时全量同步
   */
  batchUpsert(products) {
    this.bulkUpsert(products)
  }

  /**
   * 单条 upsert 产品
   * 适合运行时新增/更新单个产品
   */
  upsertProduct(product) {
    const row = productToRow(product)

    const upsert = this.db.prepare(`
      INSERT INTO products (
        folder_name, name, category, description,
        path, folder, total_size, file_count, modified,
        is_directory, main_image, views, additional_images
      ) VALUES (
        @folder_name, @name, @category, @description,
        @path, @folder, @total_size, @file_count, @modified,
        @is_directory, @main_image, @views, @additional_images
      )
      ON CONFLICT(folder_name) DO UPDATE SET
        name = excluded.name,
        total_size = excluded.total_size,
        file_count = excluded.file_count,
        modified = excluded.modified,
        main_image = excluded.main_image,
        views = excluded.views,
        additional_images = excluded.additional_images,
        updated_at = datetime('now', 'localtime')
    `)

    upsert.run(row)
  }

  /**
   * 删除产品
   */
  deleteProduct(folderName) {
    this.stmts.deleteByFolderName.run(folderName)
  }

  /**
   * 重命名产品
   */
  renameProduct(oldFolderName, newName) {
    const newFolderName = newName
    const newPath = `Product/${newFolderName}`
    const newFolder = `Product/${newFolderName}/`
    const newMainImage = `/Product/${newFolderName}/image_00.webp`
    const newViews = JSON.stringify({
      view1: `/Product/${newFolderName}/view1/`,
      view2: `/Product/${newFolderName}/view2/`,
      view3: `/Product/${newFolderName}/view3/`,
      view4: `/Product/${newFolderName}/view4/`
    })
    const newAdditionalImages = JSON.stringify({
      sixViews: `/Product/${newFolderName}/images_6Views/`,
      other: `/Product/${newFolderName}/images_other/`
    })

    this.stmts.rename.run({
      newFolderName,
      newName,
      newPath,
      newFolder,
      newMainImage,
      newViews,
      newAdditionalImages,
      oldFolderName
    })
  }

  /**
   * 清空所有产品（批量替换时用）
   */
  clearAllProducts() {
    this.stmts.deleteAll.run()
  }

  /**
   * 删除不在指定文件夹名列表中的产品记录
   * @param {string[]} existingFolderNames - 当前文件系统中存在的文件夹名
   */
  deleteProductsNotIn(existingFolderNames) {
    if (existingFolderNames.length === 0) {
      // 文件系统没有任何产品文件夹，清空全部
      this.stmts.deleteAll.run()
      return
    }
    const placeholders = existingFolderNames.map(() => '?').join(',')
    const stmt = this.db.prepare(
      `DELETE FROM products WHERE folder_name NOT IN (${placeholders})`
    )
    const result = stmt.run(...existingFolderNames)
    if (result.changes > 0) {
      console.log(`🧹 已清理 ${result.changes} 条残留记录（文件系统中不存在的产品）`)
    }
  }

  // ==================== 兼容层 ====================

  /**
   * 返回产品目录格式（兼容旧版 product-catalog.json 格式）
   * 供 productCatalogUtils 调用
   */
  getCatalogFormat() {
    const products = this.getAllProducts()
    return {
      products,
      totalProducts: products.length,
      lastUpdated: new Date().toISOString(),
      version: '2.0'
    }
  }

  /**
   * 批量导入目录格式的产品数据
   */
  importCatalog(catalogData) {
    if (!catalogData || !Array.isArray(catalogData.products)) {
      return
    }
    this.bulkUpsert(catalogData.products)
  }
}

// 导出单例
module.exports = new ProductRepository()
