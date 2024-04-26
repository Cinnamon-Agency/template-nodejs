import express from 'express'
import { validate } from '../../middleware/validation'
import { ProfileController } from './profile.controller'
import { editProfileSchema, getByIdSchema } from './profile.input'
import { requireToken } from '../../middleware/auth'
import { container } from 'tsyringe'

const profileController = container.resolve(ProfileController)
export const profileRouter = express.Router()

profileRouter.get('/', requireToken, profileController.getProfile)
profileRouter.get(
  '/:id',
  requireToken,
  validate(getByIdSchema),
  profileController.getUserProfile
)
profileRouter.put(
  '/',
  requireToken,
  validate(editProfileSchema),
  profileController.editProfile
)
profileRouter.post('/image', requireToken, profileController.upload)
