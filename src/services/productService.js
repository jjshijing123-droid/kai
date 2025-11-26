/**
 * 产品管理服务
 */
import apiService from './apiService'
import { message } from 'ant-design-vue'

class ProductService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 获取产品列表
   */
  async getProducts(options = {}) {
    const cacheKey = 'products'
    
    // 检查缓存
    if (!options.forceRefresh && this.isCacheValid(cacheKey)) {
      console.log('从缓存获取产品列表')
      return this.cache.get(cacheKey).data
    }

    try {
      console.log('从API获取产品列表')
      const data = await apiService.getProducts()
      
      // 更新缓存
      this.updateCache(cacheKey, data)
      
      return data
    } catch (error) {
      console.error('获取产品列表失败:', error)
      message.error(`获取产品列表失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 创建产品
   */
  async createProduct(productData) {
    try {
      const result = await apiService.createProduct(productData)
      
      // 清除缓存
      this.clearCache('products')
      
      message.success(`产品 "${productData.productName}" 创建成功`)
      return result
    } catch (error) {
      console.error('创建产品失败:', error)
      message.error(`创建产品失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 重命名产品
   */
  async renameProduct(productName, newData) {
    try {
      const result = await apiService.renameProduct(productName, newData)
      
      // 清除缓存
      this.clearCache('products')
      
      message.success('产品重命名成功')
      return result
    } catch (error) {
      console.error('重命名产品失败:', error)
      message.error(`重命名产品失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 删除产品
   */
  async deleteProduct(productName) {
    try {
      const result = await apiService.deleteProduct(productName)
      
      // 清除缓存
      this.clearCache('products')
      
      message.success(`产品 "${productName}" 删除成功`)
      return result
    } catch (error) {
      console.error('删除产品失败:', error)
      message.error(`删除产品失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 获取产品详情
   */
  async getProductById(id) {
    const cacheKey = `product_${id}`
    
    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      console.log(`从缓存获取产品 ${id}`)
      return this.cache.get(cacheKey).data
    }

    try {
      const result = await apiService.getProductById(id)
      
      // 更新缓存
      this.updateCache(cacheKey, result)
      
      return result
    } catch (error) {
      console.error(`获取产品 ${id} 详情失败:`, error)
      throw error
    }
  }

  /**
   * 根据名称获取产品详情
   */
  async getProductByName(name) {
    const cacheKey = `product_name_${name}`
    
    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      console.log(`从缓存获取产品 ${name}`)
      return this.cache.get(cacheKey).data
    }

    try {
      const result = await apiService.getProductByName(name)
      
      // 更新缓存
      this.updateCache(cacheKey, result)
      
      return result
    } catch (error) {
      console.error(`获取产品 ${name} 详情失败:`, error)
      throw error
    }
  }

  /**
   * 搜索产品
   */
  async searchProducts(products, searchTerm) {
    if (!searchTerm) return products
    
    const term = searchTerm.toLowerCase()
    return products.filter(product => 
      product.name?.toLowerCase().includes(term) ||
      product.folderName?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    )
  }

  /**
   * 过滤产品
   */
  async filterProducts(products, filters = {}) {
    let filtered = [...products]

    // 按分类过滤
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => 
        product.category === filters.category
      )
    }

    // 按日期过滤
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(product => {
        const productDate = new Date(product.modified || product.lastModified)
        return (!start || productDate >= start) && (!end || productDate <= end)
      })
    }

    // 按大小过滤
    if (filters.sizeRange) {
      const { min, max } = filters.sizeRange
      filtered = filtered.filter(product => {
        const size = product.totalSize || 0
        return (!min || size >= min) && (!max || size <= max)
      })
    }

    return filtered
  }

  /**
   * 排序产品
   */
  sortProducts(products, sortBy = 'name', order = 'asc') {
    const sorted = [...products].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // 处理日期排序
      if (sortBy === 'modified' || sortBy === 'lastModified') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }

      // 处理数字排序
      if (sortBy === 'totalSize' || sortBy === 'fileCount') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }

      // 字符串排序
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1
      if (aValue > bValue) return order === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }

  /**
   * 格式化产品数据
   */
  formatProductData(product) {
    return {
      ...product,
      displayName: product.folderName || product.name || '未知产品',
      displaySize: this.formatFileSize(product.totalSize || 0),
      displayDate: product.modified ? new Date(product.modified).toLocaleDateString() : '',
      hasImages: !!(product.mainImage || (product.images && product.images.length > 0)),
      imageCount: product.fileCount || 0
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ==================== 缓存管理 ====================

  /**
   * 更新缓存
   */
  updateCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(key) {
    const cached = this.cache.get(key)
    if (!cached) return false
    
    const age = Date.now() - cached.timestamp
    return age < this.cacheTimeout
  }

  /**
   * 清除缓存
   */
  clearCache(key) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    const stats = {
      total: this.cache.size,
      entries: []
    }

    for (const [key, value] of this.cache.entries()) {
      const age = Date.now() - value.timestamp
      stats.entries.push({
        key,
        age: Math.round(age / 1000), // 秒
        isValid: this.isCacheValid(key)
      })
    }

    return stats
  }
}

// 创建单例实例
const productService = new ProductService()

export default productService