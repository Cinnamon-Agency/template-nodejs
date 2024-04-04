import { Request } from 'express'
import Joi from 'joi'

export const verifyUserSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        uid: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          )
          .required(),
        password: Joi.string()
          .min(8)
          .max(24)
          // .regex(new RegExp(atob(config.PASSWORD_BASE64_REGEX)))
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.body.uid,
      password: req.body.password
    }
  }
}

export const loginUserSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        email: Joi.string().trim().email().required(),
        password: Joi.string().required()
      })
      .options({ abortEarly: false }),
    input: {
      email: req.body.email,
      password: req.body.password
    }
  }
}

export const verifyGetEmailSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        uid: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.query.uid
    }
  }
}

export const forgotPasswordSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        email: Joi.string().required()
      })
      .options({ abortEarly: false }),
    input: {
      email: req.body.email
    }
  }
}

export const resetPasswordSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        uid: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          )
          .required(),
        password: Joi.string()
          .min(8)
          .max(24)
          // .regex(new RegExp(atob(config.PASSWORD_BASE64_REGEX)))
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.body.uid,
      password: req.body.password
    }
  }
}
