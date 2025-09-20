# 일일 메뉴 기능 설정 가이드

## 문제 상황
현재 `daily_menus` 테이블이 데이터베이스에 존재하지 않아서 406 오류가 발생하고 있습니다.

## 해결 방법

### 1. Supabase 대시보드에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. `create-daily-menus-table.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣기
5. "Run" 버튼 클릭하여 실행

### 2. 또는 Supabase CLI 사용

```bash
# 프로젝트 디렉토리에서
supabase db reset
# 또는
supabase db push
```

## 생성되는 테이블들

- `daily_menus`: 일일 메뉴 정보
- `daily_menu_items`: 일일 메뉴에 포함된 메뉴 아이템들
- `daily_delivery_areas`: 일일 메뉴별 배달 지역 설정

## 테이블 생성 후 확인

테이블이 성공적으로 생성되면:
1. 일일 메뉴 관리 페이지에서 오류 없이 접근 가능
2. 일일 메뉴 페이지에서 정상적으로 메뉴 표시
3. 콘솔에서 406 오류가 사라짐

## 문제가 지속되는 경우

1. Supabase 프로젝트가 일시 중지되었는지 확인 (무료 요금제)
2. RLS (Row Level Security) 정책이 올바르게 설정되었는지 확인
3. API 키와 URL이 올바른지 확인

## 추가 도움이 필요한 경우

- Supabase 문서: https://supabase.com/docs
- 프로젝트의 `src/lib/supabase.ts` 파일에서 연결 설정 확인
