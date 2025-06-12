'use strict'

const fs = require('fs')
const path = require('path')
const mimeType = require('mime-types')
const sizeOf = require('image-size')
const { toFixed } = require('./index')

const themePath = path.resolve(__dirname, '../assets/theme')
const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

const themeList = {}

fs.readdirSync(themePath).forEach(theme => {
  const currentThemePath = path.resolve(themePath, theme)
  // skip non-directory
  if (!fs.statSync(currentThemePath).isDirectory()) return

  if (!(theme in themeList)) themeList[theme] = {}
  const imgList = fs.readdirSync(currentThemePath)
  imgList.forEach(img => {
    // skip non-image files
    if (!imgExts.includes(path.extname(img).toLowerCase())) return

    const imgPath = path.resolve(currentThemePath, img)
    const char = path.parse(img).name
    const { width, height } = sizeOf(imgPath)

    themeList[theme][char] = {
      width,
      height,
      data: convertToDatauri(imgPath)
    }
  })
})

function convertToDatauri(path) {
  const mime = mimeType.lookup(path)
  const base64 = fs.readFileSync(path).toString('base64')

  return `data:${mime};base64,${base64}`
}


const { SVG } = require('svg.js');
const { createSVGWindow } = require('svgdom');

// 主函数：处理参数并调用SVG生成器
function getCountImage(params) {
  // 参数解析与默认值设置
  const {
    count,
    theme = 'moebooru',
    padding = 7,
    prefix = -1,
    offset = 0,
    align = 'top',
    scale = 1,
    pixelated = '1',
    darkmode = 'auto'
  } = params;

  // 验证主题
  const validTheme = theme in themeList ? theme : 'moebooru';
  
  // 格式化计数数组
  const formattedCount = formatCount(count, padding, prefix, validTheme);
  
  // 计算布局参数
  const layoutParams = calculateLayout(formattedCount, validTheme, scale, align);
  
  // 生成SVG
  const svg = generateSvg(
    formattedCount,
    validTheme,
    layoutParams,
    scale,
    offset,
    pixelated,
    darkmode,
    align
  );
  
  return svg;
}

// 格式化计数数组
function formatCount(count, padding, prefix, theme) {
  const countArray = count.toString().padStart(padding, '0').split('');
  
  // 添加前缀
  if (prefix >= 0) {
    countArray.unshift(...String(prefix).split(''));
  }
  
  // 添加主题装饰
  if (themeList[theme]['_start']) {
    countArray.unshift('_start');
  }
  if (themeList[theme]['_end']) {
    countArray.push('_end');
  }
  
  return countArray;
}

// 计算布局参数
function calculateLayout(countArray, theme, scale, align) {
  const uniqueChars = [...new Set(countArray)];
  
  // 计算最大高度
  let maxHeight = 0;
  uniqueChars.forEach(char => {
    const { height } = themeList[theme][char];
    maxHeight = Math.max(maxHeight, height * scale);
  });
  
  return {
    uniqueChars,
    maxHeight
  };
}

// 生成SVG
function generateSvg(
  countArray,
  theme,
  { uniqueChars, maxHeight },
  scale,
  offset,
  pixelated,
  darkmode,
  align 
) {
  
  // 创建SVG上下文
  const window = createSVGWindow();
  const document = window.document;
  const svgNS = 'http://www.w3.org/2000/svg';
  
  // 创建SVG根元素
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('version', '1.1');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  // 添加标题
  const title = document.createElementNS(svgNS, 'title');
  title.textContent = 'Moe Counter!';
  svg.appendChild(title);
  
  // 添加样式
  const style = createStyleElement(document, pixelated, darkmode);
  svg.appendChild(style);
  
  // 添加defs和图像定义
  const defs = document.createElementNS(svgNS, 'defs');
  svg.appendChild(defs);
  
  uniqueChars.forEach(char => {
    const { width, height, data } = themeList[theme][char];
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    const image = document.createElementNS(svgNS, 'image');
    image.setAttribute('id', char);
    image.setAttribute('width', toFixed(scaledWidth, 5));
    image.setAttribute('height', toFixed(scaledHeight, 5));
    image.setAttribute('xlink:href', data);
    
    defs.appendChild(image);
  });
  
  // 添加图形组
  const g = document.createElementNS(svgNS, 'g');
  svg.appendChild(g);
  
  offset = parseFloat(offset) || 0;
  // 计算总宽度
  let totalWidth = 0;
  
  // 添加所有字符
  countArray.forEach(char => {
    const { width, height } = themeList[theme][char];
    // 确保 width 和 scale 为数值
    const scaledWidth = parseFloat(width) * parseFloat(scale);
    const scaledHeight = parseFloat(height) * parseFloat(scale);
    
    // 计算垂直偏移
    let yOffset = 0;
    if (align === 'center') {
      yOffset = (maxHeight - scaledHeight) / 2;
    } else if (align === 'bottom') {
      yOffset = maxHeight - scaledHeight;
    }
    
    // 创建use元素
    const use = document.createElementNS(svgNS, 'use');
    use.setAttribute('x', toFixed(totalWidth, 5));
    if (yOffset !== 0) {
      use.setAttribute('y', toFixed(yOffset, 5));
    }
    use.setAttribute('xlink:href', `#${char}`);
    
    g.appendChild(use);
    
    // 更新总宽度
    totalWidth += scaledWidth + offset;
  });
  
  // 修正最后一个元素的偏移
  totalWidth -= offset;
  totalWidth = Math.min(totalWidth, 1000); // 设置合理上限
  
  // 设置SVG尺寸
  svg.setAttribute('viewBox', `0 0 ${toFixed(totalWidth, 5)} ${toFixed(maxHeight, 5)}`);
  svg.setAttribute('width', toFixed(totalWidth, 5));
  svg.setAttribute('height', toFixed(maxHeight, 5));
  
  return svg.outerHTML;
}

// 创建样式元素
function createStyleElement(document, pixelated, darkmode) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const style = document.createElementNS(svgNS, 'style');
  
  let styleContent = `
  svg {
    ${pixelated === '1' ? 'image-rendering: pixelated;' : ''}
    ${darkmode === '1' ? 'filter: brightness(.6);' : ''}
  }
  `;
  
  if (darkmode === 'auto') {
    styleContent += `
    @media (prefers-color-scheme: dark) {
      svg { filter: brightness(.6); }
    }
    `;
  }
  
  style.textContent = styleContent;
  return style;
}

module.exports = {
  themeList,
  getCountImage
}