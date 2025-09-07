import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStore, getMenus } from '../../lib/database';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isAvailable: boolean;
  image: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function Menu() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showToast, setShowToast] = useState('');
  const [store, setStore] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 실제 메뉴 데이터에서 카테고리를 추출하여 존재하는 카테고리만 표시
  const existingCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  
  // 실제 존재하는 카테고리만 표시 (하드코딩된 카테고리 제거)
  const categories = existingCategories;

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) {
        navigate('/stores');
        return;
      }

      try {
        setLoading(true);
        const [storeData, menuData] = await Promise.all([
          getStore(storeId),
          getMenus(storeId)
        ]);

        if (!storeData) {
          navigate('/stores');
          return;
        }

        setStore(storeData);
        
        // 데이터베이스 필드명을 프론트엔드 필드명으로 매핑
        const mappedMenuData = menuData.map(menu => ({
          ...menu,
          isAvailable: menu.is_available, // snake_case → camelCase
          image: menu.image_url || '/placeholder-food.jpg'
        }));
        
        setMenu(mappedMenuData);
        
        // 디버깅 로그 추가
        console.log('🏪 매장 정보:', storeData);
        console.log('🍽️ 원본 메뉴 데이터:', menuData);
        console.log('🍽️ 매핑된 메뉴 데이터:', mappedMenuData);
        console.log('📊 메뉴 개수:', menuData?.length || 0);
        
        // 각 메뉴의 상세 정보 출력
        if (mappedMenuData && mappedMenuData.length > 0) {
          mappedMenuData.forEach((menu, index) => {
            console.log(`🍽️ 메뉴 ${index + 1}:`, {
              id: menu.id,
              name: menu.name,
              category: menu.category,
              price: menu.price,
              isAvailable: menu.isAvailable,
              is_available: menu.is_available
            });
          });
        }
        
        if (mappedMenuData && mappedMenuData.length > 0) {
          const categories = Array.from(new Set(mappedMenuData.map(item => item.category))).filter(Boolean);
          console.log('📂 실제 카테고리들:', categories);
          
          // 각 카테고리별 메뉴 개수 확인
          categories.forEach(category => {
            const categoryMenus = mappedMenuData.filter(item => item.category === category);
            console.log(`📁 ${category}: ${categoryMenus.length}개 메뉴`, categoryMenus.map(m => m.name));
          });
        }
        
        // 첫 번째 카테고리를 기본 선택으로 설정 (메뉴가 있으면 해당 카테고리, 없으면 첫 번째 카테고리)
        if (mappedMenuData && mappedMenuData.length > 0) {
          const firstCategory = Array.from(new Set(mappedMenuData.map(item => item.category))).filter(Boolean)[0];
          if (firstCategory) {
            setSelectedCategory(firstCategory);
            console.log('🎯 기본 선택 카테고리:', firstCategory);
          }
        } else {
          // 메뉴가 없으면 빈 문자열로 설정
          setSelectedCategory('');
          console.log('🎯 메뉴 없음, 카테고리 선택 안함');
        }
      } catch (error) {
        console.error('매장 데이터 로드 오류:', error);
        navigate('/stores');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!store) return null;

  // 카테고리가 없으면 모든 메뉴를 표시
  const filteredMenu = selectedCategory 
    ? menu.filter(item => item.category === selectedCategory)
    : menu;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.isAvailable) return;

    const existingItem = cart.find(item => item.id === menuItem.id);

    if (existingItem) {
      setCart(cart.map(item => 
        item.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...menuItem, quantity: 1 }]);
    }

    setShowToast(`${menuItem.name}이(가) 장바구니에 추가되었습니다.`);
    setTimeout(() => setShowToast(''), 2000);
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setCart(cart.map(item => 
      item.id === menuItemId 
        ? { ...item, quantity }
        : item
    ));
  };

  const handleCartClick = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('storeInfo', JSON.stringify(store));
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/stores')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-center flex-1">{store.name}</h1>
            <div className="w-10"></div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">{store.category}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <i className="ri-map-pin-line"></i>
                <span>{store.delivery_area}</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-truck-line"></i>
                <span>배달비 {store.delivery_fee.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 - 실제 존재하는 카테고리만 표시 */}
      {categories.length > 0 && (
        <div className="bg-white px-4 py-3 border-b">
          <div className="flex space-x-1 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 목록 */}
      <div className="px-4 py-4 space-y-4">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-restaurant-line text-4xl text-gray-300 mb-2"></i>
            <p className="text-gray-500">이 카테고리에 메뉴가 없습니다.</p>
          </div>
        ) : (
          filteredMenu.map(item => (
            <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image || '/placeholder-food.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-food.jpg';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                    <span className="text-orange-500 font-semibold ml-2">
                      {item.price.toLocaleString()}원
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.isAvailable 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {item.isAvailable ? '주문가능' : '품절'}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        item.isAvailable
                          ? 'bg-white hover:bg-orange-500 text-gray-700 hover:text-white border border-gray-300 hover:border-orange-500'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {item.isAvailable ? '담기' : '품절'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 장바구니 버튼 */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handleCartClick}
            className="w-full bg-white hover:bg-orange-500 text-gray-700 hover:text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 border border-gray-300 hover:border-orange-500 transition-colors"
          >
            <i className="ri-shopping-cart-line"></i>
            장바구니 ({totalQuantity}) - {totalAmount.toLocaleString()}원
          </button>
        </div>
      )}

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}