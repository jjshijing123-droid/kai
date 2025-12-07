const fs = require('fs');
const path = require('path');

// 遍历目录中的所有文件
const walkSync = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkSync(filePath, fileList);
    } else {
      // 只处理特定类型的文件
      if (['.vue', '.js', '.jsx', '.ts', '.tsx'].some(ext => file.endsWith(ext))) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
};

// 搜索所有使用翻译键的地方
const findUsedKeys = () => {
  const usedKeys = new Set();
  const srcDir = path.join(__dirname, 'src');
  const files = walkSync(srcDir);
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 匹配 t('key') 格式
      const tRegex = /t\('([\w_]+)'\)/g;
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
      
      // 匹配 $t('key') 格式
      const $tRegex = /\$t\('([\w_]+)'\)/g;
      while ((match = $tRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
      
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  });
  
  return Array.from(usedKeys);
};
// 导出函数
exports.findUsedKeys = findUsedKeys;

// 如果直接运行，则执行主函数
if (require.main === module) {
  const usedKeys = findUsedKeys();
  console.log('Used translation keys:', usedKeys);
  console.log('Total used keys:', usedKeys.length);

  // 保存到文件
  fs.writeFileSync('used-translation-keys.txt', usedKeys.join('\n'));
  console.log('Used keys saved to used-translation-keys.txt');
}