/**
 * 翻译数据 Repository — 封装 translations 表的 SQLite 操作
 *
 * 表结构：
 *   translations(lang, key, value, created_at, updated_at)
 *   PRIMARY KEY: (lang, key)
 */

const path = require('path')
const { getDatabase } = require('./index')

/**
 * 获取所有翻译（按语言组织）
 * 返回: { "en": { key: value, ... }, "zh-CN": { ... } }
 */
function getAllTranslations() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT lang, key, value FROM translations ORDER BY lang, key')
  const rows = stmt.all()

  const result = {}
  for (const row of rows) {
    if (!result[row.lang]) {
      result[row.lang] = {}
    }
    result[row.lang][row.key] = row.value
  }
  return result
}

/**
 * 获取指定语言的翻译
 * @param {string} lang - 语言代码
 * @returns {object} { key: value, ... }
 */
function getTranslationsByLang(lang) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT key, value FROM translations WHERE lang = ? ORDER BY key')
  const rows = stmt.all()

  const result = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

/**
 * 获取单个翻译值
 * @param {string} lang - 语言代码
 * @param {string} key - 翻译键
 * @returns {string|null}
 */
function getTranslation(lang, key) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT value FROM translations WHERE lang = ? AND key = ?')
  const row = stmt.get(lang, key)
  return row ? row.value : null
}

/**
 * 批量替换所有翻译（清空后重新插入）
 * @param {object} translationsObj - { "en": {...}, "zh-CN": {...} }
 */
function replaceAll(translationsObj) {
  const db = getDatabase()
  const insertStmt = db.prepare(
    "INSERT OR REPLACE INTO translations (lang, key, value, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))"
  )
  const clearStmt = db.prepare('DELETE FROM translations')

  const tx = db.transaction(() => {
    clearStmt.run()
    for (const lang of Object.keys(translationsObj)) {
      for (const key of Object.keys(translationsObj[lang])) {
        insertStmt.run(lang, key, translationsObj[lang][key])
      }
    }
  })
  tx()
}

/**
 * 插入或更新单个翻译
 * @param {string} lang - 语言代码
 * @param {string} key - 翻译键
 * @param {string} value - 翻译值
 */
function upsertTranslation(lang, key, value) {
  const db = getDatabase()
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO translations (lang, key, value, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))"
  )
  stmt.run(lang, key, value)
}

/**
 * 批量 upsert（用于添加翻译键）
 * @param {string} lang - 语言代码
 * @param {object} keyValues - { key: value, ... }
 */
function upsertBatch(lang, keyValues) {
  const db = getDatabase()
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO translations (lang, key, value, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))"
  )
  const tx = db.transaction(() => {
    for (const key of Object.keys(keyValues)) {
      stmt.run(lang, key, keyValues[key])
    }
  })
  tx()
}

/**
 * 删除指定键（跨所有语言）
 * @param {string} key - 翻译键
 * @returns {number} 删除行数
 */
function deleteKey(key) {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM translations WHERE key = ?')
  const result = stmt.run(key)
  return result.changes
}

/**
 * 获取所有翻译键（去重）
 * @returns {string[]} 排序后的键列表
 */
function getAllKeys() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT DISTINCT key FROM translations ORDER BY key')
  const rows = stmt.all()
  return rows.map(r => r.key)
}

/**
 * 获取所有支持的语言代码
 * @returns {string[]}
 */
function getAllLangs() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT DISTINCT lang FROM translations ORDER BY lang')
  const rows = stmt.all()
  return rows.map(r => r.lang)
}

/**
 * 获取翻译总数
 * @returns {number}
 */
function getTranslationCount() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM translations')
  const row = stmt.get()
  return row.count
}

/**
 * 检查翻译是否存在于数据库
 * @param {string} lang - 语言代码
 * @returns {boolean}
 */
function hasTranslations(lang) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM translations WHERE lang = ?')
  const row = stmt.get(lang)
  return row.count > 0
}

/**
 * 从种子文件增量播种缺失的翻译键
 * 读取 translations.js 中的 baseTranslations，只插入数据库中不存在的键
 * 已有的翻译（包括用户手动修改的）不会被覆盖
 * @returns {{ inserted: number, skipped: number }}
 */
async function seedMissingFromFile() {
  try {
    const translationsModule = await import(path.join(__dirname, '..', '..', 'src', 'i18n', 'translations.js'))
    const seedData = translationsModule.baseTranslations

    if (!seedData || !seedData.en) {
      return { inserted: 0, skipped: 0 }
    }

    const db = getDatabase()
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO translations (lang, key, value, updated_at) VALUES (?, ?, ?, datetime('now', 'localtime'))"
    )
    const tx = db.transaction(() => {
      let inserted = 0
      let skipped = 0
      for (const lang of Object.keys(seedData)) {
        for (const key of Object.keys(seedData[lang])) {
          const result = insertStmt.run(lang, key, seedData[lang][key])
          if (result.changes > 0) {
            inserted++
          } else {
            skipped++
          }
        }
      }
      return { inserted, skipped }
    })

    const result = tx()
    if (result.inserted > 0) {
      console.log(`📥 增量播种完成：新增 ${result.inserted} 条，跳过 ${result.skipped} 条（已存在）`)
    }
    return result
  } catch (error) {
    console.error('增量播种翻译数据失败:', error)
    return { inserted: 0, skipped: 0 }
  }
}

module.exports = {
  getAllTranslations,
  getTranslationsByLang,
  getTranslation,
  replaceAll,
  upsertTranslation,
  upsertBatch,
  deleteKey,
  getAllKeys,
  getAllLangs,
  getTranslationCount,
  hasTranslations,
  seedMissingFromFile
}
