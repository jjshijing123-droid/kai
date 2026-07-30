/**
 * API服务层 - 统一管理所有API调用
 */
// 不使用ant-design-vue的message，改用项目自定义的showMessage

class ApiService {
  constructor() {
    this.baseURL = '/api'
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
    this.authToken = null
  }

  setAuthToken(token) {
    this.authToken = token
  }

  clearAuthToken() {
    this.authToken = null
  }

  getAuthHeaders() {
    const token = this.authToken || localStorage.getItem('admin_token')
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  /**
   * 通用请求方法
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const timeout = options.timeout || 15000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const { headers: optionHeaders, signal: optionSignal, ...restOptions } = options
    const config = {
      headers: { ...this.defaultHeaders, ...this.getAuthHeaders(), ...optionHeaders },
      signal: optionSignal || controller.signal,
      ...restOptions
    }

    try {
      console.log(`🚀 API请求: ${options.method || 'GET'} ${url}`)

      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      // 处理HTTP错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // 解析响应数据
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      console.log(`✅ API响应成功:`, data)
      return data

    } catch (error) {
      console.error(`❌ API请求失败:`, error)
      
      // 网络错误处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      }
      
      throw error
    }
  }

  /**
   * GET请求
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, {
      method: 'GET'
    })
  }

  /**
   * POST请求
   */
  async post(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { ...this.defaultHeaders, ...headers }
    })
  }

  /**
   * PUT请求
   */
  async put(endpoint, data = {}, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { ...this.defaultHeaders, ...headers }
    })
  }

  /**
   * DELETE请求
   */
  async delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: { ...this.defaultHeaders, ...headers }
    })
  }

  /**
   * 文件上传
   */
  async upload(endpoint, formData, onProgress = null) {
    const url = `${this.baseURL}${endpoint}`
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(Math.round(percentComplete))
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })
      
      xhr.open('POST', url)
      xhr.send(formData)
    })
  }

  // ==================== 产品相关API ====================

  /**
   * 获取产品列表
   */
  async getProducts() {
    return this.get('/products')
  }

  /**
   * 创建产品
   */
  async createProduct(productData) {
    return this.post('/products', productData)
  }

  /**
   * 重命名产品
   */
  async renameProduct(productName, newData) {
    return this.put(`/products/${encodeURIComponent(productName)}`, newData)
  }

  /**
   * 删除产品
   */
  async deleteProduct(productName) {
    return this.delete(`/products/${encodeURIComponent(productName)}`)
  }

  /**
   * 获取产品详情
   */
  async getProductById(id) {
    return this.get(`/products/${id}`)
  }

  /**
   * 根据名称获取产品详情
   */
  async getProductByName(name) {
    return this.get(`/db/products/name/${encodeURIComponent(name)}`)
  }

  /**
   * 获取产品图片列表
   */
  async getProductImages(productName, imageType) {
    return this.get(`/products/${encodeURIComponent(productName)}/images/${imageType}`)
  }

  /**
   * 获取产品目录（兼容性）
   */
  async getProductCatalog() {
    return this.get('/db/products')
  }

  // ==================== 文件夹相关API ====================

  /**
   * 获取文件夹详情
   */
  async getFolderDetails(folderPath) {
    return this.get(`/folder/${encodeURIComponent(folderPath)}/details`)
  }

  /**
   * 创建子文件夹
   */
  async createSubfolder(parentPath, folderName) {
    return this.post(`/folder/${encodeURIComponent(parentPath)}/create-subfolder`, {
      folderName
    })
  }

  /**
   * 删除子文件夹
   */
  async deleteSubfolder(parentPath, folderName) {
    return this.delete(`/folder/${encodeURIComponent(parentPath)}/subfolder/${encodeURIComponent(folderName)}`)
  }

  /**
   * 重命名子文件夹
   */
  async renameSubfolder(parentPath, folderName, newFolderName) {
    return this.put(`/folder/${encodeURIComponent(parentPath)}/subfolder/${encodeURIComponent(folderName)}`, {
      newFolderName
    })
  }

  /**
   * 获取文件夹树
   */
  async getFolderTree(folderPath, maxDepth = 3) {
    return this.get(`/folder/${encodeURIComponent(folderPath)}/tree`, {
      maxDepth
    })
  }

  /**
   * 搜索文件
   */
  async searchFiles(folderPath, searchTerm, fileTypes = null) {
    const params = { searchTerm }
    if (fileTypes) {
      params.fileTypes = fileTypes.join(',')
    }
    return this.get(`/folder/${encodeURIComponent(folderPath)}/search`, params)
  }

  // ==================== 文件夹操作相关API ====================

  /**
   * 导出文件夹为 ZIP（返回二进制流）
   */
  async exportFolder(folderPath) {
    const cleanPath = folderPath.startsWith('Product/')
      ? folderPath.replace('Product/', '')
      : folderPath
    const url = `${this.baseURL}/folder/export/${encodeURIComponent(cleanPath)}`

    const token = this.authToken || localStorage.getItem('admin_token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    // 返回 blob 供前端下载
    const disposition = response.headers.get('content-disposition') || ''
    const fileName = disposition.match(/filename="?([^"]+)"?/)?.[1] || `${cleanPath.split('/').pop()}.zip`
    return { blob: await response.blob(), fileName }
  }

  // ==================== 文件操作相关API ====================

  /**
   * 删除文件
   */
  async deleteFile(filePath) {
    return this.post('/delete-file', { filePath })
  }

  /**
   * 检查文件夹中是否有文件
   */
  async checkFolderHasFiles(folderPath) {
    return this.get(`/check-folder/${encodeURIComponent(folderPath)}`)
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath) {
    return this.get(`/file-info/${encodeURIComponent(filePath)}`)
  }

  /**
   * 获取下载链接
   */
  async getDownloadUrl(filePath, fileName) {
    return this.get(`/download/${encodeURIComponent(filePath)}/${encodeURIComponent(fileName)}`)
  }

  /**
   * 重命名文件
   */
  async renameFile(filePath, newFileName) {
    return this.post('/rename-file', { filePath, newFileName })
  }

  // ==================== 上传相关API ====================

  /**
   * 批量替换产品
   */
  async batchReplaceProducts(file, onProgress = null) {
    const formData = new FormData()
    formData.append('zipFile', file)
    
    return this.upload('/batch-replace-products', formData, onProgress)
  }

  /**
   * 上传单个产品文件夹
   */
  async uploadProductFolder(file, folderName, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderName', folderName)
    
    return this.upload('/upload-product-folder', formData, onProgress)
  }

  /**
   * 重新生成产品目录
   */
  async regenerateCatalog() {
    return this.post('/regenerate-catalog')
  }

  /**
   * 获取上传进度
   */
  async getUploadProgress(uploadId) {
    return this.get(`/upload-progress/${uploadId}`)
  }
}

// 创建单例实例
const apiService = new ApiService()

// 导出
export default apiService
export { ApiService }