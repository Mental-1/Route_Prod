import LRUCache from "lru-cache";

interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export function createCache(config: CacheConfig) {
  const cache = new LRUCache({
    max: config.maxSize,
    ttl: config.ttl,
  });

  return {
    get: (key: string) => cache.get(key),
    set: (key: string, value: any) => cache.set(key, value),
    has: (key: string) => cache.has(key),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
  };
}
