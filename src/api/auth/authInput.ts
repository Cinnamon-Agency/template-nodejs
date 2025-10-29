import { Request } from 'express'
import Joi from 'joi'
import { AuthType } from './interface'

export const loginSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        authType: Joi.string()
          .valid(...Object.values(AuthType))
          .required(),
        email: Joi.string().required(),
        password: Joi.alternatives().conditional('authType', {
          is: 'UserPassword',
          then: Joi.string().required(),
        }),
      })
      .options({ abortEarly: false }),
    input: {
      token: req.body.token,
      type: req.body.type,
      userCredentials: req.body.userCredentials,
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
        email: Joi.string().required(),
        password: Joi.alternatives().conditional('authType', {
          is: 'UserPassword',
          then: Joi.string().required(),
        }),
      })
      .options({ abortEarly: false }),
    input: {
      token: req.body.token,
      type: req.body.type,
      userCredentials: req.body.userCredentials,
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
        password: Joi.string()
          .min(8)
          .max(24)
          // .regex(new RegExp(atob(config.PASSWORD_BASE64_REGEX)))
          .required(),
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

export const resendVerificationMailSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        role: Joi.string().valid('provider', 'patient', 'admin').required(),
        email: Joi.string().trim().email().required(),
      })
      .options({ abortEarly: false }),
    input: {
      role: req.params.role,
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
        password: Joi.string().min(8).max(24).required(),
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
