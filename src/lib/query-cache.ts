// =============================================================================
// QueryCache - Client-side TTL + LRU cache
// Default TTL: 5 minutes | Max size: 50 entries
// =============================================================================

export const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_MAX_SIZE = 50;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  accessedAt: number;
}

export class QueryCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  constructor(options?: { maxSize?: number; defaultTtl?: number }) {
    this.maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
    this.defaultTtl = options?.defaultTtl ?? DEFAULT_TTL_MS;
  }

  // ─── Core API ───────────────────────────────────────────────────────────────

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update LRU access time
    entry.accessedAt = now;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const ttlMs = ttl ?? this.defaultTtl;

    // If already at capacity, evict least-recently-used entry
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLru();
    }

    this.cache.set(key, {
      data,
      expiresAt: now + ttlMs,
      accessedAt: now,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries whose key starts with the given prefix.
   * Useful for invalidating all pages of a table query at once.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Return cached value if fresh; otherwise call `fetcher`, cache the result,
   * and return it. Handles serialization of complex objects automatically.
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  // ─── Introspection ───────────────────────────────────────────────────────────

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  get size(): number {
    return this.cache.size;
  }

  /** Purge all expired entries. */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // ─── LRU Eviction ────────────────────────────────────────────────────────────

  private evictLru(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessedAt < lruTime) {
        lruTime = entry.accessedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

/** Shared application-level query cache. */
export const queryCache = new QueryCache();

// ─── Key Builders ─────────────────────────────────────────────────────────────

/**
 * Build a stable cache key from an object of parameters.
 * Sorts keys for determinism.
 */
export function buildCacheKey(base: string, params?: Record<string, unknown>): string {
  if (!params) return base;
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');
  return sorted ? `${base}?${sorted}` : base;
}
