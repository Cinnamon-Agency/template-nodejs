import express from 'express'
import { AuthController } from './authController'
import { validate } from '@middleware/validation'
import { loginRateLimiter } from '@middleware/rate_limiter'
import { container } from 'tsyringe'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendLoginCodeSchema,
  verifyLoginCodeSchema,
  setNewPasswordSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  sendPhoneVerificationSchema,
  verifyPhoneCodeSchema,
} from './authInput'
import { requireToken } from '@middleware/auth'

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

authRouter.post(
  '/resendLoginCode',
  validate(resendLoginCodeSchema),
  authController.resendLoginCode
)

authRouter.post(
  '/verifyLoginCode',
  validate(verifyLoginCodeSchema),
  loginRateLimiter,
  authController.verifyLoginCode
)

authRouter.post(
  '/password/setNew',
  validate(setNewPasswordSchema),
  authController.setNewPassword
)

authRouter.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail
)

authRouter.post(
  '/resend-verification-email',
  validate(resendVerificationEmailSchema),
  authController.resendVerificationEmail
)

authRouter.post(
  '/send-phone-verification',
  requireToken,
  validate(sendPhoneVerificationSchema),
  authController.sendPhoneVerification
)

authRouter.post(
  '/verify-phone',
  requireToken,
  validate(verifyPhoneCodeSchema),
  authController.verifyPhoneCode
)
