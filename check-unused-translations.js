const fs = require('fs');
const path = require('path');

// 读取翻译文件并提取所有键
const extractAllTranslationKeys = () => {
  const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
  const content = fs.readFileSync(translationsPath, 'utf8');
  const allKeys = new Set();
  
  // 直接匹配文件中的所有 "key": "value" 格式
  const keyRegex = /"(\w+_\w+)":\s*"[^"]*"/g;
  let match;
  
  while ((match = keyRegex.exec(content)) !== null) {
    allKeys.add(match[1]);
  }
  
  return Array.from(allKeys);
};

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
      
      // 匹配 t("key") 格式
      const tDoubleQuoteRegex = /t\("([\w_]+)"\)/g;
      while ((match = tDoubleQuoteRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
      
      // 匹配 $t("key") 格式
      const $tDoubleQuoteRegex = /\$t\("([\w_]+)"\)/g;
      while ((match = $tDoubleQuoteRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
      
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  });
  
  return Array.from(usedKeys);
};

// 主函数
const main = () => {
  console.log('Checking unused translation keys...');
  
  // 提取所有翻译键
  const allKeys = extractAllTranslationKeys();
  console.log('Total translation keys:', allKeys.length);
  
  // 搜索使用的翻译键
  const usedKeys = findUsedKeys();
  console.log('Used translation keys:', usedKeys.length);
  
  // 找出未使用的键
  const usedKeysSet = new Set(usedKeys);
  const unusedKeys = allKeys.filter(key => !usedKeysSet.has(key));
  
  console.log('\nUnused translation keys:');
  console.log('Count:', unusedKeys.length);
  console.log('Keys:', unusedKeys);
  
  // 保存结果到文件
  fs.writeFileSync('unused-translation-keys.txt', unusedKeys.join('\n'));
  console.log('\nUnused keys saved to unused-translation-keys.txt');
  
  return unusedKeys;
};

// 执行主函数
main();