import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

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

    // 매장별 월 고정비 수익 계산 (우리 수익)
    const totalStores = stores.length;
    const monthlyFeePerStore = 30000; // 매장당 월 3만원
    const initialFeePerStore = 1000000; // 매장당 첫 계약금 100만원
    
    // 첫 계약금 수익
    const initialRevenue = totalStores * initialFeePerStore;
    
    // 월 고정비 누적 수익 (매장 생성일부터 현재까지)
    let totalMonthlyRevenue = 0;
    stores.forEach(store => {
      const storeCreatedAt = new Date(store.created_at);
      const monthsSinceStart = Math.max(0, 
        (now.getFullYear() - storeCreatedAt.getFullYear()) * 12 + 
        (now.getMonth() - storeCreatedAt.getMonth())
      );
      totalMonthlyRevenue += monthlyFeePerStore * monthsSinceStart;
    });
    
    // 이번 달 월 고정비 수익
    const thisMonthRevenue = totalStores * monthlyFeePerStore;
    
    // 총 수익 (우리 수익)
    const totalRevenue = initialRevenue + totalMonthlyRevenue;
    
    // 주문 관련 통계 (고객 주문)
    const orderRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? orderRevenue / totalOrders : 0;

    // 성장률 계산 (우리 수익 기준)
    const previousPeriodStart = getPeriodStart(new Date(periodStart.getTime() - getPeriodDuration(selectedPeriod)), selectedPeriod);
    
    // 이전 기간의 우리 수익 계산
    let previousOurRevenue = 0;
    stores.forEach(store => {
      const storeCreatedAt = new Date(store.created_at);
      const previousPeriodEnd = new Date(periodStart);
      
      // 매장이 이전 기간에 존재했는지 확인
      if (storeCreatedAt <= previousPeriodEnd) {
        // 첫 계약금 (매장이 이전 기간에 생성되었다면)
        if (storeCreatedAt >= previousPeriodStart) {
          previousOurRevenue += initialFeePerStore;
        }
        
        // 월 고정비 (이전 기간 동안의 월 수)
        const monthsInPreviousPeriod = Math.max(0, 
          (previousPeriodEnd.getFullYear() - Math.max(storeCreatedAt.getFullYear(), previousPeriodStart.getFullYear())) * 12 + 
          (previousPeriodEnd.getMonth() - Math.max(storeCreatedAt.getMonth(), previousPeriodStart.getMonth()))
        );
        previousOurRevenue += monthlyFeePerStore * monthsInPreviousPeriod;
      }
    });
    
    const revenueGrowth = previousOurRevenue > 0 ? 
      Math.round(((totalRevenue - previousOurRevenue) / previousOurRevenue) * 100) : 0;
    
    // 주문 성장률 (고객 주문 기준)
    const previousOrders = orders.filter(order => 
      new Date(order.created_at) >= previousPeriodStart && 
      new Date(order.created_at) < periodStart
    );
    const previousOrderCount = previousOrders.length;
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
      // 한국 표준시간 기준으로 주문 날짜 계산
      const orderDateObj = new Date(order.created_at);
      const koreaOrderDate = new Date(orderDateObj.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const orderDate = koreaOrderDate.toISOString().split('T')[0];
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
    // 한국 표준시간 기준으로 현재 연도 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const currentYear = koreaTime.getFullYear();
    
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
      {/* 메인 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">통계 분석</h1>
            <p className="text-blue-100 text-lg">비즈니스 인사이트를 한눈에 확인하세요</p>
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
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedPeriod === period.key
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 핵심 지표 - 3개로 축소 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 총 매출 - 메인 카드 */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">총 매출</p>
              <p className="text-4xl font-bold">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-3xl"></i>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">전기간 대비</p>
              <p className={`text-xl font-semibold ${data.revenueGrowth >= 0 ? 'text-green-100' : 'text-red-200'}`}>
                {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm">평균 주문금액</p>
              <p className="text-xl font-semibold">{formatCurrency(data.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        {/* 주문 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">총 주문 수</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalOrders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-blue-500"></i>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">전기간 대비</span>
              <span className={`font-semibold ${data.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.orderGrowth >= 0 ? '+' : ''}{data.orderGrowth}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">배달완료</span>
              <span className="font-semibold">{data.orderStatusDistribution.배달완료}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* 우리 수익 추이 그래프 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">우리 수익 추이 (월 고정비)</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyStats.map(day => ({
              ...day,
              ourRevenue: (day.revenue || 0) * 0.1 // 예시: 고객 주문의 10%를 우리 수익으로 가정
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  formatCurrency(value), 
                  name === 'ourRevenue' ? '우리 수익' : '고객 주문'
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('ko-KR', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="ourRevenue" 
                stroke="#10b981" 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>우리 수익:</strong> 매장당 월 3만원 고정비 + 첫 계약금 100만원
          </p>
        </div>
      </div>

      {/* 분석 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시스템 로그 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">시스템 로그</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {/* 시스템 상태 로그 */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">시스템 정상</span>
              </div>
              <span className="text-xs text-green-600">방금 전</span>
            </div>
            
            {/* API 상태 로그 */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">API 응답 정상</span>
              </div>
              <span className="text-xs text-blue-600">1분 전</span>
            </div>
            
            {/* DB 상태 로그 */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">데이터베이스 연결 정상</span>
              </div>
              <span className="text-xs text-green-600">2분 전</span>
            </div>
            
            {/* 보안 상태 로그 */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">보안 스캔 완료</span>
              </div>
              <span className="text-xs text-green-600">5분 전</span>
            </div>
            
            {/* 품질 상태 로그 */}
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">성능 모니터링 중</span>
              </div>
              <span className="text-xs text-yellow-600">10분 전</span>
            </div>
            
            {/* 오류 로그 (예시) */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">일시적 네트워크 지연</span>
              </div>
              <span className="text-xs text-red-600">1시간 전</span>
            </div>
          </div>
        </div>

        {/* 시간대별 분석 - 바차트 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">시간대별 주문 분석</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeSlotAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="timeSlot" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any) => [value, '주문 수']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 상위 매장 성과 - 바차트 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">상위 매장 성과</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topStores.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                width={100}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), '매출']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}