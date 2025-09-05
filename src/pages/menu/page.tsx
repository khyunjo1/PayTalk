import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

const MENU_DATA: { [storeId: string]: { store: any; menu: MenuItem[] } } = {
  '1': {
    store: {
      id: '1',
      name: '이천반찬',
      category: '한식반찬',
      deliveryArea: '강남구, 서초구',
      deliveryFee: 2000,
      phone: '031-123-4567',
      businessHoursStart: '09:00',
      businessHoursEnd: '21:00',
      pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
        { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
      ],
      bankAccount: '123456-78-901234',
      accountHolder: '이천반찬'
    },
    menu: [
      {
        id: 'm1',
        name: '김치찌개',
        price: 8000,
        description: '매콤하고 시원한 김치찌개',
        category: '메인메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20kimchi%20jjigae%20stew%20in%20traditional%20stone%20bowl%2C%20spicy%20red%20broth%20with%20kimchi%20and%20pork%2C%20steaming%20hot%2C%20garnished%20with%20green%20onions%2C%20simple%20white%20background%2C%20appetizing%20restaurant%20style%20photography&width=300&height=200&seq=m1&orientation=landscape'
      },
      {
        id: 'm2',
        name: '된장찌개',
        price: 7000,
        description: '구수한 된장찌개',
        category: '메인메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20doenjang%20jjigae%20soybean%20paste%20stew%20in%20earthenware%20pot%2C%20rich%20brown%20broth%20with%20tofu%20and%20vegetables%2C%20traditional%20Korean%20comfort%20food%2C%20simple%20background%2C%20professional%20food%20photography&width=300&height=200&seq=m2&orientation=landscape'
      },
      {
        id: 'm3',
        name: '제육볶음',
        price: 12000,
        description: '매콤달콤한 제육볶음',
        category: '메인메뉴',
        isAvailable: false,
        image: 'https://readdy.ai/api/search-image?query=Korean%20jeyuk%20bokkeum%20spicy%20stir-fried%20pork%20with%20vegetables%20and%20onions%2C%20glossy%20red%20sauce%2C%20served%20on%20white%20plate%2C%20garnished%20with%20sesame%20seeds%2C%20appetizing%20presentation%20with%20simple%20background&width=300&height=200&seq=m3&orientation=landscape'
      },
      {
        id: 'm4',
        name: '미역국',
        price: 6000,
        description: '시원한 미역국',
        category: '국물요리',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20miyeok%20guk%20seaweed%20soup%20in%20white%20bowl%2C%20clear%20broth%20with%20fresh%20seaweed%2C%20light%20and%20healthy%20appearance%2C%20traditional%20Korean%20soup%2C%20clean%20white%20background%2C%20professional%20food%20photography&width=300&height=200&seq=m4&orientation=landscape'
      },
      {
        id: 'm5',
        name: '계란말이',
        price: 5000,
        description: '부드러운 계란말이',
        category: '사이드메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20egg%20roll%20gyeran%20mari%20sliced%20and%20arranged%20on%20white%20plate%2C%20fluffy%20yellow%20omelet%20with%20scallions%2C%20clean%20presentation%2C%20simple%20white%20background%2C%20appetizing%20Korean%20side%20dish%20photography&width=300&height=200&seq=m5&orientation=landscape'
      },
      {
        id: 'm6',
        name: '배추김치',
        price: 8000,
        description: '아삭한 배추김치 1kg',
        category: '김치류',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Fresh%20Korean%20napa%20cabbage%20kimchi%20in%20glass%20container%2C%20vibrant%20red%20color%20with%20visible%20chili%20flakes%2C%20traditional%20fermented%20vegetable%2C%20clean%20white%20background%2C%20professional%20food%20photography%20showing%20texture%20and%20freshness&width=300&height=200&seq=m6&orientation=landscape'
      }
    ]
  },
  '2': {
    store: {
      id: '2',
      name: '맛있는 반찬집',
      category: '한식반찬',
      deliveryArea: '송파구, 강동구',
      deliveryFee: 1500,
      phone: '02-987-6543',
      businessHoursStart: '08:00',
      businessHoursEnd: '20:00',
      pickupTimeSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '07:30', end: '10:00', enabled: true },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: true },
        { name: '저녁 배송', start: '17:30', end: '19:30', enabled: true }
      ],
      bankAccount: '987654-32-109876',
      accountHolder: '맛있는 반찬집'
    },
    menu: [
      {
        id: 'm7',
        name: '부대찌개',
        price: 9000,
        description: '얼큰한 부대찌개',
        category: '메인메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20budae%20jjigae%20army%20stew%20with%20sausages%2C%20spam%2C%20ramen%20noodles%2C%20kimchi%20in%20spicy%20red%20broth%2C%20served%20in%20metal%20pot%2C%20steaming%20hot%2C%20appetizing%20presentation%20with%20simple%20background&width=300&height=200&seq=m7&orientation=landscape'
      },
      {
        id: 'm8',
        name: '갈비탕',
        price: 15000,
        description: '진한 갈비탕',
        category: '국물요리',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20galbitang%20beef%20short%20rib%20soup%20in%20white%20bowl%2C%20clear%20rich%20broth%20with%20tender%20meat%20and%20radish%2C%20garnished%20with%20scallions%2C%20traditional%20Korean%20soup%2C%20clean%20presentation%20with%20white%20background&width=300&height=200&seq=m8&orientation=landscape'
      },
      {
        id: 'm9',
        name: '동그랑땡',
        price: 6000,
        description: '바삭한 동그랑땡',
        category: '사이드메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20donggeuraengttaeng%20fried%20fish%20cake%20patties%20golden%20brown%20and%20crispy%2C%20arranged%20on%20white%20plate%2C%20traditional%20Korean%20side%20dish%2C%20appetizing%20presentation%20with%20simple%20white%20background&width=300&height=200&seq=m9&orientation=landscape'
      },
      {
        id: 'm10',
        name: '깍두기',
        price: 7000,
        description: '아삭한 깍두기 1kg',
        category: '김치류',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20kkakdugi%20cubed%20radish%20kimchi%20in%20glass%20container%2C%20white%20radish%20pieces%20with%20red%20chili%20seasoning%2C%20fresh%20and%20crunchy%20appearance%2C%20traditional%20fermented%20vegetable%2C%20clean%20white%20background%20photography&width=300&height=200&seq=m10&orientation=landscape'
      }
    ]
  },
  '3': {
    store: {
      id: '3',
      name: '할머니 손맛',
      category: '한식반찬',
      deliveryArea: '마포구, 용산구',
      deliveryFee: 2500,
      phone: '02-333-4444',
      businessHoursStart: '10:00',
      businessHoursEnd: '18:00',
      pickupTimeSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
        { name: '저녁 배송', start: '17:30', end: '19:00', enabled: true }
      ],
      bankAccount: '555555-66-777777',
      accountHolder: '할머니 손맛'
    },
    menu: [
      {
        id: 'm11',
        name: '순두부찌개',
        price: 8500,
        description: '부드러운 순두부찌개',
        category: '메인메뉴',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20sundubu%20jjigae%20soft%20tofu%20stew%20in%20stone%20bowl%2C%20silky%20white%20tofu%20in%20spicy%20red%20broth%2C%20garnished%20with%20scallions%20and%20egg%2C%20traditional%20Korean%20comfort%20food%2C%20simple%20background%20photography&width=300&height=200&seq=m11&orientation=landscape'
      }
    ]
  },
  '4': {
    store: {
      id: '4',
      name: '건강반찬마켓',
      category: '한식반찬',
      deliveryArea: '성북구, 동대문구',
      deliveryFee: 3000,
      phone: '02-555-6666',
      businessHoursStart: '11:00',
      businessHoursEnd: '19:00',
      pickupTimeSlots: ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: true },
        { name: '저녁 배송', start: '17:30', end: '19:00', enabled: true }
      ],
      bankAccount: '111111-22-333333',
      accountHolder: '건강반찬마켓'
    },
    menu: [
      {
        id: 'm12',
        name: '콩나물국',
        price: 5500,
        description: '시원한 콩나물국',
        category: '국물요리',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20kongnamul%20guk%20bean%20sprout%20soup%20in%20white%20bowl%2C%20clear%20broth%20with%20fresh%20bean%20sprouts%2C%20light%20and%20refreshing%20Korean%20soup%2C%20clean%20white%20background%2C%20healthy%20appearance&width=300&height=200&seq=m12&orientation=landscape'
      }
    ]
  },
  '5': {
    store: {
      id: '5',
      name: '전통반찬집',
      category: '한식반찬',
      deliveryArea: '중구, 종로구',
      deliveryFee: 1800,
      phone: '02-777-8888',
      businessHoursStart: '10:00',
      businessHoursEnd: '19:00',
      pickupTimeSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: true },
        { name: '저녁 배송', start: '17:30', end: '19:00', enabled: true }
      ],
      bankAccount: '999999-88-777777',
      accountHolder: '전통반찬집'
    },
    menu: [
      {
        id: 'm13',
        name: '열무김치',
        price: 6500,
        description: '시원한 열무김치 1kg',
        category: '김치류',
        isAvailable: true,
        image: 'https://readdy.ai/api/search-image?query=Korean%20yeolmu%20kimchi%20young%20radish%20kimchi%20in%20glass%20container%2C%20fresh%20green%20leaves%20with%20white%20radish%20in%20red%20seasoning%2C%20traditional%20fermented%20vegetable%2C%20clean%20white%20background%20photography&width=300&height=200&seq=m13&orientation=landscape'
      }
    ]
  }
};

export default function Menu() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('메인메뉴');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showToast, setShowToast] = useState('');

  const storeData = storeId ? MENU_DATA[storeId] : null;
  const categories = ['메인메뉴', '국물요리', '사이드메뉴', '김치류'];

  useEffect(() => {
    // 테스트용으로 로그인 체크 주석 처리
    // const isLoggedIn = localStorage.getItem('isLoggedIn');
    // if (!isLoggedIn) {
    //   navigate('/login');
    //   return;
    // }

    if (!storeData) {
      navigate('/stores');
    }
  }, [storeData, navigate]);

  if (!storeData) return null;

  const filteredMenu = storeData.menu.filter(item => item.category === selectedCategory);
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

    setShowToast(`${menuItem.name}이 장바구니에 추가되었습니다`);
    setTimeout(() => setShowToast(''), 2000);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleCartClick = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('storeInfo', JSON.stringify(storeData.store));
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/stores')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-center flex-1">{storeData.store.name}</h1>
            <div className="w-10"></div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">{storeData.store.category}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <i className="ri-map-pin-line"></i>
                <span>{storeData.store.deliveryArea}</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="ri-truck-line"></i>
                <span>배달비 {storeData.store.deliveryFee.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-3 whitespace-nowrap text-sm font-medium border-b-2 cursor-pointer ${
                selectedCategory === category
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div className="p-4">
        <div className="space-y-4">
          {filteredMenu.map((item) => {
            const cartItem = cart.find(cartItem => cartItem.id === item.id);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                  !item.isAvailable ? 'opacity-60' : ''
                }`}
              >
                <div className="flex">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover object-top"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold ${!item.isAvailable ? 'text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                          {!item.isAvailable && <span className="text-red-500 text-sm ml-2">(품절)</span>}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        <p className="font-semibold text-orange-500">{item.price.toLocaleString()}원</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {cartItem ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <span className="font-semibold">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full cursor-pointer"
                          >
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!item.isAvailable}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer ${
                            item.isAvailable
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {item.isAvailable ? '담기' : '품절'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 장바구니 버튼 */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handleCartClick}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-4 rounded-lg flex items-center justify-between whitespace-nowrap cursor-pointer"
          >
            <div className="flex items-center">
              <i className="ri-shopping-cart-line mr-2"></i>
              <span>장바구니 ({totalQuantity})</span>
            </div>
            <span className="font-semibold">{totalAmount.toLocaleString()}원</span>
          </button>
        </div>
      )}

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}