// 날짜 계산 유틸리티 함수들

export interface StoreTimeInfo {
  businessStartTime: string; // "09:00"
  orderCutoffTime: string;   // "15:00"
}

// 현재 한국 시간 가져오기 (UTC+9 직접 계산)
export function getCurrentKoreaTime(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (9 * 3600000)); // UTC+9
}

// 주문 날짜 계산 (오늘 vs 내일)
export function getOrderDate(storeTimeInfo: StoreTimeInfo): {
  isToday: boolean;
  orderDate: Date;
  displayText: string;
} {
  const currentTime = getCurrentKoreaTime();
  const { businessStartTime, orderCutoffTime } = storeTimeInfo;
  
  // 시간을 분으로 변환
  const [businessStartHour, businessStartMinute] = businessStartTime.split(':').map(Number);
  const [cutoffHour, cutoffMinute] = orderCutoffTime.split(':').map(Number);
  const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
  
  const businessStartMinutes = businessStartHour * 60 + businessStartMinute;
  const cutoffMinutes = cutoffHour * 60 + cutoffMinute;
  const currentMinutes = currentHour * 60 + currentMinute;
  
  // 주문마감시간 이후면 내일, 아니면 오늘
  const isToday = currentMinutes < cutoffMinutes;
  
  const orderDate = isToday ? currentTime : new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
  
  const displayText = isToday ? '오늘의 반찬' : '내일의 반찬';
  
  return {
    isToday,
    orderDate,
    displayText
  };
}

// 주문접수 시간대인지 확인
export function isInOrderTime(storeTimeInfo: StoreTimeInfo): boolean {
  const currentTime = getCurrentKoreaTime();
  const { businessStartTime, orderCutoffTime } = storeTimeInfo;
  
  const [businessStartHour, businessStartMinute] = businessStartTime.split(':').map(Number);
  const [cutoffHour, cutoffMinute] = orderCutoffTime.split(':').map(Number);
  const [currentHour, currentMinute] = [currentTime.getHours(), currentTime.getMinutes()];
  
  const businessStartMinutes = businessStartHour * 60 + businessStartMinute;
  const cutoffMinutes = cutoffHour * 60 + cutoffMinute;
  const currentMinutes = currentHour * 60 + currentMinute;
  
  return currentMinutes >= businessStartMinutes && currentMinutes < cutoffMinutes;
}

// 날짜를 한국어 형식으로 포맷
export function formatKoreanDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
}

// 주문 접수 상태 결정
export function getOrderAcceptanceStatus(storeTimeInfo: StoreTimeInfo, dbStatus: string): {
  status: 'current' | 'tomorrow' | 'closed';
  message: string;
  canOrder: boolean;
  isTomorrowOrder?: boolean;
} {
  const isInOrder = isInOrderTime(storeTimeInfo);
  const { isToday } = getOrderDate(storeTimeInfo);
  
  if (isInOrder) {
    // 주문접수 시간대 (09:00 ~ 15:00)
    return {
      status: 'current',
      message: '현재 주문을 받고 있습니다.',
      canOrder: true,
      isTomorrowOrder: false
    };
  } else {
    // 주문마감 시간대
    if (dbStatus === 'tomorrow') {
      return {
        status: 'tomorrow',
        message: '내일 주문을 미리 받고 있습니다.',
        canOrder: true,
        isTomorrowOrder: true
      };
    } else {
      return {
        status: 'closed',
        message: '오늘 주문이 마감되었습니다. 내일 주문을 미리 하시려면 버튼을 눌러주세요.',
        canOrder: false,
        isTomorrowOrder: false
      };
    }
  }
}

