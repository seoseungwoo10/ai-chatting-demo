<template>
  <div id="app" class="h-screen bg-gray-100 flex flex-col">
    <div class="max-w-4xl mx-auto w-full h-full py-6 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
        <!-- Header -->
        <div class="bg-blue-600 text-white px-6 py-4 flex-shrink-0">
          <h1 class="text-xl font-semibold">AI 채팅 데모</h1>
          <p class="text-blue-100 text-sm">마크다운 지원 채팅창</p>
        </div>

        <!-- Chat Messages -->
        <div
          class="chat-container overflow-y-auto p-4 space-y-4 flex-1 min-h-0"
          ref="chatContainer"
        >
          <ChatMessage2
            v-for="message in messages"
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
</template>

<script>
//import ChatMessage from './components/ChatMessage.vue'
import ChatMessage2 from './components/ChatMessage2.vue'
import apiService from './services/apiService.js'

export default {
  name: 'App',
  components: {
    ChatMessage2
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false,
      messageId: 1,
      selectedModel: 'gpt-4o-mini',
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
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return

      // API 키 검증
      if (!this.apiStatus.isValid) {
        this.showApiKeyError()
        return
      }

      // Add user message
      this.addMessage({
        content: this.inputMessage,
        isUser: true,
        timestamp: new Date()
      })

      const userMessage = this.inputMessage
      this.inputMessage = ''

      // Send to AI
      await this.sendToAI(userMessage)
    },

    async sendToAI(userMessage) {
      this.isLoading = true

      // Create AI message placeholder
      const aiMessageId = this.messageId++
      const aiMessage = {
        id: aiMessageId,
        content: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true
      }
      this.messages.push(aiMessage)

      try {
        // Prepare conversation context (last 10 messages)
        const conversationMessages = this.messages
          .filter(msg => !msg.isStreaming)
          .slice(-10)
          .map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          }))

        // Add current user message
        conversationMessages.push({
          role: 'user',
          content: userMessage
        })

        // Stream response from API
        await apiService.streamResponse(
          conversationMessages,
          this.selectedModel,
          (chunk) => {
            // Update AI message content with streamed text
            const messageIndex = this.messages.findIndex(msg => msg.id === aiMessageId)
            if (messageIndex !== -1) {
              this.messages[messageIndex].content += chunk
              this.$nextTick(() => {
                this.scrollToBottom()
              })
            }
          }
        )

        // Mark streaming as complete
        const messageIndex = this.messages.findIndex(msg => msg.id === aiMessageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex].isStreaming = false
        }

      } catch (error) {
        console.error('AI API Error:', error)
        
        // Update AI message with error
        const messageIndex = this.messages.findIndex(msg => msg.id === aiMessageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex].content = `❌ **오류 발생**: ${error.message}\n\n다음을 확인해주세요:\n- API 키가 올바른지 확인\n- 네트워크 연결 상태 확인\n- 선택된 모델이 사용 가능한지 확인`
          this.messages[messageIndex].isStreaming = false
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

    addMessage(messageData) {
      const message = {
        id: this.messageId++,
        ...messageData
      }
      this.messages.push(message)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    clearChat() {
      this.messages = []
      this.messageId = 1
      this.addWelcomeMessage()
    },

    deleteMessage(messageId) {
      const index = this.messages.findIndex(msg => msg.id === messageId)
      if (index !== -1) {
        this.messages.splice(index, 1)
      }
    },

    async refreshMessage(messageId) {
      // AI 메시지인지 확인
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1 || this.messages[messageIndex].isUser) {
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
        if (this.messages[i].isUser) {
          userMessage = this.messages[i].content
          break
        }
      }

      if (!userMessage) {
        console.error('이전 사용자 메시지를 찾을 수 없습니다.')
        return
      }

      // 로딩 상태로 변경
      this.isLoading = true
      this.messages[messageIndex].content = ''
      this.messages[messageIndex].isStreaming = true

      try {
        // 대화 컨텍스트 준비 (새로고침할 메시지 이전까지)
        const conversationMessages = this.messages
          .slice(0, messageIndex)
          .filter(msg => !msg.isStreaming)
          .slice(-10)
          .map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
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
            this.messages[messageIndex].content += chunk
            this.$nextTick(() => {
              this.scrollToBottom()
            })
          }
        )

        // 스트리밍 완료
        this.messages[messageIndex].isStreaming = false
        this.messages[messageIndex].timestamp = new Date()

      } catch (error) {
        console.error('AI API Refresh Error:', error)
        
        // 오류 메시지로 업데이트
        this.messages[messageIndex].content = `❌ **새로고침 오류**: ${error.message}\n\n다음을 확인해주세요:\n- API 키가 올바른지 확인\n- 네트워크 연결 상태 확인\n- 선택된 모델이 사용 가능한지 확인`
        this.messages[messageIndex].isStreaming = false
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

    addWelcomeMessage() {
      this.addMessage({
        content: `안녕하세요! 👋\n\n저는 **실제 AI 모델**과 연결된 채팅봇입니다.\n\n**사용 가능한 모델:**\n- GPT-4.1 Mini (OpenAI)\n- GPT-4o Mini (OpenAI)\n- Claude Haiku 3.5 (Anthropic)\n- Sonnet 3 (Anthropic)\n\n**기능:**\n- 📝 마크다운 문법 지원\n- 💻 코드 하이라이팅\n- 🔄 실시간 스트리밍 응답\n- 📱 반응형 디자인\n\n${this.apiStatus.isValid ? '✅ API가 준비되었습니다. 아무거나 물어보세요!' : '⚠️ API 키를 설정해주세요 (.env 파일)'}`,
        isUser: false,
        timestamp: new Date()
      })
    },

    showApiKeyError() {
      this.addMessage({
        content: `❌ **API 키 오류**\n\n다음을 확인해주세요:\n\n1. 프로젝트 루트에 \`.env\` 파일이 있는지 확인\n2. \`.env\` 파일에 다음 내용이 포함되어 있는지 확인:\n\n\`\`\`\nVUE_APP_OPENAI_API_KEY=your_openai_key_here\nVUE_APP_ANTHROPIC_API_KEY=your_anthropic_key_here\n\`\`\`\n\n3. API 키가 유효한지 확인\n4. 개발 서버를 재시작해주세요 (\`npm run serve\`)`,
        isUser: false,
        timestamp: new Date()
      })
    },

    validateApiKeys() {
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
  },

  mounted() {
    // API 키 검증
    this.validateApiKeys()
    
    // Welcome message
    this.addWelcomeMessage()
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
</style>
