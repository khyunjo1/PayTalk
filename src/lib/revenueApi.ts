import { supabase } from './supabase';

// 수익 관련 타입 정의
export interface StoreContract {
  id: string;
  store_id: string;
  initial_fee: number;
  monthly_fee: number;
  contract_start_date: string;
  contract_end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevenueRecord {
  id: string;
  store_id: string;
  revenue_type: 'initial' | 'monthly' | 'additional';
  amount: number;
  description?: string;
  record_date: string;
  created_at: string;
}

export interface RevenueSummary {
  total_revenue: number;
  monthly_revenue: number;
  initial_revenue: number;
  monthly_fee_revenue: number;
  additional_revenue: number;
  active_contracts: number;
  total_contracts: number;
}

export interface StoreRevenueSummary {
  store_id: string;
  store_name: string;
  initial_fee: number;
  monthly_fee: number;
  total_initial_revenue: number;
  total_monthly_revenue: number;
  total_additional_revenue: number;
  total_revenue: number;
  contract_start_date: string;
  is_active: boolean;
}

// 전체 수익 요약 조회
export const getRevenueSummary = async (): Promise<RevenueSummary> => {
  try {
    // 현재 등록된 매장 수 조회
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, created_at');

    if (storesError) throw storesError;

    const totalStores = stores?.length || 0;
    const activeStores = totalStores; // 현재는 모든 매장이 활성

    // 간단한 수익 계산
    const initialRevenue = totalStores * 1000000; // 매장 수 × 100만원
    const monthlyRevenue = activeStores * 30000; // 활성 매장 수 × 3만원
    
    // 월 고정비 누적 계산 (매장 생성일부터 현재까지)
    let totalMonthlyRevenue = 0;
    stores?.forEach(store => {
      const storeCreatedAt = new Date(store.created_at);
      const now = new Date();
      const monthsSinceStart = Math.max(0, 
        (now.getFullYear() - storeCreatedAt.getFullYear()) * 12 + 
        (now.getMonth() - storeCreatedAt.getMonth())
      );
      totalMonthlyRevenue += 30000 * monthsSinceStart;
    });

    return {
      total_revenue: initialRevenue + totalMonthlyRevenue,
      monthly_revenue: monthlyRevenue,
      initial_revenue: initialRevenue,
      monthly_fee_revenue: totalMonthlyRevenue,
      additional_revenue: 0,
      active_contracts: activeStores,
      total_contracts: totalStores
    };
  } catch (error) {
    console.error('수익 요약 조회 실패:', error);
    throw error;
  }
};

// 매장별 수익 요약 조회
export const getStoreRevenueSummary = async (): Promise<StoreRevenueSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('store_revenue_summary')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('매장별 수익 요약 조회 실패:', error);
    throw error;
  }
};

// 월별 수익 조회
export const getMonthlyRevenue = async (months: number = 12): Promise<Array<{
  month: string;
  initial_revenue: number;
  monthly_revenue: number;
  additional_revenue: number;
  total_revenue: number;
}>> => {
  try {
    const { data, error } = await supabase
      .from('total_revenue_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(months);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('월별 수익 조회 실패:', error);
    throw error;
  }
};

// 수익 기록 추가
export const addRevenueRecord = async (record: Omit<RevenueRecord, 'id' | 'created_at'>): Promise<RevenueRecord> => {
  try {
    const { data, error } = await supabase
      .from('revenue_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('수익 기록 추가 실패:', error);
    throw error;
  }
};

// 계약 정보 조회
export const getStoreContracts = async (): Promise<StoreContract[]> => {
  try {
    const { data, error } = await supabase
      .from('store_contracts')
      .select(`
        *,
        stores (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('계약 정보 조회 실패:', error);
    throw error;
  }
};

// 계약 정보 업데이트
export const updateStoreContract = async (id: string, updates: Partial<StoreContract>): Promise<StoreContract> => {
  try {
    const { data, error } = await supabase
      .from('store_contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('계약 정보 업데이트 실패:', error);
    throw error;
  }
};

// 월별 수익 자동 생성 (월 고정비)
export const generateMonthlyRevenue = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('generate_monthly_revenue');
    if (error) throw error;
  } catch (error) {
    console.error('월별 수익 자동 생성 실패:', error);
    throw error;
  }
};

// 사장님 이탈률 계산
export const getOwnerChurnRate = async (): Promise<{
  total_owners: number;
  active_owners: number;
  churned_owners: number;
  churn_rate: number;
  last_30_days_churn: number;
}> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 전체 사장님 수
    const { data: totalOwners, error: totalError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (totalError) throw totalError;

    // 최근 30일 내 활동한 사장님 (주문 생성)
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (ordersError) throw ordersError;

    // 최근 90일 내 활동한 사장님
    const { data: activeOrders, error: activeError } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (activeError) throw activeError;

    const totalOwnersCount = totalOwners?.length || 0;
    const recentActiveOwners = new Set(recentOrders?.map(o => o.user_id) || []);
    const activeOwnersCount = new Set(activeOrders?.map(o => o.user_id) || []).size;
    const churnedOwners = totalOwnersCount - activeOwnersCount;
    const churnRate = totalOwnersCount > 0 ? (churnedOwners / totalOwnersCount) * 100 : 0;

    return {
      total_owners: totalOwnersCount,
      active_owners: activeOwnersCount,
      churned_owners: churnedOwners,
      churn_rate: Math.round(churnRate * 100) / 100,
      last_30_days_churn: recentActiveOwners.size
    };
  } catch (error) {
    console.error('사장님 이탈률 계산 실패:', error);
    throw error;
  }
};
