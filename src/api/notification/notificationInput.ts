import { Request } from 'express'
import Joi from 'joi'

export const getNotificationSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        unread: Joi.boolean().optional(),
        page: Joi.number().integer().min(1).default(1),
        perPage: Joi.number().integer().min(1).max(100).default(20),
      })
      .options({ abortEarly: false }),
    input: {
      unread: req.query.unread,
      page: req.query.page,
      perPage: req.query.perPage,
    },
  }
}

export const deleteNotificationSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        notificationId: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      notificationId: req.params.notificationId,
    },
  }
}

export const toggleReadStatusSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        notificationId: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required(),
        read: Joi.boolean().required(),
      })
      .options({ abortEarly: false }),
    input: {
      notificationId: req.params.notificationId,
      read: req.body.read,
    },
  }
}
