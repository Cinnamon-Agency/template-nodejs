import Joi, { Schema } from 'joi'
import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'

type ValidationInput = { schema: Schema; input: Record<string, unknown> }
type Validate = (req: Request) => ValidationInput

interface ValidationErrorDetail {
  key: string | number | undefined
  type: string
  message: string
  limit?: number
}

export const validate = (validate: Validate) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schema, input } = validate(req)
      const validated = await schema.validateAsync(input)

      res.locals.input = validated || {}
      return next()
    } catch (err: unknown) {
      const errors: ValidationErrorDetail[] = []

      if (err instanceof Joi.ValidationError) {
        if (err && err.details) {
          for (let i = 0; i < err.details.length; i++) {
            const limit = err.details[i]?.context?.limit
            const key = err.details[i]?.path?.[0]
            errors.push({
              limit,
              key,
              type: err.details[i].type,
              message: err.details[i].message,
            })
          }
        }
      }

      return next({
        code: ResponseCode.INVALID_INPUT,
        data: { errors },
      })
    }
  }
}
