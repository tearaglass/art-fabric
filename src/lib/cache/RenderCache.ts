import { eventBus } from '@/lib/events/EventBus';

interface CacheEntry {
  data: string; // base64 or blob URL
  hash: string;
  timestamp: number;
  size: number;
  type: 'webgl' | 'p5' | 'sd' | 'image' | 'strudel';
  metadata?: Record<string, any>;
}

// IndexedDB helper
const DB_NAME = "LaneyGenCache";
const STORE_NAME = "renders";
let idb: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (idb) return idb;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => {
      idb = request.result;
      resolve(idb);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function cachePut(hash: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const arrayBuffer = await blob.arrayBuffer();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(arrayBuffer, hash);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('[RenderCache] IndexedDB put failed:', error);
  }
}

export async function cacheGet(hash: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(hash);
    
    const arrayBuffer = await new Promise<ArrayBuffer | null>((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
    
    return arrayBuffer ? new Blob([arrayBuffer]) : null;
  } catch (error) {
    console.warn('[RenderCache] IndexedDB get failed:', error);
    return null;
  }
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
    
    // Persist to IndexedDB
    try {
      const blob = new Blob([data]);
      await cachePut(hash, blob);
    } catch (error) {
      console.warn('[RenderCache] Failed to persist to IndexedDB:', error);
    }

    // Emit cache event
    const eventMap = {
      webgl: 'webgl/cached' as const,
      p5: 'p5/cached' as const,
      sd: 'sd/cached' as const,
      image: 'webgl/cached' as const,
      strudel: 'strudel/cached' as const,
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
    
    // Try IndexedDB fallback
    try {
      const blob = await cacheGet(hash);
      if (blob) {
        const data = await blob.text();
        return data;
      }
    } catch (error) {
      console.warn('[RenderCache] IndexedDB retrieval failed:', error);
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
