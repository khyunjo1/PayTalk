import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '../../../lib/authApi';
import { getStores } from '../../../lib/storeApi';

interface PendingUser {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'super_admin';
  created_at: string;
}

interface UserManagementProps {
  showToast: (message: string) => void;
}

export default function UserManagement({ showToast }: UserManagementProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, storesData] = await Promise.all([
        getPendingUsers(),
        getStores()
      ]);
      setPendingUsers(usersData);
      setStores(storesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showToast('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    const user = pendingUsers.find(u => u.id === userId);
    if (user?.status === 'approved') {
      showToast('이미 승인된 사용자입니다.');
      return;
    }

    const storeId = selectedStore[userId];
    if (!storeId) {
      showToast('매장을 선택해주세요.');
      return;
    }

    try {
      await approveUser(userId, storeId);
      showToast(`${userName}님을 사장님으로 승인했습니다.`);
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('승인 실패:', error);
      showToast('승인에 실패했습니다.');
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (!confirm(`${userName}님의 가입을 거부하시겠습니까?`)) {
      return;
    }

    try {
      await rejectUser(userId);
      showToast(`${userName}님의 가입을 거부했습니다.`);
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('거부 실패:', error);
      showToast('거부에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            <h2 className="text-xl font-bold text-gray-800">사장님 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              가입 신청한 사장님들을 승인하거나 거부할 수 있습니다.
            </p>
          </div>
          <div className="flex space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">
                {pendingUsers.filter(u => u.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">승인 대기</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                {pendingUsers.filter(u => u.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">승인 완료</div>
            </div>
          </div>
        </div>
      </div>

      {/* 승인 대기 목록 */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-user-check-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">승인 대기 중인 사장님이 없습니다</h3>
          <p className="text-gray-500">새로운 가입 신청이 있으면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-orange-500 text-xl"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : user.status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'approved' ? '승인됨' : user.status === 'pending' ? '대기중' : '거부됨'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                      <p className="text-xs text-gray-500">
                        신청일: {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* 매장 선택 */}
                  <div className="min-w-[200px]">
                    <select
                      value={selectedStore[user.id] || ''}
                      onChange={(e) => setSelectedStore({
                        ...selectedStore,
                        [user.id]: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">매장을 선택하세요</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div className="flex space-x-2">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(user.id, user.name)}
                          disabled={!selectedStore[user.id]}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <i className="ri-check-line"></i>
                          <span>승인</span>
                        </button>
                        
                        <button
                          onClick={() => handleReject(user.id, user.name)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <i className="ri-close-line"></i>
                          <span>거부</span>
                        </button>
                      </>
                    )}
                    {user.status === 'approved' && (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center space-x-2">
                        <i className="ri-check-double-line"></i>
                        <span>승인 완료</span>
                      </span>
                    )}
                    {user.status === 'rejected' && (
                      <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-center space-x-2">
                        <i className="ri-close-circle-line"></i>
                        <span>거부됨</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
