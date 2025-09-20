import { useState } from 'react';
import { sendTestPushNotification, diagnosePushNotification, sendSimpleTestNotification } from '../lib/testPushNotification';
import { useAuth } from '../hooks/useAuth';

export default function PushNotificationTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const { user } = useAuth();

  const handleTestPush = async () => {
    setIsLoading(true);
    try {
      await sendTestPushNotification('페이톡 테스트', '푸시 알림이 정상적으로 작동합니다!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnose = async () => {
    setIsLoading(true);
    try {
      const results = await diagnosePushNotification();
      setDiagnosticResults(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimpleTest = () => {
    sendSimpleTestNotification();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">푸시 알림 테스트</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleTestPush}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              테스트 중...
            </>
          ) : (
            <>
              <i className="ri-notification-line mr-2"></i>
              푸시 알림 테스트
            </>
          )}
        </button>

        <button
          onClick={handleSimpleTest}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <i className="ri-notification-3-line mr-2"></i>
          간단한 알림 테스트
        </button>

        <button
          onClick={handleDiagnose}
          disabled={isLoading}
          className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              진단 중...
            </>
          ) : (
            <>
              <i className="ri-bug-line mr-2"></i>
              푸시 알림 진단
            </>
          )}
        </button>
      </div>

      {diagnosticResults && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">진단 결과:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-blue-600 mb-2">
              <i className="ri-user-line mr-2"></i>
              사용자: {user ? `${user.email} (${user.id})` : '로그인되지 않음'}
            </div>
            <div className={`flex items-center ${diagnosticResults.browserSupport ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`ri-${diagnosticResults.browserSupport ? 'check' : 'close'}-line mr-2`}></i>
              브라우저 지원: {diagnosticResults.browserSupport ? 'O' : 'X'}
            </div>
            <div className={`flex items-center ${diagnosticResults.serviceWorkerSupport ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`ri-${diagnosticResults.serviceWorkerSupport ? 'check' : 'close'}-line mr-2`}></i>
              Service Worker 지원: {diagnosticResults.serviceWorkerSupport ? 'O' : 'X'}
            </div>
            <div className={`flex items-center ${diagnosticResults.pushSupport ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`ri-${diagnosticResults.pushSupport ? 'check' : 'close'}-line mr-2`}></i>
              푸시 지원: {diagnosticResults.pushSupport ? 'O' : 'X'}
            </div>
            <div className={`flex items-center ${diagnosticResults.permission === 'granted' ? 'text-green-600' : 'text-orange-600'}`}>
              <i className={`ri-${diagnosticResults.permission === 'granted' ? 'check' : 'warning'}-line mr-2`}></i>
              알림 권한: {diagnosticResults.permission}
            </div>
            <div className={`flex items-center ${diagnosticResults.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`ri-${diagnosticResults.serviceWorkerRegistered ? 'check' : 'close'}-line mr-2`}></i>
              Service Worker 등록: {diagnosticResults.serviceWorkerRegistered ? 'O' : 'X'}
            </div>
            <div className={`flex items-center ${diagnosticResults.pushSubscription ? 'text-green-600' : 'text-orange-600'}`}>
              <i className={`ri-${diagnosticResults.pushSubscription ? 'check' : 'warning'}-line mr-2`}></i>
              푸시 구독: {diagnosticResults.pushSubscription ? 'O' : 'X'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
