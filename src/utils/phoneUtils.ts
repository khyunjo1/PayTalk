// 전화번호 관련 유틸리티 함수

// 전화번호를 01023432321 형식으로 변환
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 11자리인지 확인 (010으로 시작)
  if (numbers.length === 11 && numbers.startsWith('010')) {
    return numbers;
  }
  
  // 10자리인지 확인 (02로 시작하는 서울 지역번호)
  if (numbers.length === 10 && numbers.startsWith('02')) {
    return numbers;
  }
  
  return numbers;
};

// 전화번호 유효성 검사
export const isValidPhoneNumber = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone);
  return formatted.length === 11 || formatted.length === 10;
};

// 전화번호 표시 형식 (010-1234-5678)
export const displayPhoneNumber = (phone: string): string => {
  const formatted = formatPhoneNumber(phone);
  
  if (formatted.length === 11) {
    return `${formatted.slice(0, 3)}-${formatted.slice(3, 7)}-${formatted.slice(7)}`;
  }
  
  if (formatted.length === 10) {
    return `${formatted.slice(0, 2)}-${formatted.slice(2, 6)}-${formatted.slice(6)}`;
  }
  
  return formatted;
};

// 전화번호 입력 시 자동 포맷팅
export const handlePhoneInput = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  // 11자리 제한
  const limited = numbers.slice(0, 11);
  
  return limited;
};
