import { useState, useEffect } from 'react';
import { useNewAuth } from '../hooks/useNewAuth';
import { saveOneSignalPlayerId } from '../lib/pushApi';
import { 
  getOneSignalUserId, 
  isOneSignalSubscribed, 
  subscribeToOneSignal, 
  setOneSignalUserTag,
  isOneSignalReady 
} from '../lib/oneSignal';

export default function OwnerPushNotificationSettings() {
  const { user } = useNewAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 페이지 로드 시 저장된 알림 설정 확인
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsEnabled(!!subscription);
      }
    } catch (error) {
      console.error('구독 상태 확인 실패:', error);
    }
  };

  // PWA 감지 함수
  const isPWA = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    const isPWA = isStandalone || isIOSStandalone || isAndroidApp;
    
    console.log('PWA 감지 결과:', {
      isStandalone,
      isIOSStandalone,
      isAndroidApp,
      isPWA,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
    
    return isPWA;
  };

  const handleToggleNotification = async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage('');

    try {
      if (!isEnabled) {
        // OneSignal 초기화 확인 (실패해도 계속 진행)
        if (!isOneSignalReady()) {
          console.warn('OneSignal이 아직 로드되지 않았습니다. 기본 알림으로 진행합니다.');
        }

        // PWA 체크
        if (!isPWA()) {
          setMessage('❌ PWA에서만 푸시 알림을 사용할 수 있습니다. 폰에서 홈화면에 추가 후 사용해주세요.');
          setIsLoading(false);
          return;
        }

        // 간단한 테스트: OneSignal 없이 기본 알림만 사용
        console.log('기본 알림 권한 요청...');
        
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            setMessage('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
            setIsLoading(false);
            return;
          }
        } else if (Notification.permission === 'denied') {
          setMessage('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
          setIsLoading(false);
          return;
        }
        
        console.log('알림 권한 허용됨, OneSignal 시도...');
        
        // OneSignal 시도 (30초 타임아웃, iOS는 더 오래 걸릴 수 있음)
        try {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const timeoutDuration = isIOS ? 30000 : 15000; // iOS는 30초, 기타는 15초

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('OneSignal 타임아웃')), timeoutDuration)
          );

          const oneSignalSubscribed = await Promise.race([
            subscribeToOneSignal(),
            timeoutPromise
          ]);

          console.log('OneSignal 구독 결과:', oneSignalSubscribed);

          if (oneSignalSubscribed) {
            // OneSignal Player ID 가져오기 시도
            console.log('OneSignal Player ID 가져오기 시도...');
            const playerId = await getOneSignalUserId();

            if (playerId) {
              console.log('OneSignal Player ID 획득:', playerId);

              // OneSignal Player ID를 데이터베이스에 저장
              const oneSignalSaveSuccess = await saveOneSignalPlayerId(playerId, user.id);
              if (oneSignalSaveSuccess) {
                console.log('✅ OneSignal Player ID 데이터베이스 저장 성공');

                await setOneSignalUserTag(user.id);
                console.log('OneSignal 사용자 태그 설정 완료:', user.id);

                // OneSignal 성공 시 활성화 완료
                setIsEnabled(true);
                setMessage('✅ 푸시 알림이 활성화되었습니다! (OneSignal)');

                // 테스트 알림 발송 (Service Worker 사용)
                if ('serviceWorker' in navigator) {
                  try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification('푸시 알림 활성화', {
                      body: '새 주문이 들어오면 알림을 받을 수 있습니다!',
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      vibrate: [200, 100, 200]
                    });
                    console.log('✅ 테스트 알림 발송 성공');
                  } catch (testError) {
                    console.error('테스트 알림 발송 실패:', testError);
                  }
                }
                return; // 성공적으로 완료, 함수 종료
              } else {
                console.error('❌ OneSignal Player ID 데이터베이스 저장 실패');
                setMessage('❌ OneSignal 설정 저장에 실패했습니다.');
                setIsLoading(false);
                return;
              }
            } else {
              console.error('❌ OneSignal Player ID를 가져올 수 없음');
              setMessage(isIOS ? '❌ iOS OneSignal 설정에 실패했습니다. 다시 시도해주세요.' : '❌ OneSignal Player ID 설정에 실패했습니다.');
              setIsLoading(false);
              return;
            }
          } else {
            console.error('❌ OneSignal 구독에 실패했습니다.');
            setMessage(isIOS ? '❌ iOS OneSignal 구독에 실패했습니다. 브라우저 알림 설정을 확인해주세요.' : '❌ OneSignal 구독에 실패했습니다.');
            setIsLoading(false);
            return;
          }
        } catch (oneSignalError) {
          console.error('OneSignal 구독 실패:', oneSignalError);
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

          if (oneSignalError.message.includes('타임아웃')) {
            setMessage(isIOS ? '❌ iOS OneSignal 타임아웃이 발생했습니다. 브라우저를 재시작하고 다시 시도해주세요.' : '❌ OneSignal 타임아웃이 발생했습니다.');
          } else {
            setMessage('❌ OneSignal 설정에 실패했습니다: ' + oneSignalError.message);
          }
          setIsLoading(false);
          return;
        }
      } else {
        // 알림 비활성화
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
        
        setIsEnabled(false);
        setMessage('푸시 알림이 비활성화되었습니다.');
      }
    } catch (error) {
      console.error('알림 설정 오류:', error);
      setMessage('❌ 알림 설정에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="text-center">
      {/* PWA 상태 표시 */}
      <div className="mb-4">
        {isPWA() && (
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
            <i className="ri-smartphone-line text-lg mr-2"></i>
            PWA 모드 (폰)
          </div>
        )}
      </div>

      <button
        onClick={handleToggleNotification}
        disabled={isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-all ${
          isEnabled
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          '처리중...'
        ) : isEnabled ? (
          '푸시 알림 비활성화'
        ) : (
          '푸시 알림 활성화'
        )}
      </button>
      
      {message && (
        <div className={`mt-3 text-sm ${
          message.includes('✅') ? 'text-green-600' : 
          message.includes('❌') ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
