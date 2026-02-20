import { DEFAULT_PAGE, DEFAULT_PER_PAGE, MAX_PER_PAGE } from './constants'

export interface PaginationParams {
  page: number
  perPage: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

/**
 * Normalizes raw pagination input, applying defaults and clamping limits.
 */
export function normalizePagination(
  page?: number,
  perPage?: number
): PaginationParams {
  const p = Math.max(page ?? DEFAULT_PAGE, 1)
  const pp = Math.min(Math.max(perPage ?? DEFAULT_PER_PAGE, 1), MAX_PER_PAGE)
  return { page: p, perPage: pp }
}

/**
 * Builds a PaginatedResult from items, total count, and pagination params.
 */
export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page: params.page,
      perPage: params.perPage,
      total,
      totalPages: Math.ceil(total / params.perPage),
    },
  }
}
