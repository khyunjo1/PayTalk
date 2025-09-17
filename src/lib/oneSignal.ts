// OneSignal 푸시 알림 관련 함수들

// OneSignal 사용자 ID 가져오기 (v16 API)
export const getOneSignalUserId = async (): Promise<string | null> => {
  try {
    if (typeof window !== 'undefined' && window.OneSignal) {
      console.log('OneSignal Player ID 가져오기 시도 (v16)...');

      // iOS에서는 Player ID가 비동기적으로 설정되므로 여러 번 시도
      for (let attempt = 0; attempt < 10; attempt++) {
        console.log(`OneSignal Player ID 시도 ${attempt + 1}/10...`);

        // v16 API 사용 - 여러 방법으로 시도
        let playerId = null;

        // 방법 1: User.PushSubscription.id
        if (window.OneSignal.User?.PushSubscription?.id) {
          playerId = window.OneSignal.User.PushSubscription.id;
          console.log('방법 1로 Player ID 획득:', playerId);
        }

        // 방법 2: User.onesignalId
        if (!playerId && window.OneSignal.User?.onesignalId) {
          playerId = window.OneSignal.User.onesignalId;
          console.log('방법 2로 Player ID 획득:', playerId);
        }

        // 방법 3: 직접 getPlayerId 호출 (있는 경우)
        if (!playerId && typeof window.OneSignal.getPlayerId === 'function') {
          try {
            playerId = await window.OneSignal.getPlayerId();
            console.log('방법 3으로 Player ID 획득:', playerId);
          } catch (e) {
            console.warn('getPlayerId 호출 실패:', e);
          }
        }

        if (playerId && playerId !== null && playerId !== undefined) {
          console.log('✅ OneSignal Player ID 최종 획득:', playerId);
          return playerId;
        }

        // 0.5초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.warn('❌ OneSignal Player ID를 찾을 수 없음 (v16) - 10회 시도 후 포기');

      // 디버깅 정보 출력
      console.log('OneSignal 디버깅 정보:', {
        OneSignalExists: !!window.OneSignal,
        UserExists: !!window.OneSignal.User,
        PushSubscriptionExists: !!window.OneSignal.User?.PushSubscription,
        PushSubscriptionId: window.OneSignal.User?.PushSubscription?.id,
        OneSignalId: window.OneSignal.User?.onesignalId,
        OptedIn: window.OneSignal.User?.PushSubscription?.optedIn
      });

      return null;
    }
    return null;
  } catch (error) {
    console.error('OneSignal 사용자 ID 가져오기 실패 (v16):', error);
    return null;
  }
};

// OneSignal 푸시 구독 상태 확인 (v16 API)
export const isOneSignalSubscribed = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && window.OneSignal) {
      // v16 API 사용
      const isSubscribed = window.OneSignal.User?.PushSubscription?.optedIn || false;
      console.log('OneSignal 구독 상태 (v16):', isSubscribed);
      return isSubscribed;
    }
    return false;
  } catch (error) {
    console.error('OneSignal 구독 상태 확인 실패 (v16):', error);
    return false;
  }
};

// OneSignal 푸시 구독 활성화
export const subscribeToOneSignal = async (): Promise<boolean> => {
  try {
    console.log('=== OneSignal 구독 시작 ===');
    console.log('window.OneSignal 존재:', !!window.OneSignal);
    console.log('window.OneSignalInitialized:', !!window.OneSignalInitialized);
    console.log('브라우저 정보:', navigator.userAgent);

    // OneSignal 초기화 대기 (최대 5초)
    let attempts = 0;
    while (attempts < 50 && (!window.OneSignal || !window.OneSignalInitialized)) {
      console.log(`OneSignal 초기화 대기 중... (${attempts + 1}/50)`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.OneSignal) {
      console.error('OneSignal이 초기화되지 않았습니다.');
      return false;
    }

    console.log('OneSignal 초기화 완료, 구독 시도...');

    // iOS/Android 구분하여 처리
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      console.log('iOS 기기 감지, OneSignal v16 구독 시도...');

      try {
        // iOS에서도 OneSignal v16 API 사용
        console.log('iOS OneSignal v16 권한 요청...');
        await window.OneSignal.Notifications.requestPermission();
        console.log('iOS OneSignal v16 권한 요청 완료');

        // 사용자 등록
        try {
          await window.OneSignal.setExternalUserId('user_' + Date.now());
          console.log('iOS OneSignal 사용자 등록 완료');
        } catch (iosUserError) {
          console.warn('iOS OneSignal 사용자 등록 실패:', iosUserError);
        }

        // iOS는 Player ID가 비동기적으로 설정되므로 더 많은 시도
        console.log('iOS Player ID 설정 대기 중...');
        for (let attempt = 0; attempt < 20; attempt++) {
          console.log(`iOS Player ID 확인 시도 ${attempt + 1}/20...`);

          const playerId = window.OneSignal.User?.PushSubscription?.id;
          const isOptedIn = window.OneSignal.User?.PushSubscription?.optedIn;

          console.log(`시도 ${attempt + 1} - Player ID:`, playerId, 'OptedIn:', isOptedIn);

          if (playerId && isOptedIn) {
            console.log('✅ iOS OneSignal 구독 성공, Player ID 확인됨');
            return true;
          }

          // 1초 대기
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 20회 시도 후에도 Player ID가 없으면 실패로 처리
        console.error('❌ iOS OneSignal Player ID를 20초 동안 기다렸지만 설정되지 않았습니다.');

        // 디버깅 정보 출력
        console.log('iOS OneSignal 최종 상태:', {
          optedIn: window.OneSignal.User?.PushSubscription?.optedIn,
          playerId: window.OneSignal.User?.PushSubscription?.id,
          onesignalId: window.OneSignal.User?.onesignalId
        });

        // OneSignal이 실패하면 false 반환 (기본 알림으로 폴백하지 않음)
        return false;
      } catch (iosError) {
        console.error('iOS OneSignal 구독 실패:', iosError);
        return false;
      }
    }

    // Android/Desktop에서의 OneSignal 구독
    console.log('Android/Desktop에서 OneSignal 구독 시도...');

    // OneSignal 사용자 등록
    try {
      await window.OneSignal.setExternalUserId('user_' + Date.now());
      console.log('OneSignal 사용자 등록 완료');
    } catch (userError) {
      console.warn('OneSignal 사용자 등록 실패:', userError);
    }

    // Android/Desktop: OneSignal v16 푸시 알림 권한 요청
    console.log('Android/Desktop OneSignal v16 푸시 알림 권한 요청...');

    try {
      // v16 API 사용
      await window.OneSignal.Notifications.requestPermission();
      console.log('OneSignal v16 권한 요청 완료');
    } catch (promptError) {
      console.error('OneSignal v16 권한 요청 실패:', promptError);
      // 권한 요청 실패해도 계속 진행
    }

    // 구독 상태 확인을 위해 잠시 대기
    console.log('구독 상태 확인 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isSubscribed = window.OneSignal.User?.PushSubscription?.optedIn || false;
    console.log('OneSignal v16 구독 활성화 결과:', isSubscribed);
    console.log('=== OneSignal v16 구독 완료 ===');
    return isSubscribed;
  } catch (error) {
    console.error('OneSignal 구독 활성화 실패:', error);
    console.error('에러 상세:', error.message);
    return false;
  }
};

// OneSignal 사용자 태그 설정 (v16 API)
export const setOneSignalUserTag = async (userId: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.OneSignal) {
      // v16 API 사용
      window.OneSignal.User.addTag('user_id', userId);
      console.log('OneSignal v16 사용자 태그 설정 완료:', userId);
    }
  } catch (error) {
    console.error('OneSignal v16 사용자 태그 설정 실패:', error);
  }
};

// OneSignal 초기화 확인
export const isOneSignalReady = (): boolean => {
  return typeof window !== 'undefined' && !!window.OneSignal;
};
