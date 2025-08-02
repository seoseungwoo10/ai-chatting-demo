<template>
  <div class="relative">
    <!-- 사용자 프로필 버튼 -->
    <button
      @click="toggleDropdown"
      class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <img
        :src="currentUser.avatar"
        :alt="currentUser.nickname"
        class="w-8 h-8 rounded-full"
        @error="handleAvatarError"
      />
      <span class="text-sm font-medium text-gray-700 hidden sm:block">
        {{ currentUser.nickname }}
      </span>
      <svg
        class="w-4 h-4 text-gray-500 transition-transform"
        :class="{ 'rotate-180': isDropdownOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- 드롭다운 메뉴 -->
    <div
      v-if="isDropdownOpen"
      class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      <!-- 사용자 정보 섹션 -->
      <div class="px-4 py-3 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <img
            :src="currentUser.avatar"
            :alt="currentUser.nickname"
            class="w-10 h-10 rounded-full"
            @error="handleAvatarError"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ currentUser.nickname }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ currentUser.email }}
            </p>
            <p v-if="isGuest" class="text-xs text-orange-500">
              게스트 모드
            </p>
          </div>
        </div>
      </div>

      <!-- 메뉴 아이템들 -->
      <div class="py-2">
        <!-- 프로필 편집 -->
        <button
          v-if="!isGuest"
          @click="openProfileEdit"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>프로필 편집</span>
        </button>

        <!-- 설정 -->
        <button
          @click="openSettings"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>설정</span>
        </button>

        <!-- 구분선 -->
        <hr class="my-2 border-gray-200">

        <!-- 새 계정 만들기 (게스트인 경우) -->
        <button
          v-if="isGuest"
          @click="createAccount"
          class="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>계정 만들기</span>
        </button>

        <!-- 로그아웃 -->
        <button
          @click="handleLogout"
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>로그아웃</span>
        </button>
      </div>
    </div>

    <!-- 프로필 편집 모달 -->
    <div
      v-if="showProfileEdit"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">프로필 편집</h3>
        </div>
        
        <form @submit.prevent="saveProfile" class="px-6 py-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              v-model="editForm.nickname"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeProfileEdit"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 설정 모달 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">설정</h3>
        </div>
        
        <div class="px-6 py-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              기본 AI 모델
            </label>
            <select
              v-model="settingsForm.defaultModel"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              테마
            </label>
            <select
              v-model="settingsForm.theme"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="auto">시스템 설정</option>
            </select>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeSettings"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="button"
              @click="saveSettings"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'UserProfile',
  data() {
    return {
      isDropdownOpen: false,
      showProfileEdit: false,
      showSettings: false,
      editForm: {
        nickname: ''
      },
      settingsForm: {
        defaultModel: 'gpt-4o-mini',
        theme: 'light'
      }
    }
  },
  computed: {
    ...mapGetters('auth', ['currentUser', 'isGuest', 'userPreferences'])
  },
  mounted() {
    // 클릭 외부 영역 감지
    document.addEventListener('click', this.handleClickOutside)
    
    // 사용자 설정 초기화
    if (this.userPreferences) {
      this.settingsForm = { ...this.userPreferences }
    }
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    ...mapActions('auth', ['logout', 'updateProfile', 'updatePreferences']),

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
    },

    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isDropdownOpen = false
      }
    },

    handleAvatarError(event) {
      // 아바타 로드 실패 시 기본 이미지로 대체
      event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.nickname)}&background=6366f1&color=fff`
    },

    openProfileEdit() {
      this.editForm.nickname = this.currentUser.nickname
      this.showProfileEdit = true
      this.isDropdownOpen = false
    },

    closeProfileEdit() {
      this.showProfileEdit = false
    },

    async saveProfile() {
      await this.updateProfile({
        nickname: this.editForm.nickname
      })
      this.closeProfileEdit()
    },

    openSettings() {
      this.settingsForm = { ...this.userPreferences }
      this.showSettings = true
      this.isDropdownOpen = false
    },

    closeSettings() {
      this.showSettings = false
    },

    async saveSettings() {
      await this.updatePreferences(this.settingsForm)
      this.closeSettings()
    },

    createAccount() {
      this.$emit('create-account')
      this.isDropdownOpen = false
    },

    handleLogout() {
      this.logout()
      this.isDropdownOpen = false
    }
  }
}
</script>

<style scoped>
/* 드롭다운 애니메이션 */
.rotate-180 {
  transform: rotate(180deg);
}
.border-gray-300 {
  color: rgb(55 65 81)
}
</style>
