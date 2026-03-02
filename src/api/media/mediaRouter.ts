import express from 'express'
import { container } from 'tsyringe'
import { requireToken } from '@middleware/auth'
import { MediaController } from './mediaController'

const mediaController = container.resolve(MediaController)
export const mediaRouter = express.Router()

mediaRouter.post(
  '/projects/:projectId/media',
  requireToken(),
  mediaController.uploadMedia
)

mediaRouter.get(
  '/projects/:projectId/media',
  requireToken(),
  mediaController.getMediaByProject
)

mediaRouter.get(
  '/media/:mediaFileName/download',
  requireToken(),
  mediaController.downloadMedia
)

mediaRouter.delete(
  '/media/:mediaId',
  requireToken(),
  mediaController.deleteMedia
)
