import express from 'express'
import { MessageController } from './messageController'
import { getMessageBySlug } from './messageInput'
import { validate } from '../../middleware/validation'
import { container } from 'tsyringe'

const messageController = container.resolve(MessageController)
export const messageRouter = express.Router()

messageRouter.get(
  '/:slug',
  validate(getMessageBySlug),
  messageController.getMessage
)
