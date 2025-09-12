import { useState } from 'react';

export default function PushDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const runDiagnostics = () => {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = import.meta.env.VITE_VAPID_PRIVATE_KEY;
    
    const results = {
      environment: {
        vapidPublicKey: vapidPublicKey ? `${vapidPublicKey.substring(0, 20)}...` : 'NOT SET',
        vapidPrivateKey: vapidPrivateKey ? `${vapidPrivateKey.substring(0, 20)}...` : 'NOT SET',
        vapidPublicKeyLength: vapidPublicKey?.length || 0,
        vapidPrivateKeyLength: vapidPrivateKey?.length || 0
      },
      browser: {
        userAgent: navigator.userAgent,
        hasNotification: 'Notification' in window,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        notificationPermission: Notification.permission,
        isSafari: /^((?!chrome|android|edg|firefox).)*safari/i.test(navigator.userAgent),
        isChrome: /chrome/i.test(navigator.userAgent),
        isFirefox: /firefox/i.test(navigator.userAgent),
        isEdge: /edg/i.test(navigator.userAgent),
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        isPWA: window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://')
      }
    };

    setDiagnostics(results);
    console.log('🔍 푸시 알림 진단 결과:', results);
  };

  const testVapidKeyFormat = () => {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    if (!vapidKey) {
      alert('VAPID 공개 키가 설정되지 않았습니다.');
      return;
    }

    try {
      // VAPID 키 변환 테스트
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

      const converted = urlBase64ToUint8Array(vapidKey);
      console.log('✅ VAPID 키 변환 성공:', converted);
      alert(`VAPID 키 변환 성공! 길이: ${converted.length} bytes`);
    } catch (error) {
      console.error('❌ VAPID 키 변환 실패:', error);
      alert(`VAPID 키 형식 오류: ${error.message}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">푸시 알림 진단</h3>
      
      <div className="space-y-3">
        <button
          onClick={runDiagnostics}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🔍 시스템 진단 실행
        </button>

        <button
          onClick={testVapidKeyFormat}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🔑 VAPID 키 형식 테스트
        </button>
      </div>

      {diagnostics && (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">환경변수</h4>
            <div className="space-y-1 text-sm font-mono">
              <div className={`${diagnostics.environment.vapidPublicKey !== 'NOT SET' ? 'text-green-600' : 'text-red-600'}`}>
                VAPID Public: {diagnostics.environment.vapidPublicKey} ({diagnostics.environment.vapidPublicKeyLength} chars)
              </div>
              <div className={`${diagnostics.environment.vapidPrivateKey !== 'NOT SET' ? 'text-green-600' : 'text-red-600'}`}>
                VAPID Private: {diagnostics.environment.vapidPrivateKey} ({diagnostics.environment.vapidPrivateKeyLength} chars)
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">브라우저 정보</h4>
            <div className="space-y-1 text-sm">
              <div>User Agent: {diagnostics.browser.userAgent}</div>
              <div className={`${diagnostics.browser.hasNotification ? 'text-green-600' : 'text-red-600'}`}>
                Notification API: {diagnostics.browser.hasNotification ? '✅' : '❌'}
              </div>
              <div className={`${diagnostics.browser.hasServiceWorker ? 'text-green-600' : 'text-red-600'}`}>
                Service Worker: {diagnostics.browser.hasServiceWorker ? '✅' : '❌'}
              </div>
              <div className={`${diagnostics.browser.hasPushManager ? 'text-green-600' : 'text-red-600'}`}>
                Push Manager: {diagnostics.browser.hasPushManager ? '✅' : '❌'}
              </div>
              <div className={`${diagnostics.browser.notificationPermission === 'granted' ? 'text-green-600' : 'text-yellow-600'}`}>
                Permission: {diagnostics.browser.notificationPermission}
              </div>
              <div>브라우저: {diagnostics.browser.isSafari ? 'Safari' : diagnostics.browser.isChrome ? 'Chrome' : diagnostics.browser.isFirefox ? 'Firefox' : diagnostics.browser.isEdge ? 'Edge' : '기타'}</div>
              <div>플랫폼: {diagnostics.browser.isMobile ? '모바일' : '데스크톱'}</div>
              <div>PWA 모드: {diagnostics.browser.isPWA ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}