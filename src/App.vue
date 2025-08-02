<template>
  <div id="app" class="h-screen bg-gray-100 flex flex-col">
    <!-- 인증 모달 -->
    <AuthModal
      v-if="!isAuthenticated"
      @success="handleAuthSuccess"
    />

    <!-- 메인 레이아웃 -->
    <div v-if="isAuthenticated" class="flex h-full">
      <!-- 채팅/검색 사이드바 -->
      <transition name="sidebar">
        <div v-if="sidebarVisible">
          <ChatSidebar 
            v-if="!isSearchMode"
            @chat-selected="handleChatSelected" 
          />
          <SearchSidebar 
            v-else
            @result-selected="handleSearchResult"
          />
        </div>
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

                <!-- 검색/채팅 모드 토글 버튼 -->
                <button
                  v-if="sidebarVisible"
                  @click="toggleSearchMode"
                  class="p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                  :title="isSearchMode ? '채팅 목록 보기' : '메시지 검색'"
                >
                  <svg v-if="!isSearchMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.954 8.954 0 01-2.965-.516L3 20l.735-2.706A8.95 8.95 0 013 15c0-4.418 3.582-8 8-8s8 3.582 8 5z"></path>
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
                    <option value="claude-3-5-sonnet-20241022">Sonnet 3.5</option>
                    <option value="claude-3-7-sonnet-20250219">Sonnet 3.7</option>
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
            
            <!-- 파일 업로드 영역 -->
            <FileUpload
              v-if="showFileUpload"
              ref="fileUpload"
              @file-uploaded="handleFileUploaded"
              @file-removed="handleFileRemoved"
              class="mb-4"
            />
            
            <div class="flex space-x-4">
              <div class="flex-1">
                <div class="relative">
                  <textarea
                    v-model="inputMessage"
                    @keydown.enter="handleEnter"
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈, Enter로 전송)"
                    class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                  ></textarea>
                  
                  <!-- 파일 업로드 토글 버튼 -->
                  <button
                    @click="toggleFileUpload"
                    class="absolute right-3 top-3 p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors"
                    :class="{ 'text-blue-600': showFileUpload }"
                    title="파일 첨부"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                  </button>
                </div>
                
                <!-- 첨부된 파일 미리보기 -->
                <div v-if="attachedFiles.length > 0" class="mt-2 p-2 bg-blue-50 rounded-lg">
                  <div class="text-xs text-blue-700 mb-1">첨부된 파일 ({{ attachedFiles.length }}개):</div>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="file in attachedFiles" 
                      :key="file.id"
                      class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {{ file.name }}
                      <button 
                        @click="removeAttachedFile(file.id)"
                        class="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex flex-col space-y-2">
                <button
                  @click="sendMessage"
                  :disabled="(!inputMessage.trim() && attachedFiles.length === 0) || isLoading"
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
import SearchSidebar from './components/SearchSidebar.vue'
import FileUpload from './components/FileUpload.vue'
import AuthModal from './components/auth/AuthModal.vue'
import UserProfile from './components/auth/UserProfile.vue'
import apiService from './services/apiService.js'

export default {
  name: 'App',
  components: {
    ChatMessage2,
    ChatSidebar,
    SearchSidebar,
    FileUpload,
    AuthModal,
    UserProfile
  },
  data() {
    return {
      inputMessage: '',
      isLoading: false,
      selectedModel: 'gpt-4o-mini',
      sidebarVisible: true, // 사이드바 표시 상태
      isSearchMode: false, // 검색 모드 상태
      showFileUpload: false, // 파일 업로드 영역 표시 상태
      attachedFiles: [], // 첨부된 파일 목록
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
    
    toggleSearchMode() {
      this.isSearchMode = !this.isSearchMode
    },
    
    handleKeydown(event) {
      // Ctrl + B 또는 Cmd + B로 사이드바 토글
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault()
        this.toggleSidebar()
      }
      // Ctrl + F 또는 Cmd + F로 검색 모드 토글
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        if (this.sidebarVisible) {
          this.toggleSearchMode()
        }
      }
    },
    
    async handleAuthSuccess() {
      this.initializeChat()
    },

    handleSearchResult(result) {
      // 검색 결과에서 채팅방 선택 시
      this.$store.commit('chat/SET_CURRENT_CHAT', result.chatId)

      // 검색 모드를 종료하고 채팅 모드로 전환
      // this.isSearchMode = false

      this.$nextTick(() => {
        // 해당 메시지로 스크롤
        this.scrollToMessage(result.messageId)
      })
    },

    scrollToMessage(messageId) {
      // 특정 메시지로 스크롤하는 기능
      this.$nextTick(() => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
          // 메시지를 하이라이트
          messageElement.classList.add('highlight-message')
          setTimeout(() => {
            messageElement.classList.remove('highlight-message')
          }, 2000)
        } else {
          // 메시지가 없으면 맨 아래로 스크롤
          this.scrollToBottom()
        }
      })
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
      const messageText = this.inputMessage.trim()
      const hasFiles = this.attachedFiles.length > 0
      
      if (!messageText && !hasFiles) return
      if (this.isLoading) return

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

      // 첨부 파일 정보 포함한 메시지 구성
      let fullMessage = messageText
      if (hasFiles) {
        fullMessage += this.formatAttachedFilesForAI()
      }

      try {
        const addedMessage = await this.addMessage({
          chatId: currentChatId,
          message: {
            content: fullMessage,
            sender: 'user',
            model: this.selectedModel,
            attachedFiles: hasFiles ? [...this.attachedFiles] : undefined
          }
        })
        
        if (!addedMessage) {
          throw new Error('사용자 메시지 추가에 실패했습니다.')
        }

        // 입력 필드와 첨부 파일 초기화
        this.inputMessage = ''
        this.attachedFiles = []
        
        // 파일 업로드 컴포넌트 초기화
        if (this.$refs.fileUpload) {
          this.$refs.fileUpload.clearFiles()
        }
        
        // 파일 업로드 영역 숨기기
        if (this.showFileUpload && hasFiles) {
          this.showFileUpload = false
        }

        // AI에게 전송 (원본 메시지가 아닌 파일 정보가 포함된 메시지 전송)
        await this.sendToAI(fullMessage, currentChatId)
      } catch (error) {
        console.error('메시지 전송 중 오류:', error)
        // 입력 메시지 복원 (파일은 복원하지 않음)
        this.inputMessage = this.inputMessage || messageText
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
    },

    // 파일 업로드 관련 메서드들
    toggleFileUpload() {
      this.showFileUpload = !this.showFileUpload
      
      // 파일 업로드 영역을 숨길 때 업로드된 파일들도 정리
      if (!this.showFileUpload && this.$refs.fileUpload) {
        this.$refs.fileUpload.clearFiles()
      }
    },

    handleFileUploaded(fileInfo) {
      // 파일이 업로드 완료되면 첨부 파일 목록에 추가
      const existingIndex = this.attachedFiles.findIndex(f => f.id === fileInfo.id)
      if (existingIndex === -1) {
        this.attachedFiles.push(fileInfo)
      }
      
      console.log('파일 업로드 완료:', fileInfo)
    },

    handleFileRemoved(fileId) {
      // 파일이 제거되면 첨부 파일 목록에서도 제거
      const index = this.attachedFiles.findIndex(f => f.id === fileId)
      if (index !== -1) {
        this.attachedFiles.splice(index, 1)
      }
    },

    removeAttachedFile(fileId) {
      // 첨부 파일 미리보기에서 파일 제거
      this.handleFileRemoved(fileId)
      
      // FileUpload 컴포넌트에서도 제거
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.removeFile(fileId)
      }
    },

    formatAttachedFilesForAI() {
      // AI에게 전송할 때 첨부 파일 정보 포맷팅
      if (this.attachedFiles.length === 0) return ''
      
      let fileContext = '\n\n--- 첨부된 파일 ---\n'
      
      for (const file of this.attachedFiles) {
        fileContext += `\n**파일: ${file.name}** (${file.extension.toUpperCase()})\n`
        
        if (file.type === 'image' && file.content) {
          fileContext += '[이미지가 첨부되었습니다]\n'
        } else if (file.type === 'text' && file.content) {
          fileContext += `내용:\n${file.content}\n`
        } else if (file.type === 'document') {
          fileContext += `[${file.extension.toUpperCase()} 문서가 첨부되었습니다]\n`
        }
      }
      
      return fileContext
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
  transform: translateX(0);
  opacity: 1;
}

/* 검색된 메시지 하이라이트 효과 */
.highlight-message {
  background-color: #fef3c7 !important;
  border-left: 4px solid #f59e0b !important;
  transition: background-color 0.3s ease, border-left 0.3s ease;
}
</style>
