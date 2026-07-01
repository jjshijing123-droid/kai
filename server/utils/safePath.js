const path = require('path');

/**
 * 安全的路径拼接工具，防止路径穿越攻击
 * 确保解析后的路径始终在 baseDir 目录下
 *
 * @param {string} baseDir - 基础目录（绝对路径）
 * @param {...string} segments - 路径片段
 * @returns {string} 安全的绝对路径
 * @throws {Error} 如果路径试图穿越到 baseDir 之外
 */
function safeJoin(baseDir, ...segments) {
  // 确保 baseDir 是绝对路径
  const resolvedBase = path.resolve(baseDir);

  // 拼接并解析完整路径
  const joinedPath = path.join(resolvedBase, ...segments);
  const resolvedPath = path.resolve(joinedPath);

  // 检查解析后的路径是否在 baseDir 下
  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    throw new Error(`路径穿越检测: 试图访问 "${resolvedPath}" 超出允许范围 "${resolvedBase}"`);
  }

  return resolvedPath;
}

/**
 * 验证路径是否为允许的产品目录路径
 * @param {string} filePath - 文件路径
 * @param {string} baseDir - 基础目录
 * @returns {boolean}
 */
function isSafePath(filePath, baseDir) {
  try {
    safeJoin(baseDir, filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理 ZIP 解压路径中的路径穿越字符
 * 只保留文件名，去掉任何目录遍历前缀
 * @param {string} entryPath - ZIP 中的条目路径
 * @returns {string} 清理后的文件名
 */
function sanitizeZipEntry(entryPath) {
  const normalized = entryPath.replace(/\\/g, '/');
  const basename = path.basename(normalized);
  if (basename.includes('..') || basename.includes('\x00')) {
    throw new Error(`非法 ZIP 条目路径: ${entryPath}`);
  }
  return basename;
}

module.exports = { safeJoin, isSafePath, sanitizeZipEntry };
