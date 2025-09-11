import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface StatisticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  topStores: Array<{
    id: string;
    name: string;
    revenue: number;
    orderCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  monthlyStats: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  orderStatusDistribution: {
    입금대기: number;
    입금확인: number;
    배달완료: number;
    주문취소: number;
  };
  timeSlotAnalysis: Array<{
    timeSlot: string;
    orders: number;
    revenue: number;
  }>;
}

export default function Statistics() {
  const [data, setData] = useState<StatisticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    topStores: [],
    dailyStats: [],
    monthlyStats: [],
    orderStatusDistribution: {
      입금대기: 0,
      입금확인: 0,
      배달완료: 0,
      주문취소: 0
    },
    timeSlotAnalysis: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const [ordersData, storesData] = await Promise.all([
        loadOrdersData(),
        loadStoresData()
      ]);

      const stats = calculateStatistics(ordersData, storesData);
      setData(stats);
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersData = async () => {
    // 먼저 orders 테이블의 모든 컬럼을 조회
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders 데이터 로드 실패:', error);
      return [];
    }
    
    // 매장 정보를 별도로 조회
    const storeIds = [...new Set(data?.map(order => order.store_id).filter(Boolean))];
    let storesMap = new Map();
    
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', storeIds);
      
      storesMap = new Map(storesData?.map(store => [store.id, store]) || []);
    }
    
    return data?.map(order => ({
      ...order,
      total_amount: order.amount || order.total_price || order.price || order.total_amount || 0,
      stores: storesMap.get(order.store_id) || { id: '', name: 'Unknown' }
    })) || [];
  };

  const loadStoresData = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, created_at');

    if (error) throw error;
    return data || [];
  };

  const calculateStatistics = (orders: any[], stores: any[]) => {
    const now = new Date();
    const periodStart = getPeriodStart(now, selectedPeriod);
    
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= periodStart
    );

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 성장률 계산
    const previousPeriodStart = getPeriodStart(new Date(periodStart.getTime() - getPeriodDuration(selectedPeriod)), selectedPeriod);
    const previousOrders = orders.filter(order => 
      new Date(order.created_at) >= previousPeriodStart && 
      new Date(order.created_at) < periodStart
    );
    
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const previousOrderCount = previousOrders.length;
    
    const revenueGrowth = previousRevenue > 0 ? 
      Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    const orderGrowth = previousOrderCount > 0 ? 
      Math.round(((totalOrders - previousOrderCount) / previousOrderCount) * 100) : 0;

    // 상위 매장 계산
    const storeStats = new Map();
    filteredOrders.forEach(order => {
      const storeId = order.stores.id;
      const storeName = order.stores.name;
      
      if (!storeStats.has(storeId)) {
        storeStats.set(storeId, {
          id: storeId,
          name: storeName,
          revenue: 0,
          orderCount: 0
        });
      }
      
      const store = storeStats.get(storeId);
      store.revenue += order.total_amount;
      store.orderCount++;
    });

    const topStores = Array.from(storeStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 일별 통계
    const dailyStats = calculateDailyStats(filteredOrders, periodStart, now);
    
    // 월별 통계
    const monthlyStats = calculateMonthlyStats(orders, selectedPeriod);
    
    // 주문 상태 분포
    const orderStatusDistribution = {
      입금대기: filteredOrders.filter(o => o.status === '입금대기').length,
      입금확인: filteredOrders.filter(o => o.status === '입금확인').length,
      배달완료: filteredOrders.filter(o => o.status === '배달완료').length,
      주문취소: filteredOrders.filter(o => o.status === '주문취소').length
    };

    // 시간대별 분석
    const timeSlotAnalysis = calculateTimeSlotAnalysis(filteredOrders);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth,
      orderGrowth,
      topStores,
      dailyStats,
      monthlyStats,
      orderStatusDistribution,
      timeSlotAnalysis
    };
  };

  const getPeriodStart = (date: Date, period: string) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(day - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        return new Date(year, month, 1);
      case 'year':
        return new Date(year, 0, 1);
      default:
        return new Date(year, month, 1);
    }
  };

  const getPeriodDuration = (period: string) => {
    switch (period) {
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      case 'year':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  };

  const calculateDailyStats = (orders: any[], startDate: Date, endDate: Date) => {
    const stats = new Map();
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      stats.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (stats.has(orderDate)) {
        const dayStats = stats.get(orderDate);
        dayStats.revenue += order.total_amount;
        dayStats.orders += 1;
      }
    });
    
    return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const calculateMonthlyStats = (orders: any[], period: string) => {
    if (period !== 'year') return [];
    
    const stats = new Map();
    const currentYear = new Date().getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      stats.set(monthKey, { month: monthKey, revenue: 0, orders: 0 });
    }
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate.getFullYear() === currentYear) {
        const monthKey = `${currentYear}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        if (stats.has(monthKey)) {
          const monthStats = stats.get(monthKey);
          monthStats.revenue += order.total_amount;
          monthStats.orders += 1;
        }
      }
    });
    
    return Array.from(stats.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateTimeSlotAnalysis = (orders: any[]) => {
    const timeSlots = [
      { name: '아침 (6-12시)', start: 6, end: 12 },
      { name: '점심 (12-18시)', start: 12, end: 18 },
      { name: '저녁 (18-24시)', start: 18, end: 24 },
      { name: '새벽 (0-6시)', start: 0, end: 6 }
    ];
    
    return timeSlots.map(slot => {
      const slotOrders = orders.filter(order => {
        const hour = new Date(order.created_at).getHours();
        return hour >= slot.start || hour < slot.end;
      });
      
      return {
        timeSlot: slot.name,
        orders: slotOrders.length,
        revenue: slotOrders.reduce((sum, order) => sum + order.total_amount, 0)
      };
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">통계 분석</h2>
            <p className="text-gray-600">상세한 비즈니스 분석 데이터를 확인하세요</p>
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'week', label: '이번 주' },
              { key: 'month', label: '이번 달' },
              { key: 'year', label: '이번 년' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</p>
              <p className={`text-sm ${data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth}% 전기간 대비
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-orange-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 주문 수</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalOrders.toLocaleString()}</p>
              <p className={`text-sm ${data.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.orderGrowth >= 0 ? '+' : ''}{data.orderGrowth}% 전기간 대비
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 주문 금액</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.averageOrderValue)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-bar-chart-line text-2xl text-blue-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">주문 상태 분포</p>
              <p className="text-3xl font-bold text-gray-900">{data.orderStatusDistribution.배달완료}</p>
              <p className="text-sm text-gray-500">배달완료 / {data.totalOrders}건</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-pie-chart-line text-2xl text-purple-500"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 상위 매장 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">상위 매장 (매출 기준)</h3>
        <div className="space-y-3">
          {data.topStores.map((store, index) => (
            <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{store.name}</p>
                  <p className="text-sm text-gray-500">{store.orderCount}건</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(store.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 시간대별 분석 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">시간대별 주문 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.timeSlotAnalysis.map((slot, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">{slot.timeSlot}</h4>
              <p className="text-2xl font-bold text-orange-600">{slot.orders}건</p>
              <p className="text-sm text-gray-500">{formatCurrency(slot.revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 주문 상태 분포 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">주문 상태 분포</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.orderStatusDistribution).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}