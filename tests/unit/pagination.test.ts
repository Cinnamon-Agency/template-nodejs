import 'reflect-metadata'
import { normalizePagination, buildPaginatedResult, PaginationParams, PaginatedResult } from '../../src/common/pagination'
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, MAX_PER_PAGE } from '../../src/common/constants'

describe('Pagination Utilities', () => {
  describe('normalizePagination', () => {
    it('should return default values when no parameters provided', () => {
      const result = normalizePagination()
      
      expect(result.page).toBe(DEFAULT_PAGE)
      expect(result.perPage).toBe(DEFAULT_PER_PAGE)
    })

    it('should use provided page with default perPage', () => {
      const result = normalizePagination(5)
      
      expect(result.page).toBe(5)
      expect(result.perPage).toBe(DEFAULT_PER_PAGE)
    })

    it('should use provided perPage with default page', () => {
      const result = normalizePagination(undefined, 25)
      
      expect(result.page).toBe(DEFAULT_PAGE)
      expect(result.perPage).toBe(25)
    })

    it('should use both provided parameters', () => {
      const result = normalizePagination(3, 50)
      
      expect(result.page).toBe(3)
      expect(result.perPage).toBe(50)
    })

    it('should clamp page to minimum of 1', () => {
      const result = normalizePagination(0, 10)
      
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })

    it('should clamp negative page to 1', () => {
      const result = normalizePagination(-5, 10)
      
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(10)
    })

    it('should clamp perPage to minimum of 1', () => {
      const result = normalizePagination(2, 0)
      
      expect(result.page).toBe(2)
      expect(result.perPage).toBe(1)
    })

    it('should clamp negative perPage to 1', () => {
      const result = normalizePagination(2, -10)
      
      expect(result.page).toBe(2)
      expect(result.perPage).toBe(1)
    })

    it('should clamp perPage to maximum MAX_PER_PAGE', () => {
      const result = normalizePagination(2, MAX_PER_PAGE + 100)
      
      expect(result.page).toBe(2)
      expect(result.perPage).toBe(MAX_PER_PAGE)
    })

    it('should handle edge case values', () => {
      const result = normalizePagination(0.5, 0.5)
      
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(1)
    })

    it('should handle decimal values correctly', () => {
      const result = normalizePagination(2.7, 25.9)
      
      expect(result.page).toBe(2.7)
      expect(result.perPage).toBe(25.9)
    })
  })

  describe('buildPaginatedResult', () => {
    it('should build paginated result with valid inputs', () => {
      const items = ['item1', 'item2', 'item3']
      const total = 100
      const params: PaginationParams = { page: 2, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.items).toEqual(items)
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.perPage).toBe(10)
      expect(result.pagination.total).toBe(100)
      expect(result.pagination.totalPages).toBe(10) // Math.ceil(100/10)
    })

    it('should calculate totalPages correctly for exact division', () => {
      const items = ['item1', 'item2']
      const total = 20
      const params: PaginationParams = { page: 1, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.totalPages).toBe(2)
    })

    it('should calculate totalPages correctly for remainder', () => {
      const items = ['item1', 'item2', 'item3']
      const total = 25
      const params: PaginationParams = { page: 2, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.totalPages).toBe(3) // Math.ceil(25/10)
    })

    it('should handle empty items array', () => {
      const items: string[] = []
      const total = 0
      const params: PaginationParams = { page: 1, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.items).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })

    it('should handle single page result', () => {
      const items = ['item1', 'item2', 'item3']
      const total = 3
      const params: PaginationParams = { page: 1, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should handle large numbers correctly', () => {
      const items: string[] = new Array(100).fill(null).map((_, i) => `item${i}`)
      const total = 1000000
      const params: PaginationParams = { page: 50, perPage: 100 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.totalPages).toBe(10000) // Math.ceil(1000000/100)
    })

    it('should handle zero total with items', () => {
      const items = ['item1', 'item2']
      const total = 0
      const params: PaginationParams = { page: 1, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.items).toEqual(items)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })

    it('should preserve items array reference', () => {
      const items = ['item1', 'item2']
      const total = 2
      const params: PaginationParams = { page: 1, perPage: 10 }
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.items).toBe(items) // Same reference
    })

    it('should work with complex object types', () => {
      interface TestItem {
        id: number
        name: string
      }
      
      const items: TestItem[] = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' }
      ]
      const total = 2
      const params: PaginationParams = { page: 1, perPage: 5 }
      
      const result: PaginatedResult<TestItem> = buildPaginatedResult(items, total, params)
      
      expect(result.items).toEqual(items)
      expect(result.items[0].id).toBe(1)
      expect(result.items[0].name).toBe('test1')
    })
  })

  describe('Integration Tests', () => {
    it('should work together for typical pagination use case', () => {
      // Simulate user input
      const userPage = 2
      const userPerPage = 25
      
      // Normalize the input
      const params = normalizePagination(userPage, userPerPage)
      
      // Simulate database query result
      const items = new Array(params.perPage).fill(null).map((_, i) => `item${(params.page - 1) * params.perPage + i}`)
      const total = 1000
      
      // Build result
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.page).toBe(2)
      expect(result.pagination.perPage).toBe(25)
      expect(result.pagination.total).toBe(1000)
      expect(result.pagination.totalPages).toBe(40) // Math.ceil(1000/25)
      expect(result.items).toHaveLength(25)
    })

    it('should handle edge case where page exceeds total pages', () => {
      const params = normalizePagination(100, 10) // Page 100, but only 5 items total
      const items: string[] = [] // No items on this page
      const total = 45
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.page).toBe(100)
      expect(result.pagination.totalPages).toBe(5)
      expect(result.items).toHaveLength(0)
    })

    it('should handle boundary values correctly', () => {
      // Test with maximum perPage
      const params = normalizePagination(1, MAX_PER_PAGE)
      const items: string[] = new Array(MAX_PER_PAGE).fill(null).map((_, i) => `item${i}`)
      const total = MAX_PER_PAGE * 2
      
      const result = buildPaginatedResult(items, total, params)
      
      expect(result.pagination.perPage).toBe(MAX_PER_PAGE)
      expect(result.pagination.totalPages).toBe(2)
      expect(result.items).toHaveLength(MAX_PER_PAGE)
    })
  })
})
