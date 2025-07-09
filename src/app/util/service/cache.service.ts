import { Injectable } from '@angular/core';
import { ICacheService } from './interfaces';
import { APP_CONFIG } from '../config/config';

/**
 * Cache entry interface
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageAccessCount: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Cache service providing intelligent caching with TTL and LRU eviction
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  /**
   * Set data in cache with optional expiry
   */
  set<T>(key: string, data: T, expiry?: number): void {
    const now = Date.now();
    const expiryTime = expiry || APP_CONFIG.OFFLINE.CACHE_EXPIRY;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiry: now + expiryTime,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.cleanupExpiredEntries();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Remove specific key from cache
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    this.cleanupExpiredEntries();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry with metadata
   */
  getEntry<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry as CacheEntry<T>;
  }

  /**
   * Update cache entry expiry
   */
  updateExpiry(key: string, newExpiry: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.expiry = Date.now() + newExpiry;
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.cleanupExpiredEntries();
    
    const entries = Array.from(this.cache.values());
    const totalEntries = entries.length;
    
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        averageAccessCount: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }

    const totalSize = this.calculateCacheSize();
    const hitRate = this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0;
    const missRate = this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0;
    const averageAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0) / totalEntries;
    
    const timestamps = entries.map(entry => entry.timestamp);
    const oldestEntry = Math.min(...timestamps);
    const newestEntry = Math.max(...timestamps);

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      averageAccessCount,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Get cache entries by pattern
   */
  getByPattern(pattern: RegExp): Array<{ key: string; entry: CacheEntry<any> }> {
    this.cleanupExpiredEntries();
    
    const matches: Array<{ key: string; entry: CacheEntry<any> }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        matches.push({ key, entry });
      }
    }
    
    return matches;
  }

  /**
   * Remove cache entries by pattern
   */
  removeByPattern(pattern: RegExp): number {
    let removedCount = 0;
    
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Get cache entries sorted by access count
   */
  getMostAccessed(limit: number = 10): Array<{ key: string; accessCount: number }> {
    this.cleanupExpiredEntries();
    
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
    
    return entries;
  }

  /**
   * Get cache entries sorted by last accessed time
   */
  getRecentlyAccessed(limit: number = 10): Array<{ key: string; lastAccessed: number }> {
    this.cleanupExpiredEntries();
    
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, lastAccessed: entry.lastAccessed }))
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, limit);
    
    return entries;
  }

  /**
   * Preload data into cache
   */
  preload<T>(key: string, dataLoader: () => Promise<T>, expiry?: number): Promise<T> {
    return dataLoader().then(data => {
      this.set(key, data, expiry);
      return data;
    });
  }

  /**
   * Get or set data with automatic loading
   */
  async getOrSet<T>(key: string, dataLoader: () => Promise<T>, expiry?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await dataLoader();
    this.set(key, data, expiry);
    return data;
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let invalidatedCount = 0;
    
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Calculate approximate cache size in bytes
   */
  private calculateCacheSize(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 32; // Approximate size for metadata
    }
    
    return size;
  }

  /**
   * Reset cache statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  /**
   * Get cache size limit
   */
  getSizeLimit(): number {
    return APP_CONFIG.PERFORMANCE.CACHE_SIZE;
  }

  /**
   * Check if cache is full
   */
  isFull(): boolean {
    return this.cache.size >= this.getSizeLimit();
  }

  /**
   * Evict least recently used entries
   */
  evictLRU(count: number = 1): number {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count);
    
    let evictedCount = 0;
    for (const [key] of entries) {
      this.cache.delete(key);
      evictedCount++;
    }
    
    return evictedCount;
  }
} 