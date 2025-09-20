import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../../lib/menuApi';
import {
  createDailyMenu,
  getDailyMenu,
  addDailyMenuItem,
  getDailyMenuItems,
  toggleDailyMenuItemAvailability,
  removeDailyMenuItem,
  getLatestDailyMenu,
  copyStoreSettingsToDailyMenu,
  getDailyDeliveryAreas,
  addDailyDeliveryArea,
  updateDailyDeliveryArea,
  removeDailyDeliveryArea,
  copyStoreDeliveryAreasToDailyMenu
} from '../../../lib/dailyMenuApi';
import { getStore } from '../../../lib/storeApi';
import { getMenuCategoriesByStoreCategory, getCategoryDisplayName } from '../../../lib/categoryMapping';
import { getCurrentKoreaTime } from '../../../lib/dateUtils';
import type { DailyMenu, DailyMenuItem } from '../../../lib/dailyMenuApi';
import type { MenuDB, DailyDeliveryArea } from '../../../types';
import Header from '../../../components/Header';

export default function AdminDailyMenu() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { } = useNewAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 매장 정보 상태
  const [menuCategories, setMenuCategories] = useState<string[]>([]);

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(() => {
    // 한국 시간대 기준으로 오늘 날짜를 기본값으로 설정
    const koreaTime = getCurrentKoreaTime();
    return koreaTime.toISOString().split('T')[0];
  });
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>([]);
  const [availableMenus, setAvailableMenus] = useState<MenuDB[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());

  // 아코디언 상태 관리
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 수정 사항 감지 상태
  const [hasChanges, setHasChanges] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);

  // 배달지역 관리 상태
  const [deliveryAreas, setDeliveryAreas] = useState<DailyDeliveryArea[]>([]);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DailyDeliveryArea | null>(null);
  const [areaForm, setAreaForm] = useState({
    area_name: '',
    delivery_fee: 0
  });
  const [minimumOrderAmountInput, setMinimumOrderAmountInput] = useState('');
  const [deliveryFeeInput, setDeliveryFeeInput] = useState('');

  // 메뉴 관리 상태
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuDB | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

  // 선택된 메뉴 변경 감지
  useEffect(() => {
    setHasChanges(selectedMenus.size > 0);
  }, [selectedMenus]);

  // 메뉴 카테고리가 로드되면 기본 카테고리 설정
  useEffect(() => {
    if (menuCategories.length > 0 && !menuForm.category) {
      setMenuForm(prev => ({ ...prev, category: menuCategories[0] }));
    }
  }, [menuCategories, menuForm.category]);

  // dailyMenu 변경 시 입력 필드 동기화
  useEffect(() => {
    if (dailyMenu) {
        setMinimumOrderAmountInput(dailyMenu.minimum_order_amount?.toString() || '0');
    }
  }, [dailyMenu]);

  // 설정값 변경 감지
  useEffect(() => {
    if (dailyMenu) {
      // 기본값과 다른지 확인
      const hasSettingsChanged: boolean = 
        Boolean(dailyMenu.pickup_time_slots && dailyMenu.pickup_time_slots.length > 0) ||
        Boolean(dailyMenu.delivery_time_slots && dailyMenu.delivery_time_slots.length > 0) ||
        Boolean(dailyMenu.order_cutoff_time) ||
        Boolean(dailyMenu.minimum_order_amount && dailyMenu.minimum_order_amount > 0) ||
        deliveryAreas.length > 0;
      
      setSettingsChanged(hasSettingsChanged);
    }
  }, [dailyMenu, deliveryAreas]);

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
      console.log('🔍 loadData 시작:', { storeId, selectedDate });

      // 1. 매장 정보 로드
      console.log('🔍 매장 정보 로드 중...');
      const store = await getStore(storeId);
      console.log('✅ 매장 정보 로드 완료:', store);
      
      // 2. 매장 카테고리에 맞는 메뉴 카테고리 설정
      const categories = getMenuCategoriesByStoreCategory(store.category);
      setMenuCategories(categories);

      // 3. 사용 가능한 메뉴 목록 로드
      console.log('🔍 메뉴 목록 로드 중...');
      const menus = await getMenus(storeId);
      const availableMenus = menus.filter(menu => menu.is_available);
      setAvailableMenus(availableMenus);
      console.log('✅ 메뉴 목록 로드 완료:', availableMenus.length, '개');

      // 4. 선택된 날짜의 일일 메뉴 로드
      console.log('🔍 일일 메뉴 조회 중:', { storeId, selectedDate });
      let existingDailyMenu: DailyMenu | null = null;
      try {
        existingDailyMenu = await getDailyMenu(storeId, selectedDate);
        console.log('✅ 일일 메뉴 조회 완료:', existingDailyMenu);
      } catch (error) {
        console.error('❌ 일일 메뉴 조회 오류:', error);
        
        // daily_menus 테이블이 없는 경우 사용자에게 알림
        if (error.message?.includes('daily_menus 테이블이 존재하지 않습니다')) {
          alert('일일 메뉴 기능을 사용하려면 데이터베이스에 daily_menus 테이블을 생성해야 합니다.\n\ncreate-daily-menus-table.sql 파일의 내용을 Supabase SQL Editor에서 실행해주세요.');
          setLoading(false);
          return;
        }
        
        // 다른 오류는 계속 진행
      }
      setDailyMenu(existingDailyMenu);
      
      if (existingDailyMenu) {
        console.log('🔍 로드된 일일 메뉴:', existingDailyMenu);
        console.log('🔍 로드된 배달 시간대:', existingDailyMenu.delivery_time_slots);
        console.log('🔍 로드된 배달 시간대 타입:', typeof existingDailyMenu.delivery_time_slots);
        console.log('🔍 로드된 배달 시간대 JSON:', JSON.stringify(existingDailyMenu.delivery_time_slots));
      }

      if (existingDailyMenu) {
        // 3. 일일 메뉴 아이템들 로드
        const items = await getDailyMenuItems(existingDailyMenu.id);
        setDailyMenuItems(items);

        // 4. 선택된 메뉴 설정
        const selectedSet = new Set(items.map(item => item.menu_id));
        setSelectedMenus(selectedSet);

        // 5. 배달지역 로드
        const areas = await getDailyDeliveryAreas(existingDailyMenu.id);
        setDeliveryAreas(areas);
      } else {
        // 새로운 일일 메뉴인 경우 생성
        try {
          const newDailyMenu = await createDailyMenu({
            store_id: storeId,
            menu_date: selectedDate,
            title: '오늘의 반찬',
            description: '맛있는 반찬을 주문해보세요!'
          });
          
          // 매장의 기본 설정값을 복사
          if (newDailyMenu) {
            const updatedDailyMenu = await copyStoreSettingsToDailyMenu(storeId, newDailyMenu.id);
            setDailyMenu(updatedDailyMenu || newDailyMenu);
            
            // 매장의 기본 배달지역을 복사
            const areas = await copyStoreDeliveryAreasToDailyMenu(storeId, newDailyMenu.id);
            setDeliveryAreas(areas);
          } else {
            setDailyMenu(newDailyMenu);
          }
          
          setDailyMenuItems([]);
          setSelectedMenus(new Set());
        } catch (error) {
          console.error('새 일일 메뉴 생성 오류:', error);
          setDailyMenuItems([]);
          setSelectedMenus(new Set());
        }
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
      console.log('🔍 일일 메뉴 생성 시작:', { storeId, selectedDate });
      
      const newDailyMenu = await createDailyMenu({
        store_id: storeId,
        menu_date: selectedDate,
        title: `${selectedDate}의 반찬 주문서`,
        description: '맛있는 반찬을 주문해보세요!'
      });

      console.log('🔍 생성된 일일 메뉴:', newDailyMenu);
      setDailyMenu(newDailyMenu);
      
      // 생성 후 데이터 다시 로드
      console.log('🔍 데이터 다시 로드 시작');
      await loadData();
      console.log('🔍 데이터 다시 로드 완료');
      
      alert('일일 메뉴 페이지가 생성되었습니다!');
    } catch (error) {
      console.error('❌ 일일 메뉴 생성 오류:', error);
      console.error('❌ 오류 상세 정보:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
        
        // 설정값들도 함께 불러와서 현재 일일 메뉴에 적용
        if (dailyMenu) {
          const updatedDailyMenu = {
            ...dailyMenu,
            pickup_time_slots: latestMenuData.menu.pickup_time_slots || dailyMenu.pickup_time_slots,
            delivery_time_slots: latestMenuData.menu.delivery_time_slots || dailyMenu.delivery_time_slots,
            // delivery_fee: latestMenuData.menu.delivery_fee || dailyMenu.delivery_fee,
            order_cutoff_time: latestMenuData.menu.order_cutoff_time || dailyMenu.order_cutoff_time,
            minimum_order_amount: latestMenuData.menu.minimum_order_amount || dailyMenu.minimum_order_amount
          };
          setDailyMenu(updatedDailyMenu);
        }
        
        const dateStr = latestMenuData.menu.menu_date;
        if (latestMenuData.items.length > 0) {
          alert(`${dateStr}의 메뉴 ${latestMenuData.items.length}개와 설정값들을 불러왔습니다. 수정 후 저장해주세요.`);
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

  // 설정값 수정 핸들러들
  const handlePickupTimeChange = (index: number, value: string) => {
    if (!dailyMenu) return;
    
    const newPickupTimeSlots = [...(dailyMenu.pickup_time_slots || ['09:00', '20:00'])];
    newPickupTimeSlots[index] = value;
    
    setDailyMenu({
      ...dailyMenu,
      pickup_time_slots: newPickupTimeSlots
    });
  };


  const handleOrderCutoffTimeChange = (value: string) => {
    if (!dailyMenu) return;
    
    setDailyMenu({
      ...dailyMenu,
      order_cutoff_time: value
    });
  };

  const handleMinimumOrderAmountChange = (value: number) => {
    if (!dailyMenu) return;
    
    setDailyMenu({
      ...dailyMenu,
      minimum_order_amount: value
    });
  };

  const handleDeliveryTimeSlotToggle = (index: number, enabled: boolean) => {
    console.log('🔍 배달 시간대 토글:', { index, enabled });
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = [...(dailyMenu.delivery_time_slots || [])];
    newDeliveryTimeSlots[index] = {
      ...newDeliveryTimeSlots[index],
      enabled
    };
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
    console.log('✅ settingsChanged를 true로 설정');
  };

  const handleDeliveryTimeSlotNameChange = (index: number, name: string) => {
    console.log('🔍 배달 시간대 이름 변경:', { index, name });
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = [...(dailyMenu.delivery_time_slots || [])];
    newDeliveryTimeSlots[index] = {
      ...newDeliveryTimeSlots[index],
      name
    };
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
    console.log('✅ settingsChanged를 true로 설정');
  };

  const handleDeliveryTimeSlotStartChange = (index: number, start: string) => {
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = [...(dailyMenu.delivery_time_slots || [])];
    newDeliveryTimeSlots[index] = {
      ...newDeliveryTimeSlots[index],
      start
    };
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
  };

  const handleDeliveryTimeSlotEndChange = (index: number, end: string) => {
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = [...(dailyMenu.delivery_time_slots || [])];
    newDeliveryTimeSlots[index] = {
      ...newDeliveryTimeSlots[index],
      end
    };
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
  };

  const handleAddDeliveryTimeSlot = () => {
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = [
      ...(dailyMenu.delivery_time_slots || []),
      {
        name: 'ex) 오후배송',
        start: '09:00',
        end: '18:00',
        enabled: true
      }
    ];
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
  };

  const handleRemoveDeliveryTimeSlot = (index: number) => {
    if (!dailyMenu) return;
    
    const newDeliveryTimeSlots = (dailyMenu.delivery_time_slots || []).filter((_, i) => i !== index);
    
    setDailyMenu({
      ...dailyMenu,
      delivery_time_slots: newDeliveryTimeSlots
    });
    setSettingsChanged(true);
  };


  // 배달지역 관리 핸들러들
  const handleAddArea = async () => {
    if (!dailyMenu || !areaForm.area_name.trim()) return;
    
    try {
      const newArea = await addDailyDeliveryArea(
        dailyMenu.id,
        areaForm.area_name.trim(),
        areaForm.delivery_fee
      );
      
      setDeliveryAreas(prev => [...prev, newArea]);
      setAreaForm({ area_name: '', delivery_fee: 0 });
      setShowAddAreaModal(false);
      alert('배달지역이 추가되었습니다.');
    } catch (error) {
      console.error('배달지역 추가 오류:', error);
      alert('배달지역 추가에 실패했습니다.');
    }
  };

  const handleEditArea = async () => {
    if (!editingArea || !areaForm.area_name.trim()) return;
    
    try {
      const updatedArea = await updateDailyDeliveryArea(
        editingArea.id,
        areaForm.area_name.trim(),
        areaForm.delivery_fee
      );
      
      setDeliveryAreas(prev => 
        prev.map(area => area.id === editingArea.id ? updatedArea : area)
      );
      
      setEditingArea(null);
      setAreaForm({ area_name: '', delivery_fee: 0 });
      alert('배달지역이 수정되었습니다.');
    } catch (error) {
      console.error('배달지역 수정 오류:', error);
      alert('배달지역 수정에 실패했습니다.');
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('이 배달지역을 삭제하시겠습니까?')) return;
    
    try {
      await removeDailyDeliveryArea(areaId);
      setDeliveryAreas(prev => prev.filter(area => area.id !== areaId));
      alert('배달지역이 삭제되었습니다.');
    } catch (error) {
      console.error('배달지역 삭제 오류:', error);
      alert('배달지역 삭제에 실패했습니다.');
    }
  };

  const openEditAreaModal = (area: DailyDeliveryArea) => {
    setEditingArea(area);
    setAreaForm({
      area_name: area.area_name,
      delivery_fee: area.delivery_fee
    });
    setDeliveryFeeInput(area.delivery_fee.toString());
    setShowAddAreaModal(true);
  };

  // 메뉴 관리 함수들
  const openMenuModal = (menu?: MenuDB) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        name: menu.name,
        description: menu.description || '',
        price: menu.price.toString(),
        category: menu.category
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: menuCategories.length > 0 ? menuCategories[0] : ''
      });
    }
    setShowMenuModal(true);
  };

  const handleSaveMenu = async () => {
    if (!menuForm.name.trim()) {
      alert('메뉴명을 입력해주세요.');
      return;
    }
    if (!menuForm.price || isNaN(Number(menuForm.price)) || Number(menuForm.price) < 0) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }
    if (!storeId) {
      alert('매장 정보가 없습니다.');
      return;
    }

    try {
      setSaving(true);
      
      if (editingMenu) {
        // 메뉴 수정
        const updatedMenu = await updateMenu(editingMenu.id, {
          name: menuForm.name.trim(),
          description: menuForm.description.trim(),
          price: Number(menuForm.price),
          category: menuForm.category
        });
        
        // availableMenus 업데이트
        setAvailableMenus(prev => 
          prev.map(menu => menu.id === editingMenu.id ? updatedMenu : menu)
        );
        
        alert('메뉴가 수정되었습니다.');
      } else {
        // 메뉴 생성
        const newMenu = await createMenu({
          store_id: storeId,
          name: menuForm.name.trim(),
          description: menuForm.description.trim(),
          price: Number(menuForm.price),
          category: menuForm.category,
          is_available: true
        });
        
        // availableMenus에 새 메뉴 추가
        setAvailableMenus(prev => [...prev, newMenu]);
        
        alert('메뉴가 추가되었습니다.');
      }
      
      setShowMenuModal(false);
    } catch (error) {
      console.error('메뉴 저장 오류:', error);
      alert('메뉴 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (menuId: string, menuName: string) => {
    if (!confirm(`"${menuName}" 메뉴를 삭제하시겠습니까?\n삭제된 메뉴는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setSaving(true);
      
      await deleteMenu(menuId);
      
      // availableMenus에서 제거
      setAvailableMenus(prev => prev.filter(menu => menu.id !== menuId));
      
      // selectedMenus에서도 제거
      setSelectedMenus(prev => {
        const newSet = new Set(prev);
        newSet.delete(menuId);
        return newSet;
      });
      
      alert('메뉴가 삭제되었습니다.');
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      alert('메뉴 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
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


  // 개별 아이템 품절 처리 (로컬 상태만 업데이트)
  const handleToggleItemAvailability = (itemId: string, currentAvailability: boolean) => {
    setItemAvailability(prev => ({
      ...prev,
      [itemId]: !currentAvailability
    }));
  };

  // 일일 메뉴 아이템 저장
  const handleSaveItems = async () => {
    console.log('🔍 저장 버튼 클릭됨');
    console.log('🔍 settingsChanged 상태:', settingsChanged);
    console.log('🔍 dailyMenu 상태:', dailyMenu);
    
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

      // 4. 일일 메뉴 설정값 저장 (배달 시간대, 최소주문금액 등)
      if (settingsChanged && dailyMenu) {
        console.log('🔍 설정값 저장 시작:', {
          dailyMenuId: dailyMenu.id,
          settings: {
            delivery_time_slots: dailyMenu.delivery_time_slots,
            pickup_time_slots: dailyMenu.pickup_time_slots,
            order_cutoff_time: dailyMenu.order_cutoff_time,
            minimum_order_amount: dailyMenu.minimum_order_amount
          }
        });
        
        await copyStoreSettingsToDailyMenu(
          dailyMenu.id,
          {
            delivery_time_slots: dailyMenu.delivery_time_slots,
            pickup_time_slots: dailyMenu.pickup_time_slots,
            order_cutoff_time: dailyMenu.order_cutoff_time,
            minimum_order_amount: dailyMenu.minimum_order_amount
          }
        );
        
        console.log('✅ 설정값 저장 완료');
      }

      // 5. 로컬 상태 초기화
      setItemAvailability({});
      setSelectedMenus(new Set());
      setHasChanges(false);
      setSettingsChanged(false);

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

  // 모든 메뉴 선택/해제 함수
  const handleSelectAllMenus = () => {
    // 현재 모든 메뉴가 선택되어 있는지 확인
    const allSelected = availableMenus.length > 0 && 
      availableMenus.every(menu => selectedMenus.has(menu.id));
    
    if (allSelected) {
      // 모든 메뉴 선택 해제
      setSelectedMenus(new Set());
      console.log('🔍 모든 메뉴 선택 해제');
    } else {
      // 모든 메뉴 선택
      const allMenuIds = new Set(availableMenus.map(menu => menu.id));
      setSelectedMenus(allMenuIds);
      console.log('🔍 모든 메뉴 선택:', allMenuIds.size, '개');
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
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <i className="ri-calendar-line text-orange-500 text-lg sm:text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">주문서 날짜 선택</h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <label className="text-sm sm:text-base font-semibold text-gray-700 sm:min-w-0">날짜:</label>
            <div className="flex-1">
              {/* 커스텀 날짜 선택 버튼 */}
              <div className="relative">
                <button
                  onClick={() => {
                    const input = document.getElementById('date-input') as HTMLInputElement;
                    if (input) (input as any).showPicker?.() || input.click();
                  }}
                  className="w-auto px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                >
                  <span className="text-gray-900">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    }) : '날짜를 선택하세요'}
                  </span>
                  <i className="ri-calendar-line text-orange-500 text-lg"></i>
                </button>
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    console.log('선택된 날짜:', selectedDate);
                    setSelectedDate(selectedDate);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 주문서 상태 정보 - 날짜 선택 카드 안에 포함 */}
          {dailyMenu && (
            <>
              {/* 구분선 */}
              <div className="my-6 border-t border-gray-200"></div>
              
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
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
              <div className="flex justify-start mt-4">
                <button
                  onClick={handleCopyLink}
                  className="group flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-orange-500 text-gray-800 hover:text-white border border-gray-300 hover:border-orange-500 rounded-2xl transition-all duration-300 text-base font-bold w-auto min-w-[200px] shadow-sm hover:shadow-lg"
                >
                  <i className="ri-link text-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"></i>
                  <span className="whitespace-nowrap">링크 복사</span>
                </button>
              </div>
            </>
          )}
        </div>

          
        {/* 일일 메뉴 생성 */}
        {!dailyMenu && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 mb-4 sm:mb-8">
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
                <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                      <i className="ri-restaurant-line text-orange-500 text-lg sm:text-xl"></i>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">주문서 수정</h2>
                    </div>
                  </div>
                  
                  {/* 최근 주문서 적용 버튼 - 작게 만들어서 헤딩 옆에 배치 */}
                  <button
                    onClick={handleLoadRecentTemplate}
                    disabled={loading}
                    className="group flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-lg transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg disabled:shadow-sm transform hover:scale-105 disabled:transform-none"
                  >
                    <div className="flex items-center justify-center w-5 h-5 bg-white bg-opacity-20 rounded-full group-hover:bg-opacity-30 transition-all duration-300">
                      <i className="ri-file-copy-line text-sm group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <span className="whitespace-nowrap">
                      {loading ? '불러오는 중...' : '최근 주문서 적용'}
                    </span>
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                </div>

                {/* 일일 설정값 관리 - 개선된 UI */}
                <div className="space-y-6 mb-6">


                  {/* 배달지역 및 배달비 관리 카드 */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7EC'}}>
                          <i className="ri-map-pin-line text-sm" style={{color: '#16A34A'}}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold" style={{color: '#111827'}}>배달비 설정</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {deliveryAreas.map((area) => (
                          <div key={area.id} className="p-3 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all" style={{borderColor: '#E5E7EB'}}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7EC'}}>
                                  <i className="ri-map-pin-2-line text-xs" style={{color: '#16A34A'}}></i>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-gray-900 truncate">{area.area_name}</div>
                                  <div className="font-bold text-lg text-gray-900">{area.delivery_fee.toLocaleString()}원</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-3">
                                <button
                                  onClick={() => openEditAreaModal(area)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border"
                                  style={{backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#2563EB'}}
                                >
                                  <i className="ri-edit-line text-xs"></i>
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteArea(area.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border"
                                  style={{backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#DC2626'}}
                                >
                                  <i className="ri-delete-bin-line text-xs"></i>
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setEditingArea(null);
                            setAreaForm({ area_name: '', delivery_fee: 0 });
                            setDeliveryFeeInput('');
                            setShowAddAreaModal(true);
                          }}
                          className="w-full py-3 px-4 bg-white border rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm hover:bg-gray-50"
                          style={{color: '#111827', borderColor: '#E5E7EB'}}
                        >
                          <i className="ri-add-line text-sm"></i>
                          배달지역 추가
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 주문마감시간 & 최소주문금액 카드 */}
                  <div className="bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow" style={{borderColor: '#E5E7EB'}}>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7EC'}}>
                          <i className="ri-money-dollar-circle-line text-sm sm:text-lg" style={{color: '#16A34A'}}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base sm:text-lg font-bold" style={{color: '#111827'}}>주문 조건 설정</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>주문마감시간</label>
                          <div className="relative">
                            <button
                              onClick={() => {
                                const input = document.getElementById('cutoff-time-input') as HTMLInputElement;
                                if (input) (input as any).showPicker?.() || input.click();
                              }}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                            >
                              <span className="text-gray-900">
                                {dailyMenu.order_cutoff_time ? 
                                  new Date(`2000-01-01T${dailyMenu.order_cutoff_time}`).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  }) : '시간을 선택하세요'
                                }
                              </span>
                              <i className="ri-time-line text-orange-500 text-lg"></i>
                            </button>
                            <input
                              id="cutoff-time-input"
                              type="time"
                              value={dailyMenu.order_cutoff_time || ''}
                              onChange={(e) => handleOrderCutoffTimeChange(e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>최소주문금액 (원)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={minimumOrderAmountInput}
                              onChange={(e) => {
                                setMinimumOrderAmountInput(e.target.value);
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                handleMinimumOrderAmountChange(value);
                              }}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                              min="0"
                              placeholder="0"
                            />
                            <i className="ri-money-dollar-circle-line text-orange-500 text-lg absolute right-4 top-1/2 transform -translate-y-1/2"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 픽업시간 설정 카드 */}
                  <div className="bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow" style={{borderColor: '#E5E7EB'}}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7EC'}}>
                          <i className="ri-time-line text-sm" style={{color: '#16A34A'}}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold" style={{color: '#111827'}}>픽업시간 설정</h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>시작 시간</label>
                          <div className="relative">
                            <button
                              onClick={() => {
                                const input = document.getElementById('pickup-start-time-input') as HTMLInputElement;
                                if (input) (input as any).showPicker?.() || input.click();
                              }}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                            >
                              <span className="text-gray-900">
                                {dailyMenu.pickup_time_slots?.[0] || '09:00'}
                              </span>
                              <i className="ri-time-line text-orange-500 text-lg"></i>
                            </button>
                            <input
                              id="pickup-start-time-input"
                              type="time"
                              value={dailyMenu.pickup_time_slots?.[0] || '09:00'}
                              onChange={(e) => handlePickupTimeChange(0, e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center pt-8">
                          <span className="text-gray-500 text-lg font-bold">~</span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>종료 시간</label>
                          <div className="relative">
                            <button
                              onClick={() => {
                                const input = document.getElementById('pickup-end-time-input') as HTMLInputElement;
                                if (input) (input as any).showPicker?.() || input.click();
                              }}
                              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                            >
                              <span className="text-gray-900">
                                {dailyMenu.pickup_time_slots?.[1] || '20:00'}
                              </span>
                              <i className="ri-time-line text-orange-500 text-lg"></i>
                            </button>
                            <input
                              id="pickup-end-time-input"
                              type="time"
                              value={dailyMenu.pickup_time_slots?.[1] || '20:00'}
                              onChange={(e) => handlePickupTimeChange(1, e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 배달시간대 설정 카드 */}
                  <div className="bg-white rounded-xl border shadow-md hover:shadow-lg transition-shadow" style={{borderColor: '#E5E7EB'}}>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#E6F7EC'}}>
                          <i className="ri-truck-line text-sm sm:text-lg" style={{color: '#16A34A'}}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base sm:text-lg font-bold" style={{color: '#111827'}}>배달시간대 설정</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {(dailyMenu.delivery_time_slots || []).map((slot, index) => (
                          <div key={index} className="p-3 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all" style={{borderColor: '#E5E7EB'}}>
                            {/* 시간대 이름과 액션 버튼들 - 가로 배치 */}
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="text"
                                value={slot.name}
                                onChange={(e) => handleDeliveryTimeSlotNameChange(index, e.target.value)}
                                placeholder="ex) 오후배송"
                                className="flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
                                style={{borderColor: '#E5E7EB', maxWidth: '200px'}}
                              />
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={slot.enabled}
                                    onChange={(e) => handleDeliveryTimeSlotToggle(index, e.target.checked)}
                                    className="w-4 h-4 border rounded focus:ring-green-500"
                                    style={{borderColor: '#E5E7EB'}}
                                  />
                                </label>
                                <button
                                  onClick={() => handleRemoveDeliveryTimeSlot(index)}
                                  className="px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 border whitespace-nowrap"
                                  style={{backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#DC2626'}}
                                >
                                  <i className="ri-delete-bin-line text-xs"></i>
                                  <span className="hidden sm:inline">삭제</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* 시간 입력 - 가로 배치 */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>시작 시간</label>
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`delivery-start-time-${index}`) as HTMLInputElement;
                                      if (input) (input as any).showPicker?.() || input.click();
                                    }}
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                                  >
                                    <span className="text-gray-900">{slot.start}</span>
                                    <i className="ri-time-line text-orange-500 text-lg"></i>
                                  </button>
                                  <input
                                    id={`delivery-start-time-${index}`}
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) => handleDeliveryTimeSlotStartChange(index, e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-center pt-8">
                                <span className="text-gray-500 text-lg font-bold">~</span>
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-semibold mb-3" style={{color: '#111827'}}>종료 시간</label>
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`delivery-end-time-${index}`) as HTMLInputElement;
                                      if (input) (input as any).showPicker?.() || input.click();
                                    }}
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-semibold min-h-[56px] bg-white hover:bg-gray-50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-md"
                                  >
                                    <span className="text-gray-900">{slot.end}</span>
                                    <i className="ri-time-line text-orange-500 text-lg"></i>
                                  </button>
                                  <input
                                    id={`delivery-end-time-${index}`}
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) => handleDeliveryTimeSlotEndChange(index, e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={handleAddDeliveryTimeSlot}
                          className="w-full py-3 px-4 bg-white border rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm hover:bg-gray-50"
                          style={{color: '#111827', borderColor: '#E5E7EB'}}
                        >
                          <i className="ri-add-line text-sm"></i>
                          배달시간대 추가
                        </button>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>
            
            
            
            {/* 메뉴 관리 버튼 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-restaurant-line text-blue-600 text-sm"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">메뉴 관리</h3>
                  <p className="text-sm text-gray-500">
                    {selectedMenus.size}개 선택됨 / 전체 {availableMenus.length}개
                  </p>
                </div>
              </div>
              
              {/* 모던한 버튼들을 가로 한 줄로 배치 */}
              <div className="flex gap-3">
                {/* 모두 선택 버튼 - 모던 디자인 */}
                <button
                  onClick={handleSelectAllMenus}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${
                    availableMenus.length > 0 && availableMenus.every(menu => selectedMenus.has(menu.id))
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    availableMenus.length > 0 && availableMenus.every(menu => selectedMenus.has(menu.id))
                      ? 'border-white bg-white'
                      : 'border-white'
                  }`}>
                    {availableMenus.length > 0 && availableMenus.every(menu => selectedMenus.has(menu.id)) && (
                      <i className="ri-check-line text-emerald-600 text-xs font-bold"></i>
                    )}
                  </div>
                  {availableMenus.length > 0 && availableMenus.every(menu => selectedMenus.has(menu.id))
                    ? '전체 해제'
                    : '모두 선택'
                  }
                </button>
                
                {/* 메뉴 추가 버튼 - 모던 디자인 */}
                <button
                  onClick={() => openMenuModal()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <i className="ri-add-line text-white text-xs font-bold"></i>
                  </div>
                  메뉴 추가
                </button>
              </div>
              
            </div>

            {/* 아코디언 메뉴 선택 */}
            <div className={`space-y-2 sm:space-y-3 mb-4 sm:mb-6 ${(hasChanges || settingsChanged) ? 'pb-20' : ''}`}>
              {Object.entries(menuByCategory)
                .sort(([categoryA], [categoryB]) => {
                  const indexA = menuCategories.indexOf(categoryA);
                  const indexB = menuCategories.indexOf(categoryB);
                  
                  // 순서에 없는 카테고리는 맨 뒤로
                  if (indexA === -1 && indexB === -1) return categoryA.localeCompare(categoryB);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  
                  return indexA - indexB;
                })
                .map(([category, menus]) => {
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
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{getCategoryDisplayName(category)}</h3>
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
                        <div className="flex items-center gap-2">
                          {/* 메뉴 관리 버튼들 */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openMenuModal(menu)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="메뉴 수정"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteMenu(menu.id, menu.name)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="메뉴 삭제"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                          
                          {existingItem && isSelected && (
                            <button
                              onClick={() => handleToggleItemAvailability(existingItem.id, isAvailable)}
                              className={`py-1 px-2 rounded text-xs font-medium transition-all duration-200 border ${
                                isAvailable
                                  ? 'bg-white border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                                  : 'bg-white border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400'
                              }`}
                            >
                              {isAvailable ? '품절처리' : '판매재개'}
                            </button>
                          )}
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
                      </div>

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

      {/* Floating 저장 바 - 고객 주문 페이지 스타일 */}
      {(hasChanges || settingsChanged) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              {/* 저장 버튼만 중앙 배치 */}
              <button
                onClick={handleSaveItems}
                disabled={saving}
                className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <i className="ri-save-line text-sm"></i>
                {saving ? '저장 중...' : '주문서 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 배달지역 추가/수정 모달 */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                {editingArea ? '배달지역 수정' : '배달지역 추가'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지역명
                  </label>
                  <input
                    type="text"
                    value={areaForm.area_name}
                    onChange={(e) => setAreaForm(prev => ({ ...prev, area_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="예: 평거동, 이현동, 신앙동"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배달비 (원)
                  </label>
                  <input
                    type="number"
                    value={deliveryFeeInput}
                    onChange={(e) => {
                      setDeliveryFeeInput(e.target.value);
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      setAreaForm(prev => ({ ...prev, delivery_fee: value }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddAreaModal(false);
                    setEditingArea(null);
                    setAreaForm({ area_name: '', delivery_fee: 0 });
                    setDeliveryFeeInput('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={editingArea ? handleEditArea : handleAddArea}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium"
                >
                  {editingArea ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 추가/수정 모달 */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingMenu ? '메뉴 수정' : '메뉴 추가'}
                </h3>
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메뉴명 *
                  </label>
                  <input
                    type="text"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="메뉴명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 (원) *
                  </label>
                  <input
                    type="number"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    min="0"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {menuCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={menuForm.description}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    rows={3}
                    placeholder="메뉴 설명을 입력하세요 (선택사항)"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveMenu}
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  {saving && <i className="ri-loader-4-line animate-spin text-sm"></i>}
                  {editingMenu ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}