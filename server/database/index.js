const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '../../data/products.db')

let db = null
let schemaInitialized = false

/**
 * 获取数据库实例（单例模式）
 * 首次调用时自动创建 data/ 目录，避免全新环境报
 * “Cannot open database because the directory does not exist”
 */
function getDatabase() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    // WAL 模式：提升并发读性能，写操作不阻塞读
    db.pragma('journal_mode = WAL')
    // 启用外键约束
    db.pragma('foreign_keys = ON')
    // 繁忙等待超时 5 秒
    db.pragma('busy_timeout = 5000')
  }
  return db
}

/**
 * 初始化数据库表结构和索引（幂等，可重复调用）
 * 注意：ProductRepository 在模块加载时就会预编译语句，
 * 因此必须在任何 prepare() 之前完成建表。
 */
function initDatabase() {
  if (schemaInitialized) {
    return getDatabase()
  }

  const database = getDatabase()

  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_name         TEXT    NOT NULL UNIQUE,
      name                TEXT    NOT NULL,
      category            TEXT    DEFAULT 'general',
      description         TEXT    DEFAULT '',
      path                TEXT    NOT NULL,
      folder              TEXT    NOT NULL,
      total_size          INTEGER DEFAULT 0,
      file_count          INTEGER DEFAULT 0,
      modified            TEXT,
      is_directory        INTEGER DEFAULT 1,
      main_image          TEXT,
      views               TEXT    DEFAULT '{}',
      additional_images   TEXT    DEFAULT '{}',
      created_at          TEXT    DEFAULT (datetime('now', 'localtime')),
      updated_at          TEXT    DEFAULT (datetime('now', 'localtime'))
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_folder_name ON products(folder_name)
  `)

  // 翻译表
  database.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      lang TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      PRIMARY KEY (lang, key)
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_translations_lang ON translations(lang)
  `)

  // 管理员用户表
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT    NOT NULL UNIQUE,
      password_hash TEXT   NOT NULL,
      role         TEXT    DEFAULT 'admin',
      display_name TEXT    DEFAULT '',
      is_active    INTEGER DEFAULT 1,
      created_at   TEXT    DEFAULT (datetime('now', 'localtime')),
      updated_at   TEXT    DEFAULT (datetime('now', 'localtime'))
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
  `)

  schemaInitialized = true
  console.log('✅ SQLite 数据库初始化完成')
  return database
}

/**
 * 关闭数据库连接
 */
function closeDatabase() {
  if (db) {
    db.close()
    db = null
    schemaInitialized = false
  }
}

module.exports = { getDatabase, initDatabase, closeDatabase }
