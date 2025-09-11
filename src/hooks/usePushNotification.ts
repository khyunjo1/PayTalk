import { useState, useEffect } from 'react';
import { 
  initializePushNotifications, 
  getPushNotificationStatus 
} from '../lib/pushNotification';

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
    if (!userId) return false;

    setIsLoading(true);
    
    try {
      const success = await initializePushNotifications(userId);
      setIsInitialized(success);
      setIsEnabled(success);
      
      if (success) {
        setPermission('granted');
      }
      
      return success;
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
