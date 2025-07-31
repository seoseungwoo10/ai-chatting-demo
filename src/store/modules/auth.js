import CryptoJS from 'crypto-js'

// 유틸리티 함수
const generateUserId = () => {
  return 'user_' + Math.random().toString(36).substr(2, 16)
}

const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString()
}

const state = {
  isAuthenticated: false,
  currentUser: null,
  users: JSON.parse(localStorage.getItem('ai_chat_users') || '{}'),
  userSessions: JSON.parse(localStorage.getItem('ai_chat_sessions') || '{}')
}

const mutations = {
  SET_AUTHENTICATED(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated
  },
  
  SET_CURRENT_USER(state, user) {
    state.currentUser = user
  },
  
  ADD_USER(state, user) {
    state.users[user.id] = user
    localStorage.setItem('ai_chat_users', JSON.stringify(state.users))
  },
  
  UPDATE_USER(state, userData) {
    if (state.currentUser && state.users[state.currentUser.id]) {
      state.users[state.currentUser.id] = { ...state.users[state.currentUser.id], ...userData }
      state.currentUser = { ...state.currentUser, ...userData }
      localStorage.setItem('ai_chat_users', JSON.stringify(state.users))
    }
  },
  
  SET_USER_SESSION(state, { userId, sessionData }) {
    state.userSessions[userId] = sessionData
    localStorage.setItem('ai_chat_sessions', JSON.stringify(state.userSessions))
  },
  
  CLEAR_AUTH(state) {
    state.isAuthenticated = false
    state.currentUser = null
    sessionStorage.removeItem('ai_chat_current_session')
  }
}

const actions = {
  // 회원가입
  async register({ commit }, { email, password, nickname }) {
    try {
      // 이메일 중복 체크
      const existingUser = Object.values(state.users).find(user => user.email === email)
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다.')
      }
      
      // 새 사용자 생성
      const userId = generateUserId()
      const hashedPassword = hashPassword(password)
      
      const newUser = {
        id: userId,
        email,
        password: hashedPassword,
        nickname: nickname || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          defaultModel: 'gpt-4o-mini',
          theme: 'light'
        }
      }
      
      commit('ADD_USER', newUser)
      commit('SET_CURRENT_USER', newUser)
      commit('SET_AUTHENTICATED', true)
      
      // 세션 저장
      sessionStorage.setItem('ai_chat_current_session', JSON.stringify({
        userId: newUser.id,
        loginTime: new Date().toISOString()
      }))
      
      return { success: true, user: newUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 로그인
  async login({ commit }, { email, password }) {
    try {
      // 사용자 찾기
      const user = Object.values(state.users).find(user => user.email === email)
      if (!user) {
        throw new Error('등록되지 않은 사용자입니다.')
      }
      
      // 비밀번호 확인
      const hashedPassword = hashPassword(password)
      if (user.password !== hashedPassword) {
        throw new Error('비밀번호가 올바르지 않습니다.')
      }
      
      // 로그인 성공
      const updatedUser = {
        ...user,
        lastLoginAt: new Date().toISOString()
      }
      
      commit('UPDATE_USER', { lastLoginAt: updatedUser.lastLoginAt })
      commit('SET_CURRENT_USER', updatedUser)
      commit('SET_AUTHENTICATED', true)
      
      // 세션 저장
      sessionStorage.setItem('ai_chat_current_session', JSON.stringify({
        userId: user.id,
        loginTime: new Date().toISOString()
      }))
      
      return { success: true, user: updatedUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 게스트 로그인
  async loginAsGuest({ commit }) {
    const guestId = generateUserId()
    const guestUser = {
      id: guestId,
      email: `guest@${guestId}.com`,
      nickname: '게스트 사용자',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: {
        defaultModel: 'gpt-4o-mini',
        theme: 'light'
      }
    }
    
    commit('SET_CURRENT_USER', guestUser)
    commit('SET_AUTHENTICATED', true)
    
    // 게스트 세션은 sessionStorage에만 저장
    sessionStorage.setItem('ai_chat_current_session', JSON.stringify({
      userId: guestUser.id,
      loginTime: new Date().toISOString(),
      isGuest: true
    }))
    
    return { success: true, user: guestUser }
  },
  
  // 세션 복원
  async restoreSession({ commit }) {
    try {
      const sessionData = sessionStorage.getItem('ai_chat_current_session')
      if (!sessionData) return false
      
      const session = JSON.parse(sessionData)
      
      if (session.isGuest) {
        // 게스트 세션은 복원하지 않음
        return false
      }
      
      const user = state.users[session.userId]
      if (!user) return false
      
      commit('SET_CURRENT_USER', user)
      commit('SET_AUTHENTICATED', true)
      
      return true
    } catch (error) {
      console.error('Session restore failed:', error)
      return false
    }
  },
  
  // 로그아웃
  logout({ commit }) {
    commit('CLEAR_AUTH')
    // 채팅 히스토리는 유지하고 세션만 클리어
  },
  
  // 프로필 업데이트
  updateProfile({ commit }, profileData) {
    commit('UPDATE_USER', profileData)
  },
  
  // 사용자 설정 업데이트
  updatePreferences({ commit }, preferences) {
    commit('UPDATE_USER', { preferences })
  }
}

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  currentUser: state => state.currentUser,
  userPreferences: state => state.currentUser ? state.currentUser.preferences : {},
  isGuest: state => state.currentUser ? state.currentUser.isGuest || false : false
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
