import { ref, reactive } from 'vue'

/**
 * 通用数据获取Composable
 * 提供加载状态、错误处理、重试机制等通用功能
 */
export function useDataFetch() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  
  // 状态管理
  const state = reactive({
    loading: false,
    error: null,
    data: null,
    lastFetchTime: null,
    retryCount: 0
  })

  // 状态计算属性
  const isLoading = () => state.loading
  const hasError = () => !!state.error
  const hasData = () => !!state.data
  
  // 重置状态
  const reset = () => {
    state.loading = false
    state.error = null
    state.data = null
    state.retryCount = 0
  }

  // 错误处理
  const handleError = (err, defaultMessage = '操作失败') => {
    console.error('Data fetch error:', err)
    state.error = err.message || defaultMessage
    state.loading = false
    return state.error
  }

  // 重试机制
  const retry = async (fetchFunction, maxRetries = 3, delay = 1000) => {
    if (state.retryCount >= maxRetries) {
      throw new Error(`达到最大重试次数 (${maxRetries})`)
    }

    state.retryCount++
    console.log(`重试第 ${state.retryCount} 次...`)

    // 延迟重试
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    return await executeFetch(fetchFunction)
  }

  // 执行数据获取
  const executeFetch = async (fetchFunction) => {
    try {
      state.loading = true
      state.error = null
      state.lastFetchTime = Date.now()
      
      const result = await fetchFunction()
      
      state.data = result
      state.loading = false
      
      console.log('Data fetch successful:', result)
      return result
      
    } catch (err) {
      handleError(err)
      throw err
    }
  }

  // 带重试的数据获取
  const fetchWithRetry = async (fetchFunction, options = {}) => {
    const { maxRetries = 3, delay = 1000 } = options
    
    try {
      return await executeFetch(fetchFunction)
    } catch (err) {
      if (state.retryCount < maxRetries) {
        return await retry(fetchFunction, maxRetries, delay)
      }
      throw err
    }
  }

  // 简单数据获取（无重试）
  const fetch = async (fetchFunction) => {
    return await executeFetch(fetchFunction)
  }

  // 清除错误
  const clearError = () => {
    state.error = null
  }

  // 手动设置数据
  const setData = (newData) => {
    state.data = newData
    state.error = null
    state.loading = false
  }

  // 获取状态信息
  const getState = () => ({
    loading: state.loading,
    error: state.error,
    data: state.data,
    hasData: hasData(),
    hasError: hasError(),
    isLoading: isLoading(),
    lastFetchTime: state.lastFetchTime,
    retryCount: state.retryCount
  })

  return {
    // 状态
    loading,
    error,
    data,
    state,
    
    // 计算属性
    isLoading,
    hasError,
    hasData,
    
    // 方法
    fetch,
    fetchWithRetry,
    retry,
    reset,
    clearError,
    setData,
    getState
  }
}

/**
 * 列表数据获取专用Composable
 */
export function useListDataFetch() {
  const baseFetch = useDataFetch()
  
  // 列表特有状态
  const items = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 分页状态
  const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`
  })

  // 获取列表数据
  const fetchList = async (fetchFunction, options = {}) => {
    try {
      const {
        page = 1,
        size = 10,
        params = {},
        reset = true
      } = options

      if (reset) {
        baseFetch.reset()
        items.value = []
      }

      currentPage.value = page
      pageSize.value = size

      const result = await baseFetch.fetchWithRetry(async () => {
        return await fetchFunction({ page, size, ...params })
      })

      // 处理列表数据
      if (result && result.data) {
        items.value = result.data
        total.value = result.total || result.data.length
      } else if (Array.isArray(result)) {
        items.value = result
        total.value = result.length
      } else {
        items.value = []
        total.value = 0
      }

      // 更新分页状态
      pagination.current = page
      pagination.pageSize = size
      pagination.total = total.value

      return {
        items: items.value,
        total: total.value,
        page: currentPage.value,
        pageSize: pageSize.value
      }

    } catch (err) {
      console.error('Fetch list error:', err)
      throw err
    }
  }

  // 刷新当前页
  const refresh = async (fetchFunction, options = {}) => {
    return await fetchList(fetchFunction, {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...options
    })
  }

  // 跳转到指定页
  const goToPage = async (fetchFunction, page, options = {}) => {
    return await fetchList(fetchFunction, {
      page,
      pageSize: pageSize.value,
      ...options
    })
  }

  // 更改每页数量
  const changePageSize = async (fetchFunction, newSize, options = {}) => {
    return await fetchList(fetchFunction, {
      page: 1, // 重置到第一页
      pageSize: newSize,
      ...options
    })
  }

  // 清除列表数据
  const clearList = () => {
    items.value = []
    total.value = 0
    baseFetch.reset()
  }

  return {
    // 基础数据获取
    ...baseFetch,
    
    // 列表特有状态
    items,
    total,
    currentPage,
    pageSize,
    pagination,
    
    // 列表方法
    fetchList,
    refresh,
    goToPage,
    changePageSize,
    clearList
  }
}

/**
 * 文件上传专用Composable
 */
export function useFileUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const uploadedFiles = ref([])
  const errors = ref([])

  const uploadFile = async (file, uploadFunction, options = {}) => {
    const {
      onProgress = () => {},
      onSuccess = () => {},
      onError = () => {},
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = []
    } = options

    try {
      // 文件验证
      if (file.size > maxSize) {
        throw new Error(`文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`)
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        throw new Error(`不支持的文件类型: ${file.type}`)
      }

      uploading.value = true
      progress.value = 0
      errors.value = []

      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadFunction(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        progress.value = percentCompleted
        onProgress(percentCompleted)
      })

      uploadedFiles.value.push({
        file,
        result,
        uploadedAt: new Date()
      })

      onSuccess(result)
      return result

    } catch (err) {
      const error = {
        file: file.name,
        message: err.message,
        timestamp: new Date()
      }
      errors.value.push(error)
      onError(error)
      throw err
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  const uploadMultipleFiles = async (files, uploadFunction, options = {}) => {
    const results = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await uploadFile(file, uploadFunction, options)
        results.push({ file, result, success: true })
      } catch (err) {
        results.push({ file, error: err.message, success: false })
      }
    }
    
    return results
  }

  const clearUploads = () => {
    uploadedFiles.value = []
    errors.value = []
  }

  return {
    uploading,
    progress,
    uploadedFiles,
    errors,
    uploadFile,
    uploadMultipleFiles,
    clearUploads
  }
}