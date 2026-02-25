import express from 'express'
import { validate } from '@middleware/validation'
import { container } from 'tsyringe'
import { requireToken } from '@middleware/auth'
import { NotificationController } from './notificationController'
import {
  getNotificationSchema,
  toggleReadStatusSchema,
  deleteNotificationSchema,
} from './notificationInput'

const notificationController = container.resolve(NotificationController)
export const notificationRouter = express.Router()

notificationRouter.get(
  '/',
  requireToken(),
  validate(getNotificationSchema),
  notificationController.getNotifications
)
notificationRouter.put(
  '/:notificationId',
  requireToken(),
  validate(toggleReadStatusSchema),
  notificationController.toggleReadStatus
)
notificationRouter.delete(
  '/:notificationId',
  requireToken(),
  validate(deleteNotificationSchema),
  notificationController.deleteNotification
)
