// HSL 到 HEX 转换脚本

const fs = require('fs');
const path = require('path');

// HSL 到 RGB 转换函数
function hslToRgb(h, s, l) {
  h = h % 360;
  if (h < 0) h += 360;
  
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

// RGB 到 HEX 转换函数
function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// HSL 参数到 HEX 转换函数
function hslParamsToHex(hslParams) {
  // 解析 HSL 值
  const [h, s, l] = hslParams.split(/\s+/).map(val => {
    if (val.includes('%')) {
      return parseFloat(val);
    }
    return parseFloat(val);
  });
  
  // 转换为 RGB
  const { r, g, b } = hslToRgb(h, s, l);
  
  // 转换为 HEX
  return rgbToHex(r, g, b);
}

// HSL 字符串到 HEX 转换函数
function hslStringToHex(hslStr) {
  let convertedStr = hslStr;
  
  // 1. 处理完整的 hsl(...) 函数调用
  const hslRegex = /hsl\(([^)]+)\)/g;
  convertedStr = convertedStr.replace(hslRegex, (match, hslParams) => {
    // 检查是否是 CSS 变量引用，如果是则保持不变
    if (hslParams.includes('var(--')) {
      return match;
    }
    
    return hslParamsToHex(hslParams);
  });
  
  // 2. 处理单独的 HSL 参数字符串，如 '222.2 84% 4.9%'
  const hslParamRegex = /'(\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%)'/g;
  convertedStr = convertedStr.replace(hslParamRegex, (match, hslParams) => {
    return `'${hslParamsToHex(hslParams)}'`;
  });
  
  // 3. 处理 CSS 变量中的 HSL 参数，如 --background: 0 0% 100%;
  const cssVarHslRegex = /(--[\w-]+):\s*(\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%)\s*;/g;
  convertedStr = convertedStr.replace(cssVarHslRegex, (match, varName, hslParams) => {
    return `${varName}: ${hslParamsToHex(hslParams)};`;
  });
  
  return convertedStr;
}

// 转换文件中的 HSL 颜色
function convertFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const convertedContent = hslStringToHex(content);
    
    // 写入转换后的内容
    fs.writeFileSync(filePath, convertedContent, 'utf8');
    console.log(`✓ Converted ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// 转换指定的文件
const filesToConvert = [
  path.join(__dirname, 'src/theme/index.js'),
  path.join(__dirname, 'src/styles/globals.css')
];

filesToConvert.forEach(file => {
  convertFile(file);
});

console.log('\nConversion completed!');