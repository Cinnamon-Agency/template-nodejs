import express from 'express'
import { validate } from '../../middleware/validation'
import { AuthController } from './auth.controller'
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resendRegistrationEmailSchema,
  resetPasswordSchema,
  sendResetPasswordEmailSchema,
  verifyRegistrationSchema
} from './auth.input'
import { requireToken } from '../../middleware/auth'
import { loginRateLimiter } from '../../middleware/rateLimiter'

const authController = new AuthController()
export const authRouter = express.Router()

authRouter.post('/register', validate(registerSchema), authController.register)
authRouter.post('/login', validate(loginSchema), loginRateLimiter, authController.login)
authRouter.post(
  '/register/resend',
  validate(resendRegistrationEmailSchema),
  authController.resendRegistrationEmail
)
authRouter.post('/register/verify', validate(verifyRegistrationSchema), authController.verifyRegistration)
authRouter.post('/refresh', authController.refreshToken)
authRouter.post('/logout', requireToken, authController.logout)
authRouter.post('/reset/resend', validate(sendResetPasswordEmailSchema), authController.sendResetPasswordEmail)
authRouter.post('/reset', validate(resetPasswordSchema), authController.resetPassword)
authRouter.post('/password', validate(changePasswordSchema), authController.changePassword)
authRouter.delete('/', requireToken, authController.delete)