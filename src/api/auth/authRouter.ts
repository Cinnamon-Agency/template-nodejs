import express from 'express'
import { AuthController } from './authController'
import {
  forgotPasswordSchema,
  loginUserSchema,
  resetPasswordSchema,
  verifyGetEmailSchema,
  verifyUserSchema
} from './authInput'
import { requireToken } from '../../middleware/auth'
import { validate } from '../../middleware/validation'
import { loginRateLimiter } from '../../middleware/rateLimiter'
import { container } from 'tsyringe'

const authController = container.resolve(AuthController)
export const authRouter = express.Router()

authRouter.post(
  '/verify',
  validate(verifyUserSchema),
  authController.verifyUser
)
authRouter.post('/login', validate(loginUserSchema), loginRateLimiter, authController.login)
authRouter.post('/refresh', authController.refreshToken)
authRouter.post('/logout', requireToken, authController.logout)
authRouter.get(
  '/email',
  validate(verifyGetEmailSchema),
  authController.getEmail
)
authRouter.post('/password/forgot', validate(forgotPasswordSchema), authController.forgotPassword)
authRouter.post('/password/reset', validate(resetPasswordSchema), authController.resetPassword)