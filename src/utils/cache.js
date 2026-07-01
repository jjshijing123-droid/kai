/**
 * 前端请求缓存工具
 * 用于减少重复 API 调用，提升性能
 */
const requestCache = new Map()

/**
 * 带缓存的请求方法
 * @param {string} key - 缓存键
 * @param {Function} fetcher - 获取数据的异步函数
 * @param {number} ttl - 缓存有效期（毫秒），默认 30 秒
 * @returns {Promise<any>}
 */
export async function cachedFetch(key, fetcher, ttl = 30000) {
  const cached = requestCache.get(key)

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }

  const data = await fetcher()
  requestCache.set(key, { data, timestamp: Date.now() })
  return data
}

/**
 * 使缓存失效
 * @param {string} key - 缓存键，不传则清空全部
 */
export function invalidateCache(key) {
  if (key) {
    requestCache.delete(key)
  } else {
    requestCache.clear()
  }
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null

  const debounced = function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      fn.apply(this, arguments)
    }
  }

  return debounced
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function}
 */
export function throttle(fn, interval = 500) {
  let lastTime = 0
  let timer = null

  return function (...args) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

export default { cachedFetch, invalidateCache, debounce, throttle }
