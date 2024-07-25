import { Request } from 'express'
import Joi from 'joi'

export const getNotificationSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        unread: Joi.boolean().optional(),
        numberOfFetched: Joi.number().required()
      })
      .options({ abortEarly: false }),
    input: {
      unread: req.query.unread,
      numberOfFetched: req.query.numberOfFetched
    }
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
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      notificationId: req.params.notificationId
    }
  }
}

export const toogleReadStatusSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        notificationId: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required(),
        read: Joi.boolean().required()
      })
      .options({ abortEarly: false }),
    input: {
      notificationId: req.params.notificationId,
      read: req.body.read
    }
  }
}
