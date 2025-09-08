// 주문 관리 API 함수
// 요구사항 5: 주문 상태 변경 + 알림톡

import { supabase } from './supabase';
// TODO: 알림톡 기능은 나중에 구현
// import { 
//   sendOrderReceivedNotification, 
//   sendNewOrderNotificationToOwner,
//   logAlimtalkSent
// } from './kakaoAlimtalk';

// 주문 생성
export const createOrder = async (orderData: {
  user_id: string;
  store_id: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: Array<{
    menu_id: string;
    quantity: number;
    price: number;
  }>;
}) => {
  // 주문 생성
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: orderData.user_id,
      store_id: orderData.store_id,
      order_type: orderData.order_type,
      delivery_address: orderData.delivery_address,
      delivery_time: orderData.delivery_time,
      pickup_time: orderData.pickup_time,
      special_requests: orderData.special_requests,
      depositor_name: orderData.depositor_name,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee,
      total: orderData.total,
      status: '입금대기'
    })
    .select()
    .single();

  if (orderError) {
    console.error('주문 생성 오류:', orderError);
    throw orderError;
  }

  // 주문 아이템들 생성
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    menu_id: item.menu_id,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('주문 아이템 생성 오류:', itemsError);
    throw itemsError;
  }

  // 알림톡 발송 (비동기로 처리하여 주문 생성에 영향 없도록)
  try {
    // 고객 정보와 매장 정보 가져오기
    const [userData, storeData, menuData] = await Promise.all([
      supabase.from('users').select('name, phone').eq('id', orderData.user_id).single(),
      supabase.from('stores').select('name, phone, bank_account, account_holder').eq('id', orderData.store_id).single(),
      supabase.from('menus').select('name').in('id', orderData.items.map(item => item.menu_id))
    ]);

    if (userData.data && storeData.data && menuData.data) {
      // 주문 아이템 이름 생성
      const orderItemsText = orderData.items.map(item => {
        const menu = menuData.data.find(m => m.id === item.menu_id);
        return `${menu?.name || '메뉴'} x${item.quantity}`;
      }).join(', ');

      // TODO: 알림톡 기능은 나중에 구현
      // 고객에게 주문 접수 알림톡 발송
      // const customerNotification = await sendOrderReceivedNotification({
      //   customerName: userData.data.name,
      //   customerPhone: userData.data.phone,
      //   storeName: storeData.data.name,
      //   orderId: order.id,
      //   orderItems: orderItemsText,
      //   totalAmount: orderData.total,
      //   deliveryAddress: orderData.delivery_address,
      //   deliveryTime: orderData.delivery_time,
      //   pickupTime: orderData.pickup_time,
      //   depositorName: orderData.depositor_name,
      //   bankAccount: storeData.data.bank_account,
      //   accountHolder: storeData.data.account_holder
      // });

      // 사장님에게 신규 주문 알림톡 발송
      // const ownerNotification = await sendNewOrderNotificationToOwner({
      //   ownerPhone: storeData.data.phone,
      //   storeName: storeData.data.name,
      //   orderId: order.id,
      //   customerName: userData.data.name,
      //   orderItems: orderItemsText,
      //   totalAmount: orderData.total,
      //   orderType: orderData.order_type,
      //   deliveryAddress: orderData.delivery_address,
      //   deliveryTime: orderData.delivery_time,
      //   pickupTime: orderData.pickup_time
      // });

      // 알림톡 발송 로그 저장
      // await logAlimtalkSent({
      //   orderId: order.id,
      //   recipientPhone: userData.data.phone,
      //   templateId: 'ORDER_RECEIVED_TEMPLATE',
      //   success: customerNotification
      // });

      // await logAlimtalkSent({
      //   orderId: order.id,
      //   recipientPhone: storeData.data.phone,
      //   templateId: 'NEW_ORDER_TEMPLATE',
      //   success: ownerNotification
      // });
    }
  } catch (alimtalkError) {
    console.error('알림톡 발송 오류:', alimtalkError);
    // 알림톡 발송 실패해도 주문은 정상 처리
  }

  return order;
};

// 사용자의 주문 목록 가져오기
export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        id,
        name,
        phone,
        bank_account,
        account_holder
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('사용자 주문 목록 가져오기 오류:', error);
    throw error;
  }

  // 주문 아이템 정보도 함께 가져오기
  const ordersWithItems = await Promise.all(
    (data || []).map(async (order) => {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          menus (
            id,
            name
          )
        `)
        .eq('order_id', order.id);

      return {
        ...order,
        order_items: orderItems || []
      };
    })
  );

  return ordersWithItems;
};

// 매장의 주문 목록 가져오기 (사장님용)
export const getStoreOrders = async (storeId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      users (
        id,
        name,
        phone
      )
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('매장 주문 목록 가져오기 오류:', error);
    throw error;
  }

  return data || [];
};

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: '입금대기' | '입금확인' | '배달완료') => {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select(`
      *,
      users (
        name,
        phone
      ),
      stores (
        name,
        phone
      ),
      order_items (
        quantity,
        price,
        menus (
          name
        )
      )
    `)
    .single();

  if (error) {
    console.error('주문 상태 업데이트 오류:', error);
    throw error;
  }

  // 주문 상태 변경 시 알림톡 발송 (입금확인, 배달완료만)
  if (status === '입금확인' || status === '배달완료') {
    try {
      if (data.users && data.stores && data.order_items) {
        // 주문 아이템 이름 생성
        const orderItemsText = data.order_items.map(item => 
          `${item.menus?.name || '메뉴'} x${item.quantity}`
        ).join(', ');

        // TODO: 알림톡 기능은 나중에 구현
        // 고객에게 주문 상태 변경 알림톡 발송
        // const notification = await sendOrderStatusNotification({
        //   customerName: data.users.name,
        //   customerPhone: data.users.phone,
        //   storeName: data.stores.name,
        //   orderId: data.id,
        //   orderItems: orderItemsText,
        //   totalAmount: data.total,
        //   deliveryAddress: data.delivery_address,
        //   deliveryTime: data.delivery_time,
        //   pickupTime: data.pickup_time,
        //   depositorName: data.depositor_name
        // }, status);

        // 알림톡 발송 로그 저장
        // await logAlimtalkSent({
        //   orderId: data.id,
        //   recipientPhone: data.users.phone,
        //   templateId: status === '입금확인' ? 'PAYMENT_CONFIRMED_TEMPLATE' : 'DELIVERY_COMPLETED_TEMPLATE',
        //   success: notification
        // });
      }
    } catch (alimtalkError) {
      console.error('주문 상태 변경 알림톡 발송 오류:', alimtalkError);
      // 알림톡 발송 실패해도 주문 상태 변경은 정상 처리
    }
  }

  return data;
};

// 주문 상세 정보 가져오기 (주문 아이템 포함)
export const getOrderDetails = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        id,
        name,
        phone,
        bank_account,
        account_holder
      ),
      users (
        id,
        name,
        phone
      ),
      order_items (
        id,
        quantity,
        price,
        menus (
          id,
          name,
          category
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('주문 상세 정보 가져오기 오류:', error);
    throw error;
  }

  return data;
};
