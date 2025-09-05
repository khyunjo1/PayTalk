
import { useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isAvailable: boolean;
  storeId: string;
}

interface Store {
  id: string;
  name: string;
}

interface MenuManagementProps {
  showToast: (message: string) => void;
}

export default function MenuManagement({ showToast }: MenuManagementProps) {
  const [stores] = useState<Store[]>([
    { id: '1', name: '이천반찬' },
    { id: '2', name: '맛있는 반찬집' },
    { id: '3', name: '할머니반찬' }
  ]);

  const [selectedStore, setSelectedStore] = useState('1');
  const [menus, setMenus] = useState<MenuItem[]>([
    {
      id: 'm1',
      name: '김치찌개',
      price: 8000,
      category: '메인메뉴',
      description: '매콤하고 시원한 김치찌개',
      isAvailable: true,
      storeId: '1'
    },
    {
      id: 'm2',
      name: '된장찌개',
      price: 7000,
      category: '메인메뉴',
      description: '구수한 된장찌개',
      isAvailable: true,
      storeId: '1'
    },
    {
      id: 'm3',
      name: '제육볶음',
      price: 12000,
      category: '메인메뉴',
      description: '매콤달콤한 제육볶음',
      isAvailable: false,
      storeId: '1'
    },
    {
      id: 'm4',
      name: '부대찌개',
      price: 9000,
      category: '메인메뉴',
      description: '얼큰한 부대찌개',
      isAvailable: true,
      storeId: '2'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '메인메뉴',
    description: ''
  });

  const categories = ['메인메뉴', '국물요리', '사이드메뉴', '김치류'];
  const filteredMenus = menus.filter(menu => menu.storeId === selectedStore);

  const handleSubmit = () => {
    if (!formData.name || formData.price <= 0) {
      alert('메뉴명과 가격을 입력해주세요.');
      return;
    }

    if (editingMenu) {
      // 수정
      setMenus(menus.map(menu => 
        menu.id === editingMenu.id 
          ? { ...menu, ...formData }
          : menu
      ));
      showToast('메뉴가 수정되었습니다');
    } else {
      // 추가
      const newMenu: MenuItem = {
        id: Date.now().toString(),
        ...formData,
        isAvailable: true,
        storeId: selectedStore
      };
      setMenus([...menus, newMenu]);
      showToast('새 메뉴가 등록되었습니다');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      category: '메인메뉴',
      description: ''
    });
    setShowAddModal(false);
    setEditingMenu(null);
  };

  const handleEdit = (menu: MenuItem) => {
    setFormData({
      name: menu.name,
      price: menu.price,
      category: menu.category,
      description: menu.description
    });
    setEditingMenu(menu);
    setShowAddModal(true);
  };

  const toggleAvailability = (menuId: string) => {
    setMenus(menus.map(menu => 
      menu.id === menuId 
        ? { ...menu, isAvailable: !menu.isAvailable }
        : menu
    ));
    showToast('메뉴 상태가 변경되었습니다');
  };

  const deleteMenu = (menuId: string) => {
    if (confirm('정말로 삭제하시겠습니까?')) {
      setMenus(menus.filter(menu => menu.id !== menuId));
      showToast('메뉴가 삭제되었습니다');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">메뉴 관리</h2>
          <p className="text-gray-600">매장별 메뉴를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          새 메뉴 추가
        </button>
      </div>

      {/* 매장 선택 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">매장 선택</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full md:w-64 p-3 border border-gray-300 rounded-lg text-sm pr-8"
        >
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      {/* 메뉴 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메뉴명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    등록된 메뉴가 없습니다
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{menu.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {menu.price.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{menu.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{menu.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        menu.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {menu.isAvailable ? '판매중' : '품절'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(menu)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => toggleAvailability(menu.id)}
                          className={`${menu.isAvailable ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} cursor-pointer`}
                        >
                          <i className={`ri-${menu.isAvailable ? 'pause' : 'play'}-circle-line`}></i>
                        </button>
                        <button
                          onClick={() => deleteMenu(menu.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 메뉴 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMenu ? '메뉴 수정' : '새 메뉴 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="메뉴명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="가격을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                  placeholder="메뉴 설명을 입력하세요"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                {editingMenu ? '수정' : '등록'}
              </button>
              <button
                onClick={resetForm}
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
