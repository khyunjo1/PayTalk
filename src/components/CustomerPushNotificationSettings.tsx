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
    const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    // Safari는 기본 알림만 지원하므로 Notification API만 확인
    // 다른 브라우저는 Service Worker와 PushManager도 확인
    const supported = hasNotification && (isSafari || (hasServiceWorker && hasPushManager));
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
      // 1. 알림 권한 요청
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        onError?.('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
        return;
      }

      // Safari는 기본 알림만 지원하므로 Service Worker 없이도 성공으로 처리
      const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        console.log('Safari에서 기본 알림이 활성화되었습니다.');
        setIsEnabled(true);
        setPermission('granted');
        onSuccess?.();
        return;
      }

      // 2. 푸시 구독 생성 (Safari가 아닌 경우)
      const subscription = await subscribeToPush();
      if (!subscription) {
        onError?.('푸시 알림 구독에 실패했습니다.');
        return;
      }

      // 3. 전화번호와 푸시 구독 연결
      const success = await linkPhoneToPushSubscription(phone, subscription);
      if (!success) {
        onError?.('푸시 알림 설정에 실패했습니다.');
        return;
      }

      setIsEnabled(true);
      setPermission('granted');
      onSuccess?.();
      
    } catch (error) {
      console.error('푸시 알림 설정 오류:', error);
      onError?.(`푸시 알림 설정 중 오류가 발생했습니다: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <i className="ri-error-warning-line text-yellow-500 text-xl mr-3"></i>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">푸시 알림을 지원하지 않는 브라우저입니다</h3>
            <p className="text-xs text-yellow-600 mt-1">
              Chrome, Firefox, Safari 등의 최신 브라우저를 사용해주세요.
            </p>
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
