<template>
  <div class="folder-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title-section">
          <h1 class="page-title">
            📁 {{ currentFolder }}
          </h1>
        </div>
        <div class="header-actions">
          <button @click="goBack" class="back-button">
            ← {{ t('folderManager_back') }}
          </button>
          <button @click="refreshFolder" class="refresh-button" :class="{ loading: loading }">
            🔄 {{ t('folderManager_refresh') }}
          </button>
        </div>
      </div>

      <!-- 文件夹路径 -->
      <div class="breadcrumb">
        <span class="breadcrumb-item" @click="goToRoot">
          🏠 {{ t('folderManager_productFolder') }}
        </span>
        <span v-for="(part, index) in folderPathParts" :key="index" class="breadcrumb-separator">
          /
        </span>
        <span 
          v-for="(part, index) in folderPathParts" 
          :key="index"
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item-active': index === folderPathParts.length - 1 }"
          @click="index < folderPathParts.length - 1 ? goToFolderPath(part.path) : null"
        >
          {{ part.name }}
        </span>
      </div>
    </div>

    <!-- 上传区域 -->
    <div class="upload-section">
      <FileUploader
        :folder-path="currentFolder"
        :multiple="true"
        :button-text="t('folderManager_uploadFileToCurrent')"
        @upload-complete="handleUploadComplete"
      />
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ t('folderManager_loading') }}</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3 class="error-title">{{ t('folderManager_loadingFailed') }}</h3>
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" @click="fetchFolderDetails">
          {{ t('folderManager_retry') }}
        </button>
      </div>

      <!-- 文件夹内容 -->
      <div v-else class="folder-content">
        <!-- 子文件夹 -->
        <div v-if="subfolders.length > 0" class="section">
          <h3 class="section-title">{{ t('folderManager_subfolders') }}</h3>
          <div class="folder-grid">
            <div
              v-for="folder in subfolders"
              :key="folder.name"
              class="folder-item"
              @click="openSubfolder(folder.name)"
              @contextmenu.prevent="showFolderContextMenu($event, folder)"
            >
              <div class="folder-icon">
                📁
              </div>
              <div class="folder-info">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-stats">
                  <span>{{ t('folderManager_filesCount', { count: folder.fileCount }) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件列表 -->
        <div v-if="files.length > 0" class="section">
          <h3 class="section-title">{{ t('folderManager_files') }}</h3>
          <div class="file-list">
            <div
              v-for="file in files"
              :key="file.name"
              class="file-item"
              @contextmenu.prevent="showFileContextMenu($event, file)"
            >
              <div class="file-icon">
                <span v-if="isImageFile(file.name)">🖼️</span>
                <span v-else>📄</span>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-details">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>{{ formatDate(file.modified) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <button
                  class="action-btn preview-btn"
                  @click.stop="previewFile(file)"
                  title="{{ t('folderManager_preview') }}"
                >
                  👁️
                </button>
                <button
                  class="action-btn download-btn"
                  @click.stop="downloadFile(file)"
                  title="{{ t('folderManager_download') }}"
                >
                  💾
                </button>
                <button
                  class="action-btn delete-btn"
                  @click.stop="deleteFile(file)"
                  title="{{ t('folderManager_delete') }}"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && !error && subfolders.length === 0 && files.length === 0" class="empty-state">
          <div class="empty-icon">📁</div>
          <p class="empty-text">{{ t('folderManager_folderEmpty') }}</p>
          <button class="upload-first-btn" @click="triggerUpload">
            {{ t('folderManager_uploadFirstFile') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="closePreview">
      <div class="modal-content preview-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ previewFileInfo?.name }}</h3>
          <button class="modal-close" @click="closePreview">×</button>
        </div>
        <div v-if="previewFileInfo" class="preview-content">
          <img
            v-if="isImageFile(previewFileInfo.name)"
            :src="getFileUrl(previewFileInfo)"
            :alt="previewFileInfo.name"
            class="preview-image"
          />
          <div v-else class="preview-other">
            <div class="preview-icon">📄</div>
            <p>{{ t('folderManager_previewNotSupported') }}</p>
            <button class="download-btn" @click="downloadFile(previewFileInfo)">
              💾 {{ t('folderManager_downloadFile') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click="hideContextMenu"
    >
      <template v-if="contextMenuType === 'folder'">
        <div class="context-menu-item" @click="openSubfolder(contextMenuItem.name)">
          📁 {{ t('folderManager_open') }}
        </div>
        <div class="context-menu-item" @click="renameFolder(contextMenuItem)">
          ✏️ {{ t('folderManager_rename') }}
        </div>
        <div class="context-menu-item danger" @click="deleteFolder(contextMenuItem)">
          🗑️ {{ t('folderManager_delete') }}
        </div>
      </template>
      <template v-else-if="contextMenuType === 'file'">
        <div class="context-menu-item" @click="previewFile(contextMenuItem)">
          👁️ {{ t('folderManager_preview') }}
        </div>
        <div class="context-menu-item" @click="downloadFile(contextMenuItem)">
          💾 {{ t('folderManager_download') }}
        </div>
        <div class="context-menu-item" @click="deleteFile(contextMenuItem)">
          🗑️ {{ t('folderManager_delete') }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import FileUploader from './FileUploader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentFolder = ref('')
const folderDetails = ref({})
const loading = ref(true)
const error = ref(null)
const showPreviewModal = ref(false)
const previewFileInfo = ref(null)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuItem = ref(null)
const contextMenuType = ref('')

// 简单的空状态图片
const simpleImage = undefined

// 计算属性
const subfolders = computed(() => {
  if (!folderDetails.value.folders) return []
  
  const folders = []
  Object.entries(folderDetails.value.folders).forEach(([folderName, folderInfo]) => {
    folders.push({
      name: folderName,
      fileCount: folderInfo.fileCount || 0,
      path: folderInfo.path
    })
  })
  return folders
})

const files = computed(() => {
  if (!folderDetails.value.files) return []
  return folderDetails.value.files
})

const folderPathParts = computed(() => {
  if (!currentFolder.value) return []
  
  const parts = currentFolder.value.split('/')
  const result = []
  
  let currentPath = ''
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
      result.push({
        name: parts[i],
        path: currentPath
      })
    }
  }
  
  return result
})

// 方法
const fetchFolderDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    const folderPath = route.params.folderName || currentFolder.value
    if (!folderPath) {
      throw new Error(t('folderManager_folderPathEmpty'))
    }

    // 使用新的子文件夹 API
    const response = await fetch(`/api/folder/${encodeURIComponent(folderPath)}/details`)
    if (!response.ok) {
      throw new Error(t('folderManager_getDetailsFailed'))
    }
    
    const data = await response.json()
    
    if (data.success && data.folder) {
      folderDetails.value = data.folder
      currentFolder.value = folderPath
    } else {
      throw new Error(t('folderManager_dataFormatError'))
    }
  } catch (err) {
    console.error('获取文件夹详情错误:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const openSubfolder = (folderName) => {
  // 构建子文件夹的完整路径
  const subfolderPath = `${currentFolder.value}/${folderName}`
  
  // 跳转到子文件夹管理页面
  router.push(`/folder/${encodeURIComponent(subfolderPath)}`)
}

const refreshFolder = () => {
  fetchFolderDetails()
}

const beforeUpload = (file) => {
  // 文件上传前的处理
  console.log(t('folderManager_preparingUpload'), file)
  // 这里可以实现文件上传逻辑
  alert(`${t('folderManager_preparingUpload')} ${file.name}\n\n${t('folderManager_uploadToCurrentFolder')}`)
  return false // 阻止默认上传行为
}

const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
}

const getFileUrl = (file) => {
  // 构建文件URL
  return `/Product/${currentFolder.value}/${file.name}`
}

const previewFile = (file) => {
  previewFileInfo.value = file
  showPreviewModal.value = true
}

const closePreview = () => {
  showPreviewModal.value = false
  previewFileInfo.value = null
}

const downloadFile = (file) => {
  const fileUrl = getFileUrl(file)
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = file.name
  link.click()
}

const deleteFile = async (file) => {
  if (!confirm(t('folderManager_confirmDeleteFile', { name: file.name }))) {
    return
  }

  try {
    // 构建文件路径（相对于 Product 目录）
    const filePath = `${currentFolder.value}/${file.name}`
    
    const response = await fetch('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath: filePath
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('文件删除成功:', file.name)
      // 刷新文件夹内容
      fetchFolderDetails()
    } else {
      console.error('文件删除失败:', result.error)
      alert(`${t('folderManager_deleteFileFailed')} ${result.error}`)
    }
  } catch (error) {
    console.error('删除文件时出错:', error)
    alert(`${t('folderManager_deleteFileError')} ${error.message}`)
  }
}

const showFolderContextMenu = (event, folder) => {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuItem.value = folder
  contextMenuType.value = 'folder'
  showContextMenu.value = true
}

const showFileContextMenu = (event, file) => {
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuItem.value = file
  contextMenuType.value = 'file'
  showContextMenu.value = true
}

const hideContextMenu = () => {
  showContextMenu.value = false
  contextMenuItem.value = null
  contextMenuType.value = ''
}

const goBack = () => {
  router.back()
}

const goToFolderPath = (folderPath) => {
  router.push(`/folder/${encodeURIComponent(folderPath)}`)
}

const goToRoot = () => {
  router.push('/product-management')
}

// 触发上传
const triggerUpload = () => {
  // 这里可以实现文件上传逻辑
  alert(`${t('folderManager_preparingUpload')}\n\n${t('folderManager_uploadToCurrentFolder')}`)
}

// 重命名文件夹
const renameFolder = async (folder) => {
  const newName = prompt(t('folderManager_enterNewName'), folder.name)
  
  if (!newName || newName === folder.name) {
    return
  }

  try {
    // 验证文件夹名称
    if (newName.trim() === '') {
      alert(t('folderManager_nameCannotBeEmpty'))
      return
    }

    // 检查是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(newName)) {
      alert(t('folderManager_invalidCharacters'))
      return
    }

    // 调用重命名API
    const response = await fetch(`/api/folder/${encodeURIComponent(currentFolder.value)}/subfolder/${encodeURIComponent(folder.name)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newFolderName: newName.trim()
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('文件夹重命名成功:', folder.name, '->', newName)
      // 刷新文件夹内容
      fetchFolderDetails()
    } else {
      console.error('文件夹重命名失败:', result.error)
      alert(`${t('folderManager_renameFailed')} ${result.error}`)
    }
  } catch (error) {
    console.error('重命名文件夹时出错:', error)
    alert(`${t('folderManager_renameError')} ${error.message}`)
  }
}

// 删除文件夹
const deleteFolder = async (folder) => {
  if (!confirm(t('folderManager_confirmDeleteFolder', { name: folder.name }))) {
    return
  }

  try {
    // 检查文件夹是否为空
    if (folder.fileCount > 0) {
      alert(t('folderManager_cannotDeleteNonEmptyFolder', { count: folder.fileCount }))
      return
    }

    // 调用删除API
    const response = await fetch(`/api/folder/${encodeURIComponent(currentFolder.value)}/subfolder/${encodeURIComponent(folder.name)}`, {
      method: 'DELETE'
    })

    const result = await response.json()

    if (result.success) {
      console.log('文件夹删除成功:', folder.name)
      // 刷新文件夹内容
      fetchFolderDetails()
    } else {
      console.error('文件夹删除失败:', result.error)
      alert(`${t('folderManager_deleteFolderFailed')} ${result.error}`)
    }
  } catch (error) {
    console.error('删除文件夹时出错:', error)
    alert(`${t('folderManager_deleteFolderError')} ${error.message}`)
  }
}

const handleUploadComplete = (result) => {
  console.log(t('folderManager_uploadComplete'), result)
  if (result.success) {
    // 上传成功，刷新文件夹内容
    fetchFolderDetails()
  } else {
    // 上传失败，可以显示错误信息
    console.error(t('folderManager_uploadFailed'), result)
  }
}

// 生命周期
onMounted(() => {
  fetchFolderDetails()
  
  // 点击页面其他地方隐藏右键菜单
  document.addEventListener('click', hideContextMenu)
})

// 监听路由变化
watch(() => route.params.folderName, (newFolderName) => {
  if (newFolderName) {
    fetchFolderDetails()
  }
})
</script>

<style scoped>
.folder-manager {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: white;
}

/* 页面头部 */
.page-header {
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.header-title-section {
  flex: 1;
  min-width: 200px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 操作按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0f2f5;
  color: #4a4a4a;
  border: 1px solid #d9d9d9;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #52c41a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
}

.refresh-button:hover {
  background: #73d13d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.refresh-button.loading {
  opacity: 0.7;
  cursor: wait;
}

/* 面包屑样式 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  color: #1890ff;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.breadcrumb-item:hover {
  color: #40a9ff;
  background: #f0f8ff;
}

.breadcrumb-item-active {
  color: #666;
  cursor: default;
}

.breadcrumb-item-active:hover {
  color: #666;
  background: transparent;
}

.breadcrumb-separator {
  color: #999;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

/* 内容区域 */
.content-area {
  margin-bottom: 32px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #666;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  text-align: center;
  padding: 24px;
}

.error-icon {
  font-size: 48px;
  color: #ff4d4f;
}

.error-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.error-message {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
  max-width: 500px;
}

.retry-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.retry-button:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  font-size: 64px;
  color: #d9d9d9;
}

.empty-text {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
}

.upload-first-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.upload-first-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 内容区域 */
.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

/* 文件夹网格 */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.folder-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.folder-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #d9d9d9;
  transform: translateY(-2px);
}

.folder-icon {
  font-size: 32px;
  color: #1890ff;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-stats {
  font-size: 12px;
  color: #8c8c8c;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #fafafa;
  border-color: #d9d9d9;
}

.file-icon {
  font-size: 24px;
  color: #1890ff;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8c8c8c;
}

.file-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}

.preview-btn {
  color: #1890ff;
}

.download-btn {
  color: #52c41a;
}

.delete-btn {
  color: #ff4d4f;
}

/* 文件预览 */
.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-other {
  text-align: center;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-icon {
  font-size: 64px;
  color: #8c8c8c;
  margin-bottom: 16px;
}

.preview-other .download-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-other .download-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.preview-modal {
  max-width: 90%;
  max-height: 90vh;
  width: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s ease;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  color: #1a1a1a;
  background: #f0f0f0;
}

.modal-body {
  padding: 24px;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1a1a1a;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background: #f0f2f5;
}

.context-menu-item.danger {
  color: #ff4d4f;
}

.context-menu-item.danger:hover {
  background: #fff1f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .folder-grid {
    grid-template-columns: 1fr;
  }
  
  .file-item {
    padding: 12px;
  }
  
  .file-actions {
    opacity: 1;
  }
  
  .breadcrumb {
    flex-wrap: wrap;
  }
  
  .breadcrumb-item {
    margin-bottom: 4px;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 20px;
  }
  
  .back-button, .refresh-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .file-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-header {
    padding: 16px;
  }
}
</style>
