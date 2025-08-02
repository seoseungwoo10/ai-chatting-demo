<template>
  <div class="search-sidebar h-full bg-gray-50 border-r border-gray-200 flex flex-col">
    <!-- 검색 헤더 -->
    <div class="p-4 border-b border-gray-200">
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          @input="debouncedSearch"
          placeholder="메시지 검색..."
          class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
      
      <!-- 검색 결과 요약 -->
      <div class="mt-2 text-sm text-gray-600">
        <span v-if="searchQuery && searchResults.length > 0">
          {{ searchResults.length }}개 결과 발견
        </span>
        <span v-else-if="searchQuery && searchResults.length === 0">
          검색 결과가 없습니다
        </span>
        <span v-else>
          메시지를 검색해보세요
        </span>
      </div>
    </div>

    <!-- 검색 결과 목록 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-2">
        <div v-if="!searchQuery" class="text-center py-8 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p>검색어를 입력하세요</p>
        </div>

        <div v-else-if="isSearching" class="text-center py-8 text-gray-400">
          <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>검색 중...</p>
        </div>

        <div v-else-if="searchResults.length === 0" class="text-center py-8 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1 6-2.168V6.108c0-1.305-.24-2.584-.713-3.756a11.249 11.249 0 00-2.202-3.254"></path>
          </svg>
          <p>"{{ searchQuery }}"에 대한 결과가 없습니다</p>
        </div>

        <!-- 검색 결과 아이템들 -->
        <div
          v-for="result in searchResults"
          :key="`${result.chatId}-${result.messageId}`"
          class="search-result-item group relative p-3 mb-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-100"
          @click="selectSearchResult(result)"
        >
          <div class="flex flex-col">
            <!-- 채팅방 제목 -->
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-900 truncate">
                {{ result.chatTitle }}
              </h4>
              <span class="text-xs text-gray-500">
                {{ formatTime(result.timestamp) }}
              </span>
            </div>
            
            <!-- 메시지 내용 (하이라이팅 포함) -->
            <div class="text-sm text-gray-700">
              <p class="mb-1">
                <span class="text-xs text-blue-600 font-medium">
                  {{ result.sender === 'user' ? '사용자' : 'AI' }}:
                </span>
              </p>
              <div 
                class="search-content"
                v-html="highlightText(result.content, searchQuery)"
              ></div>
            </div>

            <!-- 일치도 표시 -->
            <div class="mt-2 flex items-center">
              <div class="flex-1 bg-gray-200 rounded-full h-1">
                <div 
                  class="bg-blue-500 h-1 rounded-full"
                  :style="{ width: `${Math.round(result.score * 100)}%` }"
                ></div>
              </div>
              <span class="ml-2 text-xs text-gray-500">
                {{ Math.round(result.score * 100) }}% 일치
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Fuse from 'fuse.js'
import { debounce } from 'lodash'

export default {
  name: 'SearchSidebar',
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      fuse: null
    }
  },
  computed: {
    ...mapGetters('chat', ['getAllMessages']),
    
    // 모든 메시지를 검색용 형태로 변환
    searchableMessages() {
      const messages = []
      const chats = this.$store.getters['chat/getChatList']
      
      chats.forEach(chat => {
        if (chat.messages && chat.messages.length > 0) {
          chat.messages.forEach(message => {
            messages.push({
              chatId: chat.id,
              chatTitle: chat.title,
              messageId: message.id,
              content: message.content,
              sender: message.sender,
              timestamp: message.timestamp,
              model: message.model
            })
          })
        }
      })
      
      return messages
    }
  },
  watch: {
    searchableMessages: {
      handler() {
        this.initializeFuse()
      },
      immediate: true
    }
  },
  created() {
    this.debouncedSearch = debounce(this.performSearch, 300)
  },
  methods: {
    initializeFuse() {
      const options = {
        keys: [
          {
            name: 'content',
            weight: 0.7
          },
          {
            name: 'chatTitle',
            weight: 0.3
          }
        ],
        includeScore: true,
        threshold: 0.4, // 0.0은 정확한 일치, 1.0은 모든 것과 일치
        minMatchCharLength: 2,
        ignoreLocation: true
      }
      
      this.fuse = new Fuse(this.searchableMessages, options)
    },
    
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        return
      }
      
      this.isSearching = true
      
      try {
        // 약간의 지연을 주어 실제 검색하는 느낌을 줌
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const results = this.fuse.search(this.searchQuery)
        
        this.searchResults = results.map(result => ({
          ...result.item,
          score: 1 - result.score // 점수를 반전시켜 높을수록 좋게 만듦
        })).slice(0, 50) // 최대 50개 결과만 표시
        
      } catch (error) {
        console.error('검색 중 오류 발생:', error)
        this.searchResults = []
      } finally {
        this.isSearching = false
      }
    },
    
    highlightText(text, query) {
      if (!query.trim()) return text
      
      // HTML 엔티티를 이스케이프
      const escapedText = text.replace(/[&<>"']/g, (match) => {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }
        return map[match]
      })
      
      // 검색어를 하이라이트
      const queryWords = query.trim().split(/\s+/)
      let highlightedText = escapedText
      
      queryWords.forEach(word => {
        const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 font-medium">$1</mark>')
      })
      
      // 텍스트가 너무 길면 자르고 검색어 주변을 보여줌
      if (highlightedText.length > 200) {
        const firstMarkIndex = highlightedText.indexOf('<mark')
        if (firstMarkIndex !== -1) {
          const start = Math.max(0, firstMarkIndex - 50)
          const end = Math.min(highlightedText.length, firstMarkIndex + 150)
          highlightedText = (start > 0 ? '...' : '') + 
                           highlightedText.substring(start, end) + 
                           (end < highlightedText.length ? '...' : '')
        } else {
          highlightedText = highlightedText.substring(0, 200) + '...'
        }
      }
      
      return highlightedText
    },
    
    selectSearchResult(result) {
      // 검색 결과 선택 시 해당 채팅방으로 이동하고 메시지로 스크롤
      this.$emit('result-selected', {
        chatId: result.chatId,
        messageId: result.messageId
      })
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '방금 전'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`
      
      return date.toLocaleDateString()
    },
    
    clearSearch() {
      this.searchQuery = ''
      this.searchResults = []
    }
  }
}
</script>

<style scoped>
.search-sidebar {
  width: 280px;
  min-width: 280px;
  /* 부드러운 애니메이션을 위한 속성 */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.search-result-item {
  position: relative;
}

.search-result-item:hover {
  background-color: #f3f4f6;
}

.search-content {
  line-height: 1.4;
  word-break: break-word;
}

/* 검색 결과 하이라이팅 스타일 */
.search-content :deep(mark) {
  background-color: #fef08a;
  font-weight: 600;
  padding: 1px 2px;
  border-radius: 2px;
}

/* 스크롤바 스타일링 */
.search-sidebar .overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.search-sidebar .overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.search-sidebar .overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.search-sidebar .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.search-sidebar .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
