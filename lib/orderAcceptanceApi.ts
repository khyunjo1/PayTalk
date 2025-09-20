import { supabase } from './supabase';
import { getOrderAcceptanceStatus as getOrderStatus, StoreTimeInfo } from './dateUtils';

export interface OrderAcceptanceStatus {
  status: 'current' | 'tomorrow' | 'closed';
  message: string;
  canOrder: boolean;
  nextAvailableTime?: string;
}

// 주문접수 상태 조회
export async function getOrderAcceptanceStatus(storeId: string): Promise<OrderAcceptanceStatus> {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('order_acceptance_status, order_cutoff_time, business_hours_start')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('Error fetching store data:', error);
      return {
        status: 'closed',
        message: '가게 정보를 불러올 수 없습니다.',
        canOrder: false
      };
    }

    const storeTimeInfo: StoreTimeInfo = {
      businessStartTime: store.business_hours_start || '09:00',
      orderCutoffTime: store.order_cutoff_time || '15:00'
    };

    const dbStatus = store.order_acceptance_status || 'closed';
    
    return getOrderStatus(storeTimeInfo, dbStatus);
  } catch (error) {
    console.error('Error in getOrderAcceptanceStatus:', error);
    return {
      status: 'closed',
      message: '오류가 발생했습니다.',
      canOrder: false
    };
  }
}

// 주문접수 상태 변경 (관리자용)
export async function setOrderAcceptanceStatus(storeId: string, status: 'current' | 'tomorrow' | 'closed'): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('set_order_acceptance_status', {
      store_id: storeId,
      new_status: status
    });

    if (error) {
      console.error('Error setting order acceptance status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setOrderAcceptanceStatus:', error);
    return false;
  }
}

// 자동 상태 업데이트 (서버에서 주기적으로 실행)
export async function updateOrderAcceptanceStatus(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_order_acceptance_status');

    if (error) {
      console.error('Error updating order acceptance status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOrderAcceptanceStatus:', error);
    return false;
  }
}

// 주문 가능 여부 확인 (메뉴 페이지용)
export async function canPlaceOrder(storeId: string): Promise<{ canOrder: boolean; message: string; isTomorrowOrder?: boolean }> {
  const status = await getOrderAcceptanceStatus(storeId);
  
  return {
    canOrder: status.canOrder,
    message: status.message,
    isTomorrowOrder: status.status === 'tomorrow'
  };
}
