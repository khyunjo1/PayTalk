// 주문 관리 API 함수
// 요구사항 5: 주문 상태 변경 + 푸시 알림

import { supabase } from './supabase';
import { sendPushNotification, getStoreOrderNotificationMessage, checkUserPushSubscription } from './pushApi';

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
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  subtotal: number;
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
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      subtotal: orderData.subtotal,
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

  // 푸시 알림 발송 (비동기로 처리하여 주문 생성에 영향 없도록)
  try {
    // 고객 정보와 매장 정보 가져오기
    const [userData, storeData, menuData] = await Promise.all([
      supabase.from('users').select('name, phone').eq('id', orderData.user_id).single(),
      supabase.from('stores').select('name, phone, bank_account, account_holder, owner_id').eq('id', orderData.store_id).single(),
      supabase.from('menus').select('name').in('id', orderData.items.map(item => item.menu_id))
    ]);

    if (userData.data && storeData.data && menuData.data) {
      // 주문 아이템 이름 생성
      const orderItemsText = orderData.items.map(item => {
        const menu = menuData.data.find(m => m.id === item.menu_id);
        return `${menu?.name || '메뉴'} x${item.quantity}`;
      }).join(', ');

      // 고객에게 주문 접수 푸시 알림 발송 (전화번호 기반)
      const customerNotification = {
        title: '주문 접수 완료',
        body: `${storeData.data.name}에 주문이 접수되었습니다. 입금 확인 후 배달하겠습니다.`
      };
      
      // 전화번호 기반 푸시 알림 시도
      if (userData.data.phone) {
        await sendPushNotificationByPhone(
          userData.data.phone,
          customerNotification.title,
          customerNotification.body,
          { orderId: order.id, type: 'order_received' }
        );
      }
      
      // 기존 user_id 기반 푸시 알림도 백업으로 시도
      await sendPushNotification(
        orderData.user_id,
        customerNotification.title,
        customerNotification.body,
        { orderId: order.id, type: 'order_received' }
      );

      // 사장님에게 신규 주문 푸시 알림 발송
      if (storeData.data.owner_id) {
        const storeNotification = getStoreOrderNotificationMessage(storeData.data.name, order.id);
        console.log('사장님에게 푸시 알림 발송 시도:', {
          ownerId: storeData.data.owner_id,
          storeName: storeData.data.name,
          orderId: order.id,
          notification: storeNotification
        });
        
        // 사장님이 푸시 알림을 구독했는지 확인
        const hasOwnerSubscription = await checkUserPushSubscription(storeData.data.owner_id);
        if (!hasOwnerSubscription) {
          console.warn(`사장님(${storeData.data.owner_id})이 푸시 알림을 구독하지 않았습니다.`);
        }
        
        const pushResult = await sendPushNotification(
          storeData.data.owner_id,
          storeNotification.title,
          storeNotification.body,
          { orderId: order.id, type: 'new_order' }
        );
        
        console.log('사장님 푸시 알림 발송 결과:', pushResult);
      } else {
        console.warn('매장에 owner_id가 설정되지 않음:', storeData.data);
      }
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


// 매장의 주문 목록 가져오기 (사장님용)
export const getStoreOrders = async (storeId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('매장 주문 목록 가져오기 오류:', error);
    throw error;
  }

  // 주문 아이템도 함께 가져오기
  const ordersWithItems = await Promise.all(
    (data || []).map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menus (
            id,
            name,
            price
          )
        `)
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('주문 아이템 가져오기 오류:', itemsError);
        return { ...order, order_items: [] };
      }

      return { ...order, order_items: items || [] };
    })
  );

  return ordersWithItems;
};

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: '입금대기' | '입금확인' | '배달완료' | '주문취소') => {
  console.log('주문 상태 업데이트 시작:', { orderId, status });
  
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select(`
      *,
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
    console.error('주문 ID:', orderId);
    console.error('새 상태:', status);
    console.error('에러 상세:', error.message, error.details, error.hint);
    throw error;
  }

  console.log('주문 상태 업데이트 성공:', { orderId, status, data });

  // 주문 상태 변경 이벤트 발생 (다른 페이지에서 감지)
  window.dispatchEvent(new CustomEvent('orderStatusChanged', {
    detail: { orderId, status, updatedOrder: data }
  }));

  // 소비자 푸시 알림은 제거됨 - 고객은 주문 조회 페이지에서 확인

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
