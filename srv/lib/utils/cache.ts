interface CacheEntry<V> {
    value: V;
    expiry: number;
}

/**
 * Lightweight, zero-dependency TTL (Time-To-Live) and LRU (Least Recently Used) Cache.
 * Evicts expired items dynamically or when max capacity is reached.
 */
export class TtlLruCache<K, V> {
    private readonly cache = new Map<K, CacheEntry<V>>();

    constructor(
        private readonly maxCapacity: number = 500,
        private readonly ttlMs: number = 5 * 60 * 1000 // default 5 minutes
    ) {}

    /**
     * Retrieve a value from the cache. Updates the item's insertion order if found and valid.
     */
    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        // Refresh usage order (move to end of insertion list)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }

    /**
     * Set a value in the cache. Evicts the oldest item if capacity is exceeded.
     */
    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxCapacity) {
            // Evict least recently used (first key in map insertion order)
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttlMs
        });
    }

    /**
     * Check if a key exists in the cache and is not expired.
     */
    has(key: K): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Delete a key from the cache.
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get the current size of non-expired cache entries.
     */
    size(): number {
        this.evictExpired();
        return this.cache.size;
    }

    private evictExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}
