import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getUserOwnedStores, getMenus, createMenu, updateMenu, deleteMenu } from '../../../lib/database';

interface Menu {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
  category: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start: string;
  business_hours_end: string;
  pickup_time_slots: string[];
  delivery_time_slots: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bank_account: string;
  account_holder: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ['인기메뉴', '계절메뉴', '고기 반찬', '튀김/전류', '국', '분식', '밑반찬', '아이들 반찬'];

export default function OwnerMenu() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // 메뉴 폼 상태
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: 0,
    category: '인기메뉴',
    description: '',
    is_available: true
  });

  useEffect(() => {
    const loadOwnerData = async () => {
      if (!user || !userProfile) return;

      // 사장님 권한 확인
      if (userProfile.role !== 'owner' && userProfile.role !== 'super_admin') {
        navigate('/stores');
        return;
      }

      try {
        setLoading(true);
        const ownedStores = await getUserOwnedStores(user.id);
        setStores(ownedStores);

        if (ownedStores.length > 0) {
          setSelectedStoreId(ownedStores[0].id);
        }
      } catch (error) {
        console.error('사장님 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadOwnerData();
    }
  }, [user, userProfile, navigate, authLoading]);

  useEffect(() => {
    const loadMenus = async () => {
      if (!selectedStoreId) return;

      try {
        setLoading(true);
        const storeMenus = await getMenus(selectedStoreId);
        setMenus(storeMenus);
      } catch (error) {
        console.error('메뉴 목록 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [selectedStoreId]);

  const handleAddMenu = async () => {
    if (!selectedStoreId || !menuForm.name || menuForm.price <= 0) {
      alert('메뉴명과 가격을 입력해주세요.');
      return;
    }

    try {
      const newMenu = await createMenu({
        store_id: selectedStoreId,
        name: menuForm.name,
        price: menuForm.price,
        category: menuForm.category,
        description: menuForm.description || null,
        is_available: menuForm.is_available
      });

      if (newMenu) {
        setMenus([...menus, newMenu]);
        setShowAddMenu(false);
        resetForm();
      }
    } catch (error) {
      console.error('메뉴 생성 오류:', error);
      alert('메뉴 생성에 실패했습니다.');
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu || !menuForm.name || menuForm.price <= 0) {
      alert('메뉴명과 가격을 입력해주세요.');
      return;
    }

    try {
      const updatedMenu = await updateMenu(editingMenu.id, {
        name: menuForm.name,
        price: menuForm.price,
        category: menuForm.category,
        description: menuForm.description || null,
        is_available: menuForm.is_available
      });

      if (updatedMenu) {
        setMenus(menus.map(menu => 
          menu.id === editingMenu.id ? updatedMenu : menu
        ));
        setEditingMenu(null);
        resetForm();
      }
    } catch (error) {
      console.error('메뉴 수정 오류:', error);
      alert('메뉴 수정에 실패했습니다.');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('정말로 이 메뉴를 삭제하시겠습니까?')) return;

    try {
      await deleteMenu(menuId);
      setMenus(menus.filter(menu => menu.id !== menuId));
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setMenuForm({
      name: '',
      price: 0,
      category: '인기메뉴',
      description: '',
      image_url: '',
      is_available: true
    });
  };

  const openEditForm = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name,
      price: menu.price,
      category: menu.category,
      description: menu.description || '',
      is_available: menu.is_available
    });
  };

  const filteredMenus = menus.filter(menu => 
    categoryFilter === 'all' || menu.category === categoryFilter
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-store-3-line text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">소유한 매장이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자에게 매장 등록을 요청해주세요.</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-6 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
          >
            매장 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/stores')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-center flex-1">메뉴 관리</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 매장 선택 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-3">매장 선택</h2>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* 카테고리 필터 및 메뉴 추가 버튼 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">메뉴 관리</h2>
            <button
              onClick={() => setShowAddMenu(true)}
              className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
            >
              <i className="ri-add-line mr-1"></i>
              메뉴 추가
            </button>
          </div>
          
          <div className="flex space-x-2">
            {['all', ...CATEGORIES].map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? '전체' : category}
              </button>
            ))}
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="space-y-4">
          {filteredMenus.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <i className="ri-restaurant-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">메뉴가 없습니다.</p>
            </div>
          ) : (
            filteredMenus.map(menu => (
              <div key={menu.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <i className="ri-restaurant-line text-2xl text-gray-400"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{menu.name}</h3>
                      <span className="text-orange-500 font-semibold ml-2">
                        {(menu.price || 0).toLocaleString()}원
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{menu.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {menu.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          menu.is_available 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {menu.is_available ? '판매중' : '품절'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditForm(menu)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(menu.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 메뉴 추가/수정 모달 */}
      {(showAddMenu || editingMenu) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingMenu ? '메뉴 수정' : '메뉴 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="메뉴명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                <input
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({...menuForm, price: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="가격을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="메뉴 설명을 입력하세요"
                />
              </div>

              <div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={menuForm.is_available}
                  onChange={(e) => setMenuForm({...menuForm, is_available: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                  판매 가능
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  setEditingMenu(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={editingMenu ? handleUpdateMenu : handleAddMenu}
                className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
              >
                {editingMenu ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
