import { useState, useEffect } from 'react';
import { 
  initializePushNotifications, 
  getPushNotificationStatus,
  requestNotificationPermission,
  subscribeToPush
} from '../lib/pushNotification';
import { savePushSubscription } from '../lib/pushApi';

export const usePushNotification = (userId: string | null) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const initPushNotifications = async () => {
      setIsLoading(true);
      
      try {
        // 푸시 알림 상태 확인
        const status = getPushNotificationStatus();
        setIsSupported(status.supported);
        setPermission(status.permission);
        setIsEnabled(status.enabled);

        // 지원되지 않으면 초기화하지 않음
        if (!status.supported) {
          console.log('이 브라우저는 푸시 알림을 지원하지 않습니다.');
          return;
        }

        // 이미 허용된 경우에만 초기화
        if (status.permission === 'granted') {
          const success = await initializePushNotifications(userId);
          setIsInitialized(success);
        }
      } catch (error) {
        console.error('푸시 알림 초기화 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initPushNotifications();
  }, [userId]);

  const requestPermission = async (): Promise<boolean> => {
    console.log('푸시 알림 권한 요청 시작:', { userId });
    
    if (!userId) {
      console.error('사용자 ID가 없습니다:', userId);
      return false;
    }

    setIsLoading(true);
    
    try {
      // 1. 알림 권한 요청
      console.log('알림 권한 요청 중...');
      const hasPermission = await requestNotificationPermission();
      console.log('알림 권한 요청 결과:', hasPermission);
      
      if (!hasPermission) {
        console.log('알림 권한이 거부되었습니다.');
        return false;
      }

      // Safari는 기본 알림만 지원하므로 Service Worker 없이도 성공으로 처리
      const isSafari = /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        console.log('Safari에서 기본 알림이 활성화되었습니다.');
        setIsInitialized(true);
        setIsEnabled(true);
        setPermission('granted');
        return true;
      }

      // 2. 푸시 구독 생성 (Safari가 아닌 경우)
      console.log('푸시 구독 생성 시도...');
      const subscription = await subscribeToPush();
      console.log('푸시 구독 결과:', subscription);
      
      if (!subscription) {
        console.log('푸시 구독 실패');
        return false;
      }

      // 3. 구독 정보를 서버에 저장 (user_id 기반)
      console.log('푸시 구독 정보 저장 시도...');
      const saved = await savePushSubscription(subscription, userId);
      console.log('푸시 구독 정보 저장 결과:', saved);
      
      if (!saved) {
        console.log('푸시 구독 정보 저장 실패');
        return false;
      }

      setIsInitialized(true);
      setIsEnabled(true);
      setPermission('granted');
      
      return true;
    } catch (error) {
      console.error('푸시 알림 권한 요청 오류:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isSupported,
    permission,
    isEnabled,
    isLoading,
    requestPermission
  };
};
