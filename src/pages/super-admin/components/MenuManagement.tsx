import { useState, useEffect } from 'react';
import { getStores } from '../../../lib/storeApi';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../../lib/menuApi';
import type { MenuItem, Store } from '../../../types';

interface MenuManagementProps {
  showToast: (message: string) => void;
}

export default function MenuManagement({ showToast }: MenuManagementProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  // 실제 매장 데이터 로드 (캐싱 추가)
  useEffect(() => {
    const loadStores = async () => {
      // 이미 데이터가 있으면 다시 로드하지 않음
      if (stores.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const storesData = await getStores();
        
        const formattedStores: Store[] = storesData.map(store => ({
          id: store.id,
          name: store.name,
          category: store.category || '한식반찬',
          owner: store.owner_name || '미지정',
          phone: store.phone || '',
          status: store.is_active ? 'active' : 'inactive',
          deliveryFee: store.delivery_fee || 0,
          deliveryArea: store.delivery_area || '',
          businessHoursStart: store.business_hours_start || '09:00',
          businessHoursEnd: store.business_hours_end || '22:00',
          pickupTimeSlots: store.pickup_time_slots || [],
          deliveryTimeSlots: store.delivery_time_slots || [],
          bankAccount: store.bank_account || '',
          accountHolder: store.account_holder || ''
        }));
        
        setStores(formattedStores);
        if (formattedStores.length > 0) {
          setSelectedStore(formattedStores[0].id);
        }
        console.log('✅ 매장 데이터 로드됨:', formattedStores.length, '개');
      } catch (error) {
        console.error('❌ 매장 데이터 로드 실패:', error);
        showToast('매장 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [showToast]); // stores.length 제거하여 무한루프 방지

  // 선택된 매장의 메뉴 로드
  useEffect(() => {
    if (selectedStore) {
      loadMenus(selectedStore);
    }
  }, [selectedStore]);

  const loadMenus = async (storeId: string) => {
    try {
      setLoading(true);
      const menusData = await getMenus(storeId);
      
      const formattedMenus: MenuItem[] = menusData.map(menu => ({
        id: menu.id,
        name: menu.name,
        price: menu.price,
        category: menu.category || '인기메뉴',
        description: menu.description || '',
        isAvailable: menu.is_available !== false,
        storeId: menu.store_id,
      }));
      
      setMenus(formattedMenus);
      console.log('✅ 메뉴 데이터 로드됨:', formattedMenus.length, '개');
    } catch (error) {
      console.error('❌ 메뉴 데이터 로드 실패:', error);
      showToast('메뉴 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const [newMenu, setNewMenu] = useState({
    name: '',
    price: 0,
    category: '인기메뉴',
    description: '',
    isAvailable: true
  });

  const handleAddMenu = async () => {
    // 폼 검증
    if (!newMenu.name.trim()) {
      showToast('메뉴명을 입력해주세요');
      return;
    }
    if (newMenu.name.trim().length < 2) {
      showToast('메뉴명은 2글자 이상 입력해주세요');
      return;
    }
    if (newMenu.price <= 0) {
      showToast('가격을 입력해주세요');
      return;
    }
    if (newMenu.price > 100000) {
      showToast('가격은 100,000원 이하로 입력해주세요');
      return;
    }
    if (!selectedStore) {
      showToast('매장을 선택해주세요');
      return;
    }

    try {
      const menuData = {
        name: newMenu.name,
        price: newMenu.price,
        category: newMenu.category,
        description: newMenu.description,
        is_available: newMenu.isAvailable,
        store_id: selectedStore
      };

      console.log('🚀 메뉴 추가 시작:', menuData);
      const createdMenu = await createMenu(menuData);
      console.log('✅ 메뉴 추가 성공:', createdMenu);
      
      // 새 메뉴를 목록에 추가
      const formattedMenu: MenuItem = {
        id: createdMenu.id,
        name: createdMenu.name,
        price: createdMenu.price,
        category: createdMenu.category || '인기메뉴',
        description: createdMenu.description || '',
        isAvailable: createdMenu.is_available !== false,
        storeId: createdMenu.store_id,
      };

      setMenus([...menus, formattedMenu]);
      setShowAddModal(false);
      setNewMenu({
      name: '',
      price: 0,
        category: '인기메뉴',
        description: '',
        isAvailable: true,
      });
      showToast('새 메뉴가 추가되었습니다');
    } catch (error) {
      console.error('❌ 메뉴 추가 실패:', error);
      showToast('메뉴 추가에 실패했습니다');
    }
  };

  const handleEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    setShowEditModal(true);
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu) return;

    // 폼 검증
    if (!editingMenu.name.trim()) {
      showToast('메뉴명을 입력해주세요');
      return;
    }
    if (editingMenu.name.trim().length < 2) {
      showToast('메뉴명은 2글자 이상 입력해주세요');
      return;
    }
    if (editingMenu.price <= 0) {
      showToast('가격을 입력해주세요');
      return;
    }
    if (editingMenu.price > 100000) {
      showToast('가격은 100,000원 이하로 입력해주세요');
      return;
    }

    try {
      const updateData = {
        name: editingMenu.name,
        price: editingMenu.price,
        category: editingMenu.category,
        description: editingMenu.description,
        is_available: editingMenu.isAvailable,
      };

      await updateMenu(editingMenu.id, updateData);
      
    setMenus(menus.map(menu => 
        menu.id === editingMenu.id ? editingMenu : menu
      ));
      
      setShowEditModal(false);
      setEditingMenu(null);
      showToast('메뉴 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('❌ 메뉴 업데이트 실패:', error);
      showToast('메뉴 업데이트에 실패했습니다');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('정말로 이 메뉴를 삭제하시겠습니까?')) return;

    try {
      await deleteMenu(menuId);
      setMenus(menus.filter(menu => menu.id !== menuId));
      showToast('메뉴가 삭제되었습니다');
    } catch (error) {
      console.error('❌ 메뉴 삭제 실패:', error);
      showToast('메뉴 삭제에 실패했습니다');
    }
  };

  const toggleMenuAvailability = async (menuId: string) => {
    try {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return;

      // 데이터베이스에 상태 변경 저장
      await updateMenu(menuId, {
        is_available: !menu.isAvailable
      });

      // 로컬 상태 업데이트
      setMenus(menus.map(menu => 
        menu.id === menuId 
          ? { ...menu, isAvailable: !menu.isAvailable }
          : menu
      ));
      
      showToast('메뉴 상태가 변경되었습니다');
    } catch (error) {
      console.error('메뉴 상태 변경 실패:', error);
      showToast('메뉴 상태 변경에 실패했습니다');
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
          disabled={!selectedStore}
          className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 새 메뉴 추가
        </button>
      </div>

      {/* 매장 선택 */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">매장 선택:</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <div className="text-sm text-gray-600">
          {menus.length}개 메뉴
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{menu.name}</h3>
                <p className="text-sm text-gray-600">{menu.category}</p>
                <p className="text-lg font-bold text-orange-600 mt-1">
                      {menu.price.toLocaleString()}원
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        menu.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {menu.isAvailable ? '판매중' : '품절'}
                      </span>
            </div>

            {menu.description && (
              <p className="text-sm text-gray-600 mb-4">{menu.description}</p>
            )}

            <div className="flex space-x-2">
                        <button
                onClick={() => handleEditMenu(menu)}
                className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-3 py-2 rounded-lg text-sm border border-gray-300 hover:border-orange-500 transition-colors"
                        >
                수정
                        </button>
                        <button
                onClick={() => toggleMenuAvailability(menu.id)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  menu.isAvailable
                    ? 'bg-red-50 hover:bg-red-500 text-red-700 hover:text-white border-red-300 hover:border-red-500'
                    : 'bg-green-50 hover:bg-green-500 text-green-700 hover:text-white border-green-300 hover:border-green-500'
                }`}
              >
                {menu.isAvailable ? '품절' : '판매'}
                        </button>
                        <button
                onClick={() => handleDeleteMenu(menu.id)}
                className="bg-red-50 hover:bg-red-500 text-red-700 hover:text-white px-3 py-2 rounded-lg text-sm border border-red-300 hover:border-red-500 transition-colors"
                        >
                삭제
                        </button>
                      </div>
        </div>
        ))}
      </div>

      {menus.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">등록된 메뉴가 없습니다</p>
          <p className="text-sm text-gray-400 mt-2">새 메뉴를 추가해보세요</p>
        </div>
      )}

      {/* 새 메뉴 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 메뉴 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명</label>
                <input
                  type="text"
                  value={newMenu.name}
                  onChange={(e) => setNewMenu({...newMenu, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="메뉴명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                <input
                  type="number"
                  value={newMenu.price}
                  onChange={(e) => setNewMenu({...newMenu, price: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="가격을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={newMenu.category}
                  onChange={(e) => setNewMenu({...newMenu, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="인기메뉴">인기메뉴</option>
                  <option value="계절메뉴">계절메뉴</option>
                  <option value="고기 반찬">고기 반찬</option>
                  <option value="튀김/전류">튀김/전류</option>
                  <option value="국">국</option>
                  <option value="분식">분식</option>
                  <option value="밑반찬">밑반찬</option>
                  <option value="아이들 반찬">아이들 반찬</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={newMenu.description}
                  onChange={(e) => setNewMenu({...newMenu, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="메뉴 설명을 입력하세요"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={newMenu.isAvailable}
                  onChange={(e) => setNewMenu({...newMenu, isAvailable: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">판매 가능</label>
              </div>
              
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddMenu}
                className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 수정 모달 */}
      {showEditModal && editingMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">메뉴 정보 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명</label>
                <input
                  type="text"
                  value={editingMenu.name}
                  onChange={(e) => setEditingMenu({...editingMenu, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                <input
                  type="number"
                  value={editingMenu.price}
                  onChange={(e) => setEditingMenu({...editingMenu, price: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={editingMenu.category}
                  onChange={(e) => setEditingMenu({...editingMenu, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="인기메뉴">인기메뉴</option>
                  <option value="계절메뉴">계절메뉴</option>
                  <option value="고기 반찬">고기 반찬</option>
                  <option value="튀김/전류">튀김/전류</option>
                  <option value="국">국</option>
                  <option value="분식">분식</option>
                  <option value="밑반찬">밑반찬</option>
                  <option value="아이들 반찬">아이들 반찬</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={editingMenu.description}
                  onChange={(e) => setEditingMenu({...editingMenu, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsAvailable"
                  checked={editingMenu.isAvailable}
                  onChange={(e) => setEditingMenu({...editingMenu, isAvailable: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="editIsAvailable" className="text-sm text-gray-700">판매 가능</label>
              </div>
              
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateMenu}
                className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}