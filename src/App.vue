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
          />
          
          <div v-if="isTyping" class="flex items-start space-x-3">
            <div class="bg-gray-200 rounded-full p-2">
              <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="border-t border-gray-200 p-4 flex-shrink-0">
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
                :disabled="!inputMessage.trim() || isTyping"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전송
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

export default {
  name: 'App',
  components: {
    ChatMessage2
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      isTyping: false,
      messageId: 1,
      demoMessages: [
        {
          id: 1,
          title: '코드 예제',
          content: '다음은 JavaScript 함수 예제입니다:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```'
        },
        {
          id: 2,
          title: '마크다운 문법',
          content: '# 마크다운 예제\n\n## 텍스트 스타일\n\n- **굵은 글씨**\n- *기울임 글씨*\n- `인라인 코드`\n\n> 인용문입니다.\n\n1. 순서가 있는 목록\n2. 두 번째 항목'
        },
        {
          id: 3,
          title: 'Python 코드',
          content: 'Python으로 피보나치 수열을 구현해보세요:\n\n```python\ndef fibonacci(n):\n    """피보나치 수열을 계산하는 함수"""\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 테스트\nfor i in range(10):\n    print(f"fibonacci({i}) = {fibonacci(i)}")\n```'
        },
        {
          id: 4,
          title: 'HTML/CSS',
          content: '웹 페이지 구조를 만들어보세요:\n\n```html\n<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <meta charset="UTF-8">\n    <title>샘플 페이지</title>\n    <style>\n        .container {\n            max-width: 800px;\n            margin: 0 auto;\n            padding: 20px;\n        }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1>안녕하세요!</h1>\n        <p>이것은 샘플 HTML 페이지입니다.</p>\n    </div>\n</body>\n</html>\n```'
        }
      ]
    }
  },
  methods: {
    sendMessage() {
      if (!this.inputMessage.trim()) return

      // Add user message
      this.addMessage({
        content: this.inputMessage,
        isUser: true,
        timestamp: new Date()
      })

      const userMessage = this.inputMessage
      this.inputMessage = ''

      // Simulate AI response
      this.simulateAIResponse(userMessage)
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

    simulateAIResponse(userMessage) {
      this.isTyping = true

      // Simulate typing delay
      setTimeout(() => {
        this.isTyping = false
        
        // Generate AI response based on user message
        let aiResponse = this.generateAIResponse(userMessage)
        
        this.addMessage({
          content: aiResponse,
          isUser: false,
          timestamp: new Date()
        })
      }, 1000 + Math.random() * 2000) // Random delay between 1-3 seconds
    },

    generateAIResponse(userMessage) {
      const responses = [
        `네, "${userMessage}"에 대해 설명드리겠습니다.\n\n**주요 포인트:**\n- 이것은 시뮬레이션된 AI 응답입니다\n- 실제 AI 모델과 연결되어 있지 않습니다\n- 마크다운 문법을 지원합니다\n\n\`\`\`javascript\n// 예제 코드\nconsole.log("Hello, World!");\n\`\`\``,
        
        `좋은 질문이네요! 다음과 같이 답변드릴게요:\n\n1. **첫 번째 포인트**: 마크다운 렌더링이 잘 작동합니다\n2. **두 번째 포인트**: 코드 하이라이팅도 지원됩니다\n3. **세 번째 포인트**: 반응형 디자인으로 모바일에서도 잘 보입니다\n\n> 💡 **팁**: Shift+Enter로 줄바꿈을 할 수 있습니다!`,
        
        `흥미로운 주제입니다. 코드 예제와 함께 설명해드릴게요:\n\n\`\`\`python\ndef example_function():\n    """예제 함수입니다"""\n    return "Hello from Python!"\n\nprint(example_function())\n\`\`\`\n\n**결과:**\n- 함수가 정상적으로 실행됩니다\n- 문자열을 반환합니다\n- *이탤릭체*와 **굵은 글씨**도 잘 표시됩니다`,

        `\`${userMessage}\`에 대한 답변입니다:\n\n## 개요\n\n이는 Vue.js 2와 Tailwind CSS로 만든 채팅 인터페이스입니다.\n\n### 특징\n\n- [x] 마크다운 렌더링\n- [x] 코드 하이라이팅  \n- [x] 반응형 디자인\n- [x] 실시간 타이핑 애니메이션\n\n---\n\n**참고:** 이것은 데모용 응답입니다.`
      ]

      return responses[Math.floor(Math.random() * responses.length)]
    },

    clearChat() {
      this.messages = []
      this.messageId = 1
    },

    deleteMessage(messageId) {
      const index = this.messages.findIndex(msg => msg.id === messageId)
      if (index !== -1) {
        this.messages.splice(index, 1)
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
    }
  },

  mounted() {
    // Welcome message
    this.addMessage({
      content: '안녕하세요! 👋\n\n저는 AI 채팅 데모봇입니다. 다음 기능들을 테스트해보세요:\n\n- **마크다운 문법** 지원\n- `코드 하이라이팅` 기능\n- 반응형 디자인\n\n아래 데모 버튼을 클릭하거나 직접 메시지를 입력해보세요!',
      isUser: false,
      timestamp: new Date()
    })
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
