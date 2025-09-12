// 전화번호 기반 푸시 알림 시스템

import { supabase } from './supabase';

// 전화번호로 푸시 알림 발송
export const sendPushNotificationByPhone = async (
  phone: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> => {
  try {
    // 1. 전화번호로 푸시 구독 정보 조회
    const { data: subscriptionData, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('phone_number', phone)
      .single();

    if (error || !subscriptionData) {
      console.log(`전화번호 ${phone}에 대한 푸시 구독 정보가 없습니다.`);
      return false;
    }

    // 2. 알림 권한 확인
    if (Notification.permission !== 'granted') {
      console.log('알림 권한이 허용되지 않았습니다.');
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
    console.error('전화번호 기반 푸시 알림 발송 실패:', error);
    return false;
  }
};

// 주문 시 전화번호와 푸시 구독 정보 연결
export const linkPhoneToPushSubscription = async (
  phone: string, 
  subscription: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        phone_number: phone,
        subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('전화번호-푸시 구독 연결 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('전화번호-푸시 구독 연결 실패:', error);
    return false;
  }
};

// 주문 상태별 알림 메시지 (전화번호 기반)
export const getOrderNotificationMessageByPhone = (
  status: string, 
  orderId: string, 
  storeName: string
): { title: string; body: string } => {
  switch (status) {
    case '입금확인':
      return {
        title: `${storeName} 입금 확인`,
        body: `주문번호 ${orderId}의 입금이 확인되었습니다. 곧 배달하러 가겠습니다!`
      };
    case '배달완료':
      return {
        title: `${storeName} 배달 완료`,
        body: `주문번호 ${orderId}의 배달이 완료되었습니다. 맛있게 드세요!`
      };
    case '입금대기':
      return {
        title: `${storeName} 입금 대기`,
        body: `주문번호 ${orderId}의 입금을 확인 중입니다.`
      };
    case '주문취소':
      return {
        title: `${storeName} 주문 취소`,
        body: `주문번호 ${orderId}이 취소되었습니다.`
      };
    default:
      return {
        title: `${storeName} 주문 상태 변경`,
        body: `주문번호 ${orderId}의 상태가 변경되었습니다.`
      };
  }
};
