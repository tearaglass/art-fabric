import { eventBus } from '@/lib/events/EventBus';

interface CacheEntry {
  data: string; // base64 or blob URL
  hash: string;
  timestamp: number;
  size: number;
  type: 'webgl' | 'p5' | 'sd' | 'image';
  metadata?: Record<string, any>;
}

class RenderCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize = 100 * 1024 * 1024; // 100MB
  private currentSize = 0;

  /**
   * Generate hash from parameters
   */
  private async generateHash(params: any): Promise<string> {
    const str = JSON.stringify(params);
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store in cache
   */
  async set(
    type: CacheEntry['type'],
    params: any,
    data: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const hash = await this.generateHash(params);
    const size = new Blob([data]).size;

    // Check if we need to evict entries
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      data,
      hash,
      timestamp: Date.now(),
      size,
      type,
      metadata,
    };

    this.cache.set(hash, entry);
    this.currentSize += size;

    // Emit cache event
    const eventMap = {
      webgl: 'webgl/cached' as const,
      p5: 'p5/cached' as const,
      sd: 'sd/cached' as const,
      image: 'webgl/cached' as const,
    };

    eventBus.emit(eventMap[type], { 
      preset: metadata?.name || 'unknown', 
      hash 
    });

    return hash;
  }

  /**
   * Retrieve from cache
   */
  async get(params: any): Promise<string | null> {
    const hash = await this.generateHash(params);
    const entry = this.cache.get(hash);

    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
      return entry.data;
    }

    return null;
  }

  /**
   * Check if cached
   */
  async has(params: any): Promise<boolean> {
    const hash = await this.generateHash(params);
    return this.cache.has(hash);
  }

  /**
   * Evict oldest entry (LRU)
   */
  private evictOldest() {
    let oldest: [string, CacheEntry] | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.timestamp < oldest[1].timestamp) {
        oldest = [key, entry];
      }
    }

    if (oldest) {
      this.currentSize -= oldest[1].size;
      this.cache.delete(oldest[0]);
    }
  }

  /**
   * Clear cache
   */
  clear(type?: CacheEntry['type']) {
    if (type) {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.type === type) {
          this.currentSize -= entry.size;
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.currentSize = 0;
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const stats = {
      total: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      byType: {} as Record<string, number>,
    };

    for (const entry of this.cache.values()) {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
    }

    return stats;
  }
}

// Singleton
export const renderCache = new RenderCache();
