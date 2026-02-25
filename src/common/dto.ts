import { User } from '@prisma/client'

/**
 * Strips sensitive fields (password, etc.) from a User object
 * before sending it in API responses.
 */
export function sanitizeUser(user: User | Record<string, unknown>): Omit<User, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user as User
  return safeUser
}
