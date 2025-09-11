import { useState, useEffect } from 'react';

interface PWAInstallButtonProps {
  redirectType: 'admin' | 'menu';
  storeId?: string;
  className?: string;
}

export default function PWAInstallButton({ 
  redirectType, 
  storeId, 
  className = '' 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA 설치 가능 여부 확인
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // PWA 설치 완료 감지
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 이미 설치된 경우 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // URL 파라미터 추가
    const url = new URL(window.location.href);
    url.searchParams.set('redirect', redirectType);
    if (storeId) {
      url.searchParams.set('storeId', storeId);
    }

    // URL 업데이트
    window.history.replaceState({}, '', url.toString());

    // PWA 설치 프롬프트 표시
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA 설치됨');
    } else {
      console.log('PWA 설치 취소됨');
    }
    
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <i className="ri-check-line text-lg mr-2"></i>
          앱이 설치되었습니다
        </div>
      </div>
    );
  }

  if (!deferredPrompt) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
          <i className="ri-smartphone-line text-lg mr-2"></i>
          브라우저에서 "홈 화면에 추가"를 사용하세요
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors ${className}`}
    >
      <i className="ri-download-line text-lg mr-2"></i>
      {redirectType === 'admin' ? '관리자 앱 설치' : '메뉴 앱 설치'}
    </button>
  );
}
