import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge Function 호출됨:', req.method, req.url)
    
    const { userId, title, body, data, subscription } = await req.json()
    console.log('받은 데이터:', { userId, title, body, data })

    // Supabase 클라이언트 생성
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 데이터베이스에서 OneSignal Player ID 조회 (단일 기기 방식으로 복원)
    console.log('사용자 ID로 OneSignal Player ID 조회:', userId)

    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('onesignal_player_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError || !subscriptionData?.onesignal_player_id) {
      console.log('OneSignal Player ID를 찾을 수 없습니다:', subscriptionError)
      return new Response(
        JSON.stringify({ success: false, error: 'No OneSignal Player ID found for user' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const playerId = subscriptionData.onesignal_player_id;
    console.log('데이터베이스에서 조회한 OneSignal Player ID:', playerId)

    // OneSignal API 키 설정
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID') ?? '53e91691-f5c2-408d-9228-f08d93bd0b35'
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!oneSignalApiKey) {
      console.error('OneSignal REST API Key가 설정되지 않았습니다.')
      return new Response(
        JSON.stringify({ success: false, error: 'OneSignal API Key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('OneSignal 푸시 알림 발송 시작:', {
      appId: oneSignalAppId,
      playerId: playerId,
      title,
      body
    })

    try {
      const pushResult = await sendOneSignalNotification({
        appId: oneSignalAppId,
        apiKey: oneSignalApiKey,
        playerId: playerId,
        title,
        body,
        data: data || {}
      })

      console.log('OneSignal 푸시 알림 발송 성공:', pushResult)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OneSignal push notification sent successfully',
          result: pushResult
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } catch (pushError) {
      console.error('OneSignal 푸시 알림 발송 실패:', pushError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send OneSignal notification', details: pushError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('푸시 알림 발송 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// OneSignal REST API를 사용한 푸시 알림 발송 (단일 기기 방식으로 복원)
async function sendOneSignalNotification(params: {
  appId: string;
  apiKey: string;
  playerId: string;
  title: string;
  body: string;
  data?: any;
}) {
  const { appId, apiKey, playerId, title, body, data } = params;

  const notification = {
    app_id: appId,
    include_player_ids: [playerId],
    headings: {
      ko: title,
      en: title
    },
    contents: {
      ko: body,
      en: body
    },
    data: data || {},
    web_url: 'https://pay-talk.vercel.app',
    chrome_web_icon: '/favicon.ico',
    chrome_web_badge: '/favicon.ico'
  };

  console.log('OneSignal API 요청:', notification);

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`
    },
    body: JSON.stringify(notification)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('OneSignal API 오류:', result);
    throw new Error(`OneSignal API 오류: ${JSON.stringify(result)}`);
  }

  console.log('OneSignal 발송 결과:', result);
  return result;
}

