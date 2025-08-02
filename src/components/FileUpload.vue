<template>
  <div class="file-upload-wrapper">
    <!-- 파일 업로드 영역 -->
    <div 
      class="file-upload-area"
      :class="{ 
        'drag-active': isDragActive,
        'has-files': uploadedFiles.length > 0
      }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleFileDrop"
      @click="openFileDialog"
    >
      <input 
        type="file" 
        ref="fileInput"
        @change="handleFileSelect"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.docx"
        class="hidden"
      />
      
      <!-- 업로드 존 -->
      <div class="upload-zone" v-if="uploadedFiles.length === 0">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
        </svg>
        <p class="upload-text">
          <span class="primary-text">파일을 드래그하거나 클릭하여 업로드</span>
          <span class="secondary-text">JPG, PNG, PDF, TXT, MD 파일 지원 (최대 10MB)</span>
        </p>
      </div>
      
      <!-- 파일 추가 버튼 (파일이 있을 때) -->
      <div class="add-more-zone" v-else>
        <svg class="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>파일 추가</span>
      </div>
    </div>
    
    <!-- 업로드된 파일 목록 -->
    <div class="uploaded-files" v-if="uploadedFiles.length > 0">
      <div 
        v-for="file in uploadedFiles" 
        :key="file.id" 
        class="file-item"
        :class="{ 'uploading': file.uploading, 'error': file.error }"
      >
        <!-- 파일 썸네일 -->
        <div class="file-thumbnail">
          <img v-if="file.type === 'image' && file.thumbnail" 
               :src="file.thumbnail" 
               :alt="file.name"
               class="thumbnail-image" />
          <div v-else class="file-icon" :class="`icon-${file.extension}`">
            <svg v-if="file.extension === 'pdf'" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <svg v-else-if="file.extension === 'txt' || file.extension === 'md'" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <svg v-else fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        </div>
        
        <!-- 파일 정보 -->
        <div class="file-info">
          <div class="file-name" :title="file.name">{{ file.name }}</div>
          <div class="file-details">
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span v-if="file.uploading" class="upload-status">
              업로드 중... {{ file.progress }}%
            </span>
            <span v-else-if="file.error" class="error-status">
              업로드 실패
            </span>
            <span v-else class="success-status">
              업로드 완료
            </span>
          </div>
          
          <!-- 진행률 바 -->
          <div v-if="file.uploading" class="progress-bar">
            <div class="progress-fill" :style="{ width: `${file.progress}%` }"></div>
          </div>
        </div>
        
        <!-- 삭제 버튼 -->
        <button 
          @click.stop="removeFile(file.id)"
          class="remove-btn"
          :disabled="file.uploading"
          title="파일 제거"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="error-message">
      <svg class="error-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12,2L13.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L10.91,8.26L12,2Z" />
      </svg>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import imageCompression from 'browser-image-compression'

export default {
  name: 'FileUpload',
  data() {
    return {
      isDragActive: false,
      uploadedFiles: [],
      errorMessage: '',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      allowedTypes: {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'text/markdown': 'md',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
      }
    }
  },
  methods: {
    openFileDialog() {
      this.$refs.fileInput.click()
    },
    
    handleDragOver(e) {
      e.preventDefault()
      this.isDragActive = true
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      // 드래그가 완전히 벗어났는지 확인
      if (!e.relatedTarget || !this.$el.contains(e.relatedTarget)) {
        this.isDragActive = false
      }
    },
    
    handleFileDrop(e) {
      e.preventDefault()
      this.isDragActive = false
      const files = Array.from(e.dataTransfer.files)
      this.processFiles(files)
    },
    
    handleFileSelect(e) {
      const files = Array.from(e.target.files)
      this.processFiles(files)
      // input 값 초기화
      e.target.value = ''
    },
    
    async processFiles(files) {
      this.errorMessage = ''
      
      // 파일 개수 제한 확인
      if (this.uploadedFiles.length + files.length > this.maxFiles) {
        this.errorMessage = `최대 ${this.maxFiles}개의 파일만 업로드할 수 있습니다.`
        return
      }
      
      for (const file of files) {
        if (!this.validateFile(file)) {
          continue
        }
        
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: this.getFileType(file),
          extension: this.allowedTypes[file.type] || 'unknown',
          uploading: true,
          progress: 0,
          error: false,
          thumbnail: null,
          content: null,
          originalFile: file
        }
        
        this.uploadedFiles.push(fileData)
        
        try {
          await this.uploadFile(fileData)
        } catch (error) {
          console.error('파일 업로드 실패:', error)
          fileData.error = true
          fileData.uploading = false
        }
      }
    },
    
    validateFile(file) {
      // 파일 타입 확인
      if (!this.allowedTypes[file.type]) {
        this.errorMessage = `지원하지 않는 파일 형식입니다: ${file.name}`
        return false
      }
      
      // 파일 크기 확인
      if (file.size > this.maxFileSize) {
        this.errorMessage = `파일 크기가 너무 큽니다: ${file.name} (최대 ${this.formatFileSize(this.maxFileSize)})`
        return false
      }
      
      // 중복 파일 확인
      if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        this.errorMessage = `이미 업로드된 파일입니다: ${file.name}`
        return false
      }
      
      return true
    },
    
    async uploadFile(fileData) {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        if (fileData.progress < 90) {
          fileData.progress += Math.random() * 20
        }
      }, 100)
      
      try {
        // 파일 타입별 처리
        if (fileData.type === 'image') {
          await this.processImage(fileData)
        } else if (fileData.extension === 'pdf') {
          await this.processPDF(fileData)
        } else if (fileData.extension === 'txt' || fileData.extension === 'md') {
          await this.processText(fileData)
        }
        
        // 업로드 완료
        clearInterval(progressInterval)
        fileData.progress = 100
        fileData.uploading = false
        
        // 부모 컴포넌트에 파일 정보 전달
        this.$emit('file-uploaded', {
          id: fileData.id,
          name: fileData.name,
          type: fileData.type,
          extension: fileData.extension,
          content: fileData.content,
          thumbnail: fileData.thumbnail
        })
        
      } catch (error) {
        clearInterval(progressInterval)
        fileData.error = true
        fileData.uploading = false
        throw error
      }
    },
    
    async processImage(fileData) {
      const file = fileData.originalFile
      
      try {
        // 이미지 압축 (2MB 이상인 경우)
        let processedFile = file
        if (file.size > 2 * 1024 * 1024) {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true
          }
          processedFile = await imageCompression(file, options)
        }
        
        // 썸네일 생성
        fileData.thumbnail = await this.createImageThumbnail(processedFile)
        
        // Base64로 변환하여 저장
        fileData.content = await this.fileToBase64(processedFile)
        
      } catch (error) {
        console.error('이미지 처리 실패:', error)
        // 원본 파일로 폴백
        fileData.thumbnail = await this.createImageThumbnail(file)
        fileData.content = await this.fileToBase64(file)
      }
    },
    
    async processPDF(fileData) {
      const file = fileData.originalFile
      
      try {
        // PDF.js로 첫 페이지 텍스트 추출 (간단한 구현)
        const arrayBuffer = await file.arrayBuffer()
        fileData.content = `[PDF 파일: ${file.name}]`
        
        // 실제 PDF 텍스트 추출은 복잡하므로 간단히 파일 정보만 저장
        
      } catch (error) {
        console.error('PDF 처리 실패:', error)
        fileData.content = `[PDF 파일: ${file.name}]`
      }
    },
    
    async processText(fileData) {
      const file = fileData.originalFile
      
      try {
        // 텍스트 파일 내용 읽기
        fileData.content = await file.text()
        
        // 너무 긴 텍스트는 일부만 저장
        if (fileData.content.length > 10000) {
          fileData.content = fileData.content.substring(0, 10000) + '...'
        }
        
      } catch (error) {
        console.error('텍스트 파일 처리 실패:', error)
        fileData.content = `[텍스트 파일: ${file.name}]`
      }
    },
    
    async createImageThumbnail(file) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // 썸네일 크기 계산 (최대 100x100)
          const maxSize = 100
          let { width, height } = img
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)
          
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        
        img.onerror = () => {
          resolve(null)
        }
        
        img.src = URL.createObjectURL(file)
      })
    },
    
    async fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    
    getFileType(file) {
      if (file.type.startsWith('image/')) {
        return 'image'
      } else if (file.type === 'application/pdf') {
        return 'document'
      } else if (file.type.startsWith('text/')) {
        return 'text'
      }
      return 'document'
    },
    
    removeFile(fileId) {
      const index = this.uploadedFiles.findIndex(f => f.id === fileId)
      if (index !== -1) {
        const file = this.uploadedFiles[index]
        this.uploadedFiles.splice(index, 1)
        this.$emit('file-removed', file.id)
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    },
    
    clearFiles() {
      this.uploadedFiles = []
      this.errorMessage = ''
    },
    
    getUploadedFiles() {
      return this.uploadedFiles.filter(f => !f.uploading && !f.error)
    }
  }
}
</script>

<style scoped>
.file-upload-wrapper {
  margin-bottom: 16px;
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9fafb;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.file-upload-area.drag-active {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.file-upload-area.has-files {
  padding: 12px;
  margin-bottom: 12px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
  margin-bottom: 12px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-text {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.secondary-text {
  font-size: 14px;
  color: #6b7280;
}

.add-more-zone {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
}

.add-icon {
  width: 20px;
  height: 20px;
}

.uploaded-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-item.uploading {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.file-item.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.file-thumbnail {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f3f4f6;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  width: 32px;
  height: 32px;
  color: #6b7280;
}

.file-icon.icon-pdf {
  color: #ef4444;
}

.file-icon.icon-txt,
.file-icon.icon-md {
  color: #3b82f6;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.file-size {
  color: #6b7280;
}

.upload-status {
  color: #3b82f6;
}

.success-status {
  color: #10b981;
}

.error-status {
  color: #ef4444;
}

.progress-bar {
  margin-top: 4px;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: #ef4444;
  background-color: #fef2f2;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.hidden {
  display: none;
}
</style>
