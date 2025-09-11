
import { useState } from 'react';

interface StoreStats {
  storeName: string;
  totalRevenue: number;
  orderCount: number;
  activeUsers: number;
}

interface StatisticsProps {
  showToast: (message: string) => void;
}

export default function Statistics({ showToast }: StatisticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  const storeStats: StoreStats[] = [
    {
      storeName: '이천반찬',
      totalRevenue: 2450000,
      orderCount: 187,
      activeUsers: 89
    },
    {
      storeName: '맛있는 반찬집',
      totalRevenue: 1890000,
      orderCount: 142,
      activeUsers: 67
    },
    {
      storeName: '할머니반찬',
      totalRevenue: 980000,
      orderCount: 78,
      activeUsers: 34
    }
  ];

  const totalRevenue = storeStats.reduce((sum, store) => sum + store.totalRevenue, 0);
  const totalOrders = storeStats.reduce((sum, store) => sum + store.orderCount, 0);
  const totalUsers = storeStats.reduce((sum, store) => sum + store.activeUsers, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">통계</h2>
          <p className="text-gray-600">플랫폼 전체 통계를 확인합니다</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm pr-8"
        >
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="year">올해</option>
        </select>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-3xl font-bold text-green-600">{totalRevenue.toLocaleString()}원</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 주문 수</p>
              <p className="text-3xl font-bold text-blue-600">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 사용자</p>
              <p className="text-3xl font-bold text-purple-600">{totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 매장별 통계 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">매장별 통계</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매장명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 매출</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문 수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활성 사용자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 주문액</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storeStats.map((store, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {store.storeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.totalRevenue.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.orderCount.toLocaleString()}건
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.activeUsers.toLocaleString()}명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(store.totalRevenue / store.orderCount).toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 성과</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">신규 매장</span>
              <span className="font-semibold text-green-600">+3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">신규 사용자</span>
              <span className="font-semibold text-blue-600">+127</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">평균 주문액</span>
              <span className="font-semibold text-purple-600">13,200원</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">매출 증가율</span>
              <span className="font-semibold text-orange-600">+12.5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">인기 카테고리</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">메인메뉴</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-20 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <span className="text-sm font-semibold">83%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">국물요리</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-16 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-sm font-semibold">67%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">김치류</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-semibold">50%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">사이드메뉴</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="w-8 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <span className="text-sm font-semibold">33%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
