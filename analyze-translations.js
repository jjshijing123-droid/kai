// 翻译数据统计脚本
const fs = require('fs');

// 读取翻译文件
const content = fs.readFileSync('src/i18n/translations.js', 'utf8');

console.log('开始分析翻译数据...\n');

// 提取英语翻译
const enStart = content.indexOf('"en": {');
const enEnd = content.indexOf('  },', enStart);
const enSection = content.substring(enStart, enEnd);

console.log('英语翻译部分长度:', enSection.length);

// 统计英语翻译键数量
const enKeys = [];
const enRegex = /"([a-zA-Z0-9_]+)":\s*"[^"]*"/g;
let match;
while ((match = enRegex.exec(enSection)) !== null) {
  enKeys.push(match[1]);
}

console.log('英语翻译键总数:', enKeys.length);

// 提取中文翻译
const zhStart = content.indexOf('"zh-CN": {');
const zhEnd = content.indexOf('  }\n', zhStart);
const zhSection = content.substring(zhStart, zhEnd);

console.log('中文翻译部分长度:', zhSection.length);

// 统计中文翻译键数量
const zhKeys = [];
const zhRegex = /"([a-zA-Z0-9_]+)":\s*"[^"]*"/g;
let zhMatch;
while ((zhMatch = zhRegex.exec(zhSection)) !== null) {
  zhKeys.push(zhMatch[1]);
}

console.log('中文翻译键总数:', zhKeys.length);

// 找出缺失的翻译键
const missingKeys = enKeys.filter(key => !zhKeys.includes(key));
const extraKeys = zhKeys.filter(key => !enKeys.includes(key));

console.log('\n=== 翻译完整性分析 ===');
console.log('英语翻译键总数:', enKeys.length);
console.log('中文翻译键总数:', zhKeys.length);
console.log('缺失的中文翻译键数量:', missingKeys.length);
console.log('多余的中文翻译键数量:', extraKeys.length);

if (missingKeys.length > 0) {
  console.log('\n缺失的中文翻译键:');
  missingKeys.forEach((key, index) => {
    console.log(`${index + 1}. ${key}`);
  });
}

// 计算完整性百分比
const completenessPercentage = Math.round((zhKeys.length / enKeys.length) * 100);
console.log(`\n翻译完整性: ${completenessPercentage}% (${zhKeys.length}/${enKeys.length})`);

if (completenessPercentage !== 100) {
  console.log(`问题：翻译完整性为 ${completenessPercentage}%，应该是100%`);
}