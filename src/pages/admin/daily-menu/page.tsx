import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getMenus } from '../../../lib/menuApi';
import {
  createDailyMenu,
  getDailyMenu,
  addDailyMenuItem,
  getDailyMenuItems,
  toggleDailyMenuItemAvailability,
  removeDailyMenuItem,
  getLatestDailyMenu
} from '../../../lib/dailyMenuApi';
import type { DailyMenu, DailyMenuItem } from '../../../lib/dailyMenuApi';
import type { MenuDB } from '../../../types';
import Header from '../../../components/Header';

export default function AdminDailyMenu() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { } = useNewAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuDB[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());

  // 아코디언 상태 관리
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 수정 사항 감지 상태
  const [hasChanges, setHasChanges] = useState(false);

  // 선택된 메뉴 변경 감지
  useEffect(() => {
    setHasChanges(selectedMenus.size > 0);
  }, [selectedMenus]);

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

        // 4. 선택된 메뉴 설정
        const selectedSet = new Set(items.map(item => item.menu_id));
        setSelectedMenus(selectedSet);
      } else {
        // 새로운 일일 메뉴인 경우 초기화
        setDailyMenuItems([]);
        setSelectedMenus(new Set());
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 메뉴 그룹화
  const menuByCategory = availableMenus.reduce((acc, menu) => {
    const category = menu.category || '기타';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(menu);
    return acc;
  }, {} as Record<string, MenuDB[]>);

  // 아코디언 토글 함수
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 일일 메뉴 생성
  const handleCreateDailyMenu = async () => {
    if (!storeId || !selectedDate) return;

    try {
      setSaving(true);
      
      const newDailyMenu = await createDailyMenu({
        store_id: storeId,
        menu_date: selectedDate,
        title: `${selectedDate}의 반찬 주문서`,
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
    } else {
      newSelected.add(menuId);
    }
    setSelectedMenus(newSelected);
  };

  // 최근 메뉴를 템플릿으로 불러오기
  const handleLoadRecentTemplate = async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      
      // 선택된 날짜 이전의 가장 최근 일일메뉴 불러오기
      const latestMenuData = await getLatestDailyMenu(storeId, selectedDate);
      
      if (latestMenuData) {
        const newSelectedMenus = new Set<string>();
        
        // 아이템이 있는 경우에만 메뉴 설정
        if (latestMenuData.items.length > 0) {
          latestMenuData.items.forEach(item => {
            newSelectedMenus.add(item.menu_id);
          });
        }
        
        setSelectedMenus(newSelectedMenus);
        
        const dateStr = latestMenuData.menu.menu_date;
        if (latestMenuData.items.length > 0) {
          alert(`${dateStr}의 메뉴 ${latestMenuData.items.length}개를 불러왔습니다. 수정 후 저장해주세요.`);
      } else {
          alert(`${dateStr}의 주문서를 불러왔습니다. 메뉴를 선택해주세요.`);
        }
        return;
      }
      
      // 최근 메뉴가 없으면 안내
      alert('최근에 생성된 메뉴가 없습니다. 새로 메뉴를 선택해주세요.');
      
    } catch (error) {
      console.error('메뉴 템플릿 불러오기 오류:', error);
      alert('메뉴를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 품절 상태 관리 (로컬 상태)
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>({});
  
  // 토스트 상태
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // 토스트 표시 함수
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      show: true,
      message,
      type
    });
    
    // 3초 후 자동으로 숨기기
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

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
    
    // 새로운 메뉴가 추가되었는지 확인
    const hasNewMenus = Array.from(selectedMenus).some(menuId => 
      !dailyMenuItems.some(item => item.menu_id === menuId)
    );
    
    // 메뉴가 제거되었는지 확인
    const hasRemovedMenus = dailyMenuItems.some(item => 
      !selectedMenus.has(item.menu_id)
    );
    
    // 변경사항이 있으면 확인창 표시
    if (hasNewMenus || hasRemovedMenus) {
      const confirmed = window.confirm('메뉴를 변경하시겠습니까?');
      if (!confirmed) return;
    }
    
    try {
      setSaving(true);

      // 1. 기존 아이템들 업데이트
      for (const item of dailyMenuItems) {
        const newAvailability = itemAvailability[item.id] !== undefined ? itemAvailability[item.id] : item.is_available;
        
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
        const existingItem = dailyMenuItems.find(item => item.menu_id === menuId);
        
        if (!existingItem) {
        await addDailyMenuItem({
            daily_menu_id: dailyMenu.id,
          menu_id: menuId
        });
      }
      }

      // 4. 로컬 상태 초기화
      setItemAvailability({});
      setSelectedMenus(new Set());
      setHasChanges(false);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
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
              <h1 className="text-lg font-semibold text-gray-800">주문서 만들기</h1>
            </div>
          </div>
        </div>
            </div>

      <div className="px-3 sm:px-6 py-4 sm:py-8">
        {/* 날짜 선택 및 상태 */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center">
              <i className="ri-calendar-line text-orange-500 text-lg"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">주문서 날짜 선택</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <label className="text-sm sm:text-base font-semibold text-gray-700 sm:min-w-0">날짜:</label>
            <div className="flex-1">
            <input
              type="date"
              value={selectedDate}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  
                  // 정확한 한국 시간 계산 (UTC+9)
                  const now = new Date();
                  const koreaOffset = 9 * 60; // 9시간을 분으로
                  const koreaTime = new Date(now.getTime() + (koreaOffset * 60 * 1000));
                  const today = koreaTime.toISOString().split('T')[0];
                  
                  const tomorrow = new Date(koreaTime);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const maxDate = tomorrow.toISOString().split('T')[0];
                  
                  console.log('현재 한국 날짜:', today);
                  console.log('내일 날짜:', maxDate);
                  console.log('선택된 날짜:', selectedDate);
                  
                  // 내일 이후 날짜 선택 시 경고
                  if (selectedDate > maxDate) {
                    alert('주문서는 내일까지만 생성가능합니다.');
                    return;
                  }
                  
                  setSelectedDate(selectedDate);
                }}
                min="2020-01-01"
                max={(() => {
                  // 정확한 한국 시간 계산 (UTC+9)
                  const now = new Date();
                  const koreaOffset = 9 * 60; // 9시간을 분으로
                  const koreaTime = new Date(now.getTime() + (koreaOffset * 60 * 1000));
                  const tomorrow = new Date(koreaTime);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const maxDate = tomorrow.toISOString().split('T')[0];
                  console.log('max 날짜 설정:', maxDate);
                  return maxDate;
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm sm:text-base font-medium min-h-[48px] bg-gray-50 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                <i className="ri-information-line mr-1"></i>
                주문서는 내일까지만 생성가능합니다 (과거 날짜 선택 가능)
              </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

          {/* 주문서 상태 정보 */}
          {dailyMenu && (
            <div className="bg-white rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                    {selectedDate}의 반찬 주문서
            </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">상태:</span>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      dailyMenu.is_active 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <i className={`ri-${dailyMenu.is_active ? 'check' : 'close'}-circle-line text-xs`}></i>
                      {dailyMenu.is_active ? '주문접수중' : '주문마감'}
                    </div>
                  </div>
                </div>
                
                {/* 주문서 링크 복사 버튼 */}
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleCopyLink}
                    className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-orange-500 text-gray-800 hover:text-white border border-gray-300 hover:border-orange-500 rounded-2xl transition-all duration-300 text-base font-bold w-auto min-w-[200px] shadow-sm hover:shadow-lg"
                  >
                    <i className="ri-link text-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"></i>
                    <span className="whitespace-nowrap">링크 복사</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

          
        {/* 일일 메뉴 생성 */}
        {!dailyMenu && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-8 mb-4 sm:mb-8">
            <div className="text-center py-8 sm:py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="ri-calendar-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">주문서가 아직 없습니다</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-8">선택한 날짜의 주문서를 생성해주세요.</p>
              <div className="flex justify-center">
                <button
                  onClick={handleCreateDailyMenu}
                  disabled={saving}
                  className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-500 text-gray-800 hover:text-white border border-gray-300 hover:border-gray-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 text-base font-bold w-auto min-w-[200px] shadow-sm hover:shadow-lg disabled:shadow-none"
                >
                  <i className="ri-add-line text-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"></i>
                  <span className="whitespace-nowrap">{saving ? '생성 중...' : '주문서 링크 생성'}</span>
                </button>
              </div>
            </div>
            </div>
          )}

        {/* 메뉴 선택 및 품절 관리 */}
        {dailyMenu && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-8 mb-4 sm:mb-8">
            <div className="mb-6 sm:mb-8">
              <div className="mb-5">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                    <i className="ri-restaurant-line text-orange-500 text-lg sm:text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">메뉴 선택 및 품절 관리</h2>
                  </div>
                </div>
                
                {/* 최근 주문서 가져오기 버튼 */}
                <div className="flex justify-center">
                  <button
                    onClick={handleLoadRecentTemplate}
                    disabled={loading}
                    className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-orange-500 text-gray-800 hover:text-white border border-gray-300 hover:border-orange-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 text-base font-bold w-auto min-w-[200px] shadow-sm hover:shadow-lg disabled:shadow-none"
                  >
                    <i className="ri-file-copy-line text-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"></i>
                    <span className="whitespace-nowrap">최근 주문서 가져오기</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 안내문구 */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-information-line text-orange-600 text-sm sm:text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-orange-900 mb-2">품절 관리 안내</h3>
                  <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                    메뉴를 선택하고 품절/판매가능 상태를 관리하세요. 
                    <span className="font-semibold text-orange-900">실시간으로 고객에게 반영</span>됩니다.
                  </p>
                </div>
              </div>
            </div>
            
            
            {/* 아코디언 메뉴 선택 */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {Object.entries(menuByCategory).map(([category, menus]) => {
                const isExpanded = expandedCategories.has(category);
                const selectedCount = menus.filter(menu => selectedMenus.has(menu.id)).length;
                      
                      return (
                  <div key={category} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    {/* 카테고리 헤더 */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                    >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{category}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {selectedCount > 0 ? `${selectedCount}개 선택됨` : `${menus.length}개 메뉴`}
                          </p>
                              </div>
                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                        {selectedCount > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-900 text-xs font-medium rounded-full">
                            {selectedCount}
                                </span>
                        )}
                        <i className={`ri-arrow-down-s-line text-gray-500 text-sm ${
                          isExpanded ? 'rotate-180' : ''
                        }`}></i>
                        </div>
                                </button>
                    
                    {/* 카테고리 내용 - 아코디언 */}
                    <div className={`transition-all duration-300 ${
                      isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}>
                      <div className="border-t border-gray-100 p-3 sm:p-4 pt-5 sm:pt-6 space-y-2 sm:space-y-3">
                        {menus.map((menu) => {
                const isSelected = selectedMenus.has(menu.id);
                const existingItem = dailyMenuItems.find(item => item.menu_id === menu.id);
                const isAvailable = existingItem ? (itemAvailability[existingItem.id] !== undefined ? itemAvailability[existingItem.id] : existingItem.is_available) : true;

                return (
                  <div
                    key={menu.id}
                              className={`rounded-lg border transition-all duration-200 ${
                                isSelected ? 'border-gray-300 shadow-md bg-white' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                              <div className="p-2 sm:p-4">
                                {/* 메뉴 헤더 */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 truncate">{menu.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-xs text-gray-500">{menu.category}</span>
                            <span className="text-xs sm:text-sm font-bold text-gray-900">
                              {menu.price.toLocaleString()}원
                            </span>
                          </div>
                      </div>
                        <button
                          onClick={() => handleMenuToggle(menu.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900'
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <i className="ri-check-line text-white text-xs"></i>
                          )}
                        </button>
                      </div>

                      {/* 선택된 경우 품절 관리 */}
                      {isSelected && (
                        <div className="pt-3 border-t border-gray-100">
                          {existingItem && (
                        <button
                              onClick={() => handleToggleItemAvailability(existingItem.id, isAvailable)}
                              className={`w-full py-2 px-3 rounded-lg font-medium transition-all duration-200 text-xs border ${
                                isAvailable
                                  ? 'bg-white border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                                  : 'bg-white border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400'
                              }`}
                            >
                              {isAvailable ? '품절처리' : '판매재개'}
                        </button>
                          )}
                        </div>
                      )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 선택된 메뉴 저장 버튼 */}
            {selectedMenus.size > 0 && (
              <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-gray-200">
                <div className="flex flex-col gap-3">
                  <div className="text-center sm:text-left">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                      선택된 메뉴 {selectedMenus.size}개
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {dailyMenuItems.length === 0 
                        ? '선택한 메뉴들을 주문서에 추가하시겠습니까?'
                        : '선택한 메뉴들을 주문서에 추가하시겠습니까?'
                      }
                    </p>
            </div>
                  <button
                    onClick={handleSaveItems}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <i className="ri-save-line mr-2 text-sm sm:text-base"></i>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                      </div>
                    </div>
                  )}
                </div>
        )}

        {/* 토스트 알림 */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
              toast.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                toast.type === 'success' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <i className={`ri-${toast.type === 'success' ? 'check' : 'close'}-line text-sm`}></i>
              </div>
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
            </div>
          )}

      {/* Floating 저장 버튼 */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSaveItems}
            disabled={saving}
            className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full font-semibold transition-all duration-200 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center gap-2 animate-bounce hover:animate-none"
          >
            <i className="ri-save-line text-lg"></i>
            <span className="hidden sm:inline">{saving ? '저장 중...' : `저장 (${selectedMenus.size}개)`}</span>
            <span className="sm:hidden">{saving ? '저장 중...' : selectedMenus.size}</span>
          </button>
        </div>
      )}

      </div>
    </div>
  );
}