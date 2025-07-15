/**
 * Cache port with an in-memory adapter.
 *
 * The application calls get/set/del/delByPrefix against this interface.
 * The current adapter is a process-local Map with per-key TTL and lazy
 * expiry. Swapping to Redis means implementing the same four methods with
 * `ioredis` — callers (controllers/services) are unaffected.
 *
 * Cache-aside (lazy loading) is the usage pattern: read tries the cache,
 * on a miss the caller loads from Mongo and populates the cache; writes
 * invalidate by key prefix.
 */
class InMemoryCache {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    // Jitter the TTL by up to 10% to avoid a cache stampede where many
    // keys expire simultaneously and all miss at once.
    const jitter = Math.floor(ttlSeconds * 0.1 * (this.hits % 7) / 7);
    const expiresAt = Date.now() + (ttlSeconds + jitter) * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async del(key) {
    this.store.delete(key);
  }

  async delByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total ? (this.hits / total).toFixed(3) : "0",
      size: this.store.size,
    };
  }
}

export const cache = new InMemoryCache();
