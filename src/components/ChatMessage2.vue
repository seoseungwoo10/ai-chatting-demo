<template>
  <div class="chat-message" :class="messageClass">
    <!-- Avatar -->
    <div class="avatar-container">
      <div class="avatar" :class="avatarClass">
        {{ message.isUser ? 'U' : 'AI' }}
      </div>
    </div>

    <!-- Message Content -->
    <div class="message-content">
      <div class="message-header">
        <span class="user-name" :class="nameClass">
          {{ message.isUser ? '사용자' : 'AI 어시스턴트' }}
        </span>
        <span class="timestamp">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
      
      <div class="message-bubble prose" :class="bubbleClass">
        <!-- Loading State for AI messages -->
        <div v-if="!message.isUser && message.isStreaming && !message.content" class="flex items-center space-x-2 py-2">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
          <span class="text-sm text-gray-500">AI가 답변을 생성 중입니다...</span>
        </div>
        <!-- Message Content -->
        <div v-else v-html="renderedContent"></div>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <!-- Copy Button -->
        <button
          @click="copyMessage"
          class="action-btn copy-btn"
          :class="{ 'user-copy-btn': message.isUser }"
          title="메시지 복사"
        >
          <svg class="icon" :class="message.isUser ? 'user-icon' : 'ai-icon'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
        
        <!-- Delete Button (only for AI messages) -->
        <button
          v-if="!message.isUser"
          @click="deleteMessage"
          class="action-btn delete-btn"
          title="메시지 삭제"
        >
          <svg class="icon delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
        
        <!-- Refresh Button (only for AI messages) -->
        <button
          v-if="!message.isUser"
          @click="refreshMessage"
          class="action-btn refresh-btn"
          title="답변 새로고침"
        >
          <svg class="icon refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'
import hljs from 'highlight.js'

export default {
  name: 'ChatMessage2',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    messageClass() {
      return this.message.isUser ? 'user-message' : 'ai-message'
    },
    avatarClass() {
      return this.message.isUser ? 'user-avatar' : 'ai-avatar'
    },
    nameClass() {
      return this.message.isUser ? 'user-name-text' : 'ai-name-text'
    },
    bubbleClass() {
      return this.message.isUser ? 'user-bubble' : 'ai-bubble'
    },
    renderedContent() {
      return this.renderMarkdown(this.message.content)
    }
  },
  methods: {
    renderMarkdown(content) {
      // Configure marked with highlight.js
      marked.setOptions({
        highlight: function(code, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(code, { language: lang }).value
            } catch (err) {
              console.error('Highlight.js error:', err)
            }
          }
          return hljs.highlightAuto(code).value
        },
        breaks: true,
        gfm: true
      })

      try {
        let html = marked.parse(content)
        
        // Apply custom styling for user messages (white text)
        if (this.message.isUser) {
          html = html.replace(/<code/g, '<code style="background-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.95); padding: 2px 4px; border-radius: 3px;"')
          html = html.replace(/<pre/g, '<pre style="background-color: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 12px;"')
          html = html.replace(/<blockquote/g, '<blockquote style="border-left: 4px solid rgba(255,255,255,0.5); color: rgba(255,255,255,0.9); margin: 8px 0; padding-left: 12px; font-style: italic;"')
        } else {
          // AI messages - improve code block styling
          html = html.replace(/<pre/g, '<pre style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 12px;"')
          html = html.replace(/<code(?![^>]*style)/g, '<code style="background-color: #f1f3f4; color: #1f2937; padding: 2px 4px; border-radius: 3px;"')
        }
        
        return html
      } catch (error) {
        console.error('Markdown parsing error:', error)
        return content.replace(/\n/g, '<br>')
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const now = new Date()
      const messageTime = new Date(timestamp)
      const diffInSeconds = Math.floor((now - messageTime) / 1000)
      
      if (diffInSeconds < 60) {
        return '방금 전'
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes}분 전`
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours}시간 전`
      } else {
        return messageTime.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    async copyMessage() {
      try {
        await navigator.clipboard.writeText(this.message.content)
        // Show success feedback
        this.showCopyFeedback()
      } catch (err) {
        console.error('Failed to copy message:', err)
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(this.message.content)
      }
    },
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.top = "0"
      textArea.style.left = "0"
      textArea.style.position = "fixed"
      
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        this.showCopyFeedback()
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err)
      }
      
      document.body.removeChild(textArea)
    },
    showCopyFeedback() {
      // Simple feedback - you could enhance this with a toast notification
      const button = event.target.closest('button')
      const originalTitle = button.title
      button.title = '복사됨!'
      
      setTimeout(() => {
        button.title = originalTitle
      }, 2000)
    },
    deleteMessage() {
      // Emit event to parent component to handle deletion
      this.$emit('delete-message', this.message.id)
    },
    refreshMessage() {
      // Emit event to parent component to handle refresh
      this.$emit('refresh-message', this.message.id)
    }
  }
}
</script>

<style scoped>
/* Main chat message container */
.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  animation: fadeInUp 0.3s ease-out;
}

.user-message {
  flex-direction: row-reverse;
}

.ai-message {
  flex-direction: row;
}

/* Avatar styles */
.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.user-avatar {
  background-color: #2563eb;
}

.ai-avatar {
  background-color: #4b5563;
}

/* Message content container */
.message-content {
  flex: 1;
  min-width: 0;
}

/* Message header */
.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-name-text {
  color: #2563eb;
}

.ai-name-text {
  color: #4b5563;
}

.timestamp {
  font-size: 12px;
  color: #6b7280;
}

/* Message bubble */
.message-bubble {
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  max-width: none;
}

.user-bubble {
  background-color: #2563eb;
  color: white;
  margin-left: auto;
  max-width: 400px;
}

.ai-bubble {
  background-color: #f3f4f6;
  color: #111827;
  margin-right: auto;
  max-width: 600px;
}

/* Action buttons */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.chat-message:hover .action-buttons {
  opacity: 1;
}

.action-btn {
  padding: 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.copy-btn:hover {
  background-color: #e5e7eb;
}

.user-copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.delete-btn:hover {
  background-color: #fee2e2;
}

.refresh-btn:hover {
  background-color: #dbeafe;
}

.icon {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease-in-out;
}

.action-btn:hover .icon {
  transform: scale(1.1);
}

.refresh-btn:hover .refresh-icon {
  transform: rotate(180deg) scale(1.1);
  transition: transform 0.3s ease-in-out;
}

.user-icon {
  color: #bfdbfe;
}

.ai-icon {
  color: #6b7280;
}

.delete-icon {
  color: #ef4444;
}

.refresh-icon {
  color: #3b82f6;
}

/* Prose styles for markdown content */
.prose {
  font-size: 14px;
  line-height: 1.6;
}

.prose p {
  margin-top: 8px;
  margin-bottom: 8px;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}

.prose ul, .prose ol {
  margin-top: 8px;
  margin-bottom: 8px;
  padding-left: 24px;
}

.prose li {
  margin-top: 4px;
  margin-bottom: 4px;
}

.prose pre {
  margin-top: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  overflow-x: auto;
}

.prose code {
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.prose blockquote {
  margin-top: 12px;
  margin-bottom: 12px;
  padding-left: 16px;
  font-style: italic;
  border-left: 4px solid #d1d5db;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.prose h1:first-child, .prose h2:first-child, .prose h3:first-child, 
.prose h4:first-child, .prose h5:first-child, .prose h6:first-child {
  margin-top: 0;
}

.prose h1 { font-size: 24px; }
.prose h2 { font-size: 20px; }
.prose h3 { font-size: 18px; }
.prose h4 { font-size: 16px; }
.prose h5 { font-size: 14px; }
.prose h6 { font-size: 12px; }

/* Text selection styling */
.prose ::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

.prose ::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* Special selection styling for user messages */
.user-bubble .prose ::selection {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.user-bubble .prose ::-moz-selection {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Code block selection styling */
.prose pre ::selection {
  background-color: rgba(59, 130, 246, 0.4);
  color: inherit;
}

.prose pre ::-moz-selection {
  background-color: rgba(59, 130, 246, 0.4);
  color: inherit;
}

/* User message code block selection */
.user-bubble .prose pre ::selection {
  background-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.user-bubble .prose pre ::-moz-selection {
  background-color: rgba(255, 255, 255, 0.4);
  color: white;
}

/* Checkbox styling for task lists */
.prose input[type="checkbox"] {
  margin-right: 8px;
}

.prose li > input[type="checkbox"] {
  margin-left: -24px;
  margin-right: 8px;
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
