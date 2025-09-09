// 간단한 메모리 캐시 구현
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // TTL 체크
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // TTL 체크
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 특정 패턴의 키들 삭제
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// 캐시 키 생성 헬퍼
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

// 자주 사용되는 캐시 키들
export const CACHE_KEYS = {
  STORES: 'stores',
  ALL_STORES: 'all_stores',
  USER_STORES: 'user_stores',
  MENUS: (storeId: string) => `menus:${storeId}`,
  ORDERS: (storeId: string) => `orders:${storeId}`,
  USER_PROFILE: (userId: string) => `user_profile:${userId}`,
} as const;
