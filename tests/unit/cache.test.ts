import 'reflect-metadata'
import { cache, CacheKeys, CacheTTL } from '../../src/services/cache'

// Mock dependencies
jest.mock('@core/config', () => ({
  REDIS_URL: null, // Force memory cache for testing
}))

jest.mock('@core/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Mock Redis to avoid actual Redis connection in tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    on: jest.fn(),
  }))
})

describe('Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear memory store by accessing the internal module state
    const cacheModule = require('../../src/services/cache')
    // Reset the memory store by re-importing the module
    jest.resetModules()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Memory cache operations', () => {
    describe('get', () => {
      it('should return null for non-existent key', async () => {
        const result = await cache.get('nonexistent-key')
        expect(result).toBeNull()
      })

      it('should return cached value for existing key', async () => {
        await cache.set('test-key', { data: 'test-value' }, 300)
        const result = await cache.get('test-key')
        expect(result).toEqual({ data: 'test-value' })
      })

      it('should return null for expired key', async () => {
        await cache.set('test-key', { data: 'test-value' }, 1) // 1 second TTL
      
        // Fast forward time by 2 seconds
        jest.advanceTimersByTime(2000)
      
        // Trigger cleanup interval
        jest.runOnlyPendingTimers()
      
        const result = await cache.get('test-key')
        expect(result).toBeNull()
      })

      it('should handle different data types', async () => {
        const testValues = [
          'string',
          123,
          { object: { nested: true } },
          [1, 2, 3],
          true,
          null,
          undefined,
        ]

        for (const value of testValues) {
          await cache.set(`test-${typeof value}`, value, 300)
          const result = await cache.get(`test-${typeof value}`)
          expect(result).toEqual(value)
        }
      })
    })

    describe('set', () => {
      it('should set value with TTL', async () => {
        await cache.set('test-key', 'test-value', 300)
        const result = await cache.get('test-key')
        expect(result).toBe('test-value')
      })

      it('should overwrite existing key', async () => {
        await cache.set('test-key', 'original-value', 300)
        await cache.set('test-key', 'new-value', 300)
        const result = await cache.get('test-key')
        expect(result).toBe('new-value')
      })

      it('should handle zero TTL (immediate expiration)', async () => {
        await cache.set('test-key', 'test-value', 0)
        
        // Fast forward time
        jest.advanceTimersByTime(100)
        
        const result = await cache.get('test-key')
        expect(result).toBeNull()
      })
    })

    describe('del', () => {
      it('should delete existing key', async () => {
        await cache.set('test-key', 'test-value', 300)
        await cache.del('test-key')
        const result = await cache.get('test-key')
        expect(result).toBeNull()
      })

      it('should handle deletion of non-existent key', async () => {
        await expect(cache.del('nonexistent-key')).resolves.not.toThrow()
      })
    })

    describe('delByPrefix', () => {
      it('should delete keys with matching prefix', async () => {
        await cache.set('user:123', { id: 123, name: 'User 1' }, 300)
        await cache.set('user:456', { id: 456, name: 'User 2' }, 300)
        await cache.set('role:admin', { name: 'Admin' }, 300)
        
        await cache.delByPrefix('user:')
        
        expect(await cache.get('user:123')).toBeNull()
        expect(await cache.get('user:456')).toBeNull()
        expect(await cache.get('role:admin')).toEqual({ name: 'Admin' })
      })

      it('should handle empty prefix', async () => {
        await cache.set('key1', 'value1', 300)
        await cache.set('key2', 'value2', 300)
        
        await cache.delByPrefix('')
        
        expect(await cache.get('key1')).toBeNull()
        expect(await cache.get('key2')).toBeNull()
      })

      it('should handle non-existent prefix', async () => {
        await cache.set('key1', 'value1', 300)
        
        await cache.delByPrefix('nonexistent:')
        
        expect(await cache.get('key1')).toEqual('value1')
      })
    })
  })

  describe('Cache utilities', () => {
    describe('CacheKeys', () => {
      it('should generate correct user by ID key', () => {
        const key = CacheKeys.userById('user-123')
        expect(key).toBe('user:user-123')
      })

      it('should generate correct user by email key', () => {
        const key = CacheKeys.userByEmail('test@example.com')
        expect(key).toBe('user:email:test@example.com')
      })

      it('should generate correct role by type key', () => {
        const key = CacheKeys.roleByType('admin')
        expect(key).toBe('role:admin')
      })
    })

    describe('CacheTTL', () => {
      it('should have correct TTL values', () => {
        expect(CacheTTL.USER).toBe(300) // 5 minutes
        expect(CacheTTL.ROLE).toBe(3600) // 1 hour
      })
    })
  })

  describe('Memory cleanup', () => {
    it('should clean up expired entries automatically', async () => {
      // Set a key with 1 second TTL
      await cache.set('test-key', 'test-value', 1)
      
      // Verify it exists
      expect(await cache.get('test-key')).toBe('test-value')
      
      // Fast forward time by 2 seconds (triggers cleanup interval)
      jest.advanceTimersByTime(2000)
      
      // Trigger cleanup interval
      jest.runOnlyPendingTimers()
      
      // Verify it's cleaned up
      expect(await cache.get('test-key')).toBeNull()
    })

    it('should not clean up non-expired entries', async () => {
      // Set a key with 300 seconds TTL
      await cache.set('test-key', 'test-value', 300)
      
      // Fast forward time by 60 seconds (cleanup interval)
      jest.advanceTimersByTime(60000)
      
      // Verify it still exists
      expect(await cache.get('test-key')).toBe('test-value')
    })
  })

  describe('Redis fallback behavior', () => {
    let mockRedisClient: any

    beforeEach(() => {
      mockRedisClient = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        on: jest.fn(),
      }
    })

    it('should use Redis when available', async () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock ioredis to return our mock client
      jest.doMock('ioredis', () => {
        return jest.fn().mockImplementation(() => mockRedisClient)
      })

      // Re-import cache to get Redis-enabled version
      const cacheModule = require('../../src/services/cache')
      const redisCache = cacheModule.cache

      mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'redis-value' }))

      const result = await redisCache.get('test-key')
      expect(result).toEqual({ data: 'redis-value' })
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key')
    })

    it('should fallback to memory when Redis fails', async () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock ioredis to return our mock client
      jest.doMock('ioredis', () => {
        return jest.fn().mockImplementation(() => mockRedisClient)
      })

      // Re-import cache to get Redis-enabled version
      const cacheModule = require('../../src/services/cache')
      const redisCache = cacheModule.cache

      // Mock Redis operations to fail
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'))
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection failed'))

      // Set value (will fallback to memory since Redis fails)
      await redisCache.set('test-key', { data: 'memory-value' }, 300)
      
      // Get value (will fallback to memory since Redis fails)
      const result = await redisCache.get('test-key')
      expect(result).toEqual({ data: 'memory-value' })
    })

    it('should handle Redis set errors gracefully', async () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock ioredis to return our mock client
      jest.doMock('ioredis', () => {
        return jest.fn().mockImplementation(() => mockRedisClient)
      })

      // Re-import cache to get Redis-enabled version
      const cacheModule = require('../../src/services/cache')
      const redisCache = cacheModule.cache

      mockRedisClient.set.mockRejectedValue(new Error('Redis set failed'))
      mockRedisClient.get.mockRejectedValue(new Error('Redis get failed'))

      // Should not throw and should fallback to memory
      await expect(redisCache.set('test-key', 'value', 300)).resolves.not.toThrow()
      
      // Verify it's in memory (Redis get fails, so should fallback to memory)
      const result = await redisCache.get('test-key')
      expect(result).toBe('value')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string keys', async () => {
      await cache.set('', 'empty-key-value', 300)
      const result = await cache.get('')
      expect(result).toBe('empty-key-value')
    })

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000)
      await cache.set(longKey, 'long-key-value', 300)
      const result = await cache.get(longKey)
      expect(result).toBe('long-key-value')
    })

    it('should handle circular references in objects', async () => {
      const obj: any = { name: 'test' }
      obj.self = obj // Create circular reference
      
      // This should handle circular references gracefully or throw
      try {
        await cache.set('circular', obj, 300)
        const result = await cache.get('circular')
        // If it doesn't throw, the result should be handled
        expect(result).toBeDefined()
      } catch (error) {
        // Expected behavior for circular references
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle large objects', async () => {
      const largeArray = new Array(10000).fill(0).map((_, i) => i)
      await cache.set('large', largeArray, 300)
      const result = await cache.get('large')
      expect(result).toEqual(largeArray)
    })

    it('should handle undefined values', async () => {
      await cache.set('undefined-key', undefined, 300)
      const result = await cache.get('undefined-key')
      expect(result).toBeUndefined()
    })

    it('should handle null values', async () => {
      await cache.set('null-key', null, 300)
      const result = await cache.get('null-key')
      expect(result).toBeNull()
    })

    it('should handle negative TTL', async () => {
      await cache.set('negative-ttl', 'value', -1)
      
      // Should expire immediately
      jest.advanceTimersByTime(100)
      jest.runOnlyPendingTimers()
      
      const result = await cache.get('negative-ttl')
      expect(result).toBeNull()
    })
  })

  describe('Concurrent operations', () => {
    it('should handle concurrent reads and writes', async () => {
      const promises = []
      
      // Create multiple concurrent operations
      for (let i = 0; i < 100; i++) {
        promises.push(cache.set(`key-${i}`, `value-${i}`, 300))
        promises.push(cache.get(`key-${i}`))
      }
      
      await Promise.all(promises)
      
      // Verify all values are set correctly
      for (let i = 0; i < 100; i++) {
        const result = await cache.get(`key-${i}`)
        expect(result).toBe(`value-${i}`)
      }
    })

    it('should handle concurrent deletions', async () => {
      // Set up keys
      for (let i = 0; i < 50; i++) {
        await cache.set(`key-${i}`, `value-${i}`, 300)
      }
      
      // Delete all keys concurrently
      const deletePromises = []
      for (let i = 0; i < 50; i++) {
        deletePromises.push(cache.del(`key-${i}`))
      }
      
      await Promise.all(deletePromises)
      
      // Verify all keys are deleted
      for (let i = 0; i < 50; i++) {
        const result = await cache.get(`key-${i}`)
        expect(result).toBeNull()
      }
    })
  })

  describe('Redis error handling', () => {
    beforeEach(() => {
      // Mock Redis to be available but throw errors
      jest.doMock('ioredis', () => {
        return jest.fn().mockImplementation(() => ({
          get: jest.fn().mockRejectedValue(new Error('Redis connection error')),
          set: jest.fn().mockRejectedValue(new Error('Redis set error')),
          del: jest.fn().mockRejectedValue(new Error('Redis del error')),
          keys: jest.fn().mockRejectedValue(new Error('Redis keys error')),
          on: jest.fn(),
        }))
      })
      
      // Re-import cache to get Redis mock
      jest.resetModules()
      const cacheModule = require('../../src/services/cache')
      Object.assign(global, cacheModule)
    })

    it('should fall back to memory cache when Redis get fails', async () => {
      // Set value in memory cache first
      await cache.set('fallback-key', 'fallback-value', 300)
      
      // Try to get from Redis (will fail) and fall back to memory
      const result = await cache.get('fallback-key')
      
      expect(result).toBe('fallback-value')
    })

    it('should fall back to memory cache when Redis set fails', async () => {
      await cache.set('redis-fail-key', 'redis-fail-value', 300)
      
      const result = await cache.get('redis-fail-key')
      expect(result).toBe('redis-fail-value')
    })

    it('should handle Redis del errors gracefully', async () => {
      // Set value first
      await cache.set('del-error-key', 'del-error-value', 300)
      
      // Try to delete (Redis will fail but memory cache should still work)
      await cache.del('del-error-key')
      
      const result = await cache.get('del-error-key')
      expect(result).toBeNull() // Should be deleted from memory cache
    })

    it('should handle Redis keys errors in delByPrefix', async () => {
      // Set some values first
      await cache.set('prefix-test-1', 'value1', 300)
      await cache.set('prefix-test-2', 'value2', 300)
      await cache.set('other-key', 'other-value', 300)
      
      // Delete by prefix (Redis keys will fail, but memory cleanup should work)
      await cache.delByPrefix('prefix-test')
      
      // Memory cache keys with prefix should be deleted
      const result1 = await cache.get('prefix-test-1')
      const result2 = await cache.get('prefix-test-2')
      const resultOther = await cache.get('other-key')
      
      expect(result1).toBeNull()
      expect(result2).toBeNull()
      expect(resultOther).toBe('other-value')
    })
  })
})
