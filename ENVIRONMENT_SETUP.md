# 환경 변수 설정 가이드

PayTalk 프로젝트를 실행하기 위해 필요한 환경 변수들을 설정하는 방법을 안내합니다.

## 1. 환경 변수 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# 카카오 API 설정
VITE_KAKAO_CLIENT_ID=your-kakao-client-id-here
VITE_KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_KAKAO_REST_API_KEY=your-kakao-rest-api-key-here

# 카카오 알림톡 설정
VITE_KAKAO_ACCESS_TOKEN=your_kakao_access_token_here
VITE_KAKAO_CHANNEL_ID=your_channel_id_here

# 토스페이먼츠 설정
VITE_TOSS_CLIENT_KEY=your-toss-client-key-here
VITE_TOSS_SECRET_KEY=your-toss-secret-key-here

# 푸시 알림 설정 (VAPID)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here
VITE_VAPID_PRIVATE_KEY=your-vapid-private-key-here

# OneSignal 설정
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id-here
VITE_ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key-here

# 개발 환경 설정
VITE_APP_URL=http://localhost:3000
```

## 2. 각 환경 변수 설명

### 2.1 Supabase 설정
- **VITE_SUPABASE_URL**: Supabase 프로젝트의 URL
- **VITE_SUPABASE_ANON_KEY**: Supabase의 익명 키 (공개 키)

### 2.2 카카오 API 설정
- **VITE_KAKAO_CLIENT_ID**: 카카오 로그인용 클라이언트 ID
- **VITE_KAKAO_REDIRECT_URI**: 카카오 로그인 후 리다이렉트될 URI
- **VITE_KAKAO_REST_API_KEY**: 카카오 REST API 키

### 2.3 카카오 알림톡 설정
- **VITE_KAKAO_ACCESS_TOKEN**: 카카오 알림톡 발송용 액세스 토큰
- **VITE_KAKAO_CHANNEL_ID**: 카카오 채널 ID

### 2.4 토스페이먼츠 설정
- **VITE_TOSS_CLIENT_KEY**: 토스페이먼츠 클라이언트 키
- **VITE_TOSS_SECRET_KEY**: 토스페이먼츠 시크릿 키

### 2.5 푸시 알림 설정 (VAPID)
- **VITE_VAPID_PUBLIC_KEY**: VAPID 공개 키
- **VITE_VAPID_PRIVATE_KEY**: VAPID 개인 키

### 2.6 OneSignal 설정
- **VITE_ONESIGNAL_APP_ID**: OneSignal 앱 ID
- **VITE_ONESIGNAL_REST_API_KEY**: OneSignal REST API 키

### 2.7 개발 환경 설정
- **VITE_APP_URL**: 애플리케이션의 기본 URL

## 3. 설정 방법

### 3.1 Supabase 설정
1. [Supabase](https://supabase.com/)에서 프로젝트 생성
2. 프로젝트 설정 → API → URL과 anon key 복사
3. `.env.local` 파일에 값 입력

### 3.2 카카오 API 설정
1. [카카오 개발자 사이트](https://developers.kakao.com/)에서 애플리케이션 생성
2. 앱 키 → REST API 키 복사
3. 플랫폼 → Web 플랫폼 등록 (도메인: http://localhost:3000)
4. 제품 설정 → 카카오 로그인 활성화
5. `.env.local` 파일에 값 입력

### 3.3 카카오 알림톡 설정
1. [카카오 비즈니스](https://business.kakao.com/)에서 채널 생성
2. Bizmessage 서비스 신청
3. 템플릿 생성 및 승인
4. 액세스 토큰 발급
5. `.env.local` 파일에 값 입력

### 3.4 토스페이먼츠 설정
1. [토스페이먼츠](https://developers.tosspayments.com/)에서 계정 생성
2. 테스트 키 발급
3. `.env.local` 파일에 값 입력

### 3.5 푸시 알림 설정
1. VAPID 키 생성 (웹 푸시용)
2. OneSignal 계정 생성 및 앱 등록
3. `.env.local` 파일에 값 입력

## 4. 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (보안상 위험)
- 실제 서비스용 키와 개발용 키를 구분해서 사용하세요
- 환경 변수 값에는 따옴표를 사용하지 마세요
- 모든 환경 변수는 `VITE_` 접두사로 시작해야 합니다

## 5. 문제 해결

### 5.1 환경 변수가 인식되지 않는 경우
- 파일명이 `.env.local`인지 확인
- 프로젝트 루트 디렉토리에 있는지 확인
- 개발 서버를 재시작해보세요

### 5.2 Supabase 연결 오류
- URL과 키가 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 5.3 카카오 로그인 오류
- 클라이언트 ID가 정확한지 확인
- 리다이렉트 URI가 등록되어 있는지 확인
- 도메인이 일치하는지 확인
