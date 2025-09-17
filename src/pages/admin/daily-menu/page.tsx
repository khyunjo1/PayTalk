import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getMenus } from '../../../lib/menuApi';
import { 
  createDailyMenu, 
  getDailyMenu, 
  addDailyMenuItem, 
  getDailyMenuItems,
  updateDailyMenuItemQuantity,
  toggleDailyMenuItemAvailability,
  removeDailyMenuItem,
  DailyMenu,
  DailyMenuItem,
  CreateDailyMenuItemData
} from '../../../lib/dailyMenuApi';
import { MenuDB } from '../../../types';
import Header from '../../../components/Header';

export default function AdminDailyMenu() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useNewAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 상태 관리
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuDB[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [categories, setCategories] = useState<string[]>([]);
  
  // 오늘 날짜 설정 (한국 표준시간 기준)
  useEffect(() => {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const today = koreaTime.toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (!storeId) return;
    loadData();
  }, [storeId, selectedDate]);

  const loadData = async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      
      // 1. 사용 가능한 메뉴 목록 로드
      const menus = await getMenus(storeId);
      const availableMenus = menus.filter(menu => menu.is_available);
      setAvailableMenus(availableMenus);
      
      // 카테고리 추출
      const uniqueCategories = ['전체', ...new Set(availableMenus.map(menu => menu.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // 2. 선택된 날짜의 일일 메뉴 로드
      let existingDailyMenu: DailyMenu | null = null;
      try {
        existingDailyMenu = await getDailyMenu(storeId, selectedDate);
      } catch (error) {
        console.error('일일 메뉴 조회 오류:', error);
        // 오류가 발생해도 계속 진행
      }
      setDailyMenu(existingDailyMenu);
      
      if (existingDailyMenu) {
        // 3. 일일 메뉴 아이템들 로드
        const items = await getDailyMenuItems(existingDailyMenu.id);
        setDailyMenuItems(items);
        
        // 4. 선택된 메뉴와 수량 설정
        const selectedSet = new Set(items.map(item => item.menu_id));
        setSelectedMenus(selectedSet);
        
        const quantitiesMap: Record<string, number> = {};
        items.forEach(item => {
          quantitiesMap[item.menu_id] = item.initial_quantity;
        });
        setQuantities(quantitiesMap);
      } else {
        // 새로운 일일 메뉴인 경우 초기화
        setDailyMenuItems([]);
        setSelectedMenus(new Set());
        setQuantities({});
        setTempQuantities({});
        setItemAvailability({});
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 필터링된 메뉴
  const filteredAvailableMenus = availableMenus.filter(menu => {
    if (selectedCategory === '전체') return true;
    return menu.category === selectedCategory;
  });

  // 일일 메뉴 생성
  const handleCreateDailyMenu = async () => {
    if (!storeId || !selectedDate) return;
    
    try {
      setSaving(true);
      
      const newDailyMenu = await createDailyMenu({
        store_id: storeId,
        menu_date: selectedDate,
        title: `${selectedDate}의 반찬`,
        description: '맛있는 반찬을 주문해보세요!'
      });
      
      setDailyMenu(newDailyMenu);
      alert('일일 메뉴 페이지가 생성되었습니다!');
    } catch (error) {
      console.error('일일 메뉴 생성 오류:', error);
      alert('일일 메뉴 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 메뉴 선택/해제
  const handleMenuToggle = (menuId: string) => {
    const newSelected = new Set(selectedMenus);
    if (newSelected.has(menuId)) {
      newSelected.delete(menuId);
      // 수량도 제거
      const newQuantities = { ...quantities };
      delete newQuantities[menuId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(menuId);
      // 기본 수량 10개로 설정
      setQuantities(prev => ({ ...prev, [menuId]: 10 }));
    }
    setSelectedMenus(newSelected);
  };

  // 수량 변경
  const handleQuantityChange = (menuId: string, quantity: number) => {
    if (quantity < 0) return;
    setQuantities(prev => ({ ...prev, [menuId]: quantity }));
    
    // 수량에 따라 품절 상태 자동 업데이트 (초기 설정 시)
    const dailyMenuItem = dailyMenuItems.find(item => item.menu_id === menuId);
    if (dailyMenuItem) {
      if (quantity === 0) {
        setItemAvailability(prev => ({
          ...prev,
          [dailyMenuItem.id]: false
        }));
      } else {
        setItemAvailability(prev => ({
          ...prev,
          [dailyMenuItem.id]: true
        }));
      }
    }
  };

  // 개별 아이템 수량 변경 (임시 상태만 업데이트)
  const handleUpdateItemQuantity = (itemId: string, value: string) => {
    // 빈 문자열이면 0으로 처리하지 않고 빈 상태 유지
    const newQuantity = value === '' ? '' : (parseInt(value) || 0);
    
    if (typeof newQuantity === 'number' && newQuantity < 0) {
      alert('수량은 0 이상이어야 합니다.');
      return;
    }

    // 임시 상태만 업데이트 (실제 저장은 메뉴 저장 버튼에서)
    const dailyMenuItem = dailyMenuItems.find(item => item.id === itemId);
    if (dailyMenuItem) {
      setTempQuantities(prev => ({ ...prev, [dailyMenuItem.menu_id]: newQuantity }));
      
      // 수량에 따라 품절 상태 자동 업데이트
      if (typeof newQuantity === 'number') {
        if (newQuantity === 0) {
          setItemAvailability(prev => ({
            ...prev,
            [itemId]: false
          }));
        } else {
          setItemAvailability(prev => ({
            ...prev,
            [itemId]: true
          }));
        }
      }
    }
  };

  // 품절 상태 관리 (로컬 상태)
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>({});
  
  // 수량 변경 로컬 상태 (저장 전까지 임시)
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});

  // 개별 아이템 품절 처리 (로컬 상태만 업데이트)
  const handleToggleItemAvailability = (itemId: string, currentAvailability: boolean) => {
    setItemAvailability(prev => ({
      ...prev,
      [itemId]: !currentAvailability
    }));
  };

  // 일일 메뉴 아이템 저장
  const handleSaveItems = async () => {
    if (!dailyMenu) return;
    
    // 수량이 변경되었는지 확인 (임시 상태 포함)
    const finalQuantities = { ...quantities };
    Object.keys(tempQuantities).forEach(menuId => {
      const value = tempQuantities[menuId];
      finalQuantities[menuId] = value === '' ? 0 : value;
    });
    
    const hasQuantityChanges = dailyMenuItems.some(item => {
      const currentQuantity = finalQuantities[item.menu_id] || 0;
      return currentQuantity !== item.initial_quantity;
    });
    
    // 새로운 메뉴가 추가되었는지 확인
    const hasNewMenus = Array.from(selectedMenus).some(menuId => 
      !dailyMenuItems.some(item => item.menu_id === menuId)
    );
    
    // 메뉴가 제거되었는지 확인
    const hasRemovedMenus = dailyMenuItems.some(item => 
      !selectedMenus.has(item.menu_id)
    );
    
    // 변경사항이 있으면 확인창 표시
    if (hasQuantityChanges || hasNewMenus || hasRemovedMenus) {
      const confirmed = window.confirm('메뉴를 변경하시겠습니까?');
      if (!confirmed) return;
    }
    
    try {
      setSaving(true);
      
      // 1. 기존 아이템들 업데이트
      for (const item of dailyMenuItems) {
        const newQuantity = finalQuantities[item.menu_id];
        const newAvailability = itemAvailability[item.id] !== undefined ? itemAvailability[item.id] : item.is_available;
        
        // 수량 업데이트
        if (newQuantity !== undefined && newQuantity !== item.initial_quantity) {
          await updateDailyMenuItemQuantity(item.id, newQuantity);
        }
        
        // 품절 상태 업데이트
        if (newAvailability !== item.is_available) {
          await toggleDailyMenuItemAvailability(item.id, newAvailability);
        }
      }
      
      // 2. 제거된 메뉴들 삭제
      for (const item of dailyMenuItems) {
        if (!selectedMenus.has(item.menu_id)) {
          await removeDailyMenuItem(item.id);
        }
      }
      
      // 3. 새로운 메뉴들 추가
      for (const menuId of selectedMenus) {
        const quantity = finalQuantities[menuId] || 0;
        const existingItem = dailyMenuItems.find(item => item.menu_id === menuId);
        
        if (!existingItem && quantity > 0) {
          await addDailyMenuItem({
            daily_menu_id: dailyMenu.id,
            menu_id: menuId,
            initial_quantity: quantity
          });
        }
      }
      
      // 4. 임시 수량 상태를 실제 상태로 적용
      setQuantities(finalQuantities);
      
      // 5. 로컬 상태 초기화
      setItemAvailability({});
      setTempQuantities({});
      
      // 데이터 다시 로드
      await loadData();
      alert('메뉴 아이템이 저장되었습니다!');
    } catch (error) {
      console.error('아이템 저장 오류:', error);
      alert('아이템 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 링크 생성
  const generateLink = () => {
    if (!dailyMenu) return '';
    return `${window.location.origin}/menu/${storeId}/daily/${selectedDate}`;
  };

  // 링크 복사
  const handleCopyLink = async () => {
    const link = generateLink();
    try {
      await navigator.clipboard.writeText(link);
      alert('링크가 복사되었습니다!');
    } catch (error) {
      console.error('링크 복사 오류:', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="뒤로가기"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </button>
              <h1 className="text-lg font-semibold text-gray-800">일일메뉴</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* 날짜 선택 */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">메뉴 날짜 선택</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm sm:text-base font-semibold text-gray-800">날짜:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base font-medium"
            />
            <button
              onClick={loadData}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              조회
            </button>
          </div>
        </div>

        {/* 일일 메뉴 생성/상태 */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          
          {!dailyMenu ? (
            <div className="text-center py-6 sm:py-8">
              <i className="ri-calendar-line text-3xl sm:text-4xl text-gray-400 mb-3 sm:mb-4"></i>
              <p className="text-base sm:text-lg text-gray-700 mb-4 font-medium">이 날짜의 일일 메뉴 페이지가 없습니다.</p>
              <button
                onClick={handleCreateDailyMenu}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm sm:text-base font-semibold shadow-md"
              >
                {saving ? '생성 중...' : '일일 메뉴 페이지 생성'}
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words mb-2">{dailyMenu.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">날짜: {dailyMenu.menu_date}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base text-gray-700 font-semibold">상태:</span>
                  <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    dailyMenu.is_active 
                      ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                      : 'bg-red-100 text-red-800 border-2 border-red-200'
                  }`}>
                    <i className={`ri-${dailyMenu.is_active ? 'check' : 'close'}-circle-line text-sm`}></i>
                    {dailyMenu.is_active ? '주문접수중' : '주문마감'}
                  </div>
                </div>
              </div>
              
              {/* 링크 표시 */}
              <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700 font-semibold">공유 링크:</p>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                  >
                    링크 복사
                  </button>
                </div>
                <p className="text-sm font-mono text-gray-800 break-all bg-white p-2 rounded-lg border border-gray-300">{generateLink()}</p>
              </div>
            </div>
          )}
        </div>

        {/* 메뉴 선택 및 수량 설정 */}
        {dailyMenu && (
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">메뉴 선택 및 수량 설정</h2>
            
            {/* 안내문구 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-blue-500 text-lg mt-0.5"></i>
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">수량 변경 안내</h3>
                  <p className="text-sm text-blue-700">
                    수량을 변경하고 저장하면 <strong>실시간으로 고객에게 반영</strong>됩니다. 
                    고객이 주문할 때마다 수량이 자동으로 차감됩니다.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 카테고리 필터 */}
            <div className="mb-5 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <i className="ri-menu-line text-orange-500 text-lg sm:text-xl"></i>
                <h3 className="text-base sm:text-lg font-bold text-gray-800">카테고리 필터</h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 border-2 ${
                      selectedCategory === category
                        ? 'bg-orange-500 text-white shadow-md border-orange-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {filteredAvailableMenus.map((menu) => (
                <div
                  key={menu.id}
                  className={`border-2 rounded-xl p-4 sm:p-5 transition-all shadow-sm ${
                    selectedMenus.has(menu.id)
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg break-words mb-1">{menu.name}</h3>
                      <p className="text-sm sm:text-base text-gray-600 font-medium mb-2">{menu.category}</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-600">
                        {menu.price.toLocaleString()}원
                      </p>
                    </div>
                    <button
                      onClick={() => handleMenuToggle(menu.id)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 shadow-sm ${
                        selectedMenus.has(menu.id)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-400 bg-white'
                      }`}
                    >
                      {selectedMenus.has(menu.id) && (
                        <i className="ri-check-line text-white text-sm sm:text-base"></i>
                      )}
                    </button>
                  </div>
                  
                  {selectedMenus.has(menu.id) && (
                    <div className="space-y-3">
                      {/* 초기 설정 시 수량 입력 */}
                      {!dailyMenuItems.find(item => item.menu_id === menu.id) && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <label className="text-sm sm:text-base text-gray-700 font-semibold">수량:</label>
                            <input
                              type="number"
                              min="0"
                              value={tempQuantities[menu.id] !== undefined ? tempQuantities[menu.id] : (quantities[menu.id] || 0)}
                              onChange={(e) => {
                                const value = e.target.value;
                                const newQuantity = value === '' ? '' : (parseInt(value) || 0);
                                setTempQuantities(prev => ({ ...prev, [menu.id]: newQuantity }));
                                
                                // 수량에 따라 품절 상태 자동 업데이트
                                if (typeof newQuantity === 'number') {
                                  if (newQuantity === 0) {
                                    setItemAvailability(prev => ({
                                      ...prev,
                                      [menu.id]: false
                                    }));
                                  } else {
                                    setItemAvailability(prev => ({
                                      ...prev,
                                      [menu.id]: true
                                    }));
                                  }
                                }
                                
                                handleQuantityChange(menu.id, typeof newQuantity === 'number' ? newQuantity : 0);
                              }}
                              className="w-20 sm:w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-sm sm:text-base text-gray-600 font-semibold">개</span>
                          </div>
                          
                          {/* 초기 설정 시 품절 상태 표시 */}
                          {(() => {
                            const currentValue = tempQuantities[menu.id] !== undefined ? tempQuantities[menu.id] : (quantities[menu.id] || 0);
                            const displayValue = currentValue === '' ? 0 : currentValue;
                            return displayValue === 0 && (
                              <div className="text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-200">
                                  <i className="ri-close-line mr-1"></i>
                                  품절 (수량 0개)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* 설정 완료 후 수량 정보 및 관리 */}
                      {(() => {
                        const dailyMenuItem = dailyMenuItems.find(item => item.menu_id === menu.id);
                        if (dailyMenuItem) {
                          const soldQuantity = dailyMenuItem.initial_quantity - dailyMenuItem.current_quantity;
                          return (
                            <div className="space-y-3">
                              {/* 수량 정보 표시 */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  초기: {tempQuantities[dailyMenuItem.menu_id] !== undefined ? (tempQuantities[dailyMenuItem.menu_id] === '' ? 0 : tempQuantities[dailyMenuItem.menu_id]) : dailyMenuItem.initial_quantity}개 | 현재: {dailyMenuItem.current_quantity}개
                                </span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                  {soldQuantity}개 팔림
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  (itemAvailability[dailyMenuItem.id] !== undefined ? itemAvailability[dailyMenuItem.id] : dailyMenuItem.is_available)
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {(itemAvailability[dailyMenuItem.id] !== undefined ? itemAvailability[dailyMenuItem.id] : dailyMenuItem.is_available) ? '판매중' : '품절'}
                                </span>
                              </div>
                              
                              {/* 수량 수정 및 품절 처리 */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={tempQuantities[dailyMenuItem.menu_id] !== undefined ? tempQuantities[dailyMenuItem.menu_id] : dailyMenuItem.initial_quantity}
                                    onChange={(e) => {
                                      handleUpdateItemQuantity(dailyMenuItem.id, e.target.value);
                                    }}
                                    className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <span className="text-xs text-gray-600 font-semibold">개</span>
                                </div>
                                
                                <button
                                  onClick={() => handleToggleItemAvailability(dailyMenuItem.id, itemAvailability[dailyMenuItem.id] !== undefined ? itemAvailability[dailyMenuItem.id] : dailyMenuItem.is_available)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                                    (itemAvailability[dailyMenuItem.id] !== undefined ? itemAvailability[dailyMenuItem.id] : dailyMenuItem.is_available)
                                      ? 'bg-red-500 hover:bg-red-600 text-white'
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                >
                                  {(itemAvailability[dailyMenuItem.id] !== undefined ? itemAvailability[dailyMenuItem.id] : dailyMenuItem.is_available) ? '품절처리' : '판매재개'}
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveItems}
                disabled={saving || selectedMenus.size === 0}
                className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm sm:text-base font-semibold shadow-md"
              >
                {saving ? '저장 중...' : '메뉴 저장'}
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
