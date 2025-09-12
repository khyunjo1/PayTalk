import { useState, useEffect } from 'react';
import { subscribeToPush, requestNotificationPermission } from '../lib/pushNotification';
import { linkPhoneToPushSubscription } from '../lib/phoneBasedPush';

interface CustomerPushNotificationSettingsProps {
  phone: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function CustomerPushNotificationSettings({ 
  phone, 
  onSuccess, 
  onError 
}: CustomerPushNotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 브라우저 지원 여부 확인 (Safari 지원 포함)
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(userAgent);
    const isChrome = /chrome/i.test(userAgent);
    const isFirefox = /firefox/i.test(userAgent);
    const isEdge = /edg/i.test(userAgent);
    
    // 모바일 및 PWA 감지
    const isMobile = /Mobi|Android/i.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');
    
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    console.log('브라우저 감지 결과:', {
      userAgent,
      isSafari,
      isChrome,
      isFirefox,
      isEdge,
      isMobile,
      isPWA,
      hasNotification,
      hasServiceWorker,
      hasPushManager
    });
    
    // Safari 모바일은 PWA 모드에서만 푸시 알림 지원
    // 데스크톱 Safari는 기본 알림만 지원
    let supported = false;
    
    if (isSafari) {
      if (isMobile) {
        // 모바일 Safari: PWA 모드에서만 지원
        supported = hasNotification && isPWA;
      } else {
        // 데스크톱 Safari: 기본 알림 지원
        supported = hasNotification;
      }
    } else if (isChrome || isFirefox || isEdge) {
      // Chrome, Firefox, Edge: Service Worker + PushManager 필요
      supported = hasNotification && hasServiceWorker && hasPushManager;
    } else {
      // 기타 브라우저: 기본 알림만 확인
      supported = hasNotification;
    }
    
    console.log('최종 지원 여부:', supported);
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnablePush = async () => {
    if (!phone) {
      onError?.('전화번호가 필요합니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 푸시 알림 설정 시작:', { phone });
      
      // 1. 알림 권한 요청
      console.log('📋 1단계: 알림 권한 요청');
      const hasPermission = await requestNotificationPermission();
      console.log('권한 요청 결과:', hasPermission);
      
      if (!hasPermission) {
        onError?.('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
        return;
      }

      // Safari 감지
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(userAgent);
      const isMobile = /Mobi|Android/i.test(userAgent);
      
      console.log('🔍 브라우저 정보:', { userAgent, isSafari, isMobile });
      
      if (isSafari) {
        console.log('🦁 Safari 브라우저에서 기본 알림 설정');
        
        // Safari에서는 더미 구독 정보로 전화번호 연결
        const safariSubscription = {
          endpoint: 'safari-notification',
          keys: {
            p256dh: 'safari-p256dh',
            auth: 'safari-auth'
          }
        };
        
        console.log('📱 Safari 구독 정보로 전화번호 연결 시도');
        const success = await linkPhoneToPushSubscription(phone, safariSubscription);
        if (!success) {
          console.warn('⚠️ Safari 전화번호 연결 실패, 하지만 기본 알림은 동작합니다.');
        }
        
        setIsEnabled(true);
        setPermission('granted');
        onSuccess?.();
        return;
      }

      // 2. 푸시 구독 생성 (Safari가 아닌 경우)
      console.log('🔧 2단계: 푸시 구독 생성 (Chrome/Firefox/Edge)');
      
      // VAPID 키 확인
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      console.log('🔑 VAPID 키 확인:', vapidKey ? `${vapidKey.substring(0, 20)}...` : '없음');
      
      if (!vapidKey) {
        onError?.('VAPID 키가 설정되지 않았습니다. 개발자에게 문의하세요.');
        return;
      }

      const subscription = await subscribeToPush();
      console.log('📡 푸시 구독 결과:', subscription ? '성공' : '실패');
      
      if (!subscription) {
        // 상세한 에러 진단
        const diagnostics = {
          hasNotification: 'Notification' in window,
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
          notificationPermission: Notification.permission,
          serviceWorkerSupported: 'serviceWorker' in navigator
        };
        
        console.error('🚨 푸시 구독 실패 진단:', diagnostics);
        onError?.('푸시 알림 구독에 실패했습니다. 브라우저가 푸시 알림을 지원하는지 확인해주세요.');
        return;
      }

      // 3. 전화번호와 푸시 구독 연결
      console.log('🔗 3단계: 전화번호와 푸시 구독 연결');
      console.log('연결 정보:', { phone, subscriptionKeys: subscription.getKey ? 'OK' : 'NO' });
      
      const success = await linkPhoneToPushSubscription(phone, subscription);
      console.log('연결 결과:', success);
      
      if (!success) {
        onError?.('푸시 알림 설정에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
        return;
      }

      console.log('✅ 푸시 알림 설정 완료');
      setIsEnabled(true);
      setPermission('granted');
      onSuccess?.();
      
    } catch (error) {
      console.error('💥 푸시 알림 설정 오류:', error);
      console.error('에러 상세:', error.stack);
      
      // 구체적인 에러 메시지 제공
      let errorMessage = '푸시 알림 설정 중 오류가 발생했습니다.';
      
      if (error.name === 'NotSupportedError') {
        errorMessage = '브라우저가 푸시 알림을 지원하지 않습니다.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = '푸시 알림 권한이 거부되었습니다.';
      } else if (error.name === 'AbortError') {
        errorMessage = '푸시 구독이 중단되었습니다. 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage += ` (${error.message})`;
      }
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  document.referrer.includes('android-app://');

    let message = '';
    let instructions = '';

    if (isSafari && isMobile && !isPWA) {
      message = '모바일 Safari에서는 PWA 모드에서만 푸시 알림을 지원합니다';
      instructions = '하단의 공유 버튼을 눌러 "홈 화면에 추가"를 선택하신 후 웹앱으로 접속해주세요.';
    } else {
      message = '푸시 알림을 지원하지 않는 브라우저입니다';
      instructions = 'Chrome, Firefox, Safari 등의 최신 브라우저를 사용해주세요.';
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <i className="ri-error-warning-line text-yellow-500 text-xl mr-3 mt-1"></i>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{message}</h3>
            <p className="text-xs text-yellow-600 mt-1">
              {instructions}
            </p>
            {isSafari && isMobile && !isPWA && (
              <div className="mt-2 flex items-center text-xs text-yellow-700">
                <i className="ri-information-line mr-1"></i>
                Safari → 공유 → 홈 화면에 추가
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <i className="ri-notification-off-line text-red-500 text-xl mr-3"></i>
          <div>
            <h3 className="text-sm font-medium text-red-800">푸시 알림이 거부되었습니다</h3>
            <p className="text-xs text-red-600 mt-1">
              브라우저 설정에서 알림을 허용해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <i className="ri-notification-3-line text-green-500 text-xl mr-3"></i>
          <div>
            <h3 className="text-sm font-medium text-green-800">푸시 알림이 활성화되었습니다</h3>
            <p className="text-xs text-green-600 mt-1">
              주문 상태 변경 시 실시간으로 알림을 받으실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <i className="ri-notification-line text-blue-500 text-xl mr-3"></i>
          <div>
            <h3 className="text-sm font-medium text-blue-800">푸시 알림을 활성화하세요</h3>
            <p className="text-xs text-blue-600 mt-1">
              SMS 비용 없이 무료로 주문 알림을 받으실 수 있습니다.
            </p>
          </div>
        </div>
        <button
          onClick={handleEnablePush}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              설정 중...
            </>
          ) : (
            <>
              <i className="ri-notification-line mr-2"></i>
              알림 허용
            </>
          )}
        </button>
      </div>
    </div>
  );
}
