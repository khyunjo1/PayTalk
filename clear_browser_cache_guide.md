# 브라우저 캐시 완전 삭제 가이드

## Chrome/Edge
1. **개발자 도구 열기**: F12 또는 Ctrl+Shift+I
2. **Application 탭** 클릭
3. **Storage** 섹션에서:
   - **Local Storage** → `pay-talk.vercel.app` → 모든 항목 삭제
   - **Session Storage** → `pay-talk.vercel.app` → 모든 항목 삭제
   - **IndexedDB** → 모든 데이터베이스 삭제
4. **Cookies** → `pay-talk.vercel.app` → 모든 쿠키 삭제
5. **Clear Storage** 버튼 클릭

## 또는 하드 새로고침
- **Ctrl+Shift+R** (Windows/Linux)
- **Cmd+Shift+R** (Mac)

## 또는 시크릿 모드에서 테스트
- **Ctrl+Shift+N** (Chrome)
- **Ctrl+Shift+P** (Firefox)

## 확인 방법
1. 데이터베이스에서 `check_remaining_data.sql` 실행
2. 모든 테이블의 row_count가 0인지 확인
3. 시크릿 모드에서 사이트 접속하여 테스트
