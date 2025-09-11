import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStore, getMenus } from '../../lib/database';
import { useNewAuth } from '../../hooks/useNewAuth';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PWAInstallButton from '../../components/PWAInstallButton';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  category: string;
  isAvailable: boolean;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function Menu() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { user, loading: authLoading } = useNewAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [store, setStore] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 실제 메뉴 데이터에서 카테고리를 추출하여 존재하는 카테고리만 표시
  const existingCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  
  // 실제 존재하는 카테고리만 표시 (하드코딩된 카테고리 제거)
  const categories = existingCategories;

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) {
        navigate('/');
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
          isAvailable: menu.is_available // snake_case → camelCase
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
  };

  const removeFromCart = (menuItemId: string) => {
    const itemToRemove = cart.find(item => item.id === menuItemId);
    if (itemToRemove) {
      setCart(cart.filter(item => item.id !== menuItemId));
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    const itemToUpdate = cart.find(item => item.id === menuItemId);
    if (itemToUpdate) {
      setCart(cart.map(item => 
        item.id === menuItemId 
          ? { ...item, quantity }
          : item
      ));
      
    }
  };

  const handleCartClick = () => {
    // 최소주문금액 체크
    const minimumAmount = store?.minimum_order_amount || 0;
    if (totalAmount < minimumAmount) {
      // 최소주문금액 미달 시 토스트 메시지 표시
      const remainingAmount = minimumAmount - totalAmount;
      setToastMessage(`${remainingAmount.toLocaleString()}원 더 담아주세요. (최소주문금액: ${minimumAmount.toLocaleString()}원)`);
      setShowToast(true);
      
      // 3초 후 토스트 숨기기
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return;
    }
    
    // 최소주문금액 충족 시 cart 페이지로 이동
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('storeInfo', JSON.stringify(store));
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      {/* 매장 정보 - menu 페이지 전용 */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="px-4 py-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10"></div>
            <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">{store.name}</h1>
            <div className="w-10">
              {/* 사장님만 매장관리 버튼 표시 */}
              {!authLoading && user && user.role === 'admin' && (
                <button
                  onClick={() => navigate(`/admin/${storeId}`)}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-settings-line"></i>
                  매장관리
                </button>
              )}
            </div>
          </div>
          
          {/* 매장 정보 */}
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <i className="ri-map-pin-line text-orange-500"></i>
              <span className="font-medium">{store.delivery_area}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <i className="ri-money-dollar-circle-line text-orange-500"></i>
              <span className="font-medium">최소주문 {store.minimum_order_amount?.toLocaleString() || '0'}원</span>
            </div>
          </div>
          
          {/* 오늘의 반찬 날짜 표시 - 작은 배지 형태 */}
          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
              <i className="ri-calendar-check-line text-orange-500 text-sm"></i>
              <span className="text-xs font-medium text-orange-700">
                {new Date().toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })} 오늘의 반찬
              </span>
            </div>
          </div>
          
          {/* PWA 설치 버튼 */}
          <div className="flex justify-center mt-4">
            <PWAInstallButton 
              redirectType="menu" 
              storeId={storeId} 
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* 카테고리 탭 - 실제 존재하는 카테고리만 표시 */}
      {categories.length > 0 && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex space-x-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <i className={`ri-restaurant-line mr-1.5 ${selectedCategory === category ? 'text-white' : 'text-gray-600'}`}></i>
                {category}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 목록 */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-restaurant-line text-3xl text-orange-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">메뉴가 없습니다</h3>
              <p className="text-gray-500">이 카테고리에 등록된 메뉴가 없습니다.</p>
            </div>
          ) : (
            filteredMenu.map((item, index) => (
              <div key={item.id} className={`px-4 py-4 hover:bg-gray-50 transition-colors duration-200 ${index !== filteredMenu.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-black text-base truncate">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-black font-semibold text-base">
                        {item.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                        item.isAvailable 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        <i className={`ri-${item.isAvailable ? 'check' : 'close'}-line text-xs`}></i>
                        {item.isAvailable ? '주문가능' : '품절'}
                      </span>
                    </div>
                    {/* 장바구니 수량 조절 UI */}
                    {(() => {
                      const cartItem = cart.find(cartItem => cartItem.id === item.id);
                      
                      if (!cartItem) {
                        // 장바구니에 없는 경우 - 담기 버튼
                        return (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                              item.isAvailable
                                ? 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <i className={`ri-${item.isAvailable ? 'add' : 'close'}-line text-sm`}></i>
                          </button>
                        );
                      } else {
                        // 장바구니에 있는 경우 - 수량 조절 UI
                        return (
                          <div className="flex items-center gap-2">
                            {/* 수량 조절 버튼들 */}
                            <div className="flex items-center bg-white border border-gray-300 rounded-full">
                              <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-100 rounded-l-full transition-all duration-200"
                              >
                                <i className="ri-subtract-line text-sm"></i>
                              </button>
                              <span className="px-3 py-1 text-black font-bold text-sm min-w-[2rem] text-center">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-100 rounded-r-full transition-all duration-200"
                              >
                                <i className="ri-add-line text-sm"></i>
                              </button>
                            </div>
                            
                            {/* 삭제 버튼 (1개일 때만 표시) */}
                            {cartItem.quantity === 1 && (
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                                title="메뉴 삭제"
                              >
                                <i className="ri-delete-bin-line text-sm"></i>
                              </button>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 메뉴와 푸터 사이 구분선 */}
      <div className="h-px bg-gray-100"></div>

      {/* 장바구니 버튼 - 맥도날드 스타일 */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between p-4">
            {/* 왼쪽: 가격 정보 */}
            <div className="flex-1">
              <div className="text-lg font-bold text-black">
                {totalAmount.toLocaleString()}원
              </div>
              {totalAmount < (store?.minimum_order_amount || 0) && (
                <div className="text-xs text-gray-600">
                  {(store?.minimum_order_amount || 0) - totalAmount}원 더 담으면 주문 가능
                </div>
              )}
            </div>
            
            {/* 오른쪽: 장바구니 버튼 */}
            <button
              onClick={handleCartClick}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <i className="ri-shopping-cart-line text-sm"></i>
              <span className="text-sm">{totalQuantity} 장바구니 보기</span>
            </button>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <i className="ri-error-warning-line text-sm"></i>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}