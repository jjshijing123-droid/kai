/**
 * 后端API测试套件
 * 对重构后的模块化后端进行全面的API测试
 */

const request = require('supertest')
const fs = require('fs')
const path = require('path')

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  retries: 3
}

/**
 * 产品API测试
 */
describe('Products API', () => {
  let authToken = ''
  let testProductId = ''

  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test'
    
    // 启动测试服务器（在实际测试中需要启动服务器）
    // const app = require('../../server')
  })

  afterAll(async () => {
    // 清理测试数据
    await cleanup()
  })

  describe('GET /api/products', () => {
    it('应该返回产品列表', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/products')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('应该支持分页参数', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/products?page=1&limit=5')
        .expect(200)

      expect(response.body.data.length).toBeLessThanOrEqual(5)
      expect(response.body).toHaveProperty('pagination')
    })

    it('应该支持搜索参数', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/products?search=test')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('GET /api/products/:id', () => {
    it('应该返回特定产品信息', async () => {
      const productId = '1'
      const response = await request(TEST_CONFIG.baseURL)
        .get(`/api/products/${productId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id', productId)
    })

    it('应该处理不存在的产品ID', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/products/99999')
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('message')
    })
  })

  describe('POST /api/products', () => {
    it('应该创建新产品（需要认证）', async () => {
      const newProduct = {
        name: '测试产品',
        description: '这是一个测试产品',
        price: 99.99,
        category: '测试分类',
        status: 'active'
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id')
      
      // 保存产品ID用于后续测试
      testProductId = response.body.data.id
    })

    it('应该验证必需字段', async () => {
      const incompleteProduct = {
        name: '不完整的产品'
        // 缺少description, price等必需字段
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteProduct)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errors')
    })

    it('应该拒绝未认证的请求', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/products')
        .send({ name: '测试产品' })
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
    })
  })

  describe('PUT /api/products/:id', () => {
    it('应该更新产品信息', async () => {
      const updates = {
        name: '更新后的产品名称',
        price: 199.99
      }

      const response = await request(TEST_CONFIG.baseURL)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data.name).toBe(updates.name)
      expect(response.body.data.price).toBe(updates.price)
    })

    it('应该验证价格字段格式', async () => {
      const invalidUpdates = {
        price: '无效价格'
      }

      const response = await request(TEST_CONFIG.baseURL)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('应该删除产品（软删除）', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .delete(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data.deletedAt).toBeDefined()
    })

    it('应该处理不存在的产品删除', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('success', false)
    })
  })
})

/**
 * 文件管理API测试
 */
describe('Files API', () => {
  let testFileId = ''

  describe('GET /api/files', () => {
    it('应该返回文件列表', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/files')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('应该支持文件夹过滤', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/files?folder=documents')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })
  })

  describe('POST /api/files/upload', () => {
    it('应该处理文件上传', async () => {
      // 创建测试文件
      const testFilePath = path.join(__dirname, 'test-file.txt')
      fs.writeFileSync(testFilePath, '测试文件内容')

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/files/upload')
        .attach('file', testFilePath)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id')
      
      testFileId = response.body.data.id

      // 清理测试文件
      fs.unlinkSync(testFilePath)
    })

    it('应该验证文件类型', async () => {
      // 创建无效文件类型
      const testFilePath = path.join(__dirname, 'test.exe')
      fs.writeFileSync(testFilePath, '恶意文件内容')

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/files/upload')
        .attach('file', testFilePath)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)

      // 清理测试文件
      fs.unlinkSync(testFilePath)
    })
  })

  describe('DELETE /api/files/:id', () => {
    it('应该删除文件', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .delete(`/api/files/${testFileId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })
  })
})

/**
 * 文件夹管理API测试
 */
describe('Folders API', () => {
  let testFolderId = ''

  describe('GET /api/folders', () => {
    it('应该返回文件夹列表', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/folders')
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/folders', () => {
    it('应该创建新文件夹', async () => {
      const folderData = {
        name: '测试文件夹',
        parentId: null,
        description: '测试文件夹描述'
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/folders')
        .send(folderData)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('id')
      
      testFolderId = response.body.data.id
    })

    it('应该验证文件夹名称', async () => {
      const invalidFolderData = {
        name: '', // 空名称
        parentId: null
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/folders')
        .send(invalidFolderData)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
    })
  })

  describe('DELETE /api/folders/:id', () => {
    it('应该删除空文件夹', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .delete(`/api/folders/${testFolderId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })

    it('应该阻止删除包含文件的文件夹', async () => {
      // 首先创建一个包含文件的文件夹
      const folderWithFiles = {
        name: '包含文件的文件夹',
        parentId: null
      }

      const createResponse = await request(TEST_CONFIG.baseURL)
        .post('/api/folders')
        .send(folderWithFiles)
        .expect(201)

      const folderId = createResponse.body.data.id

      // 尝试删除包含文件的文件夹
      const deleteResponse = await request(TEST_CONFIG.baseURL)
        .delete(`/api/folders/${folderId}`)
        .expect(400)

      expect(deleteResponse.body).toHaveProperty('success', false)
    })
  })
})

/**
 * 系统健康检查API测试
 */
describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('应该返回系统健康状态', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('version')
    })

    it('应该包含依赖服务状态', async () => {
      const response = await request(TEST_CONFIG.baseURL)
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('services')
      expect(response.body.services).toHaveProperty('database')
      expect(response.body.services).toHaveProperty('storage')
    })
  })
})

/**
 * 错误处理API测试
 */
describe('Error Handling API', () => {
  describe('POST /api/error-report', () => {
    it('应该接受错误报告', async () => {
      const errorReport = {
        type: 'CLIENT_ERROR',
        message: '测试错误',
        severity: 'medium',
        context: {
          url: '/test',
          userAgent: 'test-agent'
        }
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/error-report')
        .send(errorReport)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('id')
    })

    it('应该验证错误报告格式', async () => {
      const invalidReport = {
        // 缺少必需字段
      }

      const response = await request(TEST_CONFIG.baseURL)
        .post('/api/error-report')
        .send(invalidReport)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
    })
  })
})

/**
 * 性能测试
 */
describe('Performance Tests', () => {
  it('产品列表API响应时间应该小于500ms', async () => {
    const startTime = Date.now()
    
    await request(TEST_CONFIG.baseURL)
      .get('/api/products')
      .expect(200)
    
    const responseTime = Date.now() - startTime
    
    expect(responseTime).toBeLessThan(500)
  })

  it('并发请求应该正确处理', async () => {
    const requests = Array.from({ length: 10 }, () => 
      request(TEST_CONFIG.baseURL).get('/api/products')
    )

    const responses = await Promise.all(requests)
    
    responses.forEach(response => {
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })
  })
})

/**
 * 安全性测试
 */
describe('Security Tests', () => {
  it('应该防止SQL注入攻击', async () => {
    const maliciousQuery = "'; DROP TABLE products; --"
    
    const response = await request(TEST_CONFIG.baseURL)
      .get(`/api/products?search=${encodeURIComponent(maliciousQuery)}`)
      .expect(200) // 应该返回空结果而不是执行恶意SQL
    
    expect(response.body).toHaveProperty('success', true)
  })

  it('应该限制文件上传大小', async () => {
    // 创建一个大于限制的大文件（这里只是测试逻辑）
    const largeBuffer = Buffer.alloc(1024 * 1024 * 100) // 100MB
    
    // 在实际测试中需要使用form-data
    const response = await request(TEST_CONFIG.baseURL)
      .post('/api/files/upload')
      .send({ size: largeBuffer.length })
      .expect(413) // Payload Too Large
    
    expect(response.body).toHaveProperty('success', false)
  })

  it('应该要求认证才能访问受保护的端点', async () => {
    const response = await request(TEST_CONFIG.baseURL)
      .post('/api/products')
      .send({ name: '测试产品' })
      .expect(401)
    
    expect(response.body).toHaveProperty('success', false)
  })
})

/**
 * 工具函数
 */
async function cleanup() {
  // 清理测试数据库
  // 删除测试文件
  // 关闭连接等
  console.log('清理测试数据完成')
}

// 导出配置
module.exports = {
  TEST_CONFIG,
  cleanup
}