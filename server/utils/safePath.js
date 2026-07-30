const path = require('path');
const fs = require('fs');

/**
 * 安全的路径拼接工具，防止路径穿越攻击
 * 确保解析后的路径始终在 baseDir 目录下
 * 同时检测符号链接绕过
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

  // 检测符号链接绕过：验证真实路径仍在 baseDir 下
  try {
    const realPath = fs.realpathSync(resolvedPath);
    if (!realPath.startsWith(resolvedBase + path.sep) && realPath !== resolvedBase) {
      throw new Error(`符号链接检测: 真实路径 "${realPath}" 超出允许范围 "${resolvedBase}"`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // 路径不存在，检查父目录
      const parentDir = path.dirname(resolvedPath);
      if (parentDir !== resolvedBase) {
        try {
          const realParent = fs.realpathSync(parentDir);
          if (!realParent.startsWith(resolvedBase + path.sep)) {
            throw new Error(`符号链接检测: 父目录真实路径 "${realParent}" 超出允许范围`);
          }
        } catch (parentErr) {
          if (parentErr.code === 'ENOENT') {
            // 父目录也不存在，向上递归检查直到找到存在的祖先
            let ancestor = path.dirname(parentDir)
            while (ancestor !== resolvedBase && ancestor !== path.dirname(ancestor)) {
              try {
                const realAncestor = fs.realpathSync(ancestor)
                if (!realAncestor.startsWith(resolvedBase + path.sep)) {
                  throw new Error(`符号链接检测: 祖先路径 "${realAncestor}" 超出允许范围`)
                }
                break
              } catch (ancestorErr) {
                if (ancestorErr.code === 'ENOENT') {
                  ancestor = path.dirname(ancestor)
                  continue
                }
                throw ancestorErr
              }
            }
          } else if (!parentErr.message.includes('符号链接检测')) {
            // 忽略其他 realpath 错误（如 ELOOP）
          } else {
            throw parentErr
          }
        }
      }
    } else if (err.message.includes('符号链接检测')) {
      throw err;
    }
    // 其他 realpathSync 错误忽略，后续操作会自然失败
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
 * 保留相对目录结构，但拒绝任何路径穿越尝试
 * @param {string} entryPath - ZIP 中的条目路径
 * @returns {string} 清理后的相对路径
 */
function sanitizeZipEntry(entryPath) {
  // 统一分隔符为 /
  let normalized = entryPath.replace(/\\/g, '/')

  // 去掉前导 / 或 ./
  normalized = normalized.replace(/^\.\//, '').replace(/^\//, '')

  // 拒绝包含路径穿越段（如 ../）的条目
  const segments = normalized.split('/')
  if (segments.some(seg => seg === '..' || seg === '')) {
    throw new Error(`非法 ZIP 条目路径: ${entryPath}`)
  }

  // 拒绝包含 NUL 字节的条目
  if (normalized.includes('\x00')) {
    throw new Error(`非法 ZIP 条目路径: ${entryPath}`)
  }

  return normalized
}

module.exports = { safeJoin, isSafePath, sanitizeZipEntry };
