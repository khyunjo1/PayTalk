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
    console.log('전화번호 기반 푸시 알림 발송 시작:', { phone, title, body });

    // 1. 전화번호로 푸시 구독 정보 조회
    const { data: subscriptionData, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('phone_number', phone)
      .single();

    if (error || !subscriptionData) {
      console.log(`전화번호 ${phone}에 대한 푸시 구독 정보가 없습니다.`);
      // 다른 사용자들에게 알림을 시도해보기 위해 브로드캐스트
      return await sendBrowserNotificationFallback(title, body, data);
    }

    console.log('전화번호 기반 구독 정보 찾음:', subscriptionData);

    // 2. 알림 권한 확인
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('알림 권한이 허용되지 않았습니다. 현재 권한:', Notification.permission);
      return false;
    }
    
    // Safari 브라우저 감지
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // Safari에서는 기본 Notification API 사용
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data,
          silent: false
        });
        
        console.log('Safari 기본 알림 발송 성공:', notification);
        
        // 5초 후 자동으로 닫기
        setTimeout(() => {
          if (notification) {
            notification.close();
          }
        }, 5000);
        
        return true;
      } catch (safariError) {
        console.error('Safari 알림 발송 실패:', safariError);
        return false;
      }
    }
    
    // 3. Service Worker를 통한 알림 표시 (Safari가 아닌 경우)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data,
          vibrate: [200, 100, 200],
          requireInteraction: false,
          silent: false,
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
        console.log('Service Worker 알림 발송 성공');
        return true;
      } catch (swError) {
        console.error('Service Worker 알림 발송 실패:', swError);
        return false;
      }
    } else {
      console.warn('Service Worker 또는 PushManager를 지원하지 않는 브라우저입니다.');
      return false;
    }
  } catch (error) {
    console.error('전화번호 기반 푸시 알림 발송 실패:', error);
    return false;
  }
};

// 브라우저 알림 폴백 (전화번호로 구독 정보를 찾을 수 없을 때)
const sendBrowserNotificationFallback = async (
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> => {
  try {
    console.log('브라우저 알림 폴백 시도:', { title, body });

    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('알림 권한이 허용되지 않았습니다.');
      return false;
    }

    // Safari 감지
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
        silent: false
      });
      
      setTimeout(() => {
        if (notification) {
          notification.close();
        }
      }, 5000);
      
      console.log('Safari 폴백 알림 발송 성공');
      return true;
    }

    // Service Worker 알림
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
        vibrate: [200, 100, 200],
        requireInteraction: false
      });
      console.log('Service Worker 폴백 알림 발송 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('브라우저 알림 폴백 실패:', error);
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
