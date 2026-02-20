import { NextFunction, Request, Response } from 'express'

/**
 * Middleware that sanitizes common input fields in the request body.
 * - Trims all string values
 * - Normalizes email addresses to lowercase
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      const value = req.body[key]
      if (typeof value === 'string') {
        req.body[key] = value.trim()
      }
    }

    if (typeof req.body.email === 'string') {
      req.body.email = req.body.email.toLowerCase()
    }
  }

  next()
}
