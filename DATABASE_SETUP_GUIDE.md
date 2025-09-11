# 데이터베이스 설정 가이드

## 1. Supabase SQL 에디터에서 다음 순서로 실행하세요:

### Step 1: users 테이블 생성
```sql
-- create_users_table_with_roles.sql 파일의 내용을 복사해서 실행
```

### Step 2: user_stores 테이블 생성  
```sql
-- create_user_stores_table.sql 파일의 내용을 복사해서 실행
```

### Step 3: menus 테이블 생성
```sql
-- create_menus_table.sql 파일의 내용을 복사해서 실행
```

### Step 4: order_items 테이블 생성
```sql
-- create_order_items_table.sql 파일의 내용을 복사해서 실행
```

## 2. 테이블 생성 확인

다음 쿼리로 테이블이 정상 생성되었는지 확인하세요:

```sql
-- 모든 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- users 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

## 3. 샘플 데이터 삽입 (선택사항)

```sql
-- 테스트용 관리자 계정 생성
INSERT INTO users (id, email, name, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@paytalk.com',
  '관리자',
  'admin'
) ON CONFLICT (id) DO NOTHING;
```

## 4. RLS 정책 확인

```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 완료 후 다음 단계

데이터베이스 설정이 완료되면 다음 단계로 진행합니다:
- 실제 데이터 연동
- 권한 기반 라우팅 강화
- 알림톡 실제 발송 구현
