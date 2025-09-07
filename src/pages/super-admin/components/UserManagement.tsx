
import { useState, useEffect } from 'react';
import { getAllUsers, addUserToStore, updateUserRole } from '../../../lib/userApi';
import { getStores } from '../../../lib/storeApi';

interface User {
  id: string;
  name: string;
  role: 'customer' | 'owner' | 'admin' | 'super_admin';
  storeName?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UserManagementProps {
  showToast: (message: string) => void;
}

export default function UserManagement({ showToast }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStore, setSelectedStore] = useState('');

  // 실제 사용자 및 매장 데이터 로드 (캐싱 추가)
  useEffect(() => {
    const loadData = async () => {
      // 이미 데이터가 있으면 다시 로드하지 않음
      if (users.length > 0 && stores.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 사용자와 매장 데이터를 동시에 로드
        const [usersData, storesData] = await Promise.all([
          getAllUsers(),
          getStores()
        ]);
        
        // 사용자 데이터 변환
        const formattedUsers: User[] = usersData.map(user => ({
          id: user.id,
          name: user.name,
          role: user.role as 'customer' | 'owner' | 'admin' | 'super_admin',
          phone: user.phone || '',
          email: user.email,
          status: 'active' as const
        }));
        
        // 매장 데이터 변환
        const formattedStores = storesData.map(store => ({
          id: store.id,
          name: store.name
        }));
        
        setUsers(formattedUsers);
        setStores(formattedStores);
        console.log('✅ 사용자 및 매장 데이터 로드됨:', {
          users: formattedUsers.length,
          stores: formattedStores.length,
          storeNames: formattedStores.map(s => s.name)
        });
      } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        showToast('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast, users.length, stores.length]);


  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(user => user.role === selectedRole);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer': return '고객';
      case 'owner': return '사장님';
      case 'admin': return '관리자';
      case 'super_admin': return '슈퍼 어드민';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'owner': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'super_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignStore = async (userId: string, storeId: string) => {
    try {
      await addUserToStore(userId, storeId);
      showToast('매장이 성공적으로 할당되었습니다.');
      setShowPromoteModal(false);
      setSelectedUser(null);
      setSelectedStore('');
    } catch (error) {
      console.error('매장 할당 오류:', error);
      showToast('매장 할당에 실패했습니다.');
    }
  };

  const handlePromoteToOwner = (user: User) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const confirmPromotion = async () => {
    if (!selectedUser || !selectedStore) {
      alert('담당할 매장을 선택해주세요.');
      return;
    }

    try {
      console.log('🚀 권한 부여 시작:', {
        userId: selectedUser.id,
        userName: selectedUser.name,
        storeId: selectedStore,
        storeName: stores.find(store => store.id === selectedStore)?.name
      });
      
      // 1. 사용자 역할을 admin으로 변경
      console.log('📝 사용자 역할을 admin으로 변경 중...');
      await updateUserRole(selectedUser.id, 'admin');
      console.log('✅ 사용자 역할 변경 완료');
      
      // 2. 매장 할당
      console.log('🏪 매장 할당 중...');
      await handleAssignStore(selectedUser.id, selectedStore);
      console.log('✅ 매장 할당 완료');
      
      // 3. 로컬 상태 업데이트
      const storeName = stores.find(store => store.id === selectedStore)?.name || '';
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: 'admin', storeName }
          : user
      ));

      showToast(`${selectedUser.name}님이 ${storeName} 사장님으로 권한이 부여되었습니다`);
      setShowPromoteModal(false);
      setSelectedUser(null);
      setSelectedStore('');
    } catch (error) {
      console.error('권한 부여 실패:', error);
      showToast('권한 부여에 실패했습니다.');
    }
  };

  const revokeOwnerRole = async (userId: string) => {
    if (confirm('정말로 사장님 권한을 회수하시겠습니까?')) {
      try {
        // 1. 사용자 역할을 customer로 변경
        await updateUserRole(userId, 'customer');
        
        // 2. 로컬 상태 업데이트
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: 'customer', storeName: undefined }
            : user
        ));
        showToast('사장님 권한이 회수되었습니다');
      } catch (error) {
        console.error('권한 회수 실패:', error);
        showToast('권한 회수에 실패했습니다.');
      }
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    showToast('사용자 상태가 변경되었습니다');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">유저 관리</h2>
          <p className="text-gray-600">플랫폼 사용자와 권한을 관리합니다</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedRole === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedRole('customer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedRole === 'customer'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            고객
          </button>
          <button
            onClick={() => setSelectedRole('owner')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedRole === 'owner'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            사장님
          </button>
          <button
            onClick={() => setSelectedRole('admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            관리자
          </button>
        </div>
      </div>

      {/* 사용자 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당 매장</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.storeName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {user.role === 'customer' && (
                        <button
                          onClick={() => handlePromoteToOwner(user)}
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="사장님 권한 부여"
                        >
                          <i className="ri-vip-crown-line"></i>
                        </button>
                      )}
                      {user.role === 'owner' && (
                        <button
                          onClick={() => revokeOwnerRole(user.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="사장님 권한 회수"
                        >
                          <i className="ri-vip-crown-fill"></i>
                        </button>
                      )}
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} cursor-pointer`}
                        title={user.status === 'active' ? '비활성화' : '활성화'}
                      >
                        <i className={`ri-${user.status === 'active' ? 'pause' : 'play'}-circle-line`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사장님 권한 부여 모달 */}
      {showPromoteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">사장님 권한 부여</h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedUser.name}</strong>님에게 사장님 권한을 부여하시겠습니까?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">담당 매장 선택</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
              >
                <option value="">매장을 선택하세요</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmPromotion}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                권한 부여
              </button>
              <button
                onClick={() => {
                  setShowPromoteModal(false);
                  setSelectedUser(null);
                  setSelectedStore('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
