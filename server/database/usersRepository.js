const bcrypt = require('bcrypt')
const { getDatabase } = require('./index')

const SALT_ROUNDS = 10

/**
 * 用户数据仓库 — 封装 users 表的 SQLite 操作
 *
 * 表结构：
 *   users(id, username, password_hash, role, display_name, is_active, created_at, updated_at)
 */

/**
 * 创建用户（密码自动哈希）
 */
function createUser(username, password, role = 'admin', displayName = '') {
  const db = getDatabase()
  const hash = bcrypt.hashSync(password, SALT_ROUNDS)
  const stmt = db.prepare(
    `INSERT INTO users (username, password_hash, role, display_name)
     VALUES (?, ?, ?, ?)`
  )
  const result = stmt.run(username, hash, role, displayName)
  return { id: result.lastInsertRowid, username, role, display_name: displayName }
}

/**
 * 根据用户名获取用户（不含密码哈希）
 */
function getUserByUsername(username) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, username, role, display_name, is_active, created_at, updated_at FROM users WHERE username = ?')
  const row = stmt.get(username)
  return row || null
}

/**
 * 获取所有用户（不含密码哈希）
 */
function getAllUsers() {
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, username, role, display_name, is_active, created_at, updated_at FROM users ORDER BY id')
  return stmt.all()
}

/**
 * 验证用户名和密码
 * @returns {Object|null} 验证成功返回用户信息，失败返回 null
 */
function verifyPassword(username, password) {
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, username, password_hash, role, display_name, is_active FROM users WHERE username = ?')
  const row = stmt.get(username)

  if (!row) return null
  if (!row.is_active) return null

  if (bcrypt.compareSync(password, row.password_hash)) {
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      display_name: row.display_name
    }
  }
  return null
}

/**
 * 修改密码
 */
function updatePassword(username, newPassword) {
  const db = getDatabase()
  const hash = bcrypt.hashSync(newPassword, SALT_ROUNDS)
  const stmt = db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE username = ?"
  )
  const result = stmt.run(hash, username)
  return result.changes > 0
}

/**
 * 更新用户信息（不含密码）
 */
function updateUser(username, updates) {
  const db = getDatabase()
  const allowed = ['role', 'display_name', 'is_active']
  const sets = []
  const values = []

  for (const key of allowed) {
    if (key in updates) {
      sets.push(`${key} = ?`)
      values.push(updates[key])
    }
  }

  if (sets.length === 0) return false

  sets.push("updated_at = datetime('now', 'localtime')")
  values.push(username)

  const stmt = db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE username = ?`)
  const result = stmt.run(...values)
  return result.changes > 0
}

/**
 * 删除用户
 */
function deleteUser(username) {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM users WHERE username = ?')
  const result = stmt.run(username)
  return result.changes > 0
}

/**
 * 获取用户总数
 */
function getUserCount() {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users').get()
  return row.cnt
}

/**
 * 检查指定用户名是否存在
 */
function userExists(username) {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE username = ?').get(username)
  return row.cnt > 0
}

/**
 * 初始化默认管理员账户（如果不存在）
 * 从环境变量读取初始凭据，仅当用户表为空时生效
 */
function seedDefaultAdmin() {
  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS

  // 环境变量未设置时，不创建默认管理员
  if (!adminUser || !adminPass) {
    console.log('ℹ️ ADMIN_USER/ADMIN_PASS 未设置，跳过默认管理员创建（可通过 API 自行创建）')
    return null
  }

  if (userExists(adminUser)) {
    console.log(`ℹ️ 管理员用户 "${adminUser}" 已存在，跳过创建`)
    return null
  }

  const user = createUser(adminUser, adminPass, 'admin', 'Administrator')
  console.log(`✅ 默认管理员已创建: ${adminUser}（凭据来自 .env）`)
  return user
}

module.exports = {
  createUser,
  getUserByUsername,
  getAllUsers,
  verifyPassword,
  updatePassword,
  updateUser,
  deleteUser,
  getUserCount,
  userExists,
  seedDefaultAdmin
}
