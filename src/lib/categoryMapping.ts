// 매장 카테고리별 메뉴 카테고리 매핑
export interface StoreCategoryMapping {
  [storeCategory: string]: string[];
}

// 매장 카테고리별 메뉴 카테고리 정의
export const STORE_CATEGORY_MAPPINGS: StoreCategoryMapping = {
  '한식반찬': [
    '서비스반찬',
    '월식메뉴',
    '메인요리',
    '세트메뉴',
    '국',
    '고기반찬',
    '나물류',
    '조림류',
    '튀김류',
    '김치류',
    '3000원 반찬',
    '기타',
    '젓갈류',
    '밑반찬'
  ],
  '기타': [
    '상품'
  ]
};

// 매장 카테고리별 메뉴 카테고리 가져오기
export const getMenuCategoriesByStoreCategory = (storeCategory: string): string[] => {
  return STORE_CATEGORY_MAPPINGS[storeCategory] || STORE_CATEGORY_MAPPINGS['한식반찬'];
};

// 사용 가능한 매장 카테고리 목록 가져오기
export const getAvailableStoreCategories = (): string[] => {
  return Object.keys(STORE_CATEGORY_MAPPINGS);
};

// 매장 카테고리 유효성 검사
export const isValidStoreCategory = (category: string): boolean => {
  return category in STORE_CATEGORY_MAPPINGS;
};

// 카테고리 표시 이름 매핑
export const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
  '서비스반찬': '서비스반찬 (1개씩만 골라주세요)',
  '월식메뉴': '월식메뉴',
  '메인요리': '메인요리',
  '세트메뉴': '세트메뉴',
  '국': '국',
  '고기반찬': '고기반찬',
  '나물류': '나물류',
  '조림류': '조림류',
  '튀김류': '튀김류',
  '김치류': '김치류',
  '3000원 반찬': '3000원 반찬',
  '기타': '기타',
  '젓갈류': '젓갈류',
  '밑반찬': '밑반찬'
};

// 카테고리 표시 이름 가져오기
export const getCategoryDisplayName = (category: string): string => {
  return CATEGORY_DISPLAY_NAMES[category] || category;
};
