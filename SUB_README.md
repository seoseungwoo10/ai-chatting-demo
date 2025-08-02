
## 🗂️ 2. 채팅 세션 관리 (우선순위: 높음)

### 📖 기능 설명
여러 채팅방을 생성하고 관리할 수 있는 탭 기반 인터페이스

### 🎯 목표
- 주제별 대화 분리
- 동시에 여러 주제 진행 가능
- 채팅방 이름 및 설정 관리

### 📋 요구사항

#### 기능적 요구사항
1. **채팅방 생성**
   - 새 채팅방 생성 버튼
   - 자동 채팅방 이름 생성 (첫 번째 메시지 기반)
   - 채팅방 이름 수정 기능

2. **채팅방 관리**
   - 채팅방 목록 사이드바
   - 채팅방 삭제 기능
   - 채팅방 즐겨찾기
   - 최근 활동 순 정렬

3. **채팅방별 설정**
   - 각 채팅방별 AI 모델 설정
   - 채팅방별 시스템 프롬프트
   - 채팅방 색상 테마

#### 비기능적 요구사항
- 최대 채팅방 수: 20개
- 채팅방 전환 시간: < 500ms
- 채팅방별 최대 메시지: 100개

### 🛠️ 기술 스택
- **라우팅**: Vue Router 3.x
- **상태 관리**: Vuex modules
- **아이콘**: Heroicons
- **애니메이션**: CSS Transitions

### 📐 UI/UX 설계

#### 사이드바 레이아웃
```vue
<template>
  <div class="chat-layout">
    <!-- 사이드바 -->
    <div class="sidebar">
      <button class="new-chat-btn">+ 새 채팅</button>
      <div class="chat-list">
        <div v-for="chat in chatSessions" :key="chat.id" 
             class="chat-item"
             :class="{ active: currentChat === chat.id }">
          <span class="chat-title">{{ chat.title }}</span>
          <span class="chat-time">{{ chat.lastActivity }}</span>
        </div>
      </div>
    </div>
    
    <!-- 메인 채팅 영역 -->
    <div class="main-chat">
      <ChatMessage2 v-for="message in currentMessages" ... />
    </div>
  </div>
</template>
```

#### 채팅방 관리 UI
- 마우스 우클릭 컨텍스트 메뉴
- 채팅방 이름 인라인 편집
- 색상 테마 선택 팝오버

### 📊 성공 지표
- 평균 채팅방 수: 사용자당 3-5개
- 채팅방 전환 횟수: 세션당 5회 이상
- 채팅방 삭제율: 20% 이하

### ⏰ 일정
- **1-2일**: Vue Router 및 Vuex modules 설정
- **3-4일**: 사이드바 UI 구현
- **5-6일**: 채팅방 CRUD 기능
- **7일**: 채팅방 설정 및 테마  

