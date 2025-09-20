// Supabase에서 menu_date 컬럼 추가 및 기존 데이터 업데이트
import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (실제 값으로 변경 필요)
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMenuDateColumn() {
  try {
    console.log('menu_date 컬럼 추가 시도...')
    
    // 1. 컬럼 추가 (PostgreSQL)
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS menu_date text;'
    })
    
    if (alterError) {
      console.error('컬럼 추가 오류:', alterError)
      // RPC 함수가 없는 경우 직접 SQL 실행
      console.log('RPC 함수를 사용할 수 없습니다. Supabase 대시보드에서 직접 실행해주세요.')
      return
    }
    
    console.log('menu_date 컬럼이 추가되었습니다.')
    
    // 2. 기존 데이터 업데이트
    console.log('기존 주문들의 menu_date 업데이트 시작...')
    
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .is('menu_date', null)
    
    if (fetchError) {
      console.error('주문 조회 오류:', fetchError)
      return
    }
    
    console.log(`총 ${orders.length}개의 주문을 업데이트합니다.`)
    
    for (const order of orders) {
      let menuDate = null
      
      // delivery_time에서 날짜 추출
      if (order.delivery_time) {
        const dateMatch = order.delivery_time.match(/(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
          menuDate = dateMatch[1]
        }
      }
      
      // pickup_time에서 날짜 추출
      if (!menuDate && order.pickup_time) {
        const dateMatch = order.pickup_time.match(/(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
          menuDate = dateMatch[1]
        }
      }
      
      // 날짜를 찾지 못한 경우 created_at 사용
      if (!menuDate) {
        const createdDate = new Date(order.created_at)
        menuDate = createdDate.toISOString().split('T')[0]
      }
      
      // menu_date 업데이트
      const { error: updateError } = await supabase
        .from('orders')
        .update({ menu_date: menuDate })
        .eq('id', order.id)
      
      if (updateError) {
        console.error(`주문 ${order.id} 업데이트 오류:`, updateError)
      } else {
        console.log(`주문 ${order.id} 업데이트 완료: ${menuDate}`)
      }
    }
    
    console.log('모든 주문의 menu_date 업데이트가 완료되었습니다.')
    
  } catch (error) {
    console.error('스크립트 실행 오류:', error)
  }
}

addMenuDateColumn()
