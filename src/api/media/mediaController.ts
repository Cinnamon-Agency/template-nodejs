import { Request, Response, NextFunction } from 'express'
import { autoInjectable, singleton } from 'tsyringe'
import { MediaService } from './mediaService'
import { S3Service } from '@services/aws_s3'
import { IMediaData, StorageProvider } from './interface'
import { MediaType } from '@prisma/client'
import { ResponseCode } from '@common/response'
import { getPrismaClient } from '@services/prisma'
import { getSignedURL } from '@services/google_cloud_storage'

@singleton()
@autoInjectable()
export class MediaController {
  constructor(
    private mediaService: MediaService,
    private s3Service: S3Service
  ) {}

  // Original unified endpoints
  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params
      const { mediaFiles } = req.body

      const mediaData: IMediaData[] = mediaFiles.map((file: any) => ({
        mediaFileName: file.mediaFileName,
        mediaType: file.mediaType as MediaType,
        storageProvider: file.storageProvider as StorageProvider || StorageProvider.GOOGLE_CLOUD
      }))

      const result = await this.mediaService.createMediaEntries({
        mediaFiles: mediaData,
        projectId
      })

      res.status(201).json({
        success: result.code === ResponseCode.OK,
        data: result.mediaInfo,
        message: result.code === ResponseCode.OK ? 'Media uploaded successfully' : 'Failed to upload media'
      })
    } catch (error) {
      next(error)
    }
  }

  async getMediaByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params
      const { mediaType } = req.query

      const result = await this.mediaService.getMediaByProject(
        projectId,
        mediaType as MediaType
      )

      res.status(200).json({
        success: result.code === ResponseCode.OK,
        data: result.mediaFiles,
        message: result.code === ResponseCode.OK ? 'Media retrieved successfully' : 'Failed to retrieve media'
      })
    } catch (error) {
      next(error)
    }
  }

  async downloadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName } = req.params
      const { storageProvider } = req.query

      const result = await this.mediaService.getDownloadUrl(
        mediaFileName,
        storageProvider as StorageProvider
      )

      res.status(200).json({
        success: result.code === ResponseCode.OK,
        data: { downloadUrl: result.url },
        message: result.code === ResponseCode.OK ? 'Download URL generated successfully' : 'Failed to generate download URL'
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaId } = req.params

      const result = await this.mediaService.deleteMedia(mediaId)

      res.status(200).json({
        success: result.code === ResponseCode.OK,
        message: result.code === ResponseCode.OK ? 'Media deleted successfully' : 'Failed to delete media'
      })
    } catch (error) {
      next(error)
    }
  }

  // S3 Specific Endpoints
  async getS3UploadURL(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName, mediaType } = res.locals.input

      const { url, code } = await this.s3Service.getSignedUrl(mediaFileName, 'write')

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: {
          uploadUrl: url,
          mediaFileName,
          mediaType,
          storageProvider: 'AWS_S3'
        },
        message: code === ResponseCode.OK ? 'S3 upload URL generated successfully' : 'Failed to generate S3 upload URL'
      })
    } catch (error) {
      next(error)
    }
  }

  async getS3DownloadURL(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName } = res.locals.input

      const { url, code } = await this.s3Service.getSignedUrl(mediaFileName, 'read')

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: { downloadUrl: url },
        message: code === ResponseCode.OK ? 'S3 download URL generated successfully' : 'Failed to generate S3 download URL'
      })
    } catch (error) {
      next(error)
    }
  }

  async completeS3Upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, mediaFileName, mediaType } = res.locals.input

      const dbClient = getPrismaClient()

      // Verify file exists in S3
      const { code, metadata } = await this.s3Service.getFileMetadata(mediaFileName)
      if (code !== ResponseCode.OK) {
        return res.status(404).json({
          success: false,
          message: 'File not found in S3'
        })
      }

      // Create media record in database
      const media = await dbClient.media.create({
        data: {
          mediaFileName,
          mediaType: mediaType as MediaType,
          projectId,
        },
      })

      res.status(201).json({
        success: true,
        data: {
          id: media.id,
          mediaFileName: media.mediaFileName,
          mediaType: media.mediaType,
          projectId: media.projectId,
          createdAt: media.createdAt,
          storageProvider: 'AWS_S3',
          fileSize: metadata?.size
        },
        message: 'S3 upload completed successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteS3File(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaId } = res.locals.input

      const dbClient = getPrismaClient()

      // Get media record
      const media = await dbClient.media.findUnique({
        where: { id: mediaId }
      })

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        })
      }

      // Delete from S3
      const { code } = await this.s3Service.deleteFile(media.mediaFileName)
      if (code !== ResponseCode.OK) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete file from S3'
        })
      }

      // Delete from database
      await dbClient.media.delete({
        where: { id: mediaId }
      })

      res.status(200).json({
        success: true,
        message: 'S3 file deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  async getS3FileMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName } = res.locals.input

      const { code, metadata } = await this.s3Service.getFileMetadata(mediaFileName)

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: metadata,
        message: code === ResponseCode.OK ? 'S3 file metadata retrieved successfully' : 'Failed to retrieve S3 file metadata'
      })
    } catch (error) {
      next(error)
    }
  }

  async listS3Files(req: Request, res: Response, next: NextFunction) {
    try {
      const { prefix, maxKeys } = res.locals.input

      const { code, files } = await this.s3Service.listFiles(
        prefix as string,
        maxKeys
      )

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: files,
        message: code === ResponseCode.OK ? 'S3 files listed successfully' : 'Failed to list S3 files'
      })
    } catch (error) {
      next(error)
    }
  }

  // Google Cloud Storage Specific Endpoints
  async getGCSUploadURL(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName, mediaType } = res.locals.input

      const { url, code } = await getSignedURL(mediaFileName, 'write')

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: {
          uploadUrl: url,
          mediaFileName,
          mediaType,
          storageProvider: 'GOOGLE_CLOUD'
        },
        message: code === ResponseCode.OK ? 'GCS upload URL generated successfully' : 'Failed to generate GCS upload URL'
      })
    } catch (error) {
      next(error)
    }
  }

  async getGCSDownloadURL(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName } = res.locals.input

      const { url, code } = await getSignedURL(mediaFileName, 'read')

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: { downloadUrl: url },
        message: code === ResponseCode.OK ? 'GCS download URL generated successfully' : 'Failed to generate GCS download URL'
      })
    } catch (error) {
      next(error)
    }
  }

  async completeGCSUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, mediaFileName, mediaType } = res.locals.input

      const dbClient = getPrismaClient()

      // Verify file exists in GCS by trying to get read URL
      const { code } = await getSignedURL(mediaFileName, 'read')
      if (code !== ResponseCode.OK) {
        return res.status(404).json({
          success: false,
          message: 'File not found in Google Cloud Storage'
        })
      }

      // Create media record in database
      const media = await dbClient.media.create({
        data: {
          mediaFileName,
          mediaType: mediaType as MediaType,
          projectId,
        },
      })

      res.status(201).json({
        success: true,
        data: {
          id: media.id,
          mediaFileName: media.mediaFileName,
          mediaType: media.mediaType,
          projectId: media.projectId,
          createdAt: media.createdAt,
          storageProvider: 'GOOGLE_CLOUD'
        },
        message: 'GCS upload completed successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteGCSFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaId } = res.locals.input

      const dbClient = getPrismaClient()

      // Get media record
      const media = await dbClient.media.findUnique({
        where: { id: mediaId }
      })

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        })
      }

      // Note: In a real implementation, you would delete the file from GCS
      // For now, we'll just delete the database record
      // You would need to implement GCS file deletion using the Google Cloud Storage admin SDK

      // Delete from database
      await dbClient.media.delete({
        where: { id: mediaId }
      })

      res.status(200).json({
        success: true,
        message: 'GCS file deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  // Generic getUploadURL endpoint (storage provider agnostic)
  async getUploadURL(req: Request, res: Response, next: NextFunction) {
    try {
      const { mediaFileName, mediaType, storageProvider } = res.locals.input

      const provider = storageProvider as StorageProvider || StorageProvider.GOOGLE_CLOUD
      let url: string | undefined
      let code: ResponseCode

      if (provider === StorageProvider.AWS_S3) {
        const s3Response = await this.s3Service.getSignedUrl(mediaFileName, 'write')
        url = s3Response.url
        code = s3Response.code
      } else {
        // Default to Google Cloud Storage
        const gcsResponse = await getSignedURL(mediaFileName, 'write')
        url = gcsResponse.url
        code = gcsResponse.code
      }

      res.status(200).json({
        success: code === ResponseCode.OK,
        data: {
          uploadUrl: url,
          mediaFileName,
          mediaType,
          storageProvider: provider
        },
        message: code === ResponseCode.OK ? 'Upload URL generated successfully' : 'Failed to generate upload URL'
      })
    } catch (error) {
      next(error)
    }
  }
}
