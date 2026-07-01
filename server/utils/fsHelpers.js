const path = require('path')
const fs = require('fs')

/**
 * 共享文件系统工具函数
 */

/**
 * 递归计算文件夹大小和文件数量
 */
function calculateFolderSize(dirPath) {
  let totalSize = 0
  let fileCount = 0

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name)

      if (item.isDirectory()) {
        const subResult = calculateFolderSize(itemPath)
        totalSize += subResult.totalSize
        fileCount += subResult.fileCount
      } else if (item.isFile()) {
        const stats = fs.statSync(itemPath)
        totalSize += stats.size
        fileCount += 1
      }
    }
  } catch (error) {
    console.error(`计算文件夹大小失败: ${dirPath}`, error)
  }

  return { totalSize, fileCount }
}

module.exports = { calculateFolderSize }
