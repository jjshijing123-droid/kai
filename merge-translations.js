const fs = require('fs');
const path = require('path');

// 读取所有翻译文件
const readTranslations = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`Reading translations from ${filePath}`);
  
  // 直接使用正则表达式匹配整个翻译对象，不依赖于变量名
  // 匹配 {
  //   "en": {
  //     ...
  //   },
  //   "zh-CN": {
  //     ...
  //   }
  // } 格式
  const translationRegex = /(\{\s*"en"\s*:\s*\{[\s\S]*?\}\s*,\s*"zh-CN"\s*:\s*\{[\s\S]*?\}\s*\})/;
  const match = content.match(translationRegex);
  
  if (match) {
    console.log('Found translations, parsing...');
    // 使用 eval 解析包含注释的 JavaScript 对象
    return eval(`(${match[1]})`);
  }
  
  throw new Error(`Could not find translations in ${filePath}`);
};

// 合并翻译
const mergeTranslations = () => {
  console.log('开始合并翻译文件...');
  
  // 读取所有翻译文件
  const baseTranslations = readTranslations(path.join(__dirname, 'src/i18n/translations.js'));
  const commonTranslations = readTranslations(path.join(__dirname, 'src/i18n/common/commonTranslations.js'));
  const componentTranslations = readTranslations(path.join(__dirname, 'src/i18n/components/componentTranslations.js'));
  
  // 合并所有翻译键
  const mergedTranslations = {
    "en": {
      ...baseTranslations.en,
      ...commonTranslations.en,
      ...componentTranslations.en
    },
    "zh-CN": {
      ...baseTranslations['zh-CN'],
      ...commonTranslations['zh-CN'],
      ...componentTranslations['zh-CN']
    }
  };
  
  console.log('合并完成，英文翻译键数量:', Object.keys(mergedTranslations.en).length);
  console.log('合并完成，中文翻译键数量:', Object.keys(mergedTranslations['zh-CN']).length);
  
  // 更新 translations.js 文件
  const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
  const content = fs.readFileSync(translationsPath, 'utf8');
  
  // 替换文件内容
  const newContent = content.replace(/const baseTranslations = (\{[\s\S]*?\});/, `const baseTranslations = ${JSON.stringify(mergedTranslations, null, 2)};`);
  
  fs.writeFileSync(translationsPath, newContent);
  console.log('translations.js 文件已更新');
  
  return mergedTranslations;
};

// 执行合并
mergeTranslations();
console.log('翻译文件合并完成！');