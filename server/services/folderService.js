const path = require('path');
const fs = require('fs');
const FileService = require('./fileService');

/**
 * 文件夹管理服务类 - 负责文件夹相关的业务逻辑
 */
class FolderService {
  constructor() {
    this.serverPath = __dirname.replace(/server\/services$/, '');
    this.fileService = new FileService();
  }

  /**
   * 获取文件夹详情
   */
  async getFolderDetails(folderPath) {
    try {
      console.log(`获取文件夹详情: ${folderPath}`);
      
      // 构建完整的文件夹路径
      const fullPath = path.join(this.serverPath, folderPath.startsWith('Product/') ? folderPath : `Product/${folderPath}`);
      console.log('完整路径:', fullPath);
      
      // 检查文件夹是否存在
      if (!fs.existsSync(fullPath)) {
        throw new Error('文件夹不存在');
      }
      
      // 读取文件夹内容
      const folders = {};
      const files = [];
      
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const subFolderPath = path.join(fullPath, item.name);
          const subItems = fs.readdirSync(subFolderPath, { withFileTypes: true });
          
          folders[item.name] = {
            path: path.join(folderPath, item.name),
            fileCount: subItems.filter(subItem => subItem.isFile()).length,
            totalSize: 0 // 简化实现
          };
        } else if (item.isFile()) {
          const filePath = path.join(fullPath, item.name);
          const stats = fs.statSync(filePath);
          
          files.push({
            name: item.name,
            size: stats.size,
            modified: stats.mtime,
            path: path.join(folderPath, item.name)
          });
        }
      }
      
      return {
        name: path.basename(fullPath),
        path: folderPath,
        folders,
        files
      };
    } catch (error) {
      console.error('获取文件夹详情失败:', error);
      throw new Error(`获取文件夹详情失败: ${error.message}`);
    }
  }

  /**
   * 创建子文件夹
   */
  async createSubfolder(parentPath, folderName) {
    try {
      const fullPath = path.join(this.serverPath, parentPath, folderName);
      
      // 检查父文件夹是否存在
      if (!fs.existsSync(fullPath.replace(new RegExp(`/[^/]+$`), ''))) {
        throw new Error('父文件夹不存在');
      }
      
      // 创建子文件夹
      fs.mkdirSync(fullPath, { recursive: true });
      
      return {
        name: folderName,
        path: path.join(parentPath, folderName),
        created: true
      };
    } catch (error) {
      console.error('创建子文件夹失败:', error);
      throw new Error(`创建子文件夹失败: ${error.message}`);
    }
  }

  /**
   * 删除子文件夹
   */
  async deleteSubfolder(parentPath, folderName) {
    try {
      const fullPath = path.join(this.serverPath, parentPath, folderName);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error('文件夹不存在');
      }
      
      // 递归删除文件夹及其所有内容
      fs.rmSync(fullPath, { recursive: true, force: true });
      
      return {
        name: folderName,
        path: path.join(parentPath, folderName),
        deleted: true
      };
    } catch (error) {
      console.error('删除子文件夹失败:', error);
      throw new Error(`删除子文件夹失败: ${error.message}`);
    }
  }

  /**
   * 重命名子文件夹
   */
  async renameSubfolder(parentPath, oldName, newName) {
    try {
      const oldPath = path.join(this.serverPath, parentPath, oldName);
      const newPath = path.join(this.serverPath, parentPath, newName);
      
      if (!fs.existsSync(oldPath)) {
        throw new Error('原文件夹不存在');
      }
      
      if (fs.existsSync(newPath)) {
        throw new Error('新文件夹名称已存在');
      }
      
      fs.renameSync(oldPath, newPath);
      
      return {
        oldName,
        newName,
        oldPath: path.join(parentPath, oldName),
        newPath: path.join(parentPath, newName),
        renamed: true
      };
    } catch (error) {
      console.error('重命名子文件夹失败:', error);
      throw new Error(`重命名子文件夹失败: ${error.message}`);
    }
  }

  /**
   * 获取文件夹树结构
   */
  async getFolderTree(folderPath, maxDepth = 3, currentDepth = 0) {
    try {
      if (currentDepth >= maxDepth) {
        return null;
      }
      
      const fullPath = path.join(this.serverPath, folderPath);
      
      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        return null;
      }
      
      const tree = {
        name: path.basename(fullPath),
        path: folderPath,
        type: 'directory',
        children: []
      };
      
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item.name);
        
        if (item.isDirectory()) {
          const subTree = await this.getFolderTree(itemPath, maxDepth, currentDepth + 1);
          if (subTree) {
            tree.children.push(subTree);
          }
        } else if (item.isFile()) {
          const stats = fs.statSync(path.join(fullPath, item.name));
          tree.children.push({
            name: item.name,
            path: itemPath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
      
      return tree;
    } catch (error) {
      console.error('获取文件夹树失败:', error);
      return null;
    }
  }

  /**
   * 搜索文件夹中的文件
   */
  async searchFiles(folderPath, searchTerm, fileTypes = null) {
    try {
      const fullPath = path.join(this.serverPath, folderPath);
      const results = [];
      
      if (!fs.existsSync(fullPath)) {
        return results;
      }
      
      const searchRecursive = (currentPath, currentRelativePath) => {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemFullPath = path.join(currentPath, item.name);
          const itemRelativePath = path.join(currentRelativePath, item.name);
          
          if (item.isDirectory()) {
            searchRecursive(itemFullPath, itemRelativePath);
          } else if (item.isFile()) {
            // 检查文件名是否匹配搜索词
            if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
              // 如果指定了文件类型，检查是否匹配
              if (fileTypes) {
                const ext = path.extname(item.name).toLowerCase();
                if (!fileTypes.includes(ext)) {
                  continue;
                }
              }
              
              const stats = fs.statSync(itemFullPath);
              results.push({
                name: item.name,
                path: itemRelativePath,
                size: stats.size,
                modified: stats.mtime,
                type: 'file'
              });
            }
          }
        }
      };
      
      searchRecursive(fullPath, folderPath);
      return results;
    } catch (error) {
      console.error('搜索文件失败:', error);
      return [];
    }
  }
}

module.exports = FolderService;