import { usePushNotification } from '../hooks/usePushNotification';
import { useNewAuth } from '../hooks/useNewAuth';

export default function PushNotificationSettings() {
  const { user } = useNewAuth();
  const { 
    isSupported, 
    permission, 
    isEnabled, 
    isLoading, 
    requestPermission 
  } = usePushNotification(user?.id || null);

  const handleEnablePush = async () => {
    const success = await requestPermission();
    if (success) {
      alert('푸시 알림이 활성화되었습니다!');
    } else {
      alert('푸시 알림 활성화에 실패했습니다. 브라우저 설정을 확인해주세요.');
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0 flex-1">
          <i className="ri-notification-line text-blue-500 text-lg mr-2 flex-shrink-0"></i>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-blue-800 truncate">푸시알림 활성화</h3>
          </div>
        </div>
        <button
          onClick={handleEnablePush}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center flex-shrink-0"
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
