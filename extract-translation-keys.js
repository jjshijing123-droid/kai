const fs = require('fs');
const path = require('path');

// 读取翻译文件
const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
const content = fs.readFileSync(translationsPath, 'utf8');

// 提取翻译键
const extractKeys = (content) => {
  // 提取 en 语言的翻译键
  const enMatch = content.match(/"en":\s*\{([\s\S]*?)\}/);
  if (!enMatch) {
    console.error('Could not find en translations');
    return [];
  }
  
  const enContent = enMatch[1];
  const keys = [];
  
  // 匹配所有 "key": "value" 格式
  const keyRegex = /"(\w+_\w+)":\s*"[^"]*"/g;
  let match;
  
  while ((match = keyRegex.exec(enContent)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
};

const allKeys = extractKeys(content);
console.log('All translation keys:', allKeys);
console.log('Total keys:', allKeys.length);

// 保存到文件
fs.writeFileSync('all-translation-keys.txt', allKeys.join('\n'));
console.log('Keys saved to all-translation-keys.txt');