
import { useState } from 'react';

interface User {
  id: string;
  name: string;
  role: 'customer' | 'owner' | 'admin';
  storeName?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UserManagementProps {
  showToast: (message: string) => void;
}

export default function UserManagement({ showToast }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: '김사장',
      role: 'owner',
      storeName: '이천반찬',
      phone: '031-123-4567',
      email: 'kim@example.com',
      status: 'active'
    },
    {
      id: '2',
      name: '박사장',
      role: 'owner',
      storeName: '맛있는 반찬집',
      phone: '02-987-6543',
      email: 'park@example.com',
      status: 'active'
    },
    {
      id: '3',
      name: '이고객',
      role: 'customer',
      phone: '010-1234-5678',
      email: 'customer@example.com',
      status: 'active'
    },
    {
      id: '4',
      name: '최관리',
      role: 'admin',
      phone: '010-9999-8888',
      email: 'admin@example.com',
      status: 'active'
    }
  ]);

  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStore, setSelectedStore] = useState('');

  const stores = [
    { id: '1', name: '이천반찬' },
    { id: '2', name: '맛있는 반찬집' },
    { id: '3', name: '할머니반찬' }
  ];

  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(user => user.role === selectedRole);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer': return '고객';
      case 'owner': return '사장님';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-800';
      case 'owner': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePromoteToOwner = (user: User) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const confirmPromotion = () => {
    if (!selectedUser || !selectedStore) {
      alert('담당할 매장을 선택해주세요.');
      return;
    }

    const storeName = stores.find(store => store.id === selectedStore)?.name || '';
    
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, role: 'owner', storeName }
        : user
    ));

    showToast(`${selectedUser.name}님이 ${storeName} 사장님으로 권한이 부여되었습니다`);
    setShowPromoteModal(false);
    setSelectedUser(null);
    setSelectedStore('');
  };

  const revokeOwnerRole = (userId: string) => {
    if (confirm('정말로 사장님 권한을 회수하시겠습니까?')) {
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: 'customer', storeName: undefined }
          : user
      ));
      showToast('사장님 권한이 회수되었습니다');
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
