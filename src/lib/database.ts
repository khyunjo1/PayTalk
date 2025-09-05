import { supabase } from './supabase'
import type { Database } from './supabase'

type Store = Database['public']['Tables']['stores']['Row']
type Menu = Database['public']['Tables']['menus']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

// 매장 목록 가져오기
export const getStores = async (): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('매장 목록 가져오기 오류:', error)
    throw error
  }
  
  return data || []
}

// 특정 매장 정보 가져오기
export const getStore = async (storeId: string): Promise<Store | null> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()
  
  if (error) {
    console.error('매장 정보 가져오기 오류:', error)
    return null
  }
  
  return data
}

// 매장의 메뉴 목록 가져오기
export const getMenus = async (storeId: string): Promise<Menu[]> => {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_available', true)
    .order('category', { ascending: true })
  
  if (error) {
    console.error('메뉴 목록 가져오기 오류:', error)
    throw error
  }
  
  return data || []
}

// 사용자의 매장 목록 가져오기 (링크로 등록된 매장들)
export const getUserStores = async (userId: string): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('user_stores')
    .select(`
      stores (
        id,
        name,
        category,
        delivery_area,
        delivery_fee,
        phone,
        business_hours,
        bank_account,
        account_holder
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('사용자 매장 목록 가져오기 오류:', error)
    throw error
  }
  
  return data?.map(item => item.stores).filter(Boolean) || []
}

// 사용자 매장에 추가
export const addUserStore = async (userId: string, storeId: string) => {
  const { error } = await supabase
    .from('user_stores')
    .insert({
      user_id: userId,
      store_id: storeId
    })
  
  if (error) {
    console.error('사용자 매장 추가 오류:', error)
    throw error
  }
}

// 주문 생성
export const createOrder = async (orderData: {
  userId: string
  storeId: string
  orderType: 'delivery' | 'pickup'
  deliveryAddress?: string
  deliveryTime?: string
  pickupTime?: string
  specialRequests?: string
  depositorName: string
  subtotal: number
  deliveryFee: number
  total: number
  items: Array<{
    menuId: string
    quantity: number
    price: number
  }>
}): Promise<Order> => {
  // 주문 생성
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: orderData.userId,
      store_id: orderData.storeId,
      order_type: orderData.orderType,
      delivery_address: orderData.deliveryAddress,
      delivery_time: orderData.deliveryTime,
      pickup_time: orderData.pickupTime,
      special_requests: orderData.specialRequests,
      depositor_name: orderData.depositorName,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      total: orderData.total,
      status: '입금대기'
    })
    .select()
    .single()
  
  if (orderError) {
    console.error('주문 생성 오류:', orderError)
    throw orderError
  }
  
  // 주문 아이템들 생성
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    menu_id: item.menuId,
    quantity: item.quantity,
    price: item.price
  }))
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
  
  if (itemsError) {
    console.error('주문 아이템 생성 오류:', itemsError)
    throw itemsError
  }
  
  return order
}

// 사용자의 주문 목록 가져오기
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        name,
        phone
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('사용자 주문 목록 가져오기 오류:', error)
    throw error
  }
  
  return data || []
}

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: '입금대기' | '입금확인' | '배달완료') => {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
  
  if (error) {
    console.error('주문 상태 업데이트 오류:', error)
    throw error
  }
}
