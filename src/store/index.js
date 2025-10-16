import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import chat from './modules/chat'

Vue.use(Vuex)

/**
 * Vuex 스토어 설정
 * - modules: auth, chat 모듈 포함
 * - strict 모드: 개발 환경에서만 활성화
 * - 각 모듈은 독립적인 상태, 변이, 액션, 게터를 가짐
 * - auth 모듈: 사용자 인증 및 설정 관리
 * - chat 모듈: 채팅 관련 상태 관리
 * - strict 모드 활성화 시, 상태 변경은 반드시 변이를 통해서만 이루어져야 함
 * - 프로덕션 환경에서는 strict 모드를 비활성화하여 성능 최적화
 * - Vuex 공식 문서 참고: https://v3.vuex.vuejs.org/
 */
export default new Vuex.Store({
  modules: {
    auth,
    chat
  },
  strict: process.env.NODE_ENV !== 'production'
})
