import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TtlLruCache } from '../../../srv/lib/utils/cache';

describe('TtlLruCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve values', () => {
    const cache = new TtlLruCache<string, number>(10, 1000);
    cache.set('key1', 42);
    expect(cache.get('key1')).toBe(42);
  });

  it('should return undefined for non-existent keys', () => {
    const cache = new TtlLruCache<string, number>(10, 1000);
    expect(cache.get('non-existent')).toBeUndefined();
  });

  it('should respect TTL expiration', () => {
    const cache = new TtlLruCache<string, string>(5, 100); // 100ms TTL
    cache.set('temp', 'value');

    expect(cache.get('temp')).toBe('value');

    // Advance time by 101ms
    vi.advanceTimersByTime(101);

    expect(cache.get('temp')).toBeUndefined();
  });

  it('should evict the least recently used item when capacity is exceeded', () => {
    // Max capacity = 3
    const cache = new TtlLruCache<string, string>(3, 5000);
    
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // 'a' is the oldest
    // Now add 'd' which exceeds capacity
    cache.set('d', '4');

    expect(cache.get('a')).toBeUndefined(); // Evicted!
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
    expect(cache.get('d')).toBe('4');
  });

  it('should update LRU order on get (refresh usage)', () => {
    const cache = new TtlLruCache<string, string>(3, 5000);
    
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Access 'a' to make it recently used
    expect(cache.get('a')).toBe('1');

    // Now 'b' is the least recently used (oldest)
    cache.set('d', '4');

    expect(cache.get('b')).toBeUndefined(); // 'b' is evicted instead of 'a'
    expect(cache.get('a')).toBe('1');
    expect(cache.get('c')).toBe('3');
    expect(cache.get('d')).toBe('4');
  });

  it('should update LRU order on set of existing key', () => {
    const cache = new TtlLruCache<string, string>(3, 5000);
    
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    // Update existing key 'a', making it recently used
    cache.set('a', '1-updated');

    // 'b' is now the oldest
    cache.set('d', '4');

    expect(cache.get('b')).toBeUndefined(); // 'b' evicted
    expect(cache.get('a')).toBe('1-updated');
  });

  it('should return correct status using has()', () => {
    const cache = new TtlLruCache<string, string>(5, 100);
    cache.set('key', 'val');
    expect(cache.has('key')).toBe(true);

    vi.advanceTimersByTime(101);
    expect(cache.has('key')).toBe(false);
  });

  it('should allow manual deletion of keys', () => {
    const cache = new TtlLruCache<string, string>(5, 1000);
    cache.set('key', 'val');
    expect(cache.delete('key')).toBe(true);
    expect(cache.get('key')).toBeUndefined();
    expect(cache.delete('key')).toBe(false);
  });

  it('should clear all entries', () => {
    const cache = new TtlLruCache<string, string>(5, 1000);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('should calculate size and passively evict expired items on size() call', () => {
    const cache = new TtlLruCache<string, string>(5, 100);
    cache.set('a', '1');
    cache.set('b', '2');
    expect(cache.size()).toBe(2);

    vi.advanceTimersByTime(101);
    // size() runs evictExpired
    expect(cache.size()).toBe(0);
  });
});
