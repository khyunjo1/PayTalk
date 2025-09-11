
import { useState } from 'react';

interface DashboardProps {
  showToast: (message: string) => void;
}

export default function Dashboard({ showToast }: DashboardProps) {
  const [notifications] = useState([
    { id: 1, message: '새로운 매장개설 문의가 있습니다', time: '5분 전', type: 'inquiry' },
    { id: 2, message: '이천반찬에서 새 메뉴를 등록했습니다', time: '1시간 전', type: 'menu' },
    { id: 3, message: '오늘 총 47건의 주문이 완료되었습니다', time: '2시간 전', type: 'order' }
  ]);

  const stats = {
    totalStores: 12,
    activeStores: 9,
    pendingInquiries: 5,
    totalOrders: 1247
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="bg-white rounded-lg p-3 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">전체 매장 수</p>
              <p className="text-xl lg:text-3xl font-bold text-blue-600">{stats.totalStores}</p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-store-line text-lg lg:text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">활성 매장 수</p>
              <p className="text-xl lg:text-3xl font-bold text-green-600">{stats.activeStores}</p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-lg lg:text-2xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">대기중인 문의</p>
              <p className="text-xl lg:text-3xl font-bold text-orange-600">{stats.pendingInquiries}</p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-question-line text-lg lg:text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">총 주문 수</p>
              <p className="text-xl lg:text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-line text-lg lg:text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm">
        <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 lg:mb-4">최근 활동</h3>
        <div className="space-y-3 lg:space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.type === 'inquiry' ? 'bg-orange-500' :
                notification.type === 'menu' ? 'bg-blue-500' :
                'bg-green-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-xs lg:text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
