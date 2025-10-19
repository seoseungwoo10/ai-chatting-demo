# GitHub Copilot Instructions

## 프로젝트 기본 정보
**프레임워크**: Vue.js 2.6.14 + Vuex 3.6.2  
**빌드 도구**: Vue CLI 5.0.0  
**스타일**: Tailwind CSS 3.3.2

---

## 🎯 개발 시 반드시 지켜야 할 규칙

### 1. Vuex 상태 관리 - ⚠️ 가장 중요
```javascript
// ❌ 절대 금지 - 직접 상태 변경
this.$store.state.chat.userChats[userId][chatId].title = 'New Title'

// ✅ 올바른 방법 - mutation 사용
this.$store.commit('chat/UPDATE_CHAT', {
  userId,
  chatId,
  updates: { title: 'New Title' }
})

// ✅ 또는 action 사용
this.$store.dispatch('chat/updateChatTitle', { chatId, title: 'New Title' })
```

**주의사항**:
- 채팅방 편집 시 `editingChatId`, `editedTitle` 같은 로컬 변수 사용
- 저장 시에만 Vuex mutation 호출
- `Do not mutate vuex store state` 에러가 나면 mutation 사용 확인

### 2. Vue 반응성 시스템
```javascript
// ❌ 배열/객체 직접 수정 (반응성 손실)
state.userChats[userId][chatId].messages.push(message) // 작동 안함

// ✅ Vue.set 사용
Vue.set(state.userChats[userId][chatId], 'messages', [
  ...state.userChats[userId][chatId].messages,
  message
])

// ✅ 또는 강제 반응성 트리거
state.userChats = { ...state.userChats }
```

### 3. 컴포넌트 간 통신
```javascript
// ✅ 자식 → 부모: $emit
this.$emit('chat-selected', chatId)

// ✅ 부모 → 자식: props
<ChatMessage2 :message="message" @delete-message="handleDelete" />

// ✅ 전역 상태: Vuex
this.$store.dispatch('chat/addMessage', { chatId, message })
```

---

## 📁 파일별 역할 및 코딩 패턴

### `src/App.vue` - 메인 애플리케이션
**책임**: 레이아웃, 라우팅, 전역 이벤트 처리

```javascript
// 필수 computed 패턴
computed: {
  ...mapGetters('auth', ['isAuthenticated', 'currentUser']),
  ...mapGetters('chat', ['currentChatId']),
  
  getCurrentChat() {
    const chatId = this.$store.getters['chat/currentChatId']
    return this.$store.getters['chat/getChatById'](chatId)
  },
  
  safeCurrentMessages() {
    return this.currentMessages || [] // 항상 안전한 기본값
  }
}

// 키보드 단축키 처리
handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    this.toggleSidebar()
  }
}

// 라이프사이클: 이벤트 리스너 정리
beforeDestroy() {
  document.removeEventListener('keydown', this.handleKeydown)
}
```

### `src/components/ChatMessage2.vue` - 메시지 렌더링
**책임**: 메시지 표시만 (읽기 전용), 수정은 emit으로 부모에 위임

```javascript
// marked + highlight.js + KaTeX 통합
import { marked } from 'marked'
import hljs from 'highlight.js'
import katex from 'katex'

// 마크다운 렌더링 설정
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

computed: {
  renderedContent() {
    let html = marked.parse(this.message.content)
    
    // KaTeX 수식 렌더링
    // 인라인: $...$
    html = html.replace(/\$([^\$]+)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { throwOnError: false })
      } catch (e) {
        return match
      }
    })
    
    // 블록: $$...$$
    html = html.replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, {
          displayMode: true,
          throwOnError: false
        })
      } catch (e) {
        return match
      }
    })
    
    return html
  }
}

// 메시지 액션은 emit으로 처리
methods: {
  deleteMessage() {
    this.$emit('delete-message', this.message.id)
  },
  refreshMessage() {
    this.$emit('refresh-message', this.message.id)
  }
}
```

### `src/components/ChatSidebar.vue` - 채팅방 목록
**책임**: 채팅방 목록, 편집 UI, 컨텍스트 메뉴

```javascript
data() {
  return {
    editingChatId: null,      // 로컬 상태로 관리
    editedTitle: '',          // Vuex 직접 수정 방지
    contextMenuChatId: null,
    showContextMenu: false,
    contextMenuPosition: { x: 0, y: 0 }
  }
}

methods: {
  // 편집 시작
  startEditingTitle(chat) {
    this.editingChatId = chat.id
    this.editedTitle = chat.title // 로컬 복사
  },
  
  // 편집 저장
  async saveTitle(chatId) {
    if (this.editedTitle.trim()) {
      // Vuex action 호출
      await this.$store.dispatch('chat/updateChatTitle', {
        chatId,
        title: this.editedTitle.trim()
      })
    }
    this.editingChatId = null
    this.editedTitle = ''
  },
  
  // 우클릭 메뉴
  showChatContextMenu(event, chatId) {
    event.preventDefault()
    this.contextMenuChatId = chatId
    this.contextMenuPosition = { x: event.clientX, y: event.clientY }
    this.showContextMenu = true
  }
}
```

### `src/components/SearchSidebar.vue` - 검색
**책임**: Fuse.js 검색, 결과 하이라이팅

```javascript
import Fuse from 'fuse.js'
import Mark from 'mark.js'
import { debounce } from 'lodash'

data() {
  return {
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    fuse: null
  }
}

created() {
  // 디바운싱 적용 (300ms)
  this.debouncedSearch = debounce(this.performSearch, 300)
  this.initializeFuse()
}

methods: {
  initializeFuse() {
    const searchData = this.prepareSearchData()
    this.fuse = new Fuse(searchData, {
      keys: ['chatTitle', 'content'],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true
    })
  },
  
  performSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = []
      return
    }
    
    this.isSearching = true
    const results = this.fuse.search(this.searchQuery)
    this.searchResults = results.map(r => ({
      ...r.item,
      score: 1 - (r.score || 0) // 점수 반전 (높을수록 좋음)
    }))
    this.isSearching = false
  },
  
  // mark.js로 하이라이팅
  highlightText(text, query) {
    const instance = new Mark(document.createElement('div'))
    instance.mark(query)
    return text.replace(
      new RegExp(`(${query})`, 'gi'),
      '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>'
    )
  }
}
```

### `src/components/FileUpload.vue` - 파일 업로드
**책임**: 파일 처리, 압축, Base64 변환

```javascript
import imageCompression from 'browser-image-compression'
import * as pdfjsLib from 'pdfjs-dist'

// PDF.js 워커 설정 (중요!)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

methods: {
  async handleFileSelect(event) {
    const files = Array.from(event.target.files)
    
    for (const file of files) {
      // 파일 크기 검증
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}은(는) 10MB를 초과합니다.`)
        continue
      }
      
      const fileData = await this.processFile(file)
      this.uploadedFiles.push(fileData)
      this.$emit('file-uploaded', fileData)
    }
  },
  
  async processFile(file) {
    const extension = file.name.split('.').pop().toLowerCase()
    const fileType = this.getFileType(extension)
    
    let content = ''
    let thumbnail = ''
    
    if (fileType === 'image') {
      // 이미지 압축
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      })
      
      content = await this.fileToBase64(compressed)
      thumbnail = await this.createThumbnail(compressed)
      
    } else if (extension === 'pdf') {
      // PDF 텍스트 추출
      content = await this.extractPdfText(file)
      
    } else {
      // 텍스트 파일
      content = await file.text()
    }
    
    return {
      id: `file_${Date.now()}_${Math.random()}`,
      name: file.name,
      type: fileType,
      extension,
      size: file.size,
      content,
      thumbnail
    }
  },
  
  async extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  },
  
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}
```

### `src/services/apiService.js` - AI API 통신
**책임**: OpenAI/Anthropic API, 스트리밍, 멀티모달

```javascript
class ApiService {
  // 스트리밍 응답 처리 (핵심 패턴)
  async streamOpenAIResponse(messages, model, onChunk) {
    const formattedMessages = this.formatMessagesForOpenAI(messages)
    
    const response = await fetch(this.openaiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      })
    })
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 마지막 불완전 줄 보관
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              onChunk(content) // 실시간 콜백
            }
          } catch (e) {
            console.warn('Parse error:', e)
          }
        }
      }
    }
  }
  
  // 멀티모달 메시지 변환
  formatMessagesForOpenAI(messages) {
    return messages.map(msg => {
      if (msg.attachedFiles?.length > 0) {
        const content = []
        
        // 텍스트
        if (msg.content) {
          content.push({ type: 'text', text: msg.content })
        }
        
        // 이미지들
        msg.attachedFiles.forEach(file => {
          if (file.type === 'image' && file.content) {
            content.push({
              type: 'image_url',
              image_url: { url: file.content } // Base64 data URL
            })
          }
        })
        
        return { role: msg.sender === 'user' ? 'user' : 'assistant', content }
      }
      
      return {
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }
    })
  }
}
```

### `src/store/modules/chat.js` - 채팅 Vuex 모듈
**핵심 패턴**: Vue.set + 강제 반응성 트리거

```javascript
import Vue from 'vue'

const mutations = {
  ADD_MESSAGE(state, { userId, chatId, message }) {
    if (state.userChats[userId]?.[chatId]) {
      // 1. messages 배열이 없으면 생성
      if (!state.userChats[userId][chatId].messages) {
        Vue.set(state.userChats[userId][chatId], 'messages', [])
      }
      
      // 2. 메시지 추가
      state.userChats[userId][chatId].messages.push(message)
      
      // 3. 타임스탬프 갱신
      Vue.set(state.userChats[userId][chatId], 'updatedAt', new Date().toISOString())
      
      // 4. localStorage 저장
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
      
      // 5. 강제 반응성 트리거 (중요!)
      state.userChats = { ...state.userChats }
    }
  },
  
  UPDATE_MESSAGE(state, { userId, chatId, messageIndex, updates }) {
    if (state.userChats[userId]?.[chatId]?.messages?.[messageIndex]) {
      const updatedMessage = {
        ...state.userChats[userId][chatId].messages[messageIndex],
        ...updates
      }
      
      Vue.set(state.userChats[userId][chatId].messages, messageIndex, updatedMessage)
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
      state.userChats = { ...state.userChats }
    }
  }
}

const actions = {
  async addMessage({ commit, rootState }, { chatId, message }) {
    const userId = rootState.auth.currentUser.id
    commit('ADD_MESSAGE', { userId, chatId, message })
  },
  
  async updateMessage({ commit, rootState }, { chatId, messageId, updates }) {
    const userId = rootState.auth.currentUser.id
    const chat = state.userChats[userId]?.[chatId]
    const messageIndex = chat?.messages.findIndex(m => m.id === messageId)
    
    if (messageIndex !== -1) {
      commit('UPDATE_MESSAGE', { userId, chatId, messageIndex, updates })
    }
  }
}
```

---

## 🔧 자주 사용하는 코드 스니펫

### 새 메시지 추가 (스트리밍 패턴)
```javascript
async sendMessage() {
  const userMessage = {
    id: `msg_${Date.now()}`,
    content: this.inputMessage,
    sender: 'user',
    timestamp: new Date().toISOString(),
    attachedFiles: this.attachedFiles
  }
  
  // 사용자 메시지 추가
  await this.$store.dispatch('chat/addMessage', {
    chatId: this.currentChatId,
    message: userMessage
  })
  
  // AI 메시지 플레이스홀더
  const aiMessageId = `msg_${Date.now()}_ai`
  const aiMessage = {
    id: aiMessageId,
    content: '',
    sender: 'ai',
    timestamp: new Date().toISOString(),
    isStreaming: true
  }
  
  await this.$store.dispatch('chat/addMessage', {
    chatId: this.currentChatId,
    message: aiMessage
  })
  
  // 스트리밍 시작
  const messages = this.currentMessages.slice(-10) // 최근 10개만
  await apiService.streamResponse(messages, this.selectedModel, (chunk) => {
    // 실시간 업데이트
    this.$store.dispatch('chat/appendMessageContent', {
      chatId: this.currentChatId,
      messageId: aiMessageId,
      content: chunk
    })
  })
  
  // 스트리밍 종료
  await this.$store.dispatch('chat/updateMessage', {
    chatId: this.currentChatId,
    messageId: aiMessageId,
    updates: { isStreaming: false }
  })
}
```

### 스크롤 자동 이동
```javascript
scrollToBottom() {
  this.$nextTick(() => {
    const container = this.$refs.chatContainer
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// 메시지 추가 후 호출
watch: {
  currentMessages() {
    this.scrollToBottom()
  }
}
```

---

## 🚨 흔한 버그와 해결법

### 1. "Do not mutate vuex store state"
**원인**: Vuex 상태 직접 수정  
**해결**: mutation 또는 action 사용

### 2. 메시지가 화면에 안 보임
**원인**: Vue 반응성 손실  
**해결**: `Vue.set()` + `state.userChats = { ...state.userChats }`

### 3. 파일 업로드 후 AI가 인식 못함
**원인**: Base64 형식 오류 또는 API 메시지 형식 오류  
**해결**: `formatMessagesForOpenAI()` 확인, `data:image/jpeg;base64,` prefix 확인

### 4. PDF 텍스트 추출 안됨
**원인**: PDF.js 워커 경로 설정 누락  
**해결**: `pdfjsLib.GlobalWorkerOptions.workerSrc` 설정 확인

### 5. KaTeX 수식 렌더링 실패
**원인**: 잘못된 LaTeX 문법 또는 `$` 이스케이프 문제  
**해결**: `throwOnError: false` 옵션 사용, 정규식 수정

### 6. 검색 결과 너무 많거나 없음
**원인**: Fuse.js threshold 설정  
**해결**: `threshold: 0.3` (0.0=완전일치, 1.0=모두일치)

---

## 📊 성능 최적화 체크리스트

- [ ] `v-for`에 항상 `:key` 사용
- [ ] 검색/필터링에 디바운싱 적용 (300ms)
- [ ] 긴 목록은 가상 스크롤 고려 (향후)
- [ ] 이미지는 압축 후 업로드 (1MB 이하)
- [ ] AI API 메시지 컨텍스트 제한 (최근 10개)
- [ ] localStorage 크기 모니터링 (5MB 제한)
- [ ] 불필요한 `watch` 제거
- [ ] `computed` 캐싱 활용

---

## 🔐 보안 체크리스트

- [ ] API 키는 `.env` 파일에만 (Git ignore)
- [ ] localStorage에 비밀번호는 해싱 후 저장 (crypto-js)
- [ ] XSS 방지: `v-html` 사용 시 DOMPurify 고려 (향후)
- [ ] 파일 업로드 크기 제한 (10MB)
- [ ] 파일 확장자 화이트리스트 검증
- [ ] CORS는 API 서버에서 처리 (프론트엔드 프록시 불필요)

---

## 🎨 Tailwind CSS 패턴

```html
<!-- 다크 모드 지원 -->
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

<!-- 반응형 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- 트랜지션 -->
<div class="transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">

<!-- 버튼 -->
<button class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg 
               hover:bg-blue-700 dark:hover:bg-blue-600 
               focus:outline-none focus:ring-2 focus:ring-blue-500 
               disabled:opacity-50 disabled:cursor-not-allowed">
  전송
</button>
```

---

## 📝 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: 스타일 변경 (코드 로직 변경 없음)
docs: 문서 수정
perf: 성능 개선
test: 테스트 추가/수정
chore: 빌드 설정, 패키지 업데이트 등

예시:
feat: 파일 업로드 기능 추가 (이미지, PDF 지원)
fix: Vuex 상태 변이 오류 수정 (채팅방 편집)
refactor: apiService.js 멀티모달 로직 개선
```

---

**마지막 업데이트**: 2025-10-19  
**작성자**: AI Chatting Demo Team
