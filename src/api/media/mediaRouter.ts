import express from 'express'
import { container } from 'tsyringe'
import { requireToken } from '@middleware/auth'
import { validate } from '@middleware/validation'
import { MediaController } from './mediaController'
import {
  getUploadURLSchema,
  getS3UploadURLSchema,
  completeS3UploadSchema,
  getS3DownloadURLSchema,
  deleteS3FileSchema,
  getS3FileMetadataSchema,
  listS3FilesSchema,
  getGCSUploadURLSchema,
  completeGCSUploadSchema,
  getGCSDownloadURLSchema,
  deleteGCSFileSchema
} from './mediaInput'

const mediaController = container.resolve(MediaController)
export const mediaRouter = express.Router()

// Generic getUploadURL endpoint (storage provider agnostic)
mediaRouter.post(
  '/upload-url',
  requireToken(),
  validate(getUploadURLSchema),
  mediaController.getUploadURL
)

// S3 Specific endpoints
mediaRouter.post(
  '/s3/upload-url',
  requireToken(),
  validate(getS3UploadURLSchema),
  mediaController.getS3UploadURL
)

mediaRouter.post(
  '/s3/complete-upload/:projectId',
  requireToken(),
  validate(completeS3UploadSchema),
  mediaController.completeS3Upload
)

mediaRouter.get(
  '/s3/:mediaFileName/download-url',
  requireToken(),
  validate(getS3DownloadURLSchema),
  mediaController.getS3DownloadURL
)

mediaRouter.delete(
  '/s3/:mediaId',
  requireToken(),
  validate(deleteS3FileSchema),
  mediaController.deleteS3File
)

mediaRouter.get(
  '/s3/:mediaFileName/metadata',
  requireToken(),
  validate(getS3FileMetadataSchema),
  mediaController.getS3FileMetadata
)

mediaRouter.get(
  '/s3/files',
  requireToken(),
  validate(listS3FilesSchema),
  mediaController.listS3Files
)

// Google Cloud Storage Specific endpoints
mediaRouter.post(
  '/gcs/upload-url',
  requireToken(),
  validate(getGCSUploadURLSchema),
  mediaController.getGCSUploadURL
)

mediaRouter.post(
  '/gcs/complete-upload/:projectId',
  requireToken(),
  validate(completeGCSUploadSchema),
  mediaController.completeGCSUpload
)

mediaRouter.get(
  '/gcs/:mediaFileName/download-url',
  requireToken(),
  validate(getGCSDownloadURLSchema),
  mediaController.getGCSDownloadURL
)

mediaRouter.delete(
  '/gcs/:mediaId',
  requireToken(),
  validate(deleteGCSFileSchema),
  mediaController.deleteGCSFile
)
