/**
 * Ant Design 主题配置
 * 统一项目的主题样式和全局配置
 */

// 主题配置
export const themeConfig = {
  token: {
    // 主色调
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    
    // 字体
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 18,
    
    // 圆角
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 8,
    
    // 间距
    padding: 16,
    paddingSM: 12,
    paddingLG: 24,
    margin: 16,
    marginSM: 12,
    marginLG: 24,
    
    // 高度
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    
    // 线宽
    lineWidth: 1,
    lineWidthBold: 2,
    
    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  
  // 组件配置
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerPadding: '0 24px',
      headerHeight: 64,
      bodyBg: '#f5f5f5',
      footerBg: '#f5f5f5',
      footerPadding: '24px 50px',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
    },
    Button: {
      borderRadius: 6,
      borderRadiusSM: 4,
      borderRadiusLG: 8,
    },
    Input: {
      borderRadius: 6,
      borderRadiusSM: 4,
      borderRadiusLG: 8,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
      headerSplitColor: 'transparent',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e6f7ff',
      itemHoverBg: '#f5f5f5',
    },
    Modal: {
      borderRadiusLG: 8,
    },
    Drawer: {
      borderRadiusLG: 8,
    },
  },
}

// 响应式断点配置
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
}

// 颜色配置
export const colors = {
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff',
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#f0f0f0',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
  },
  success: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a',
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#092b00',
  },
  warning: {
    50: '#fffbe6',
    100: '#fff1b8',
    200: '#ffe58f',
    300: '#ffd666',
    400: '#ffc53d',
    500: '#faad14',
    600: '#d48806',
    700: '#ad6800',
    800: '#874d00',
    900: '#613400',
  },
  error: {
    50: '#fff2f0',
    100: '#fff1f0',
    200: '#ffccc7',
    300: '#ffa39e',
    400: '#ff7875',
    500: '#ff4d4f',
    600: '#f5222d',
    700: '#cf1322',
    800: '#a8071a',
    900: '#820014',
  },
}

// 间距配置
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// 字体配置
export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

// 导出默认配置
export default {
  themeConfig,
  breakpoints,
  colors,
  spacing,
  typography,
}