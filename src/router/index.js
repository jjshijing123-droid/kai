import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuth } from '../composables/useAdminAuth.js'
import Product_list from '../components/Product_list.vue'
import Product_nav from '../components/Product_nav.vue'
import Product3DViewer from '../components/Product3DViewer.vue'
import Product_Viewimages from '../components/Product_Viewimages.vue'
import I18nManagementPanel from '../components/I18nManagementPanel.vue'
import Product_Management from '../components/Product_Management.vue'
import ProductDetailManagement from '../components/ProductDetailManagement.vue'
import FolderManager from '../components/FolderManager.vue'
import i18n from '../i18n/index.js'

// 定义应用的路由配置数组
// 每个路由对象包含路径、名称和对应的组件
const routes = [
  {
    path: '/',                    // 根路径
    name: 'Home',                 // 路由名称
    component: Product_list // 对应的组件
  },
  {
    path: '/product/:name',       // 动态路由，:name 为参数
    name: 'Product_nav',        // 路由名称
    component: Product_nav,     // 产品详情组件
    props: true                   // 启用 props 传递路由参数
  },
  {
    path: '/product-3d/:name',    // 3D展示页面路径
    name: 'Product3DViewer',      // 路由名称
    component: Product3DViewer,   // 3D展示组件
    props: true                   // 启用 props 传递路由参数
  },
  {
    path: '/product-images/:name/:type',    // 产品图片展示页面路径
    name: 'ProductViewimages',              // 路由名称
    component: Product_Viewimages,          // 图片展示组件
    props: true                             // 启用 props 传递路由参数
  },
  {
    path: '/i18n-manager',        // 国际化管理页面路径
    name: 'I18nManagement',       // 路由名称
    component: I18nManagementPanel // 国际化管理面板组件
  },
  {
    path: '/product-management',  // 产品管理页面路径
    name: 'ProductManagement',    // 路由名称
    component: Product_Management  // 产品管理组件
  },
  {
    path: '/product-management/:name',  // 产品详情管理页面路径
    name: 'ProductDetailManagement',    // 路由名称
    component: ProductDetailManagement, // 产品详情管理组件
    props: true                         // 启用 props 传递路由参数
  },
  {
    path: '/folder/:folderName',        // 文件夹管理页面路径
    name: 'FolderManager',              // 路由名称
    component: FolderManager,           // 文件夹管理组件
    props: true                         // 启用 props 传递路由参数
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),    // 使用 HTML5 History 模式
  routes                          // 传入路由配置
})

// 全局前置守卫 - 确保语言状态一致性和权限检查
router.beforeEach((to, from, next) => {
  // 确保语言状态已正确初始化
  const savedLang = localStorage.getItem('preferredLanguage')
  
  if (savedLang && i18n.getCurrentLanguage() !== savedLang) {
    i18n.setLanguage(savedLang)
  }
  
  // 检查是否需要管理员权限
  const protectedRoutes = ['/i18n-manager', '/product-management']
  
  if (protectedRoutes.includes(to.path)) {
    // 动态检查管理员登录状态（避免过早实例化）
    const storedSession = localStorage.getItem('admin_session')
    if (storedSession !== 'true') {
      console.log('尝试访问受保护页面，需要管理员权限')
    }
  }
  
  next()
})

// 导出路由实例供应用使用
export default router
