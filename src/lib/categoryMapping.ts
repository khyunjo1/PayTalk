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
  '동태탕': [
    '동태탕',
    '국물요리',
    '찌개류',
    '탕류',
    '밑반찬',
    '김치류',
    '나물류',
    '기타'
  ],
  '중식': [
    '중식메인',
    '면류',
    '밥류',
    '튀김류',
    '탕류',
    '밑반찬',
    '음료',
    '기타'
  ],
  '일식': [
    '일식메인',
    '초밥류',
    '라멘',
    '우동',
    '돈부리',
    '밑반찬',
    '음료',
    '기타'
  ],
  '양식': [
    '파스타',
    '스테이크',
    '샐러드',
    '피자',
    '리조또',
    '스프',
    '음료',
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
