import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../../lib/menuApi';
import Header from '../../../components/Header';

const STANDARD_CATEGORIES = [
  '메인요리',
  '국물류', 
  '김치류',
  '젓갈류',
  '나물류',
  '조림류',
  '특별반찬',
  '인기메뉴',
  '세트메뉴',
  '월식메뉴'
];

interface Menu {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminMenu() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('all');
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin-login');
      return;
    }

    if (!loading && user && user.role !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    if (storeId) {
      loadMenus();
    }
  }, [user, loading, navigate, storeId]);

  const loadMenus = async () => {
    if (!storeId) return;
    
    try {
      setMenusLoading(true);
      console.log('🔍 메뉴 로드 시작 - 매장 ID:', storeId);
      const menusData = await getMenus(storeId);
      console.log('✅ 메뉴 로드 성공:', menusData?.length || 0, '개 메뉴');
      if (menusData && menusData.length > 0) {
        console.log('📋 메뉴 목록:', menusData.map(m => `${m.name} (${m.category})`));
      }
      setMenus(menusData);
    } catch (error) {
      console.error('❌ 메뉴 로드 실패:', error);
    } finally {
      setMenusLoading(false);
    }
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const menuData = {
        ...menuForm,
        price: parseFloat(menuForm.price),
        store_id: storeId,
        is_available: true
      };

      if (editingMenu) {
        await updateMenu(editingMenu.id, menuData);
        setMenus(prevMenus => 
          prevMenus.map(menu => 
            menu.id === editingMenu.id 
              ? { ...menu, ...menuData }
              : menu
          )
        );
      } else {
        const newMenu = await createMenu(menuData);
        setMenus(prevMenus => [...prevMenus, newMenu]);
      }

      setShowMenuModal(false);
      setEditingMenu(null);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: ''
      });
    } catch (error) {
      console.error('메뉴 저장 실패:', error);
      alert('메뉴 저장에 실패했습니다.');
    }
  };


  const handleDeleteMenu = async (menuId: string) => {
    try {
      await deleteMenu(menuId);
      setMenus(prevMenus => prevMenus.filter(menu => menu.id !== menuId));
    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const filteredMenus = menus.filter(menu => 
    selectedMenuCategory === 'all' || menu.category === selectedMenuCategory
  );
  
  console.log('🔍 카테고리 필터링:', {
    selectedCategory: selectedMenuCategory,
    totalMenus: menus.length,
    filteredMenus: filteredMenus.length,
    categories: [...new Set(menus.map(m => m.category))]
  });


  if (loading || menusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </button>
              <h1 className="text-xl font-bold text-gray-800">메뉴관리</h1>
            </div>
            <button
              onClick={() => {
                setEditingMenu(null);
                setMenuForm({ name: '', description: '', price: '', category: '' });
                setShowMenuModal(true);
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              메뉴 추가
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* 카테고리 필터 */}
        {menus.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMenuCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedMenuCategory === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <i className={`ri-restaurant-line mr-1.5 ${selectedMenuCategory === 'all' ? 'text-white' : 'text-gray-600'}`}></i>
                전체
              </button>
              {STANDARD_CATEGORIES.map(category => {
                const count = menus.filter(menu => menu.category === category).length;
                if (count === 0) return null;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedMenuCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedMenuCategory === category
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`ri-restaurant-line mr-1.5 ${selectedMenuCategory === category ? 'text-white' : 'text-gray-600'}`}></i>
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 메뉴 목록 */}
        {menusLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">메뉴를 불러오는 중...</p>
          </div>
        ) : filteredMenus.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {filteredMenus.map((menu, index) => (
              <div key={menu.id} className={`px-4 py-4 hover:bg-gray-50 transition-colors duration-200 ${index !== filteredMenus.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-black text-base truncate">{menu.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-black font-semibold text-base">
                          {(menu.price || 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2 leading-relaxed">{menu.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          {menu.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMenu(menu);
                            setMenuForm({
                              name: menu.name,
                              description: menu.description || '',
                              price: menu.price.toString(),
                              category: menu.category
                            });
                            setShowMenuModal(true);
                          }}
                          className="w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center bg-white text-black border border-gray-300 hover:bg-gray-100"
                        >
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
                              handleDeleteMenu(menu.id);
                            }
                          }}
                          className="w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedMenuCategory === 'all' ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-restaurant-line text-3xl text-orange-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">메뉴가 없습니다</h3>
            <p className="text-gray-500">위의 "메뉴 추가" 버튼을 눌러<br />새로운 메뉴를 추가해보세요!</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-restaurant-line text-3xl text-orange-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">메뉴가 없습니다</h3>
            <p className="text-gray-500">이 카테고리에 등록된 메뉴가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 메뉴 추가/수정 모달 */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMenu ? '메뉴 수정' : '메뉴 추가'}
            </h3>
            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="메뉴명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="메뉴 설명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 *</label>
                <input
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="가격을 입력하세요"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">카테고리를 선택하세요</option>
                  {STANDARD_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  {editingMenu ? '수정하기' : '추가하기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setEditingMenu(null);
                    setMenuForm({
                      name: '',
                      description: '',
                      price: '',
                      category: ''
                    });
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
