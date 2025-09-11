// 푸시 알림 테스트용 함수들

// 테스트용 푸시 알림 발송
export const sendTestPushNotification = async (title: string = '테스트 알림', body: string = '푸시 알림이 정상적으로 작동합니다!') => {
  try {
    if (!('serviceWorker' in navigator)) {
      alert('이 브라우저는 Service Worker를 지원하지 않습니다.');
      return false;
    }

    if (!('PushManager' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return false;
    }

    // 1. 알림 권한 요청
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
        return false;
      }
    } else if (Notification.permission === 'denied') {
      alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        test: true,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'test',
          title: '테스트 완료'
        }
      ]
    });

    console.log('테스트 푸시 알림 발송 성공!');
    return true;
  } catch (error) {
    console.error('테스트 푸시 알림 발송 실패:', error);
    alert('푸시 알림 발송에 실패했습니다: ' + error.message);
    return false;
  }
};

// 푸시 알림 상태 진단
export const diagnosePushNotification = async () => {
  const results = {
    browserSupport: false,
    serviceWorkerSupport: false,
    pushSupport: false,
    permission: 'default',
    serviceWorkerRegistered: false,
    pushSubscription: null
  };

  try {
    // 1. 브라우저 지원 확인
    results.browserSupport = 'Notification' in window;
    console.log('✅ 브라우저 지원:', results.browserSupport);

    // 2. Service Worker 지원 확인
    results.serviceWorkerSupport = 'serviceWorker' in navigator;
    console.log('✅ Service Worker 지원:', results.serviceWorkerSupport);

    // 3. 푸시 지원 확인
    results.pushSupport = 'PushManager' in window;
    console.log('✅ 푸시 지원:', results.pushSupport);

    // 4. 권한 상태 확인
    results.permission = Notification.permission;
    console.log('✅ 알림 권한:', results.permission);

    // 5. Service Worker 등록 확인
    if (results.serviceWorkerSupport) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      results.serviceWorkerRegistered = registrations.length > 0;
      console.log('✅ Service Worker 등록:', results.serviceWorkerRegistered);
    }

    // 6. 푸시 구독 확인
    if (results.serviceWorkerRegistered) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      results.pushSubscription = subscription;
      console.log('✅ 푸시 구독:', subscription ? '있음' : '없음');
    }

    return results;
  } catch (error) {
    console.error('푸시 알림 진단 오류:', error);
    return results;
  }
};

// 간단한 테스트 알림
export const sendSimpleTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('페이톡 테스트', {
      body: '푸시 알림이 정상적으로 작동합니다!',
      icon: '/favicon.ico'
    });
  } else {
    alert('알림 권한이 허용되지 않았습니다.');
  }
};
