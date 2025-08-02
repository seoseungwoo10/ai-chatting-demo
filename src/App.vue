<template>
  <div id="app" class="h-screen bg-gray-100 flex flex-col">
    <!-- 인증 모달 -->
    <AuthModal
      v-if="!isAuthenticated"
      @success="handleAuthSuccess"
    />

    <!-- 메인 레이아웃 -->
    <div v-if="isAuthenticated" class="flex h-full">
      <!-- 채팅 사이드바 -->
      <transition name="sidebar">
        <ChatSidebar 
          v-if="sidebarVisible"
          @chat-selected="handleChatSelected" 
        />
      </transition>
      
      <!-- 메인 채팅 영역 -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="bg-white flex flex-col h-full">
          <!-- Header -->
          <div class="bg-blue-600 text-white px-6 py-4 flex-shrink-0">
            <div class="flex justify-between items-center">
              <div class="flex items-center space-x-3">
                <!-- 사이드바 토글 버튼 -->
                <button
                  @click="toggleSidebar"
                  class="p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                  :title="sidebarVisible ? '사이드바 숨기기' : '사이드바 보기'"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                
                <div>
                  <h1 class="text-xl font-semibold">{{ getCurrentChat?.title || 'AI 채팅 데모' }}</h1>
                  <p class="text-blue-100 text-sm">마크다운 지원 채팅창</p>
                </div>
              </div>
              
              <!-- 사용자 프로필 -->
              <div class="text-white">
                <UserProfile />
              </div>
            </div>
          </div>

          <!-- Chat Messages -->
          <div
            class="chat-container overflow-y-auto p-4 space-y-4 flex-1 min-h-0"
            ref="chatContainer"
          >
            <div v-if="!safeCurrentMessages.length" class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.954 8.954 0 01-2.965-.516L3 20l.735-2.706A8.95 8.95 0 013 15c0-4.418 3.582-8 8-8s8 3.582 8 5z"></path>
                </svg>
                <p class="text-lg">새로운 대화를 시작해보세요!</p>
                <p class="text-sm text-gray-400 mt-2">아래에 메시지를 입력하거나 데모 버튼을 클릭하세요.</p>
              </div>
            </div>
            
            <ChatMessage2
              v-for="message in safeCurrentMessages"
              :key="message.id"
              :message="message"
              @delete-message="deleteMessage"
              @refresh-message="refreshMessage"
            />
          </div>

          <!-- Input Area -->
          <div class="border-t border-gray-200 p-4 flex-shrink-0">
            <!-- Model Selection Bar -->
            <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div class="flex items-center space-x-3">
                <label class="text-sm font-medium text-gray-700">AI 모델:</label>
                <select 
                  v-model="selectedModel" 
                  class="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="isLoading"
                >
                  <optgroup label="OpenAI">
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </optgroup>
                  <optgroup label="Anthropic">
                    <option value="claude-3-5-haiku-20241022">Claude Haiku 3.5</option>
                    <option value="claude-3-5-sonnet-20241022">Sonnet 3</option>
                  </optgroup>
                </select>
              </div>
              
              <!-- API Status -->
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-600">
                  {{ apiStatus.isValid ? 'API 준비됨' : 'API 키 필요' }}
                </span>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <div class="flex-1">
                <textarea
                  v-model="inputMessage"
                  @keydown.enter="handleEnter"
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈, Enter로 전송)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                ></textarea>
              </div>
              <div class="flex flex-col space-y-2">
                <button
                  @click="sendMessage"
                  :disabled="!inputMessage.trim() || isLoading"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading">전송 중...</span>
                  <span v-else>전송</span>
                </button>
                <button
                  @click="clearChat"
                  class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          <!-- Demo Buttons -->
          <div class="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <h3 class="text-sm font-medium text-gray-700 mb-2">데모 메시지:</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="demo in demoMessages"
                :key="demo.id"
                @click="sendDemoMessage(demo)"
                class="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {{ demo.title }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ChatMessage2 from './components/ChatMessage2.vue'
import ChatSidebar from './components/ChatSidebar.vue'
import AuthModal from './components/auth/AuthModal.vue'
import UserProfile from './components/auth/UserProfile.vue'
import apiService from './services/apiService.js'

export default {
  name: 'App',
  components: {
    ChatMessage2,
    ChatSidebar,
    AuthModal,
    UserProfile
  },
  data() {
    return {
      inputMessage: '',
      isLoading: false,
      selectedModel: 'gpt-4o-mini',
      sidebarVisible: true, // 사이드바 표시 상태
      apiStatus: {
        isValid: false,
        errors: []
      },
      demoMessages: [
        {
          id: 1,
          title: '코드 작성 요청',
          content: 'JavaScript로 배열에서 중복값을 제거하는 함수를 작성해주세요.'
        },
        {
          id: 2,
          title: '설명 요청',
          content: 'React와 Vue.js의 차이점을 설명해주세요.'
        },
        {
          id: 3,
          title: '문제 해결',
          content: 'Python에서 리스트를 정렬하는 다양한 방법들을 알려주세요.'
        },
        {
          id: 4,
          title: '코드 리뷰',
          content: '다음 코드를 개선할 수 있는 방법이 있나요?\n\n```javascript\nfunction getData() {\n  return fetch("/api/data")\n    .then(response => response.json())\n    .then(data => data)\n    .catch(error => console.log(error))\n}\n```'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated', 'currentUser']),
    ...mapGetters('chat', ['currentChatId']),
    
    // 직접 구현한 getCurrentChat
    getCurrentChat() {
      const chatId = this.$store.getters['chat/currentChatId']
      if (!chatId) return null
      return this.$store.getters['chat/getChatById'](chatId)
    },
    
    // 직접 구현한 currentMessages
    currentMessages() {
      const chat = this.getCurrentChat
      return chat ? chat.messages || [] : []
    },
    
    // currentMessages가 undefined인 경우 빈 배열 반환
    safeCurrentMessages() {
      return this.currentMessages || []
    }
  },
  async mounted() {
    // 세션 복원 시도
    await this.restoreSession()
    
    // API 키 상태 확인
    this.checkApiKeys()
    
    // 인증된 사용자가 있으면 채팅 초기화
    if (this.isAuthenticated) {
      this.initializeChat()
    }
    
    // 키보드 단축키 이벤트 리스너 추가
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy() {
    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    ...mapActions('auth', ['restoreSession']),
    ...mapActions('chat', ['createChat', 'addMessage', 'deleteMessage', 'restoreLastChat']),
    
    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible
    },
    
    handleKeydown(event) {
      // Ctrl + B 또는 Cmd + B로 사이드바 토글
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        this.toggleSidebar()
      }
    },
    
    async handleAuthSuccess() {
      this.initializeChat()
    },
    
    handleChatSelected(chatId) {
      this.$store.commit('chat/SET_CURRENT_CHAT', chatId)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    
    initializeChat() {
      // 먼저 마지막 채팅방 복원 시도
      const restored = this.restoreLastChat()
      
      // 복원되지 않은 경우에만 새 채팅방 생성
      if (!restored && !this.getCurrentChat) {
        this.createChat()
      }
    },

    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return

      // 인증 체크
      if (!this.isAuthenticated) {
        console.warn('사용자가 인증되지 않았습니다.')
        return
      }

      // API 키 검증
      if (!this.apiStatus.isValid) {
        this.showApiKeyError()
        return
      }

      // 현재 채팅이 없으면 생성
      let currentChatId = this.$store.getters['chat/currentChatId']
      
      if (!currentChatId) {
        currentChatId = await this.createChat()
        if (!currentChatId) {
          console.error('채팅 생성에 실패했습니다.')
          return
        }
        
        // 채팅 생성 후 상태 확인
        await this.$nextTick()
      }

      // 사용자 메시지 추가
      const userMessage = this.inputMessage

      try {
        const addedMessage = await this.addMessage({
          chatId: currentChatId,
          message: {
            content: userMessage,
            sender: 'user',
            model: this.selectedModel
          }
        })
        
        if (!addedMessage) {
          throw new Error('사용자 메시지 추가에 실패했습니다.')
        }

        this.inputMessage = ''

        // AI에게 전송
        await this.sendToAI(userMessage, currentChatId)
      } catch (error) {
        console.error('메시지 전송 중 오류:', error)
        // 입력 메시지 복원
        this.inputMessage = this.inputMessage || userMessage
      }
    },

    async sendToAI(userMessage, chatId) {
      this.isLoading = true
      let aiMessage = null

      try {
        // AI 메시지 플레이스홀더 생성
        aiMessage = await this.addMessage({
          chatId,
          message: {
            content: '',
            sender: 'ai',
            model: this.selectedModel,
            isStreaming: true
          }
        })

        if (!aiMessage) {
          throw new Error('AI 메시지 생성에 실패했습니다.')
        }

        // Vuex 상태 업데이트를 기다림
        await this.$nextTick()

        // 대화 히스토리 구성 (최근 10개 메시지)
        const conversationMessages = this.safeCurrentMessages
          .filter(msg => !msg.isStreaming)
          .slice(-10)
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))

        // 현재 사용자 메시지 추가
        conversationMessages.push({
          role: 'user',
          content: userMessage
        })

        // AI 메시지 인덱스 찾기
        let aiMessageIndex = -1
        let retryCount = 0
        
        while (aiMessageIndex === -1 && retryCount < 3) {
          aiMessageIndex = this.safeCurrentMessages.findIndex(msg => msg.id === aiMessage.id)
          if (aiMessageIndex === -1) {
            await this.$nextTick()
            retryCount++
          }
        }
        
        if (aiMessageIndex === -1) {
          console.error('AI 메시지를 찾을 수 없습니다.')
          throw new Error('AI 메시지를 찾을 수 없습니다.')
        }

        // API에서 스트리밍 응답 받기
        await apiService.streamResponse(
          conversationMessages,
          this.selectedModel,
          (chunk) => {
            // 스트리밍 텍스트로 AI 메시지 업데이트
            if (aiMessageIndex !== -1) {
              const currentMessage = this.safeCurrentMessages[aiMessageIndex]
              if (currentMessage) {
                this.$store.commit('chat/UPDATE_MESSAGE', {
                  userId: this.currentUser.id,
                  chatId,
                  messageIndex: aiMessageIndex,
                  updates: {
                    content: currentMessage.content + chunk
                  }
                })
                this.$nextTick(() => {
                  this.scrollToBottom()
                })
              }
            }
          }
        )

        // 스트리밍 완료 표시
        if (aiMessageIndex !== -1) {
          this.$store.commit('chat/UPDATE_MESSAGE', {
            userId: this.currentUser.id,
            chatId,
            messageIndex: aiMessageIndex,
            updates: {
              isStreaming: false
            }
          })
        }

      } catch (error) {
        console.error('AI API Error:', error)
        
        // 에러 메시지로 AI 메시지 업데이트
        if (aiMessage) {
          // AI 메시지 인덱스 찾기 (재시도 로직)
          let errorMessageIndex = -1
          let retryCount = 0
          while (errorMessageIndex === -1 && retryCount < 3) {
            errorMessageIndex = this.safeCurrentMessages.findIndex(msg => msg.id === aiMessage.id)
            if (errorMessageIndex === -1) {
              await this.$nextTick()
              retryCount++
            }
          }
          
          if (errorMessageIndex !== -1) {
            this.$store.commit('chat/UPDATE_MESSAGE', {
              userId: this.currentUser.id,
              chatId,
              messageIndex: errorMessageIndex,
              updates: {
                content: `❌ **오류 발생**: ${error.message}\n\n다음을 확인해주세요:\n- API 키가 올바른지 확인\n- 네트워크 연결 상태 확인\n- 선택된 모델이 사용 가능한지 확인`,
                isStreaming: false
              }
            })
          }
        }
      } finally {
        this.isLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    sendDemoMessage(demo) {
      this.inputMessage = demo.content
      this.sendMessage()
    },

    clearChat() {
      if (this.getCurrentChat) {
        this.$store.commit('chat/UPDATE_CHAT', {
          userId: this.currentUser.id,
          chatId: this.$store.getters['chat/currentChatId'],
          updates: { messages: [] }
        })
      }
    },

    deleteMessage(messageId) {
      const messageIndex = this.safeCurrentMessages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        this.$store.dispatch('chat/deleteMessage', {
          chatId: this.$store.getters['chat/currentChatId'],
          messageIndex
        })
      }
    },

    async refreshMessage(messageId) {
      // AI 메시지인지 확인
      const messageIndex = this.safeCurrentMessages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1 || this.safeCurrentMessages[messageIndex].sender === 'user') {
        return
      }

      // API 키 검증
      if (!this.apiStatus.isValid) {
        this.showApiKeyError()
        return
      }

      // 해당 메시지의 이전 사용자 메시지 찾기
      let userMessage = ''
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (this.safeCurrentMessages[i].sender === 'user') {
          userMessage = this.safeCurrentMessages[i].content
          break
        }
      }

      if (!userMessage) {
        console.error('이전 사용자 메시지를 찾을 수 없습니다.')
        return
      }

      // 로딩 상태로 변경
      this.isLoading = true
      const chatId = this.$store.getters['chat/currentChatId']
      
      this.$store.commit('chat/UPDATE_MESSAGE', {
        userId: this.currentUser.id,
        chatId,
        messageIndex,
        updates: {
          content: '',
          isStreaming: true
        }
      })

      try {
        // 대화 컨텍스트 준비 (새로고침할 메시지 이전까지)
        const conversationMessages = this.safeCurrentMessages
          .slice(0, messageIndex)
          .filter(msg => !msg.isStreaming)
          .slice(-10)
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))

        // 현재 사용자 메시지 추가
        conversationMessages.push({
          role: 'user',
          content: userMessage
        })

        // API에서 새로운 응답 받기
        await apiService.streamResponse(
          conversationMessages,
          this.selectedModel,
          (chunk) => {
            // AI 메시지 내용 업데이트
            const currentMessage = this.safeCurrentMessages[messageIndex]
            this.$store.commit('chat/UPDATE_MESSAGE', {
              userId: this.currentUser.id,
              chatId,
              messageIndex,
              updates: {
                content: currentMessage.content + chunk
              }
            })
            this.$nextTick(() => {
              this.scrollToBottom()
            })
          }
        )

        // 스트리밍 완료
        this.$store.commit('chat/UPDATE_MESSAGE', {
          userId: this.currentUser.id,
          chatId,
          messageIndex,
          updates: {
            isStreaming: false,
            timestamp: new Date().toISOString()
          }
        })

      } catch (error) {
        console.error('AI API Refresh Error:', error)
        
        // 오류 메시지로 업데이트
        this.$store.commit('chat/UPDATE_MESSAGE', {
          userId: this.currentUser.id,
          chatId,
          messageIndex,
          updates: {
            content: `❌ **새로고침 오류**: ${error.message}\n\n다음을 확인해주세요:\n- API 키가 올바른지 확인\n- 네트워크 연결 상태 확인\n- 선택된 모델이 사용 가능한지 확인`,
            isStreaming: false
          }
        })
      } finally {
        this.isLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },

    scrollToBottom() {
      const container = this.$refs.chatContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },

    handleEnter(event) {
      if (event.shiftKey) {
        // Allow shift+enter for new line (default behavior)
        return
      }
      // Prevent default Enter behavior and send message
      event.preventDefault()
      this.sendMessage()
    },

    showApiKeyError() {
      const chatId = this.$store.getters['chat/currentChatId']
      if (chatId) {
        this.addMessage({
          chatId,
          message: {
            content: `❌ **API 키 오류**\n\n다음을 확인해주세요:\n\n1. 프로젝트 루트에 \`.env\` 파일이 있는지 확인\n2. \`.env\` 파일에 다음 내용이 포함되어 있는지 확인:\n\n\`\`\`\nVUE_APP_OPENAI_API_KEY=your_openai_key_here\nVUE_APP_ANTHROPIC_API_KEY=your_anthropic_key_here\n\`\`\`\n\n3. API 키가 유효한지 확인\n4. 개발 서버를 재시작해주세요 (\`npm run serve\`)`,
            sender: 'ai',
            model: 'system'
          }
        })
      }
    },

    checkApiKeys() {
      try {
        const validation = apiService.validateApiKeys()
        this.apiStatus = validation
      } catch (error) {
        this.apiStatus = {
          isValid: false,
          errors: ['API 서비스 초기화 실패']
        }
      }
    }
  },

  watch: {
    selectedModel() {
      // 모델 변경시 UI 업데이트
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Ensure proper flexbox behavior for full height */
.chat-container {
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.chat-container::-webkit-scrollbar {
  width: 4px;
}

.chat-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Ensure the chat container takes up remaining space correctly */
.flex-1 {
  flex: 1 1 0%;
}

.min-h-0 {
  min-height: 0;
}

/* 사이드바 애니메이션 */
.sidebar-enter-active, .sidebar-leave-active {
  transition: margin-right 1s ease-in-out;
}

.sidebar-enter-from, .sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.sidebar-enter-to, .sidebar-leave-from {
  transform: translateX(10%);
  opacity: 1;
}
</style>
