import express from 'express'
import { validate } from '@middleware/validation'
import { container } from 'tsyringe'
import { requireToken } from '@middleware/auth'
import { UserController } from './userController'
import { getUserProfileSchema } from './userInput'

const userController = container.resolve(UserController)
export const userRouter = express.Router()

userRouter.get('/', requireToken(), userController.getUser)
userRouter.patch(
  '/toggleNotifications',
  requireToken(),
  userController.toggleNotifications
)
userRouter.get(
  '/:id',
  requireToken(),
  validate(getUserProfileSchema),
  userController.getUserProfile
)
