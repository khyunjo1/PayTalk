import { supabase } from './supabase';

// 푸시 구독 정보 저장 (VAPID 방식)
export const savePushSubscription = async (subscription: any, userId: string): Promise<boolean> => {
  try {
    console.log('푸시 구독 정보 저장 시작:', { userId, subscription });

    // 1. 로컬 스토리지에 저장 (백업용)
    localStorage.setItem(`push_subscription_${userId}`, JSON.stringify(subscription));
    console.log('✅ 푸시 구독 정보 로컬 저장 성공');

    // 2. Supabase에 저장 (서버사이드 푸시 알림용)
    try {
      console.log('🔄 Supabase에 구독 정보 저장 시도...');
      console.log('저장할 데이터:', {
        user_id: userId,
        subscription: subscription,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 일반 supabase 클라이언트 사용
      const { data, error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      console.log('Supabase 응답:', { data, error });

      if (error) {
        console.error('❌ Supabase 저장 실패:', error);
        console.error('❌ 에러 상세 정보:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.warn('로컬 저장으로 진행:', error);
        return false; // Supabase 저장 실패 시 false 반환
      } else {
        console.log('✅ Supabase 저장 성공:', data);
        return true; // Supabase 저장 성공 시 true 반환
      }
    } catch (dbError) {
      console.error('❌ 데이터베이스 저장 실패:', dbError);
      console.warn('로컬 저장으로 진행:', dbError);
      return false; // 데이터베이스 저장 실패 시 false 반환
    }
  } catch (error) {
    console.error('푸시 구독 정보 저장 실패:', error);
    return false;
  }
};

// OneSignal Player ID 저장 (원래 작동했던 단순 upsert 방식으로 복원)
export const saveOneSignalPlayerId = async (playerId: string, userId: string): Promise<boolean> => {
  try {
    console.log('OneSignal Player ID 저장 시작:', { userId, playerId });

    // 원래 작동했던 upsert 방식 사용
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: userId,
        onesignal_player_id: playerId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    console.log('OneSignal Player ID 저장 응답:', { data, error });

    if (error) {
      console.error('❌ OneSignal Player ID 저장 실패:', error);
      return false;
    } else {
      console.log('✅ OneSignal Player ID 저장 성공:', data);
      return true;
    }
  } catch (error) {
    console.error('OneSignal Player ID 저장 실패:', error);
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
      // 테이블이 없는 경우 null 반환
      if (error.code === 'PGRST116' || error.message.includes('relation "user_push_subscriptions" does not exist')) {
        console.log('user_push_subscriptions 테이블이 존재하지 않습니다.');
        return null;
      }
      console.error('푸시 구독 정보 조회 오류:', error);
      return null;
    }

    return data?.subscription;
  } catch (error) {
    console.error('푸시 구독 정보 조회 실패:', error);
    return null;
  }
};

// 사용자의 푸시 알림 구독 상태 확인
export const checkUserPushSubscription = async (userId: string): Promise<boolean> => {
  try {
    console.log(`사용자 ${userId}의 푸시 구독 상태 확인 중...`);
    
    const { data: subscriptionData, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 테이블이 없거나 다른 에러인 경우 false 반환
      if (error.code === 'PGRST116' || 
          error.message.includes('relation "user_push_subscriptions" does not exist') ||
          error.code === 'PGRST301' ||
          error.message.includes('406')) {
        console.log('user_push_subscriptions 테이블이 존재하지 않거나 접근할 수 없습니다. 기본 알림을 사용합니다.');
        return false;
      }
      console.log(`사용자 ${userId}의 푸시 구독 정보 조회 실패:`, error.message, error.code);
      return false;
    }

    if (!subscriptionData) {
      console.log(`사용자 ${userId}의 푸시 구독 정보가 없습니다.`);
      return false;
    }

    console.log(`사용자 ${userId}의 푸시 구독 정보 확인됨`);
    return true;
  } catch (error) {
    console.error('푸시 구독 상태 확인 오류:', error);
    return false;
  }
};

// 푸시 알림 발송 (간단한 방식)
export const sendPushNotification = async (
  userId: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> => {
  try {
    console.log('푸시 알림 발송 시작:', { userId, title, body, data });
    
    // 1. 알림 권한 확인
    if (Notification.permission !== 'granted') {
      console.log('알림 권한이 허용되지 않았습니다. 현재 권한:', Notification.permission);
      return false;
    }
    
    // 2. 기본 알림 발송
    console.log(`기본 알림 발송: ${title}`);

    // 브라우저별 알림 발송
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // Safari에서는 기본 Notification API 사용
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data
        });
        console.log('Safari에서 기본 알림이 발송되었습니다:', notification);
        return true;
      } catch (safariError) {
        console.error('Safari 알림 발송 실패:', safariError);
        return false;
      }
    }

    // Chrome/Firefox/Edge: Service Worker를 통한 알림 발송
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
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
        console.log('Service Worker를 통한 알림이 발송되었습니다.');
        return true;
      } catch (swError) {
        console.error('Service Worker 알림 발송 실패:', swError);
        // Service Worker 실패 시 기본 알림 시도
        try {
          const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            data
          });
          console.log('기본 알림으로 대체 발송되었습니다:', notification);
          return true;
        } catch (basicError) {
          console.error('기본 알림 발송도 실패:', basicError);
          return false;
        }
      }
    } else {
      // Service Worker를 지원하지 않는 경우 기본 알림 시도
      console.warn('Service Worker를 지원하지 않는 브라우저입니다. 기본 알림을 시도합니다.');
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          data
        });
        console.log('기본 알림이 발송되었습니다:', notification);
        return true;
      } catch (basicError) {
        console.error('기본 알림 발송 실패:', basicError);
        return false;
      }
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

// 전화번호 기반 푸시 알림 발송
export const sendPushNotificationByPhone = async (
  phone: string, 
  title: string, 
  body: string, 
  data?: any
): Promise<boolean> => {
  try {
    console.log('전화번호 기반 푸시 알림 발송 시작:', { phone, title, body, data });
    
    // 전화번호로 사용자 ID 찾기
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !userData) {
      console.log(`전화번호 ${phone}에 해당하는 사용자를 찾을 수 없습니다.`);
      return false;
    }

    // 찾은 사용자 ID로 푸시 알림 발송
    return await sendPushNotification(userData.id, title, body, data);
  } catch (error) {
    console.error('전화번호 기반 푸시 알림 발송 실패:', error);
    return false;
  }
};

// 푸시 알림 테스트 함수 (개발용)
export const testPushNotification = async (userId: string): Promise<boolean> => {
  try {
    console.log('=== 푸시 알림 테스트 시작 ===');
    console.log('테스트 사용자 ID:', userId);
    
    // 1. 구독 상태 확인 (에러가 있어도 계속 진행)
    let hasSubscription = false;
    try {
      hasSubscription = await checkUserPushSubscription(userId);
      console.log('구독 상태:', hasSubscription ? '✅ 구독됨' : '❌ 구독 안됨');
    } catch (subscriptionError) {
      console.warn('구독 상태 확인 실패, 기본 알림으로 진행:', subscriptionError);
    }
    
    // 2. 알림 권한 확인
    console.log('알림 권한:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('⚠️ 알림 권한이 허용되지 않았습니다. 기본 알림을 시도합니다.');
    }
    
    // 3. 테스트 알림 발송
    const testResult = await sendPushNotification(
      userId,
      '테스트 알림',
      '푸시 알림이 정상적으로 작동합니다!',
      { type: 'test', timestamp: new Date().toISOString() }
    );
    
    console.log('테스트 결과:', testResult ? '✅ 성공' : '❌ 실패');
    console.log('=== 푸시 알림 테스트 완료 ===');
    
    return testResult;
  } catch (error) {
    console.error('푸시 알림 테스트 실패:', error);
    return false;
  }
};
