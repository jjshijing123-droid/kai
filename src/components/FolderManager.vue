<template>
  <div class="folder-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <a-space direction="vertical" :size="16" style="width: 100%">
        <a-row justify="space-between" align="middle">
          <a-col>
            <h1 class="page-title">
              <FolderOpenOutlined />
              {{ currentFolder }}
            </h1>
          </a-col>
          <a-col>
            <a-space>
              <a-button @click="goBack" class="back-button">
                <template #icon>
                  <ArrowLeftOutlined />
                </template>
                {{ t('folderManager_back') }}
              </a-button>
              <a-button @click="refreshFolder" class="refresh-button" :loading="loading">
                <template #icon>
                  <ReloadOutlined />
                </template>
                {{ t('folderManager_refresh') }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>

        <!-- 文件夹路径 -->
        <a-breadcrumb>
          <a-breadcrumb-item @click="goToRoot">
            <HomeOutlined />
            {{ t('folderManager_productFolder') }}
          </a-breadcrumb-item>
          <template v-for="(part, index) in folderPathParts" :key="index">
            <a-breadcrumb-item 
              v-if="index < folderPathParts.length - 1"
              @click="goToFolderPath(part.path)"
            >
              {{ part.name }}
            </a-breadcrumb-item>
            <a-breadcrumb-item v-else>
              {{ part.name }}
            </a-breadcrumb-item>
          </template>
        </a-breadcrumb>
      </a-space>
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
      <a-spin v-if="loading" :spinning="loading" size="large" class="loading-spin">
        <template #indicator>
          <a-spin size="large" />
        </template>
      </a-spin>

      <!-- 错误状态 -->
      <a-result
        v-else-if="error"
        status="error"
        :title="t('folderManager_loadingFailed')"
        :sub-title="error"
      >
        <template #extra>
          <a-button type="primary" @click="fetchFolderDetails">
            {{ t('folderManager_retry') }}
          </a-button>
        </template>
      </a-result>

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
                <FolderOutlined />
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
                <FileImageOutlined v-if="isImageFile(file.name)" />
                <FileOutlined v-else />
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-details">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>{{ formatDate(file.modified) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <a-button
                  type="text"
                  size="small"
                  @click.stop="previewFile(file)"
                  :title="t('folderManager_preview')"
                >
                  <EyeOutlined />
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  @click.stop="downloadFile(file)"
                  :title="t('folderManager_download')"
                >
                  <DownloadOutlined />
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  @click.stop="deleteFile(file)"
                  :title="t('folderManager_delete')"
                  danger
                >
                  <DeleteOutlined />
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <a-empty
          v-if="!loading && !error && subfolders.length === 0 && files.length === 0"
          :image="simpleImage"
          class="empty-state"
        >
          <template #description>
            <p>{{ t('folderManager_folderEmpty') }}</p>
          </template>
          <a-upload
            :before-upload="beforeUpload"
            :show-upload-list="false"
            :multiple="true"
          >
            <a-button type="primary">
              {{ t('folderManager_uploadFirstFile') }}
            </a-button>
          </a-upload>
        </a-empty>
      </div>
    </div>

    <!-- 文件预览模态框 -->
    <a-modal
      v-model:open="showPreviewModal"
      :title="previewFileInfo?.name"
      width="80%"
      :footer="null"
      @cancel="closePreview"
    >
      <div v-if="previewFileInfo" class="preview-content">
        <img
          v-if="isImageFile(previewFileInfo.name)"
          :src="getFileUrl(previewFileInfo)"
          :alt="previewFileInfo.name"
          class="preview-image"
        />
        <div v-else class="preview-other">
          <FileOutlined class="preview-icon" />
          <p>{{ t('folderManager_previewNotSupported') }}</p>
          <a-button type="primary" @click="downloadFile(previewFileInfo)">
            <DownloadOutlined />
            {{ t('folderManager_downloadFile') }}
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click="hideContextMenu"
    >
      <template v-if="contextMenuType === 'folder'">
        <div class="context-menu-item" @click="openSubfolder(contextMenuItem.name)">
          <FolderOpenOutlined />
          <span>{{ t('folderManager_open') }}</span>
        </div>
        <div class="context-menu-item" @click="renameFolder(contextMenuItem)">
          <EditOutlined />
          <span>{{ t('folderManager_rename') }}</span>
        </div>
        <div class="context-menu-item danger" @click="deleteFolder(contextMenuItem)">
          <DeleteOutlined />
          <span>{{ t('folderManager_delete') }}</span>
        </div>
      </template>
      <template v-else-if="contextMenuType === 'file'">
        <div class="context-menu-item" @click="previewFile(contextMenuItem)">
          <EyeOutlined />
          <span>{{ t('folderManager_preview') }}</span>
        </div>
        <div class="context-menu-item" @click="downloadFile(contextMenuItem)">
          <DownloadOutlined />
          <span>{{ t('folderManager_download') }}</span>
        </div>
        <div class="context-menu-item" @click="deleteFile(contextMenuItem)">
          <DeleteOutlined />
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
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FileOutlined,
  FileImageOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  HomeOutlined,
  EditOutlined
} from '@ant-design/icons-vue'

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

.upload-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.upload-button:hover {
  background: linear-gradient(135deg, #40a9ff, #5cdbd3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
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

/* 面包屑 */
:deep(.ant-breadcrumb) {
  font-size: 14px;
}

:deep(.ant-breadcrumb a) {
  color: #1890ff;
  cursor: pointer;
}

:deep(.ant-breadcrumb a:hover) {
  color: #40a9ff;
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
  font-size: 64px;
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

/* 加载状态 */
.loading-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folder-manager {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
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
  
  .back-button, .upload-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .file-details {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
