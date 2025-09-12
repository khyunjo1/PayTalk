import { supabase } from './supabase';

// 푸시 구독 정보 저장
export const savePushSubscription = async (userId: string, subscription: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('푸시 구독 정보 저장 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('푸시 구독 정보 저장 실패:', error);
    return false;
  }
};

// 사용자의 푸시 구독 정보 조회
export const getPushSubscription = async (userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('푸시 구독 정보 조회 오류:', error);
      return null;
    }

    return data?.subscription;
  } catch (error) {
    console.error('푸시 구독 정보 조회 실패:', error);
    return null;
  }
};

// 푸시 알림 발송 (user_id 기반)
export const sendPushNotification = async (
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> => {
  try {
    // 2. 알림 권한 확인
    if (Notification.permission !== 'granted') {
      console.log('알림 권한이 허용되지 않았습니다.');
      return false;
    }

    // Safari는 기본 알림만 지원
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // Safari에서는 기본 Notification API 사용
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data
      });
      console.log('Safari에서 기본 알림이 발송되었습니다.');
      return true;
    }

    // 1. 사용자의 푸시 구독 정보 조회 (Safari가 아닌 경우)
    const { data: subscriptionData, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !subscriptionData) {
      console.log(`사용자 ${userId}의 푸시 구독 정보가 없습니다.`);
      return false;
    }

    // 3. Service Worker를 통한 알림 표시
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: '확인하기'
          },
          {
            action: 'close',
            title: '닫기'
          }
        ]
      });
    }

    return true;
  } catch (error) {
    console.error('푸시 알림 발송 실패:', error);
    return false;
  }
};

// 주문 상태별 알림 메시지 생성
export const getOrderNotificationMessage = (status: string, orderId: string): { title: string; body: string } => {
  switch (status) {
    case '입금확인':
      return {
        title: '입금 확인 완료',
        body: `주문번호 ${orderId}의 입금이 확인되었습니다. 곧 배달하러 가겠습니다!`
      };
    case '배달완료':
      return {
        title: '배달 완료',
        body: `주문번호 ${orderId}의 배달이 완료되었습니다. 맛있게 드세요!`
      };
    case '입금대기':
      return {
        title: '입금 대기',
        body: `주문번호 ${orderId}의 입금을 확인 중입니다.`
      };
    case '주문취소':
      return {
        title: '주문 취소',
        body: `주문번호 ${orderId}이 취소되었습니다.`
      };
    default:
      return {
        title: '주문 상태 변경',
        body: `주문번호 ${orderId}의 상태가 변경되었습니다.`
      };
  }
};

// 사장님용 주문 접수 알림 메시지
export const getStoreOrderNotificationMessage = (storeName: string, orderId: string): { title: string; body: string } => {
  return {
    title: '새 주문 접수',
    body: `${storeName}에 새로운 주문이 들어왔습니다! (주문번호: ${orderId})`
  };
};
