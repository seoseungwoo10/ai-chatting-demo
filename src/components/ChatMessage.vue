<template>
  <div class="chat-message flex items-start space-x-3 group" :class="messageClass">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" :class="avatarClass">
        {{ message.isUser ? 'U' : 'AI' }}
      </div>
    </div>

    <!-- Message Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center space-x-2 mb-1">
        <span class="text-sm font-medium" :class="nameClass">
          {{ message.isUser ? '사용자' : 'AI 어시스턴트' }}
        </span>
        <span class="text-xs text-gray-500">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
      
      <div class="rounded-lg px-4 py-3 prose prose-sm max-w-none" :class="bubbleClass">
        <div v-html="renderedContent"></div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center justify-end space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <!-- Copy Button -->
        <button
          @click="copyMessage"
          class="p-1 rounded hover:bg-gray-200 transition-colors duration-150"
          :class="{ 'hover:bg-white/20': message.isUser }"
          title="메시지 복사"
        >
          <svg class="w-4 h-4" :class="message.isUser ? 'text-blue-200' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </button>
        
        <!-- Delete Button (only for AI messages) -->
        <button
          v-if="!message.isUser"
          @click="deleteMessage"
          class="p-1 rounded hover:bg-red-100 transition-colors duration-150"
          title="메시지 삭제"
        >
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    messageClass() {
      return this.message.isUser ? 'flex-row-reverse' : ''
    },
    avatarClass() {
      return this.message.isUser 
        ? 'bg-blue-600' 
        : 'bg-gray-600'
    },
    nameClass() {
      return this.message.isUser 
        ? 'text-blue-600' 
        : 'text-gray-600'
    },
    bubbleClass() {
      return this.message.isUser
        ? 'bg-blue-600 text-white ml-auto max-w-md'
        : 'bg-gray-100 text-gray-900 mr-auto max-w-2xl'
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
    }
  }
}
</script>

<style scoped>
/* Override prose styles for better chat appearance */
.prose {
  font-size: 0.875rem;
}

/* Action buttons styling */
.group:hover .opacity-0 {
  opacity: 1;
}

/* Smooth transitions for buttons */
button {
  transition: all 0.15s ease-in-out;
}

button:hover svg {
  transform: scale(1.1);
}

.prose p {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.prose p:first-child {
  margin-top: 0;
}

.prose p:last-child {
  margin-bottom: 0;
}

.prose ul, .prose ol {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.prose li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.prose pre {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.prose code {
  font-size: 0.8rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.prose blockquote {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1rem;
  font-style: italic;
}

.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.prose h1:first-child, .prose h2:first-child, .prose h3:first-child, 
.prose h4:first-child, .prose h5:first-child, .prose h6:first-child {
  margin-top: 0;
}

/* Code highlighting theme adjustments */
.prose pre code {
  background: transparent !important;
  padding: 0;
}

/* Text selection styling */
/* Blue selection for better visibility */
.prose ::selection {
  background-color: rgba(59, 130, 246, 0.3); 
  color: inherit;
}

.prose ::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* Special selection styling for user messages (white text on blue background) */
.bg-blue-600 .prose ::selection {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.bg-blue-600 .prose ::-moz-selection {
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
.bg-blue-600 .prose pre ::selection {
  background-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.bg-blue-600 .prose pre ::-moz-selection {
  background-color: rgba(255, 255, 255, 0.4);
  color: white;
}

/* Checkbox styling for task lists */
.prose input[type="checkbox"] {
  margin-right: 0.5rem;
}

.prose li > input[type="checkbox"] {
  margin-left: -1.5rem;
  margin-right: 0.5rem;
}
</style>
