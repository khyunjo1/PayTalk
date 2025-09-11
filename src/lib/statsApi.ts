import { supabase } from './supabase';

export interface HomeStats {
  totalStores: number;
  totalOrders: number;
}

// 홈페이지 통계 데이터 조회
export const getHomeStats = async (): Promise<HomeStats> => {
  try {
    // 1. 총 매장 수 조회
    const { count: storeCount, error: storeError } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });

    if (storeError) {
      console.error('매장 수 조회 오류:', storeError);
      throw storeError;
    }

    // 2. 총 주문 수 조회
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (orderError) {
      console.error('주문 수 조회 오류:', orderError);
      throw orderError;
    }

    return {
      totalStores: storeCount || 0,
      totalOrders: orderCount || 0
    };
  } catch (error) {
    console.error('통계 데이터 조회 실패:', error);
    // 오류 발생 시 기본값 반환
    return {
      totalStores: 0,
      totalOrders: 0
    };
  }
};
