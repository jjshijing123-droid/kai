const fs = require('fs');
const path = require('path');

// 读取未使用的翻译键
const readUnusedKeys = () => {
  const unusedKeysPath = path.join(__dirname, 'unused-translation-keys.txt');
  const content = fs.readFileSync(unusedKeysPath, 'utf8');
  return content.trim().split('\n');
};

// 移除未使用的翻译键
const removeUnusedTranslations = () => {
  const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
  const content = fs.readFileSync(translationsPath, 'utf8');
  
  // 读取使用的键
  const usedKeys = require('./find-used-keys').findUsedKeys();
  const usedKeysSet = new Set(usedKeys);
  
  console.log('Removing unused translation keys...');
  console.log('Total used keys:', usedKeys.length);
  
  // 创建一个简化的翻译文件内容，只包含使用的键
  let newContent = '// 基础翻译配置 - 按组件组织翻译键\nconst baseTranslations = {\n';
  
  // 先处理英文
  newContent += '  "en": {\n';
  
  // 从原始文件中提取英文翻译键
  const enMatch = content.match(/"en":\s*\{([\s\S]*?)\}/);
  if (enMatch) {
    const enContent = enMatch[1];
    const enKeyRegex = /"(\w+_\w+)":\s*"([^"]*)"/g;
    let match;
    
    while ((match = enKeyRegex.exec(enContent)) !== null) {
      const key = match[1];
      const value = match[2];
      if (usedKeysSet.has(key)) {
        newContent += `    "${key}": "${value}",\n`;
      }
    }
  }
  
  newContent = newContent.replace(/,\n$/, '\n'); // 移除最后一个逗号
  newContent += '  },\n';
  
  // 处理中文
  newContent += '  "zh-CN": {\n';
  
  // 从原始文件中提取中文翻译键
  const zhMatch = content.match(/"zh-CN":\s*\{([\s\S]*?)\}/);
  if (zhMatch) {
    const zhContent = zhMatch[1];
    const zhKeyRegex = /"(\w+_\w+)":\s*"([^"]*)"/g;
    let match;
    
    while ((match = zhKeyRegex.exec(zhContent)) !== null) {
      const key = match[1];
      const value = match[2];
      if (usedKeysSet.has(key)) {
        newContent += `    "${key}": "${value}",\n`;
      }
    }
  }
  
  newContent = newContent.replace(/,\n$/, '\n'); // 移除最后一个逗号
  newContent += '  }\n';
  newContent += '};\n';
  
  // 添加剩余的文件内容
  const restMatch = content.match(/\};([\s\S]*)$/);
  if (restMatch) {
    newContent += restMatch[1];
  }
  
  // 保存修改后的文件
  fs.writeFileSync(translationsPath, newContent);
  console.log('Unused translation keys removed successfully');
  
  // 验证修改结果
  const updatedContent = fs.readFileSync(translationsPath, 'utf8');
  
  // 统计剩余的键
  const remainingKeys = [];
  const allKeysRegex = /"(\w+_\w+)":\s*"[^"]*"/g;
  let match;
  while ((match = allKeysRegex.exec(updatedContent)) !== null) {
    remainingKeys.push(match[1]);
  }
  
  console.log('Remaining keys:', remainingKeys.length);
};

// 执行移除操作
removeUnusedTranslations();