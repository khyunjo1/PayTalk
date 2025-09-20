// 표준 Push API 구현 (iOS 17+ 호환)
import { supabase } from './supabase';

// VAPID 공개 키 (새로 생성 필요)
const VAPID_PUBLIC_KEY = 'BHMdCyy1clUEqM8fiqbC7yKMbD56Ps_UDqNzjnK2-xIFK0Yk2chTKPRkHKM_n-bk7fuPUjTB_SS3AFiYe5ryyGs';

// VAPID 키를 Uint8Array로 변환
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

// Service Worker 등록
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Service Worker 등록 중...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker 등록 성공:', registration);
      return registration;
    } catch (error) {
      console.error('❌ Service Worker 등록 실패:', error);
      return null;
    }
  } else {
    console.warn('Service Worker가 지원되지 않는 브라우저입니다.');
    return null;
  }
}

// 푸시 권한 요청
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.error('이 브라우저는 알림을 지원하지 않습니다.');
    return 'denied';
  }

  console.log('현재 알림 권한 상태:', Notification.permission);

  if (Notification.permission === 'default') {
    console.log('알림 권한 요청 중...');
    const permission = await Notification.requestPermission();
    console.log('알림 권한 요청 결과:', permission);
    return permission;
  }

  return Notification.permission;
}

// 푸시 구독 생성
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    console.log('=== 표준 Push API 구독 시작 ===');

    // 1. Service Worker 등록
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker 등록 실패');
    }

    // 2. 알림 권한 요청
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.error('알림 권한이 거부되었습니다.');
      return false;
    }

    // 3. 기존 구독 확인 및 해제
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('기존 구독 해제 중...');
      await existingSubscription.unsubscribe();
    }

    // 4. 새 푸시 구독 생성
    console.log('새 푸시 구독 생성 중...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ 푸시 구독 생성 성공:', subscription);

    // 5. 구독 정보를 Supabase에 저장
    const success = await saveSubscriptionToDatabase(subscription, userId);

    if (success) {
      console.log('✅ 구독 정보 저장 성공');

      // 6. 테스트 알림 발송
      await sendTestNotification(registration);

      return true;
    } else {
      console.error('❌ 구독 정보 저장 실패');
      return false;
    }

  } catch (error) {
    console.error('❌ 푸시 구독 실패:', error);
    return false;
  }
}

// 구독 정보를 데이터베이스에 저장
async function saveSubscriptionToDatabase(subscription: PushSubscription, userId: string): Promise<boolean> {
  try {
    console.log('구독 정보 데이터베이스 저장 중...');

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
        auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : ''
      }
    };

    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscriptionData,
        is_active: true,
        device_type: 'web',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ 데이터베이스 저장 실패:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 구독 정보 저장 중 오류:', error);
    return false;
  }
}

// 테스트 알림 발송
async function sendTestNotification(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    console.log('테스트 알림 발송 중...');

    await registration.showNotification('푸시 알림 활성화!', {
      body: '표준 Push API로 푸시 알림이 활성화되었습니다. 새 주문이 들어오면 알림을 받을 수 있어요!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        type: 'test',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '확인하기'
        }
      ],
      requireInteraction: false
    });

    console.log('✅ 테스트 알림 발송 성공');
  } catch (error) {
    console.error('❌ 테스트 알림 발송 실패:', error);
  }
}

// 푸시 구독 해제
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ 푸시 구독 해제 성공');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ 푸시 구독 해제 실패:', error);
    return false;
  }
}

// 현재 구독 상태 확인
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription && Notification.permission === 'granted';
    }
    return false;
  } catch (error) {
    console.error('구독 상태 확인 실패:', error);
    return false;
  }
}

// 브라우저 푸시 지원 여부 확인
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iOS 16.4+ 웹푸시 지원 확인
export function isIOSWebPushSupported(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return true; // iOS가 아니면 일반적으로 지원

  // iOS 버전 확인 (16.4+)
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    const majorVersion = parseInt(match[1]);
    const minorVersion = parseInt(match[2]);

    // iOS 16.4 이상인지 확인
    return majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4);
  }

  return false;
}