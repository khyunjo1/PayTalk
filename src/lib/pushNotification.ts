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

  const permission = await Notification.requestPermission();
  return permission === 'granted';
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
  const registration = await navigator.serviceWorker.ready;
  
  if (!registration.pushManager) {
    console.log('이 브라우저는 푸시를 지원하지 않습니다.');
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
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

    // 2. Service Worker 등록
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
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  const permission = supported ? Notification.permission : 'denied';
  const enabled = supported && permission === 'granted';

  return {
    supported,
    permission,
    enabled
  };
};
