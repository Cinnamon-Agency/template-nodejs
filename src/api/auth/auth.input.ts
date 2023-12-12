import { Request } from 'express'
import Joi from 'joi'

export const registerSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        firstName: Joi.string().min(1).max(36).optional(),
        lastName: Joi.string().min(1).max(36).optional(),
        email: Joi.string().trim().email().required(),
        password: Joi.string()
          .min(8)
          .max(24)
          .regex(
            /(?=[A-Za-z0-9@#$%^&+!.?=*]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=.?*])(?=.{8,}).*$/
          )
          .required()
      })
      .options({ abortEarly: false }),
    input: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password
    }
  }
}

export const loginSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      email: Joi.string().trim().email().required(),
      password: Joi.string().required()
    }),
    input: {
      email: req.body.email,
      password: req.body.password
    }
  }
}

export const resendRegistrationEmailSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      email: Joi.string().trim().email().required()
    }),
    input: {
      email: req.body.email
    }
  }
}

export const verifyRegistrationSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      email: Joi.string().trim().email().required(),
      uid: Joi.string()
        .regex(
          /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
        )
        .required()
    }),
    input: {
      email: req.body.email,
      uid: req.body.uid
    }
  }
}

export const sendResetPasswordEmailSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      email: Joi.string().trim().email().required()
    }),
    input: {
      email: req.body.email
    }
  }
}

export const resetPasswordSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      email: Joi.string().trim().email().required(),
      password: Joi.string()
      .min(8)
      .max(24)
      .regex(
        /(?=[A-Za-z0-9@#$%^&+!.?=*]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=.?*])(?=.{8,}).*$/
      )
      .required(),
      uid: Joi.string()
        .regex(
          /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
        )
        .required()
    }),
    input: {
      email: req.body.email,
      password: req.body.password,
      uid: req.body.uid
    }
  }
}

export const changePasswordSchema = (req: Request) => {
  return {
    schema: Joi.object().keys({
      currentPassword: Joi.string()
        .min(8)
        .max(24)
        .regex(
          /(?=[A-Za-z0-9@#$%^&+!.?=*]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=.?*])(?=.{8,}).*$/
        )
        .required()
        .label('currentPassword'),
      newPassword: Joi.string()
        .min(8)
        .max(24)
        .regex(
          /(?=[A-Za-z0-9@#$%^&+!.?=*]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=.?*])(?=.{8,}).*$/
        )
        .invalid(Joi.ref('currentPassword'))
        .required()
        .label('newPassword')
    }).messages({
      'any.invalid': '{{#label}} must be different than currentPassword',
    }).options({ abortEarly: false }),
    input: {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    },
  }
}