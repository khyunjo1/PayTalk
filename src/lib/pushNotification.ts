// 푸시 알림 관련 유틸리티 함수들

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

// 푸시 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('알림이 거부되었습니다.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return false;
  }
};

// Service Worker 등록
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('이 브라우저는 Service Worker를 지원하지 않습니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 등록 성공:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
};

// 푸시 구독 생성
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    console.log('푸시 구독 생성 시작');
    
    // Service Worker 지원 확인
    if (!('serviceWorker' in navigator)) {
      console.log('이 브라우저는 Service Worker를 지원하지 않습니다.');
      return null;
    }
    
    console.log('Service Worker 지원 확인됨');

    // Service Worker 등록 확인
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      console.log('Service Worker가 등록되지 않았습니다.');
      return null;
    }

    // Service Worker 준비 대기
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.log('Service Worker가 준비되지 않았습니다.');
      return null;
    }
    
    if (!registration.pushManager) {
      console.log('이 브라우저는 푸시를 지원하지 않습니다.');
      return null;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    console.log('VAPID 키 확인:', vapidKey ? '설정됨' : '설정되지 않음');
    
    if (!vapidKey) {
      console.error('VAPID 공개 키가 설정되지 않았습니다.');
      return null;
    }
    
    console.log('푸시 구독 생성 시도...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });
    
    console.log('푸시 구독 성공:', subscription);
    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    return null;
  }
};

// VAPID 키 변환 함수
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 푸시 구독 정보를 서버에 저장
export const savePushSubscription = async (subscription: PushSubscription, userId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });

    if (response.ok) {
      console.log('푸시 구독 정보 저장 성공');
      return true;
    } else {
      console.error('푸시 구독 정보 저장 실패');
      return false;
    }
  } catch (error) {
    console.error('푸시 구독 정보 저장 오류:', error);
    return false;
  }
};

// 푸시 알림 초기화 (앱 시작 시 호출)
export const initializePushNotifications = async (userId: string): Promise<boolean> => {
  try {
    // 1. 알림 권한 요청
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }

    // Safari는 기본 알림만 지원하므로 Service Worker 없이도 성공으로 처리
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      console.log('Safari에서 기본 알림이 활성화되었습니다.');
      return true;
    }

    // 2. Service Worker 등록 (Safari가 아닌 경우)
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service Worker 등록 실패');
      return false;
    }

    // 3. 푸시 구독
    const subscription = await subscribeToPush();
    if (!subscription) {
      console.log('푸시 구독 실패');
      return false;
    }

    // 4. 구독 정보를 서버에 저장
    const saved = await savePushSubscription(subscription, userId);
    if (!saved) {
      console.log('푸시 구독 정보 저장 실패');
      return false;
    }

    console.log('푸시 알림 초기화 완료');
    return true;
  } catch (error) {
    console.error('푸시 알림 초기화 오류:', error);
    return false;
  }
};

// 푸시 알림 상태 확인
export const getPushNotificationStatus = (): {
  supported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
} => {
  // Safari는 기본 알림을 지원하지만 Service Worker Push API는 제한적
  // Chrome, Edge, Firefox는 제외하고 Safari만 감지
  const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
  const hasNotification = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  
  // Safari의 경우 기본 알림만 지원하므로 Notification API만 확인
  // 다른 브라우저는 Service Worker와 PushManager도 확인
  const supported = hasNotification && (isSafari || (hasServiceWorker && hasPushManager));
  
  console.log('브라우저 지원 확인:', {
    userAgent: navigator.userAgent,
    isSafari,
    hasNotification,
    hasServiceWorker,
    hasPushManager,
    supported
  });
  const permission = supported ? Notification.permission : 'denied';
  const enabled = supported && permission === 'granted';

  return {
    supported,
    permission,
    enabled
  };
};
