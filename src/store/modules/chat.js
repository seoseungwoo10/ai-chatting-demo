import Vue from 'vue'

const state = {
  currentChatId: null,
  userChats: JSON.parse(localStorage.getItem('ai_chat_histories') || '{}')
}

const mutations = {
  SET_CURRENT_CHAT(state, chatId) {
    state.currentChatId = chatId
    // 루트 스토어를 통해 auth 모듈의 lastChatId 업데이트
    if (chatId) {
      this.dispatch('auth/updateLastChatId', chatId, { root: true })
    }
  },
  
  ADD_CHAT(state, { userId, chat }) {
    if (!state.userChats[userId]) {
      Vue.set(state.userChats, userId, {})
    }
    Vue.set(state.userChats[userId], chat.id, chat)
    localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
    
    // 강제 반응성 트리거
    state.userChats = { ...state.userChats }
  },
  
  UPDATE_CHAT(state, { userId, chatId, updates }) {
    if (state.userChats[userId] && state.userChats[userId][chatId]) {
      state.userChats[userId][chatId] = { ...state.userChats[userId][chatId], ...updates }
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
    }
  },
  
  ADD_MESSAGE(state, { userId, chatId, message }) {
    if (state.userChats[userId] && state.userChats[userId][chatId]) {
      if (!state.userChats[userId][chatId].messages) {
        // Vue.set을 사용하여 반응성 보장
        Vue.set(state.userChats[userId][chatId], 'messages', [])
      }
      
      // 메시지 배열에 직접 추가
      state.userChats[userId][chatId].messages.push(message)
      
      // 업데이트 시간 갱신
      Vue.set(state.userChats[userId][chatId], 'updatedAt', new Date().toISOString())
      
      // localStorage 저장
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
      
      // 강제로 반응성 트리거
      state.userChats = { ...state.userChats }
    }
  },
  
  UPDATE_MESSAGE(state, { userId, chatId, messageIndex, updates }) {
    if (state.userChats[userId] && 
        state.userChats[userId][chatId] && 
        state.userChats[userId][chatId].messages[messageIndex]) {
      
      // Vue.set을 사용하여 메시지 업데이트
      const updatedMessage = {
        ...state.userChats[userId][chatId].messages[messageIndex],
        ...updates
      }
      
      Vue.set(state.userChats[userId][chatId].messages, messageIndex, updatedMessage)
      
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
      
      // 강제 반응성 트리거
      state.userChats = { ...state.userChats }
    }
  },
  
  DELETE_MESSAGE(state, { userId, chatId, messageIndex }) {
    if (state.userChats[userId] && 
        state.userChats[userId][chatId] && 
        state.userChats[userId][chatId].messages) {
      state.userChats[userId][chatId].messages.splice(messageIndex, 1)
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
    }
  },
  
  DELETE_CHAT(state, { userId, chatId }) {
    if (state.userChats[userId] && state.userChats[userId][chatId]) {
      delete state.userChats[userId][chatId]
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
    }
  },
  
  CLEAR_USER_CHATS(state, userId) {
    if (state.userChats[userId]) {
      delete state.userChats[userId]
      localStorage.setItem('ai_chat_histories', JSON.stringify(state.userChats))
    }
  }
}

const actions = {
  // 마지막 채팅방 복원
  restoreLastChat({ commit, getters, rootGetters }) {
    const userId = rootGetters['auth/currentUser']?.id
    const lastChatId = rootGetters['auth/currentUser']?.lastChatId
    
    if (!userId || !lastChatId) {
      return false
    }
    
    // 해당 채팅방이 존재하는지 확인
    const chat = getters.getChatById(lastChatId)
    if (chat) {
      commit('SET_CURRENT_CHAT', lastChatId)
      return true
    }
    
    return false
  },

  // 새 채팅 생성
  createChat({ commit, rootGetters }, { title = '새로운 채팅' } = {}) {
    const userId = rootGetters['auth/currentUser']?.id
    
    if (!userId) {
      console.error('createChat: userId가 없습니다.')
      return null
    }
    
    const chatId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    const newChat = {
      id: chatId,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        model: rootGetters['auth/userPreferences'].defaultModel || 'gpt-4o-mini'
      }
    }
    
    commit('ADD_CHAT', { userId, chat: newChat })
    commit('SET_CURRENT_CHAT', chatId)
    
    return chatId
  },
  
  // 메시지 추가
  addMessage({ commit, rootGetters }, { chatId, message }) {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId || !chatId) {
      console.error('addMessage: userId 또는 chatId가 없습니다.', { userId, chatId })
      return null
    }
    
    const messageWithId = {
      ...message,
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    }
    
    commit('ADD_MESSAGE', { userId, chatId, message: messageWithId })
    
    // 첫 번째 사용자 메시지로 채팅 제목 자동 생성
    const chat = this.getters['chat/getChatById'](chatId)
    if (chat && chat.messages.length === 1 && message.sender === 'user') {
      const title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
      commit('UPDATE_CHAT', { userId, chatId, updates: { title } })
    }
    
    return messageWithId
  },
  
  // 채팅 제목 업데이트
  updateChatTitle({ commit, rootGetters }, { chatId, title }) {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId) return
    
    commit('UPDATE_CHAT', { userId, chatId, updates: { title } })
  },
  
  // 채팅 설정 업데이트
  updateChatSettings({ commit, rootGetters }, { chatId, settings }) {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId) return
    
    commit('UPDATE_CHAT', { userId, chatId, updates: { settings } })
  },
  
  // 메시지 삭제
  deleteMessage({ commit, rootGetters }, { chatId, messageIndex }) {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId) return
    
    commit('DELETE_MESSAGE', { userId, chatId, messageIndex })
  },
  
  // 채팅 삭제
  deleteChat({ commit, rootGetters }, chatId) {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId) return
    
    commit('DELETE_CHAT', { userId, chatId })
    
    // 현재 채팅이 삭제된 경우 초기화
    if (state.currentChatId === chatId) {
      commit('SET_CURRENT_CHAT', null)
    }
  }
}

const getters = {
  currentChatId: state => state.currentChatId,
  
  getUserChats: (state, getters, rootState, rootGetters) => {
    const userId = rootGetters['auth/currentUser']?.id
    if (!userId || !state.userChats[userId]) return {}
    return state.userChats[userId]
  },
  
  getChatById: (state, getters) => (chatId) => {
    const userChats = getters.getUserChats
    return userChats[chatId] || null
  },
  
  getCurrentChat: (state, getters) => {
    if (!state.currentChatId) return null
    return getters.getChatById(state.currentChatId)
  },
  
  getCurrentMessages: (state, getters) => {
    const currentChat = getters.getCurrentChat
    return currentChat ? currentChat.messages || [] : []
  },
  
  getChatList: (state, getters) => {
    const userChats = getters.getUserChats
    return Object.values(userChats).sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    )
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
