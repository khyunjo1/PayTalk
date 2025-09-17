// PWA 매니페스트 동적 생성 유틸리티

export const generateManifest = (redirectType: 'admin' | 'menu', storeId?: string) => {
  const baseUrl = window.location.origin;
  let startUrl = baseUrl;
  
  if (redirectType === 'admin') {
    startUrl = `${baseUrl}/admin-dashboard`;
  } else if (redirectType === 'menu' && storeId) {
    startUrl = `${baseUrl}/menu/${storeId}`;
  }

  return {
    name: redirectType === 'admin' ? 'PayTalk 관리자' : 'PayTalk 메뉴',
    short_name: redirectType === 'admin' ? '관리자' : '메뉴',
    description: redirectType === 'admin' 
      ? 'PayTalk 매장 관리 시스템' 
      : 'PayTalk 반찬 주문 시스템',
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['food', 'shopping', 'lifestyle'],
    lang: 'ko',
    dir: 'ltr'
  };
};

export const updateManifest = (redirectType: 'admin' | 'menu', storeId?: string) => {
  const manifest = generateManifest(redirectType, storeId);
  
  // 기존 manifest 링크 제거
  const existingLink = document.querySelector('link[rel="manifest"]');
  if (existingLink) {
    existingLink.remove();
  }
  
  // 새로운 manifest 링크 추가
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = `data:application/json,${encodeURIComponent(JSON.stringify(manifest))}`;
  document.head.appendChild(link);
  
  return manifest;
};
