import { Schema } from 'joi'
import { NextFunction, Request, Response } from 'express'
import { StatusCode, ResponseCode, ResponseMessage } from '../../interface'
import { logger } from '../../logger'

type ValidationInput = { schema: Schema; input: Record<string, unknown> }
type Validate = (req: Request) => ValidationInput

export const validate = (validate: Validate) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schema, input } = validate(req)
      const validated = await schema.validateAsync(input)

      res.locals.input = validated || {}
      return next()
    } catch (err: any) {
      logger.info(err + err.toString())
      const errors = []
      if (err && err.details) {
        for (let i = 0; i < err.details.length; i++) {
          const limit = err.details[i].context.limit
          const key = err.details[i].path[0]
          errors.push({
            limit,
            key,
            type: err.details[i].type,
            message: err.details[i].message
          })
        }
      }

      return res.status(StatusCode.BAD_REQUEST).send({
        data: null,
        code: ResponseCode.BAD_REQUEST,
        message: ResponseMessage.INVALID_INPUT,
        errors
      })
    }
  }
}
