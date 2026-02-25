import { Request } from 'express'
import Joi from 'joi'
import { AuthType } from '@prisma/client'
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@common'

/**
 * Shared password validation rule.
 * Requires at least one uppercase, one lowercase, and one digit.
 */
const passwordRule = Joi.string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[A-Z]/, 'uppercase letter')
  .regex(/[a-z]/, 'lowercase letter')
  .regex(/\d/, 'digit')
  .messages({
    'string.min': `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    'string.max': `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    'string.pattern.name': 'Password must contain at least one {#name}',
  })

export const loginSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        authType: Joi.string()
          .valid(...Object.values(AuthType))
          .required(),
        email: Joi.string().email().required(),
        password: Joi.alternatives().conditional('authType', {
          is: 'USER_PASSWORD',
          then: Joi.string().required(),
        }),
      })
      .options({ abortEarly: false }),
    input: {
      authType: req.body.authType,
      email: req.body.email,
      password: req.body.password,
    },
  }
}

export const registerSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        authType: Joi.string()
          .valid(...Object.values(AuthType))
          .required(),
        email: Joi.string().email().required(),
        password: Joi.alternatives().conditional('authType', {
          is: 'USER_PASSWORD',
          then: passwordRule.required(),
        }),
      })
      .options({ abortEarly: false }),
    input: {
      authType: req.body.authType,
      email: req.body.email,
      password: req.body.password,
    },
  }
}

export const forgotPasswordSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        email: Joi.string().required(),
      })
      .options({ abortEarly: false }),
    input: {
      email: req.body.email,
    },
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
        password: passwordRule.required(),
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.body.uid,
      password: req.body.password,
    },
  }
}

export const verifyLoginCodeSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        loginCode: Joi.string()
          .regex(/^\d{4}$/)
          .required(),
        email: Joi.string().trim().email().required(),
        dontAskOnThisDevice: Joi.boolean().optional(),
      })
      .options({ abortEarly: false }),
    input: {
      loginCode: req.body.loginCode,
      email: req.body.email,
      dontAskOnThisDevice: req.body.dontAskOnThisDevice,
    },
  }
}

export const resendLoginCodeSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        email: Joi.string().trim().email().required(),
      })
      .options({ abortEarly: false }),
    input: {
      email: req.body.email,
    },
  }
}

export const setNewPasswordSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        uid: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          )
          .required(),
        password: passwordRule.required(),
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.body.uid,
      password: req.body.password,
    },
  }
}

export const verifyEmailSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        uid: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          )
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      uid: req.body.uid,
    },
  }
}

export const resendVerificationEmailSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        email: Joi.string().email().required(),
      })
      .options({ abortEarly: false }),
    input: {
      email: req.body.email,
    },
  }
}

export const sendPhoneVerificationSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        phoneNumber: Joi.string()
          .pattern(/^\+?[1-9]\d{1,14}$/)
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      phoneNumber: req.body.phoneNumber,
    },
  }
}

export const verifyPhoneCodeSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        code: Joi.string()
          .pattern(/^\d{6}$/)
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      code: req.body.code,
    },
  }
}
