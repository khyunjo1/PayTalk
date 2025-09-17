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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 특정 사용자 ID의 모든 구독 정보 조회
    const testUserId = '636a0bd3-a198-4cd8-9cb0-7fe17c2422e2'

    const { data: allSubscriptions, error } = await supabaseClient
      .from('user_push_subscriptions')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })

    console.log('=== 다중 기기 디버깅 결과 ===')
    console.log('사용자 ID:', testUserId)
    console.log('총 구독 수:', allSubscriptions?.length || 0)

    if (allSubscriptions) {
      allSubscriptions.forEach((sub, index) => {
        console.log(`구독 ${index + 1}:`, {
          id: sub.id,
          onesignal_player_id: sub.onesignal_player_id,
          is_active: sub.is_active,
          created_at: sub.created_at
        })
      })
    }

    // 활성 구독만 필터링
    const activeSubscriptions = allSubscriptions?.filter(sub => sub.is_active) || []
    console.log('활성 구독 수:', activeSubscriptions.length)

    const playerIds = activeSubscriptions.map(sub => sub.onesignal_player_id).filter(Boolean)
    console.log('Player IDs:', playerIds)

    return new Response(
      JSON.stringify({
        success: true,
        userId: testUserId,
        totalSubscriptions: allSubscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        playerIds: playerIds,
        subscriptions: allSubscriptions
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('디버깅 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})