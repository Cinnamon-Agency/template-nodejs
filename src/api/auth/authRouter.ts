// Node.js modules
import express from 'express'

// Internal modules
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
  googleLoginSchema,
  appleLoginSchema,
} from './authInput'
import { requireToken } from '@middleware/auth'
import { passwordResetRateLimiter, verificationRateLimiter } from '@middleware/rate_limiter'

const authController = container.resolve(AuthController)
export const authRouter = express.Router()

authRouter.post('/register', validate(registerSchema), loginRateLimiter, authController.register)
authRouter.post(
  '/login',
  validate(loginSchema),
  loginRateLimiter,
  authController.login
)
authRouter.post('/logout', requireToken(), authController.logout)
authRouter.post('/refresh', authController.refreshToken)

authRouter.post(
  '/password/forgot',
  validate(forgotPasswordSchema),
  passwordResetRateLimiter,
  authController.forgotPassword
)
authRouter.post(
  '/password/reset',
  validate(resetPasswordSchema),
  passwordResetRateLimiter,
  authController.resetPassword
)

authRouter.post(
  '/resendLoginCode',
  validate(resendLoginCodeSchema),
  verificationRateLimiter,
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
  passwordResetRateLimiter,
  authController.setNewPassword
)

authRouter.post(
  '/verify-email',
  validate(verifyEmailSchema),
  verificationRateLimiter,
  authController.verifyEmail
)

authRouter.post(
  '/resend-verification-email',
  validate(resendVerificationEmailSchema),
  verificationRateLimiter,
  authController.resendVerificationEmail
)

authRouter.post(
  '/send-phone-verification',
  requireToken(),
  validate(sendPhoneVerificationSchema),
  verificationRateLimiter,
  authController.sendPhoneVerification
)

authRouter.post(
  '/verify-phone',
  requireToken(),
  validate(verifyPhoneCodeSchema),
  verificationRateLimiter,
  authController.verifyPhoneCode
)

authRouter.post(
  '/google',
  validate(googleLoginSchema),
  loginRateLimiter,
  authController.googleLogin
)

authRouter.post(
  '/apple',
  validate(appleLoginSchema),
  loginRateLimiter,
  authController.appleLogin
)
