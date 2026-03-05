import { Request } from 'express'
import Joi from 'joi'
import { SupportRequestStatus } from './interface'

export const createSupportRequestSchemaStatus = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        subject: Joi.string().required(),
        message: Joi.string().required(),
      })
      .options({ abortEarly: false }),
    input: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    },
  }
}

export const updateSupportRequestStatusSchemaStatus = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        supportRequestId: Joi.string().required(),
        status: Joi.string()
          .valid(...Object.values(SupportRequestStatus))
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      supportRequestId: req.params.id,
      status: req.body.status,
    },
  }
}

export const getAllSupportRequestsSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
        status: Joi.string()
          .valid(...Object.values(SupportRequestStatus))
          .optional(),
      })
      .options({ abortEarly: false }),
    input: {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    },
  }
}
