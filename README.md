<<<<<<< HEAD
# PayTalk - 반찬 배달 플랫폼

전문 반찬가게와 고객을 연결하는 스마트한 배달 플랫폼입니다.

## 🚀 주요 기능

- **카카오 로그인** 연동
- **실시간 알림톡** (카카오 비즈메시지 API)
- **PWA** 지원 (앱 설치 불필요)
- **모바일 최적화** UI/UX
- **매장 관리 시스템**
- **주문 관리 시스템**

## 🛠 기술 스택

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Authentication**: Kakao OAuth 2.0
- **Notifications**: Kakao Bizmessage API
- **Payments**: Toss Payments (예정)

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/PayTalk.git
cd PayTalk
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# 카카오 API 설정
VITE_KAKAO_CLIENT_ID=your-kakao-client-id-here
VITE_KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_KAKAO_REST_API_KEY=your-kakao-rest-api-key-here

# 토스페이먼츠 설정
VITE_TOSS_CLIENT_KEY=your-toss-client-key-here
VITE_TOSS_SECRET_KEY=your-toss-secret-key-here

# 개발 환경 설정
VITE_APP_URL=http://localhost:3000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 📱 사용법

1. **홈페이지**에서 카카오 로그인
2. **매장 선택** 및 메뉴 확인
3. **주문하기** 및 결제
4. **실시간 알림** 받기

## 🔧 개발

### 프로젝트 구조
```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── hooks/         # 커스텀 훅
├── lib/           # 유틸리티 및 설정
└── types/         # TypeScript 타입 정의
```

### 주요 페이지
- `/` - 홈페이지 (로그인)
- `/stores` - 매장 목록
- `/menu/:storeId` - 메뉴 페이지
- `/cart` - 장바구니
- `/admin` - 매장 관리자 페이지
- `/super-admin` - 슈퍼 관리자 페이지

## 📄 라이선스

© 2024 PayTalk. All rights reserved.

## 📞 연락처

- **전화**: 02-1234-5678
- **이메일**: support@paytalk.co.kr
- **운영시간**: 평일 09:00 - 18:00
=======
# PayTalk
This project is a Korean side-dish delivery web app where users log in with Kakao, browse stores, add menus to cart, and place delivery or pickup orders with simulated KakaoPay. Store owners manage orders via their page, while a super admin dashboard lets the operator create stores, manage menus, and handle owner inquiries.
>>>>>>> 856b227d129f3ff2dc9d567875ae7f9714a5a6f4
