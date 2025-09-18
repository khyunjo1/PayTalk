// Service Worker for Push Notifications
const CACHE_NAME = 'paytalk-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened, adding URLs to cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: '페이톡 알림',
    body: '새로운 주문이 요청되었습니다',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {}
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Push data parsed:', pushData);
      
      notificationData = {
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        data: pushData.data || notificationData.data
      };
    } catch (error) {
      console.error('Failed to parse push data:', error);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: 'paytalk-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      ...notificationData.data,
      dateOfArrival: Date.now(),
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: '확인하기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  console.log('Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // 알림 클릭 시 웹사이트로 이동
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // 백그라운드 동기화 로직
  console.log('Background sync executed');
}
