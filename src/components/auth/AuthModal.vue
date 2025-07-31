<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- 헤더 -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ isLoginMode ? '로그인' : '회원가입' }}
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          {{ isLoginMode ? 'AI 채팅에 오신 것을 환영합니다' : '새 계정을 만들어 시작하세요' }}
        </p>
      </div>

      <!-- 폼 -->
      <form @submit.prevent="handleSubmit" class="px-6 py-4">
        <!-- 닉네임 (회원가입 시에만) -->
        <div v-if="!isLoginMode" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            닉네임
          </label>
          <input
            v-model="form.nickname"
            type="text"
            placeholder="닉네임을 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.nickname }"
          />
          <p v-if="errors.nickname" class="text-red-500 text-xs mt-1">
            {{ errors.nickname }}
          </p>
        </div>

        <!-- 이메일 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            이메일 주소
          </label>
          <input
            v-model="form.email"
            type="email"
            placeholder="이메일 주소를 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.email }"
            required
          />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- 비밀번호 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            비밀번호
          </label>
          <input
            v-model="form.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.password }"
            required
          />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">
            {{ errors.password }}
          </p>
        </div>

        <!-- 비밀번호 확인 (회원가입 시에만) -->
        <div v-if="!isLoginMode" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            비밀번호 확인
          </label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.confirmPassword }"
            required
          />
          <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ errorMessage }}
        </div>

        <!-- 버튼들 -->
        <div class="flex flex-col space-y-3">
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              처리 중...
            </span>
            <span v-else>
              {{ isLoginMode ? '로그인' : '회원가입' }}
            </span>
          </button>

          <button
            type="button"
            @click="handleGuestLogin"
            class="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            게스트로 시작하기
          </button>
        </div>
      </form>

      <!-- 하단 링크 -->
      <div class="px-6 py-4 border-t border-gray-200 text-center">
        <p class="text-sm text-gray-600">
          {{ isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?' }}
          <button
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-500 font-medium"
          >
            {{ isLoginMode ? '회원가입' : '로그인' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AuthModal',
  data() {
    return {
      isLoginMode: true,
      isLoading: false,
      errorMessage: '',
      form: {
        email: '',
        password: '',
        confirmPassword: '',
        nickname: ''
      },
      errors: {}
    }
  },
  methods: {
    ...mapActions('auth', ['login', 'register', 'loginAsGuest']),

    toggleMode() {
      this.isLoginMode = !this.isLoginMode
      this.clearForm()
    },

    clearForm() {
      this.form = {
        email: '',
        password: '',
        confirmPassword: '',
        nickname: ''
      }
      this.errors = {}
      this.errorMessage = ''
    },

    validateForm() {
      this.errors = {}

      // 이메일 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.form.email) {
        this.errors.email = '이메일을 입력해주세요.'
      } else if (!emailRegex.test(this.form.email)) {
        this.errors.email = '올바른 이메일 형식이 아닙니다.'
      }

      // 비밀번호 검증
      if (!this.form.password) {
        this.errors.password = '비밀번호를 입력해주세요.'
      } else if (this.form.password.length < 6) {
        this.errors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
      }

      // 회원가입 시 추가 검증
      if (!this.isLoginMode) {
        // 닉네임 검증
        if (!this.form.nickname) {
          this.errors.nickname = '닉네임을 입력해주세요.'
        } else if (this.form.nickname.length < 2) {
          this.errors.nickname = '닉네임은 최소 2자 이상이어야 합니다.'
        }

        // 비밀번호 확인 검증
        if (!this.form.confirmPassword) {
          this.errors.confirmPassword = '비밀번호를 다시 입력해주세요.'
        } else if (this.form.password !== this.form.confirmPassword) {
          this.errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
        }
      }

      return Object.keys(this.errors).length === 0
    },

    async handleSubmit() {
      if (!this.validateForm()) {
        return
      }

      this.isLoading = true
      this.errorMessage = ''

      try {
        let result
        if (this.isLoginMode) {
          result = await this.login({
            email: this.form.email,
            password: this.form.password
          })
        } else {
          result = await this.register({
            email: this.form.email,
            password: this.form.password,
            nickname: this.form.nickname
          })
        }

        if (result.success) {
          this.$emit('success', result.user)
        } else {
          this.errorMessage = result.error
        }
      } catch (error) {
        this.errorMessage = '오류가 발생했습니다. 다시 시도해주세요.'
        console.error('Auth error:', error)
      } finally {
        this.isLoading = false
      }
    },

    async handleGuestLogin() {
      this.isLoading = true
      try {
        const result = await this.loginAsGuest()
        if (result.success) {
          this.$emit('success', result.user)
        }
      } catch (error) {
        this.errorMessage = '게스트 로그인에 실패했습니다.'
        console.error('Guest login error:', error)
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* 추가적인 스타일이 필요한 경우 여기에 작성 */
</style>
