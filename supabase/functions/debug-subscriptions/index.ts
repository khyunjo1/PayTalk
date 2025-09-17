import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 모든 구독 정보 조회
    const { data: allSubscriptions, error: allError } = await supabaseClient
      .from('user_push_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('전체 구독 조회 결과:', { allSubscriptions, allError })

    // 특정 사용자 조회
    const testUserId = '636a0bd3-a198-4cd8-9cb0-7fe17c2422e2'
    const { data: userSubscriptions, error: userError } = await supabaseClient
      .from('user_push_subscriptions')
      .select('*')
      .eq('user_id', testUserId)

    console.log(`사용자 ${testUserId} 구독 정보:`, { userSubscriptions, userError })

    // 테이블 스키마 정보
    const { data: tableInfo, error: tableError } = await supabaseClient
      .rpc('get_table_info', { table_name: 'user_push_subscriptions' })
      .select()

    console.log('테이블 스키마 정보:', { tableInfo, tableError })

    return new Response(
      JSON.stringify({
        success: true,
        allSubscriptions,
        userSubscriptions,
        tableInfo,
        errors: { allError, userError, tableError }
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