# PayTalk - 종합 상품 판매 플랫폼

다양한 업종의 매장과 고객을 연결하는 스마트한 상품 판매 플랫폼입니다. 반찬가게, 음식점, 기타 상품 판매업체 등 다양한 업종을 지원하며, PWA 기술을 활용하여 모바일 앱과 같은 사용자 경험을 제공합니다. 실시간 푸시 알림을 통해 주문 상태를 즉시 알려드리며, 전화번호 기반 간편 로그인과 무통장입금/제로페이 결제 시스템을 지원합니다.

## 🚀 주요 기능

### 고객 기능
- **전화번호 로그인** - 간편한 전화번호 기반 로그인
- **다양한 업종 지원** - 반찬가게, 음식점, 기타 상품 판매업체 등
- **일일 상품 목록** - 매일 업데이트되는 상품/메뉴
- **실시간 주문** - 배달/픽업 주문 시스템
- **주문 조회** - 전화번호로 주문 내역 확인
- **푸시 알림** - 주문 상태 변경 실시간 알림
- **PWA 지원** - 앱 설치 없이 네이티브 앱 경험
- **다양한 결제** - 무통장입금, 제로페이 QR 결제 지원

### 매장 관리자 기능
- **매장 정보 관리** - 매장 등록, 수정, 삭제 (다양한 업종 지원)
- **상품 관리** - 카테고리별 상품 CRUD, 상품 분류 관리
- **일일 상품 목록 관리** - 날짜별 상품 목록 생성 및 설정
- **주문 관리** - 주문 목록, 상태 변경, 상세 조회
- **배달 지역 관리** - 지역별 배달비 설정
- **시간 설정** - 영업시간, 주문마감시간, 픽업/배달시간대

### 슈퍼 관리자 기능
- **전체 매장 관리** - 모든 업종의 매장 통합 관리
- **사용자 관리** - 고객 및 매장 관리자 관리
- **통계 및 분석** - 매출, 주문 현황 분석
- **문의 관리** - 고객 문의사항 처리

## 🛠 기술 스택

### Frontend
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 타입 안전성 보장
- **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **React Router** - 클라이언트 사이드 라우팅

### Backend & Database
- **Supabase** - PostgreSQL 기반 BaaS
- **Supabase Auth** - 사용자 인증 관리
- **Supabase Realtime** - 실시간 데이터 동기화
- **Supabase Functions** - 서버리스 함수

### 외부 서비스
- **OneSignal** - 푸시 알림 서비스
- **무통장입금** - 계좌이체 결제 시스템
- **제로페이** - QR 코드 기반 결제 시스템

### 개발 도구
- **ESLint** - 코드 품질 관리
- **PostCSS** - CSS 후처리
- **Auto Import** - 자동 import 관리

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

# OneSignal 설정
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id-here

# 개발 환경 설정
VITE_APP_URL=http://localhost:5173
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📱 사용법

### 고객 사용법
1. **홈페이지** (`/`)에서 전화번호로 로그인
2. **일일 상품 목록** (`/menu/:storeId/daily/:date`)에서 상품 확인
3. **장바구니** (`/cart`)에서 주문 정보 입력 및 결제
4. **주문 완료** 후 전화번호로 주문 조회 가능

### 매장 관리자 사용법
1. **관리자 로그인** (`/admin-login`)
2. **매장 선택** 후 관리자 대시보드 접근
3. **일일 상품 목록 관리** (`/admin/:storeId/daily-menu`)에서 상품 설정
4. **주문 관리** (`/admin/:storeId/orders`)에서 주문 처리

### 슈퍼 관리자 사용법
1. **슈퍼 관리자 로그인** (`/super-login`)
2. **슈퍼 관리자 대시보드** (`/super-admin`)에서 전체 시스템 관리

## 🔧 개발

### 프로젝트 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header.tsx      # 공통 헤더
│   ├── Footer.tsx      # 공통 푸터
│   ├── PWAInstallButton.tsx  # PWA 설치 버튼
│   └── PushNotification*.tsx # 푸시 알림 관련 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── home/           # 홈페이지
│   ├── login/          # 로그인 페이지
│   ├── menu/           # 메뉴 관련 페이지
│   ├── cart/           # 장바구니 페이지
│   ├── admin/          # 매장 관리자 페이지
│   ├── super-admin/    # 슈퍼 관리자 페이지
│   └── order-*/        # 주문 관련 페이지
├── hooks/              # 커스텀 훅
│   ├── useAuth.ts      # 인증 관련 훅
│   ├── useNewAuth.tsx  # 새로운 인증 훅
│   └── usePushNotification.ts # 푸시 알림 훅
├── lib/                # 유틸리티 및 설정
│   ├── supabase.ts     # Supabase 클라이언트
│   ├── auth.ts         # 인증 관련 함수
│   ├── *Api.ts         # API 함수들
│   └── push*.ts        # 푸시 알림 관련 함수
├── types/              # TypeScript 타입 정의
│   └── index.ts        # 공통 타입 정의
├── router/             # 라우팅 설정
│   ├── config.tsx      # 라우트 설정
│   └── index.ts        # 라우터 초기화
└── utils/              # 유틸리티 함수
    ├── manifestGenerator.ts # PWA 매니페스트 생성
    └── phoneUtils.ts    # 전화번호 유틸리티
```

### 주요 페이지 라우트
- `/` - 홈페이지 (로그인)
- `/homepage` - 메인 홈페이지
- `/menu/:storeId/daily/:date` - 일일 상품 목록 페이지
- `/cart` - 장바구니
- `/order-complete/:orderId` - 주문 완료
- `/order-status/:storeId` - 주문 조회
- `/admin/:storeId` - 매장 관리자 대시보드
- `/admin/:storeId/daily-menu` - 일일 상품 목록 관리
- `/admin/:storeId/orders` - 주문 관리
- `/admin/:storeId/analytics` - 매출 분석
- `/super-admin` - 슈퍼 관리자 대시보드

### API 구조
- **인증 API** (`authApi.ts`) - 로그인, 로그아웃, 사용자 정보
- **매장 API** (`storeApi.ts`) - 매장 CRUD, 설정 관리
- **상품 API** (`menuApi.ts`) - 상품 CRUD, 카테고리 관리
- **일일 상품 API** (`dailyMenuApi.ts`) - 일일 상품 목록 관리
- **주문 API** (`orderApi.ts`) - 주문 생성, 조회, 상태 변경
- **푸시 알림 API** (`pushApi.ts`) - 알림 발송, 구독 관리

## 🧪 테스트

프로젝트에는 포괄적인 테스트 케이스가 포함되어 있습니다. 자세한 내용은 [TEST_CASES.md](./TEST_CASES.md)를 참고하세요.

### 테스트 실행
```bash
# 개발 서버에서 수동 테스트
npm run dev

# 프로덕션 빌드 테스트
npm run build
npm run preview
```

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel 계정에 GitHub 저장소 연결
2. 환경 변수 설정
3. 자동 배포 활성화

### 수동 배포
```bash
npm run build
# dist 폴더를 웹 서버에 업로드
```

## 📱 PWA 기능

- **앱 설치** - 홈 화면에 앱 추가 가능
- **오프라인 지원** - Service Worker를 통한 오프라인 기능
- **푸시 알림** - 주문 상태 변경 실시간 알림
- **반응형 디자인** - 모든 디바이스에서 최적화된 경험

## 🔐 보안

- **JWT 토큰** 기반 인증
- **Supabase RLS** (Row Level Security) 적용
- **HTTPS** 강제 사용
- **XSS 방지** 및 입력 검증

## 📊 모니터링

- **Supabase Dashboard** - 데이터베이스 모니터링
- **Vercel Analytics** - 웹사이트 성능 분석
- **OneSignal Dashboard** - 푸시 알림 통계

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참고하세요.

## 📞 지원 및 문의

- **이메일**: support@paytalk.co.kr
- **GitHub Issues**: [프로젝트 이슈 페이지](https://github.com/YOUR_USERNAME/PayTalk/issues)
- **문서**: [프로젝트 위키](https://github.com/YOUR_USERNAME/PayTalk/wiki)

## 🙏 감사의 말

- [React](https://reactjs.org/) - UI 라이브러리
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [OneSignal](https://onesignal.com/) - 푸시 알림 서비스

---

## 📋 프로젝트 개요

이 프로젝트는 한국의 종합 상품 판매 웹 애플리케이션입니다. 반찬가게, 음식점, 기타 상품 판매업체 등 다양한 업종의 매장을 지원합니다. 사용자는 전화번호로 로그인하여 원하는 업종의 매장을 둘러보고, 상품을 장바구니에 담아 배달 또는 픽업 주문을 할 수 있습니다. 무통장입금과 제로페이 QR 코드를 통한 결제를 지원합니다. 매장 사장님들은 전용 페이지에서 주문을 관리할 수 있으며, 슈퍼 관리자 대시보드를 통해 운영자는 다양한 업종의 매장을 생성하고, 상품을 관리하며, 사장님들의 문의를 처리할 수 있습니다.

**PayTalk** - 다양한 상품의 새로운 판매 경험을 만들어갑니다. 🛍️✨