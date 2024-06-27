import express from 'express'
import { AuthController } from './authController'
import { validate } from '../../middleware/validation'
import { loginRateLimiter } from '../../middleware/rate_limiter'
import { container } from 'tsyringe'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './authInput'
import { requireToken } from '../../middleware/auth'

const authController = container.resolve(AuthController)
export const authRouter = express.Router()

authRouter.post('/register', validate(registerSchema), authController.register)
authRouter.post(
  '/login',
  validate(loginSchema),
  loginRateLimiter,
  authController.login
)
authRouter.post('/logout', requireToken, authController.logout)
authRouter.post('/refresh', authController.refreshToken)
authRouter.post(
  '/password/forgot',
  validate(forgotPasswordSchema),
  authController.forgotPassword
)
authRouter.post(
  '/password/reset',
  validate(resetPasswordSchema),
  authController.resetPassword
)
