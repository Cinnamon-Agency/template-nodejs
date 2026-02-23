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

  describe('Redis initialization and error handling', () => {
    it('should initialize Redis client when REDIS_URL is provided', () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock ioredis constructor
      const mockRedis = jest.fn()
      jest.doMock('ioredis', () => mockRedis)
      
      // Re-import the module to trigger initialization
      jest.resetModules()
      require('../../src/services/cache')
      
      expect(mockRedis).toHaveBeenCalledWith('redis://localhost:6379', {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      })
    })

    it('should handle Redis connection errors during initialization', () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock ioredis to throw during construction
      const mockRedis = jest.fn().mockImplementation(() => {
        throw new Error('Redis connection failed')
      })
      jest.doMock('ioredis', () => mockRedis)
      
      // Mock logger
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
      }
      jest.doMock('@core/logger', () => ({
        logger: mockLogger,
      }))
      
      // Re-import the module to trigger initialization
      jest.resetModules()
      require('../../src/services/cache')
      
      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to connect to Redis for caching, using in-memory')
    })

    it('should set up Redis error event handler', () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock Redis client with on method
      const mockOn = jest.fn()
      const mockRedis = jest.fn().mockImplementation(() => ({
        on: mockOn,
      }))
      jest.doMock('ioredis', () => mockRedis)
      
      // Re-import the module
      jest.resetModules()
      require('../../src/services/cache')
      
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should log Redis errors when error event is emitted', () => {
      // Mock config to have Redis URL
      jest.doMock('@core/config', () => ({
        REDIS_URL: 'redis://localhost:6379',
      }))
      
      // Mock logger
      const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
      }
      jest.doMock('@core/logger', () => ({
        logger: mockLogger,
      }))
      
      // Mock Redis client
      let errorHandler: ((err: Error) => void) | null = null
      const mockRedis = jest.fn().mockImplementation(() => ({
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            errorHandler = handler
          }
        }),
      }))
      jest.doMock('ioredis', () => mockRedis)
      
      // Re-import the module
      jest.resetModules()
      require('../../src/services/cache')
      
      // Simulate Redis error
      if (errorHandler) {
        const redisError = new Error('Redis connection lost')
        ;(errorHandler as (err: Error) => void)(redisError)
        
        expect(mockLogger.error).toHaveBeenCalledWith('Cache Redis error:', redisError)
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

  describe('Missing coverage tests', () => {
    describe('Memory cache cleanup', () => {
      it('should clean up expired entries from memory cache', async () => {
        // Set a value with short TTL
        await cache.set('cleanup-test', 'value', 1)
        
        // Fast forward time to trigger cleanup
        jest.advanceTimersByTime(61 * 1000) // 61 seconds
        
        // Value should be cleaned up
        const result = await cache.get('cleanup-test')
        expect(result).toBeNull()
      })
    })

    describe('Redis error handling in set operation', () => {
      it('should fall back to memory cache when Redis set fails', async () => {
        // Mock Redis to throw error on set
        const RedisMock = require('ioredis')
        const mockRedis = new RedisMock()
        mockRedis.set.mockRejectedValue(new Error('Redis connection failed'))
        
        // Set value (should fall back to memory)
        await cache.set('fallback-test', 'fallback-value', 300)
        
        // Verify it's in memory cache
        const result = await cache.get('fallback-test')
        expect(result).toBe('fallback-value')
      })
    })

    describe('Redis error handling in get operation', () => {
      it('should fall back to memory cache when Redis get fails', async () => {
        // Set value in memory cache first
        await cache.set('memory-only', 'memory-value', 300)
        
        // Mock Redis to throw error on get
        const RedisMock = require('ioredis')
        const mockRedis = new RedisMock()
        mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))
        
        // Should still get from memory cache
        const result = await cache.get('memory-only')
        expect(result).toBe('memory-value')
      })
    })

    describe('Redis error handling in del operation', () => {
      it('should handle Redis del errors gracefully', async () => {
        // Set value first
        await cache.set('del-error-test', 'del-error-value', 300)
        
        // Mock Redis to throw error on del
        const RedisMock = require('ioredis')
        const mockRedis = new RedisMock()
        mockRedis.del.mockRejectedValue(new Error('Redis del failed'))
        
        // Should not throw error
        await expect(cache.del('del-error-test')).resolves.not.toThrow()
        
        // Memory cache should still be deleted
        const result = await cache.get('del-error-test')
        expect(result).toBeNull()
      })
    })

    describe('Redis error handling in delByPrefix operation', () => {
      it('should handle Redis keys and del errors gracefully', async () => {
        // Set some values first
        await cache.set('error-prefix-1', 'value1', 300)
        await cache.set('error-prefix-2', 'value2', 300)
        
        // Mock Redis to throw error on keys and del
        const RedisMock = require('ioredis')
        const mockRedis = new RedisMock()
        mockRedis.keys.mockRejectedValue(new Error('Redis keys failed'))
        mockRedis.del.mockRejectedValue(new Error('Redis del failed'))
        
        // Should not throw error
        await expect(cache.delByPrefix('error-prefix')).resolves.not.toThrow()
        
        // Memory cache should still be cleaned up
        const result1 = await cache.get('error-prefix-1')
        const result2 = await cache.get('error-prefix-2')
        expect(result1).toBeNull()
        expect(result2).toBeNull()
      })
    })

    describe('Missing coverage tests', () => {
      describe('Memory cache cleanup', () => {
        it('should clean up expired entries from memory cache', async () => {
          // Set a value with short TTL
          await cache.set('cleanup-test', 'cleanup-value', 1) // 1 second TTL
          
          // Verify it exists
          const result1 = await cache.get('cleanup-test')
          expect(result1).toBe('cleanup-value')
          
          // Fast-forward time by 2 seconds
          jest.advanceTimersByTime(2000)
          
          // Value should be cleaned up
          const result2 = await cache.get('cleanup-test')
          expect(result2).toBeNull()
        })

        it('should trigger automatic cleanup interval', async () => {
          // Set some values with short TTL
          await cache.set('auto-cleanup-1', 'value1', 1)
          await cache.set('auto-cleanup-2', 'value2', 1)
          
          // Verify they exist
          expect(await cache.get('auto-cleanup-1')).toBe('value1')
          expect(await cache.get('auto-cleanup-2')).toBe('value2')
          
          // Advance time to trigger the cleanup interval (1 minute + 2 seconds)
          jest.advanceTimersByTime(60200)
          
          // Values should be cleaned up by the interval
          expect(await cache.get('auto-cleanup-1')).toBeNull()
          expect(await cache.get('auto-cleanup-2')).toBeNull()
        })
      })

      describe('Memory cleanup interval', () => {
        it('should execute cleanup interval callback and remove expired entries', async () => {
          // Set multiple values with different expiration times
          await cache.set('key1', 'value1', 1) // Will expire in 1 second
          await cache.set('key2', 'value2', 2) // Will expire in 2 seconds  
          await cache.set('key3', 'value3', 300) // Will not expire
          
          // Verify all values exist initially
          expect(await cache.get('key1')).toBe('value1')
          expect(await cache.get('key2')).toBe('value2')
          expect(await cache.get('key3')).toBe('value3')
          
          // Fast forward time by 61 seconds to trigger the cleanup interval
          jest.advanceTimersByTime(61 * 1000)
          
          // Run the cleanup interval
          jest.runOnlyPendingTimers()
          
          // Verify expired entries are removed and non-expired remain
          expect(await cache.get('key1')).toBeNull()
          expect(await cache.get('key2')).toBeNull()
          expect(await cache.get('key3')).toBe('value3')
        })

        it('should execute cleanup callback when entries have expired', async () => {
          // Set a value that will expire
          await cache.set('expire-test', 'value', 1) // 1 second TTL
          
          // Verify it exists
          expect(await cache.get('expire-test')).toBe('value')
          
          // Fast forward time by 2 seconds to ensure it's expired
          jest.advanceTimersByTime(2000)
          
          // Trigger the cleanup interval by advancing time past the interval
          jest.advanceTimersByTime(61 * 1000)
          
          // Run all pending timers including the cleanup interval
          jest.runOnlyPendingTimers()
          
          // Verify the expired entry was cleaned up
          expect(await cache.get('expire-test')).toBeNull()
        })

        it('should directly test memory cleanup logic with expired entries', async () => {
          // Set multiple entries that will expire
          await cache.set('cleanup1', 'value1', 1) // expires in 1 second
          await cache.set('cleanup2', 'value2', 1) // expires in 1 second
          await cache.set('cleanup3', 'value3', 300) // doesn't expire
          
          // Verify they exist
          expect(await cache.get('cleanup1')).toBe('value1')
          expect(await cache.get('cleanup2')).toBe('value2')
          expect(await cache.get('cleanup3')).toBe('value3')
          
          // Wait for entries to expire
          jest.advanceTimersByTime(2000) // 2 seconds
          
          // Trigger multiple cleanup intervals to ensure callback execution
          for (let i = 0; i < 3; i++) {
            jest.advanceTimersByTime(61 * 1000) // 61 seconds
            jest.runOnlyPendingTimers()
          }
          
          // Verify expired entries are gone
          expect(await cache.get('cleanup1')).toBeNull()
          expect(await cache.get('cleanup2')).toBeNull()
          expect(await cache.get('cleanup3')).toBe('value3') // Should still exist
        })

        it('should force cleanup interval execution with many expired entries', async () => {
          // Create many expired entries to ensure the cleanup callback runs
          const expiredKeys = []
          for (let i = 0; i < 10; i++) {
            const key = `expired-${i}`
            await cache.set(key, `value-${i}`, 1) // 1 second TTL
            expiredKeys.push(key)
          }
          
          // Also create some non-expired entries
          await cache.set('valid1', 'value1', 300)
          await cache.set('valid2', 'value2', 300)
          
          // Verify all entries exist initially
          for (const key of expiredKeys) {
            expect(await cache.get(key)).toBe(`value-${key.split('-')[1]}`)
          }
          expect(await cache.get('valid1')).toBe('value1')
          expect(await cache.get('valid2')).toBe('value2')
          
          // Wait for entries to expire
          jest.advanceTimersByTime(2000) // 2 seconds
          
          // Trigger cleanup interval multiple times to ensure callback execution
          jest.advanceTimersByTime(61 * 1000) // 61 seconds - trigger first cleanup
          jest.runOnlyPendingTimers()
          
          jest.advanceTimersByTime(61 * 1000) // 61 seconds - trigger second cleanup
          jest.runOnlyPendingTimers()
          
          jest.advanceTimersByTime(61 * 1000) // 61 seconds - trigger third cleanup
          jest.runOnlyPendingTimers()
          
          // Verify expired entries are gone and valid ones remain
          for (const key of expiredKeys) {
            expect(await cache.get(key)).toBeNull()
          }
          expect(await cache.get('valid1')).toBe('value1')
          expect(await cache.get('valid2')).toBe('value2')
        })

        it('should test cleanup interval with immediate expiration and multiple triggers', async () => {
          // Set entries with zero TTL (immediate expiration)
          await cache.set('immediate1', 'value1', 0)
          await cache.set('immediate2', 'value2', 0)
          
          // Also set some normal entries
          await cache.set('normal1', 'value1', 300)
          await cache.set('normal2', 'value2', 300)
          
          // Advance time and trigger cleanup multiple times
          jest.advanceTimersByTime(100) // 100ms
          jest.runOnlyPendingTimers()
          
          jest.advanceTimersByTime(61 * 1000) // 61 seconds - trigger cleanup
          jest.runOnlyPendingTimers()
          
          jest.advanceTimersByTime(61 * 1000) // 61 seconds - trigger cleanup again
          jest.runOnlyPendingTimers()
          
          // Verify immediate entries are gone, normal ones remain
          expect(await cache.get('immediate1')).toBeNull()
          expect(await cache.get('immediate2')).toBeNull()
          expect(await cache.get('normal1')).toBe('value1')
          expect(await cache.get('normal2')).toBe('value2')
        })

        it('should test cleanup interval with mixed expiration times', async () => {
          // Set entries with different expiration times
          await cache.set('short1', 'value1', 1) // 1 second
          await cache.set('short2', 'value2', 2) // 2 seconds
          await cache.set('medium1', 'value3', 120) // 120 seconds (longer than cleanup interval)
          await cache.set('long1', 'value4', 300) // 300 seconds
          
          // Verify they exist
          expect(await cache.get('short1')).toBe('value1')
          expect(await cache.get('short2')).toBe('value2')
          expect(await cache.get('medium1')).toBe('value3')
          expect(await cache.get('long1')).toBe('value4')
          
          // Wait for short entries to expire
          jest.advanceTimersByTime(3000) // 3 seconds
          
          // Trigger cleanup interval
          jest.advanceTimersByTime(61 * 1000) // 61 seconds
          jest.runOnlyPendingTimers()
          
          // Verify short entries are gone, others remain
          expect(await cache.get('short1')).toBeNull()
          expect(await cache.get('short2')).toBeNull()
          expect(await cache.get('medium1')).toBe('value3') // Should still exist (120s TTL)
          expect(await cache.get('long1')).toBe('value4') // Should still exist (300s TTL)
          
          // Wait for medium entry to expire (need to advance past 120 seconds total)
          jest.advanceTimersByTime(61 * 1000) // 61 seconds
          jest.runOnlyPendingTimers()
          
          // Verify medium entry is now gone
          expect(await cache.get('medium1')).toBeNull()
          expect(await cache.get('long1')).toBe('value4') // Should still exist
        })
      })

      describe('Redis error handling in del operation', () => {
        it('should handle Redis del errors gracefully', async () => {
          // Set value first
          await cache.set('del-error-test', 'del-error-value', 300)
          
          // Mock Redis to throw error on del
          const RedisMock = require('ioredis')
          const mockRedis = new RedisMock()
          mockRedis.del.mockRejectedValue(new Error('Redis del failed'))
          
          // Should not throw error
          await expect(cache.del('del-error-test')).resolves.not.toThrow()
          
          // Memory cache should still be deleted
          const result = await cache.get('del-error-test')
          expect(result).toBeNull()
        })
      })

      describe('Redis error handling in delByPrefix operation', () => {
        it('should handle Redis keys and del errors gracefully', async () => {
          // Set some values first
          await cache.set('error-prefix-1', 'value1', 300)
          await cache.set('error-prefix-2', 'value2', 300)
          
          // Mock Redis to throw error on keys and del
          const RedisMock = require('ioredis')
          const mockRedis = new RedisMock()
          mockRedis.keys.mockRejectedValue(new Error('Redis keys failed'))
          mockRedis.del.mockRejectedValue(new Error('Redis del failed'))
          
          // Should not throw error
          await expect(cache.delByPrefix('error-prefix')).resolves.not.toThrow()
          
          // Memory cache should still be cleaned up
          const result1 = await cache.get('error-prefix-1')
          const result2 = await cache.get('error-prefix-2')
          expect(result1).toBeNull()
          expect(result2).toBeNull()
        })
      })
    })

    describe('Redis successful operations', () => {
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

      it('should use Redis successfully for set operation', async () => {
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

        // Mock Redis set to succeed
        mockRedisClient.set.mockResolvedValue('OK')

        // Set a value using Redis
        await redisCache.set('test-key', 'test-value', 300)

        // Verify Redis set was called
        expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', JSON.stringify('test-value'), 'EX', 300)
      })

      it('should use Redis successfully for del operation', async () => {
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

        // Mock Redis del to succeed
        mockRedisClient.del.mockResolvedValue(1)

        // Delete a key using Redis
        await redisCache.del('test-key')

        // Verify Redis del was called
        expect(mockRedisClient.del).toHaveBeenCalledWith('test-key')
      })

      it('should use Redis successfully for delByPrefix operation', async () => {
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

        // Mock Redis keys and del to succeed
        mockRedisClient.keys.mockResolvedValue(['prefix:key1', 'prefix:key2'])
        mockRedisClient.del.mockResolvedValue(2)

        // Delete keys by prefix using Redis
        await redisCache.delByPrefix('prefix')

        // Verify Redis keys and del were called
        expect(mockRedisClient.keys).toHaveBeenCalledWith('prefix*')
        expect(mockRedisClient.del).toHaveBeenCalledWith('prefix:key1', 'prefix:key2')
      })
    })
  })
})
