// 매장 카테고리별 메뉴 카테고리 매핑
export interface StoreCategoryMapping {
  [storeCategory: string]: string[];
}

// 매장 카테고리별 메뉴 카테고리 정의
export const STORE_CATEGORY_MAPPINGS: StoreCategoryMapping = {
  '한식반찬': [
    '메인요리',
    '국',
    '김치류',
    '젓갈류',
    '나물류',
    '조림류',
    '튀김류',
    '밑반찬',
    '고기반찬',
    '세트메뉴',
    '월식메뉴',
    '3000원 반찬',
    '오늘의 특가',
    '오늘의 메인반찬',
    '서비스반찬',
    '기타'
  ],
  '기타': [
    '메인요리',
    '국',
    '김치류',
    '젓갈류',
    '나물류',
    '조림류',
    '튀김류',
    '밑반찬',
    '고기반찬',
    '세트메뉴',
    '월식메뉴',
    '3000원 반찬',
    '오늘의 특가',
    '오늘의 메인반찬',
    '서비스반찬',
    '기타'
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
