const path = require('path');
const fs = require('fs');

/**
 * 文件管理服务类 - 负责文件相关的业务逻辑
 */
class FileService {
  constructor() {
    this.serverPath = __dirname.replace(/server\/services$/, '');
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath) {
    if (!filePath) {
      throw new Error('文件路径不能为空');
    }
    
    console.log(`删除文件: ${filePath}`);
    
    // 构建完整的文件路径
    const fullPath = path.join(this.serverPath, filePath.startsWith('Product/') ? filePath : `Product/${filePath}`);
    console.log('文件完整路径:', fullPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      throw new Error('文件不存在');
    }
    
    // 删除文件
    fs.unlinkSync(fullPath);
    
    console.log(`文件删除成功: ${fullPath}`);
    
    return { success: true };
  }

  /**
   * 获取文件URL
   */
  getFileUrl(filePath, fileName) {
    return `/Product/${filePath}/${fileName}`;
  }

  /**
   * 检查文件是否存在
   */
  async checkFileExists(filePath) {
    const fullPath = path.join(this.serverPath, filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(this.serverPath, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      
      const stats = fs.statSync(fullPath);
      
      return {
        name: path.basename(filePath),
        size: stats.size,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      console.error('获取文件信息失败:', error);
      return null;
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 检查是否为图片文件
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
  }

  /**
   * 检查文件夹中是否有文件
   */
  async checkFolderHasFiles(folderPath) {
    try {
      const fullPath = path.join(this.serverPath, folderPath);
      
      if (!fs.existsSync(fullPath)) {
        return { hasFiles: false, message: '文件夹不存在' };
      }
      
      const stats = fs.statSync(fullPath);
      if (!stats.isDirectory()) {
        return { hasFiles: false, message: '不是目录' };
      }
      
      let fileCount = 0;
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isFile()) {
          fileCount++;
          break; // 找到至少一个文件就退出循环
        }
      }
      
      const hasFiles = fileCount > 0;
      
      return {
        hasFiles,
        fileCount,
        folderPath,
        message: hasFiles ? '文件夹中存在文件' : '文件夹中无文件'
      };
    } catch (error) {
      console.error('检测文件夹失败:', error);
      throw new Error(`检测文件夹失败: ${error.message}`);
    }
  }
}

module.exports = FileService;