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
  store_name?: string | null;
}

interface UserManagementProps {
  showToast: (message: string) => void;
}

export default function UserManagement({ showToast }: UserManagementProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

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

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await rejectUser(userToDelete.id);
      showToast(`${userToDelete.name}님을 삭제했습니다.`);
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('삭제 실패:', error);
      showToast('삭제에 실패했습니다.');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // 검색 필터링
  const filteredUsers = pendingUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    (user.store_name && user.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">사장님 관리</h2>
          <p className="text-sm text-gray-600 mt-1">
            가입 신청한 사장님들을 승인하거나 거부할 수 있습니다.
          </p>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-500 mb-1">
              {pendingUsers.filter(u => u.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">승인 대기</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">
              {pendingUsers.filter(u => u.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">승인 완료</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {pendingUsers.length}
            </div>
            <div className="text-sm text-gray-600">전체 사장님</div>
          </div>
        </div>
        
        {/* 검색 기능 */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="사장님 이름, 전화번호, 매장명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
              />
            </div>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* 사장님 목록 */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-user-check-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '사장님이 없습니다'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? '다른 검색어로 시도해보세요.' : '새로운 가입 신청이 있으면 여기에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5 hover:shadow-md transition-shadow duration-200">
              <div className="space-y-4">
                {/* 사용자 정보 */}
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-orange-500 text-xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">{user.name}</h3>
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
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center">
                        <i className="ri-phone-line mr-2 text-gray-400"></i>
                        {user.phone}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <i className="ri-calendar-line mr-2 text-gray-400"></i>
                        신청일: {formatDate(user.created_at)}
                      </p>
                      {user.status === 'approved' && user.store_name && (
                        <p className="text-xs text-green-600 font-medium flex items-center">
                          <i className="ri-store-line mr-2"></i>
                          {user.store_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 매장 선택 또는 표시 */}
                {user.status === 'pending' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">매장 선택</label>
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
                )}
                
                {user.status === 'approved' && user.store_name && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">할당된 매장</label>
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium">
                      <i className="ri-store-line mr-2"></i>
                      {user.store_name}
                    </div>
                  </div>
                )}
                
                {/* 액션 버튼들 */}
                <div className="flex space-x-2 pt-2">
                  {user.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(user.id, user.name)}
                        disabled={!selectedStore[user.id]}
                        className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <i className="ri-check-line"></i>
                        <span>승인</span>
                      </button>
                      
                      <button
                        onClick={() => handleReject(user.id, user.name)}
                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <i className="ri-close-line"></i>
                        <span>거부</span>
                      </button>
                    </>
                  )}
                  
                  {user.status === 'approved' && (
                    <>
                      <div className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center justify-center space-x-1">
                        <i className="ri-check-double-line"></i>
                        <span>승인 완료</span>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <i className="ri-delete-bin-line"></i>
                        <span>삭제</span>
                      </button>
                    </>
                  )}
                  
                  {user.status === 'rejected' && (
                    <>
                      <div className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-center justify-center space-x-1">
                        <i className="ri-close-circle-line"></i>
                        <span>거부됨</span>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <i className="ri-delete-bin-line"></i>
                        <span>삭제</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">사장님 삭제</h3>
              <p className="text-gray-600 mb-6">
                <span className="font-semibold text-red-600">{userToDelete.name}</span>님을 정말로 삭제하시겠습니까?
                <br />
                <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteUser}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
