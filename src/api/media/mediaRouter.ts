import express from 'express'
import { container } from 'tsyringe'
import { requireToken } from '@middleware/auth'
import { MediaController } from './mediaController'

const mediaController = container.resolve(MediaController)
export const mediaRouter = express.Router()

// Generic getUploadURL endpoint (storage provider agnostic)
mediaRouter.post(
  '/upload-url',
  requireToken(),
  mediaController.getUploadURL
)

// S3 Specific endpoints
mediaRouter.post(
  '/s3/upload-url',
  requireToken(),
  mediaController.getS3UploadURL
)

mediaRouter.post(
  '/s3/complete-upload/:projectId',
  requireToken(),
  mediaController.completeS3Upload
)

mediaRouter.get(
  '/s3/:mediaFileName/download-url',
  requireToken(),
  mediaController.getS3DownloadURL
)

mediaRouter.delete(
  '/s3/:mediaId',
  requireToken(),
  mediaController.deleteS3File
)

mediaRouter.get(
  '/s3/:mediaFileName/metadata',
  requireToken(),
  mediaController.getS3FileMetadata
)

mediaRouter.get(
  '/s3/files',
  requireToken(),
  mediaController.listS3Files
)

// Google Cloud Storage Specific endpoints
mediaRouter.post(
  '/gcs/upload-url',
  requireToken(),
  mediaController.getGCSUploadURL
)

mediaRouter.post(
  '/gcs/complete-upload/:projectId',
  requireToken(),
  mediaController.completeGCSUpload
)

mediaRouter.get(
  '/gcs/:mediaFileName/download-url',
  requireToken(),
  mediaController.getGCSDownloadURL
)

mediaRouter.delete(
  '/gcs/:mediaId',
  requireToken(),
  mediaController.deleteGCSFile
)
