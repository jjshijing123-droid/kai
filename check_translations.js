const fs = require('fs');
const path = require('path');

// 读取translations.js文件
const translationsPath = path.join(__dirname, 'src/i18n/translations.js');
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

// 提取所有翻译键
const translations = {};

// 解析baseTranslations对象
const baseTranslationsMatch = translationsContent.match(/const baseTranslations = (\{[\s\S]*?\});/);
if (baseTranslationsMatch) {
  const baseTranslations = JSON.parse(baseTranslationsMatch[1].replace(/\/\/.*$/gm, ''));
  
  // 合并所有语言的翻译键
  Object.keys(baseTranslations).forEach(lang => {
    translations[lang] = baseTranslations[lang];
  });
}

// 提取所有Vue组件文件
const componentsPath = path.join(__dirname, 'src/components');
const vueFiles = [];

function findVueFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      findVueFiles(filePath);
    } else if (file.endsWith('.vue')) {
      vueFiles.push(filePath);
    }
  }
}

findVueFiles(componentsPath);

// 提取所有翻译键
const allTranslationKeys = new Set();
const missingKeys = {};

// 正则表达式匹配翻译函数调用 t('key') 或 t("key")
const translationRegex = /t\(['"]([^'"]+)['"]/g;

// 遍历所有Vue文件
vueFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  
  while ((match = translationRegex.exec(content)) !== null) {
    const key = match[1];
    allTranslationKeys.add(key);
    
    // 检查每个语言是否有这个键
    Object.keys(translations).forEach(lang => {
      if (!translations[lang][key]) {
        if (!missingKeys[lang]) {
          missingKeys[lang] = [];
        }
        missingKeys[lang].push(key);
      }
    });
  }
});

// 输出结果
console.log('=== 翻译键检查结果 ===');
console.log(`总共找到 ${allTranslationKeys.size} 个翻译键`);
console.log();

// 检查缺失的翻译键
let hasMissingKeys = false;
Object.keys(missingKeys).forEach(lang => {
  if (missingKeys[lang].length > 0) {
    hasMissingKeys = true;
    console.log(`${lang} 语言缺失 ${missingKeys[lang].length} 个翻译键：`);
    console.log(missingKeys[lang].join(', '));
    console.log();
  }
});

if (!hasMissingKeys) {
  console.log('所有翻译键都已在translations.js中定义！');
}

// 保存结果到文件
const result = {
  totalKeys: allTranslationKeys.size,
  missingKeys: missingKeys
};

fs.writeFileSync('translation_check_result.json', JSON.stringify(result, null, 2), 'utf8');
console.log('结果已保存到 translation_check_result.json');
