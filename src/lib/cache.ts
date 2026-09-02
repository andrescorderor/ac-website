/**
 * High-Performance Client-Side Cache for Supabase Egress Optimization
 * Prevents redundant round-trip database queries and eliminates excessive bandwidth usage.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 2 * 60 * 1000 // Default 2 minutes TTL
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory cache first (fastest)
  const mem = memoryCache.get(key);
  if (mem && (now - mem.timestamp < ttlMs)) {
    return mem.data;
  }

  // 2. Check sessionStorage for persistence across components in the same tab
  try {
    const raw = sessionStorage.getItem(`ac_cache_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      if (now - parsed.timestamp < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  // 3. Execute fetcher
  const data = await fetcher();

  // 4. Save to caches
  const entry: CacheEntry<T> = { data, timestamp: now };
  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(`ac_cache_${key}`, JSON.stringify(entry));
  } catch (e) {
    // Ignore quota exceeded in storage
  }

  return data;
}

/**
 * Invalidate a specific cache key or all cache keys
 */
export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    try {
      const keys = Object.keys(sessionStorage);
      for (const k of keys) {
        if (k.startsWith('ac_cache_')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch {}
    return;
  }

  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }

  try {
    const keys = Object.keys(sessionStorage);
    for (const k of keys) {
      if (k.startsWith(`ac_cache_${keyPrefix}`)) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}
}
