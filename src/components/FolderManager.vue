<template>
  <div class="folder-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title-section">
        <h1 class="page-title">
          <LucideIcon name="Folder" size="28" />
          {{ currentFolder }}
        </h1>
        
        <div class="action-buttons">
          <Button @click="goBack" variant="text" class="back-button">
            <LucideIcon name="ArrowLeft" size="16" />
            {{ t('folderManager_back') }}
          </Button>
          <Button @click="refreshFolder" :loading="loading" variant="secondary" class="refresh-button">
            <LucideIcon name="RefreshCw" size="16" />
            {{ t('folderManager_refresh') }}
          </Button>
        </div>
      </div>

      <!-- 面包屑导航 -->
      <Breadcrumb 
        :items="breadcrumbItems" 
        @click="handleBreadcrumbClick"
      />
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
      <div v-if="loading" class="loading-spin">
        <div class="spinner">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <h3>{{ t('folderManager_loadingFailed') }}</h3>
          <p>{{ error }}</p>
          <Button @click="fetchFolderDetails" variant="primary">
            {{ t('folderManager_retry') }}
          </Button>
        </div>
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
              <LucideIcon name="Folder" size="32" class="folder-icon" />
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
                <LucideIcon v-if="isImageFile(file.name)" name="Image" size="24" />
                <LucideIcon v-else name="FileText" size="24" />
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-details">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>{{ formatDate(file.modified) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <Button
                  variant="text"
                  size="small"
                  @click.stop="previewFile(file)"
                  :title="t('folderManager_preview')"
                >
                  <LucideIcon name="Eye" size="16" />
                </Button>
                <Button
                  variant="text"
                  size="small"
                  @click.stop="downloadFile(file)"
                  :title="t('folderManager_download')"
                >
                  <LucideIcon name="Download" size="16" />
                </Button>
                <Button
                  variant="text"
                  size="small"
                  @click.stop="deleteFile(file)"
                  :title="t('folderManager_delete')"
                  class="danger"
                >
                  <LucideIcon name="Trash2" size="16" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && !error && subfolders.length === 0 && files.length === 0" class="empty-state">
          <div class="empty-content">
            <LucideIcon name="FolderOpen" size="64" class="empty-icon" />
            <p>{{ t('folderManager_folderEmpty') }}</p>
            <Button variant="primary" @click="triggerUpload">
              {{ t('folderManager_uploadFirstFile') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <Modal
      :open="showPreviewModal"
      :title="previewFileInfo?.name"
      width="80%"
      @close="closePreview"
      :showFooter="false"
    >
      <div v-if="previewFileInfo" class="preview-content">
        <img
          v-if="isImageFile(previewFileInfo.name)"
          :src="getFileUrl(previewFileInfo)"
          :alt="previewFileInfo.name"
          class="preview-image"
        />
        <div v-else class="preview-other">
          <LucideIcon name="FileText" size="64" class="preview-icon" />
          <p>{{ t('folderManager_previewNotSupported') }}</p>
          <Button variant="primary" @click="downloadFile(previewFileInfo)">
            <LucideIcon name="Download" size="16" />
            {{ t('folderManager_downloadFile') }}
          </Button>
        </div>
      </div>
    </Modal>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click="hideContextMenu"
    >
      <template v-if="contextMenuType === 'folder'">
        <div class="context-menu-item" @click="openSubfolder(contextMenuItem.name)">
          <LucideIcon name="FolderOpen" size="16" />
          <span>{{ t('folderManager_open') }}</span>
        </div>
        <div class="context-menu-item" @click="renameFolder(contextMenuItem)">
          <LucideIcon name="Edit" size="16" />
          <span>{{ t('folderManager_rename') }}</span>
        </div>
        <div class="context-menu-item danger" @click="deleteFolder(contextMenuItem)">
          <LucideIcon name="Trash2" size="16" />
          <span>{{ t('folderManager_delete') }}</span>
        </div>
      </template>
      <template v-else-if="contextMenuType === 'file'">
        <div class="context-menu-item" @click="previewFile(contextMenuItem)">
          <LucideIcon name="Eye" size="16" />
          <span>{{ t('folderManager_preview') }}</span>
        </div>
        <div class="context-menu-item" @click="downloadFile(contextMenuItem)">
          <LucideIcon name="Download" size="16" />
          <span>{{ t('folderManager_download') }}</span>
        </div>
        <div class="context-menu-item" @click="deleteFile(contextMenuItem)">
          <LucideIcon name="Trash2" size="16" />
          <span>{{ t('folderManager_delete') }}</span>
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
import Button from './ui/button.vue'
import Modal from './ui/modal.vue'
import Breadcrumb from './ui/breadcrumb.vue'
import LucideIcon from './ui/LucideIcon.vue'

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

const breadcrumbItems = computed(() => {
  if (!currentFolder.value) return []
  
  const parts = currentFolder.value.split('/')
  const result = []
  
  let currentPath = ''
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
      result.push({
        label: parts[i],
        path: currentPath,
        icon: i === 0 ? 'Home' : null
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

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    folderDetails.value = {
      folders: {
        images_6Views: { fileCount: 6, path: `${folderPath}/images_6Views` },
        images_other: { fileCount: 3, path: `${folderPath}/images_other` }
      },
      files: [
        { name: 'image_00.webp', size: 1024000, modified: '2023-12-01T10:30:00Z' },
        { name: 'readme.txt', size: 2048, modified: '2023-12-01T09:15:00Z' }
      ]
    }
    currentFolder.value = folderPath
    
  } catch (err) {
    console.error('获取文件夹详情错误:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const openSubfolder = (folderName) => {
  const subfolderPath = `${currentFolder.value}/${folderName}`
  router.push(`/folder/${encodeURIComponent(subfolderPath)}`)
}

const refreshFolder = () => {
  fetchFolderDetails()
}

const triggerUpload = () => {
  // 触发上传组件
  const uploadButton = document.querySelector('.upload-button')
  if (uploadButton) {
    uploadButton.click()
  }
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
    // 模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))
    // 刷新文件夹内容
    fetchFolderDetails()
  } catch (error) {
    console.error('删除文件时出错:', error)
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

const handleBreadcrumbClick = (item, index) => {
  router.push(`/folder/${encodeURIComponent(item.path)}`)
}

const goBack = () => {
  router.back()
}

const renameFolder = async (folder) => {
  const newName = prompt(t('folderManager_enterNewName'), folder.name)
  
  if (!newName || newName === folder.name) {
    return
  }

  try {
    // 模拟重命名操作
    await new Promise(resolve => setTimeout(resolve, 500))
    fetchFolderDetails()
  } catch (error) {
    console.error('重命名文件夹时出错:', error)
  }
}

const deleteFolder = async (folder) => {
  if (!confirm(t('folderManager_confirmDeleteFolder', { name: folder.name }))) {
    return
  }

  try {
    // 模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 500))
    fetchFolderDetails()
  } catch (error) {
    console.error('删除文件夹时出错:', error)
  }
}

const handleUploadComplete = (result) => {
  console.log(t('folderManager_uploadComplete'), result)
  if (result.success) {
    fetchFolderDetails()
  }
}

// 生命周期
onMounted(() => {
  fetchFolderDetails()
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

.page-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.page-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border-radius: 2px;
}

.action-buttons {
  display: flex;
  gap: 8px;
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
}

.preview-icon {
  color: #8c8c8c;
  margin-bottom: 16px;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
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

/* 状态样式 */
.loading-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.spinner {
  font-size: 16px;
  color: #1890ff;
}

.error-state {
  padding: 80px 20px;
  text-align: center;
}

.error-content h3 {
  margin-bottom: 8px;
  color: #262626;
}

.error-content p {
  margin-bottom: 16px;
  color: #8c8c8c;
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  color: #d9d9d9;
}

.empty-content p {
  color: #8c8c8c;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .page-title-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
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
}

@media (max-width: 576px) {
  .page-title {
    font-size: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
  
  .file-details {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
