<template>
  <div class="chat-sidebar h-full bg-gray-50 border-r border-gray-200 flex flex-col">
    <!-- 사이드바 헤더 -->
    <div class="p-4 border-b border-gray-200">
      <button
        @click="createNewChat"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>새 채팅</span>
      </button>
    </div>

    <!-- 채팅방 목록 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-2">
        <div
          v-for="chat in chatList"
          :key="chat.id"
          class="chat-item group relative p-3 mb-2 rounded-lg cursor-pointer transition-colors"
          :class="{
            'bg-blue-100 border-l-4 border-blue-500': chat.id === currentChatId,
            'hover:bg-gray-100': chat.id !== currentChatId
          }"
          @click="selectChat(chat.id)"
        >
          <!-- 채팅방 제목 -->
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 
                v-if="editingChatId !== chat.id"
                class="text-sm font-medium text-gray-900 truncate"
                @dblclick="startEditing(chat)"
              >
                {{ chat.title }}
              </h3>
              <input
                v-else
                v-model="editingTitle"
                @blur="finishEditing(chat)"
                @keydown.enter="finishEditing(chat)"
                @keydown.esc="cancelEditing(chat)"
                class="text-sm font-medium text-gray-900 bg-transparent border-none outline-none w-full"
                ref="titleInput"
              />
              <p class="text-xs text-gray-500 mt-1">
                {{ formatTime(chat.updatedAt) }}
              </p>
            </div>
            
            <!-- 채팅방 액션 버튼 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex space-x-1">
              <!-- 즐겨찾기 -->
              <button
                @click.stop="toggleFavorite(chat)"
                class="p-1 rounded hover:bg-gray-200"
                :title="chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
              >
                <svg class="w-4 h-4" :class="chat.isFavorite ? 'text-yellow-500' : 'text-gray-400'" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              
              <!-- 더 보기 메뉴 -->
              <button
                @click.stop="showContextMenu($event, chat)"
                class="p-1 rounded hover:bg-gray-200"
                title="메뉴"
              >
                <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- 채팅방 컬러 인디케이터 -->
          <div 
            v-if="chat.color"
            class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            :style="{ backgroundColor: chat.color }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div
      v-if="contextMenu.show"
      class="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <button
        @click="startEditing(contextMenu.chat)"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        이름 변경
      </button>
      <button
        @click="toggleFavorite(contextMenu.chat)"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        {{ contextMenu.chat.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가' }}
      </button>
      <button
        @click="showColorPicker(contextMenu.chat)"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        색상 변경
      </button>
      <hr class="my-1">
      <button
        @click="deleteChat(contextMenu.chat)"
        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
      >
        삭제
      </button>
    </div>

    <!-- 색상 선택기 -->
    <div
      v-if="colorPicker.show"
      class="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
      :style="{ top: colorPicker.y + 'px', left: colorPicker.x + 'px' }"
      @click.stop
    >
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="color in colorOptions"
          :key="color"
          @click="setColor(colorPicker.chat, color)"
          class="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500"
          :style="{ backgroundColor: color }"
        ></button>
      </div>
      <button
        @click="setColor(colorPicker.chat, null)"
        class="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
      >
        색상 제거
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ChatSidebar',
  data() {
    return {
      editingTitle: '',
      editingChatId: null, // 현재 편집 중인 채팅방 ID
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        chat: null
      },
      colorPicker: {
        show: false,
        x: 0,
        y: 0,
        chat: null
      },
      colorOptions: [
        '#EF4444', '#F97316', '#EAB308', '#22C55E', 
        '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
      ]
    }
  },
  computed: {
    ...mapGetters('chat', ['currentChatId']),
    
    chatList() {
      const chats = this.$store.getters['chat/getChatList']
      
      // 즐겨찾기가 먼저 오고, 그 다음 최근 활동 순으로 정렬
      return chats.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
    }
  },
  mounted() {
    // 전역 클릭 이벤트로 메뉴 닫기
    document.addEventListener('click', this.closeMenus)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeMenus)
  },
  methods: {
    ...mapActions('chat', ['createChat', 'deleteChat', 'updateChat']),
    
    async createNewChat() {
      const chatId = await this.createChat({ title: '새로운 채팅' })
      if (chatId) {
        this.$emit('chat-selected', chatId)
      }
    },
    
    selectChat(chatId) {
      this.$emit('chat-selected', chatId)
    },
    
    startEditing(chat) {
      this.closeMenus()
      this.editingChatId = chat.id
      this.editingTitle = chat.title
      this.$nextTick(() => {
        this.$refs.titleInput?.[0]?.focus()
      })
    },
    
    finishEditing(chat) {
      if (this.editingTitle.trim() && this.editingTitle !== chat.title) {
        this.updateChat({
          chatId: chat.id,
          updates: { title: this.editingTitle.trim() }
        })
      }
      this.cancelEditing(chat)
    },
    
    cancelEditing(chat) {
      this.editingChatId = null
      this.editingTitle = ''
    },
    
    toggleFavorite(chat) {
      this.closeMenus()
      this.updateChat({
        chatId: chat.id,
        updates: { isFavorite: !chat.isFavorite }
      })
    },
    
    showContextMenu(event, chat) {
      // 기존 메뉴들 닫기
      this.closeMenus()
      
      this.contextMenu = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        chat
      }
    },
    
    showColorPicker(chat) {
      this.closeMenus()
      this.colorPicker = {
        show: true,
        x: this.contextMenu.x,
        y: this.contextMenu.y,
        chat
      }
    },
    
    setColor(chat, color) {
      this.updateChat({
        chatId: chat.id,
        updates: { color }
      })
      this.closeMenus()
    },
    
    deleteChat(chat) {
      if (confirm(`"${chat.title}" 채팅방을 삭제하시겠습니까?`)) {
        this.$store.dispatch('chat/deleteChat', chat.id)
      }
      this.closeMenus()
    },
    
    closeMenus() {
      this.contextMenu.show = false
      this.colorPicker.show = false
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
    }
  }
}
</script>

<style scoped>
.chat-sidebar {
  width: 280px;
  min-width: 280px;
  /* 부드러운 애니메이션을 위한 속성 */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.chat-item {
  position: relative;
}

.chat-item.active {
  background-color: #dbeafe;
}

/* 컨텍스트 메뉴 애니메이션 */
.context-menu-enter-active, .context-menu-leave-active {
  transition: opacity 0.2s;
}
.context-menu-enter, .context-menu-leave-to {
  opacity: 0;
}
</style>
