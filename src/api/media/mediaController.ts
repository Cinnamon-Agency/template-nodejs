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

    return next({
      code: result.code,
      data: {
        mediaInfo: result.mediaInfo
      }
    })
  }

  async getMediaByProject(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params
    const { mediaType } = req.query

    const result = await this.mediaService.getMediaByProject(
      projectId,
      mediaType as MediaType
    )

    return next({
      code: result.code,
      data: {
        mediaFiles: result.mediaFiles
      }
    })
  }

  async downloadMedia(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName } = req.params
    const { storageProvider } = req.query

    const result = await this.mediaService.getDownloadUrl(
      mediaFileName,
      storageProvider as StorageProvider
    )

    return next({
      code: result.code,
      data: {
        downloadUrl: result.url
      }
    })
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    const { mediaId } = req.params

    const result = await this.mediaService.deleteMedia(mediaId)

    return next({ code: result.code })
  }

  // S3 Specific Endpoints
  async getS3UploadURL(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName, mediaType } = res.locals.input

    const { url, code } = await this.s3Service.getSignedUrl(mediaFileName, 'write')

    return next({
      code,
      data: {
        uploadUrl: url,
        mediaFileName,
        mediaType,
        storageProvider: 'AWS_S3'
      }
    })
  }

  async getS3DownloadURL(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName } = res.locals.input

    const { url, code } = await this.s3Service.getSignedUrl(mediaFileName, 'read')

    return next({
      code,
      data: {
        downloadUrl: url
      }
    })
  }

  async completeS3Upload(req: Request, res: Response, next: NextFunction) {
    const { projectId, mediaFileName, mediaType } = res.locals.input

    const result = await this.mediaService.completeS3Upload(projectId, mediaFileName, mediaType as MediaType)

    return next({
      code: result.code,
      data: result.data
    })
  }

  async deleteS3File(req: Request, res: Response, next: NextFunction) {
    const { mediaId } = res.locals.input

    const result = await this.mediaService.deleteS3File(mediaId)

    return next({ code: result.code })
  }

  async getS3FileMetadata(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName } = res.locals.input

    const { code, metadata } = await this.s3Service.getFileMetadata(mediaFileName)

    return next({
      code,
      data: metadata
    })
  }

  async listS3Files(req: Request, res: Response, next: NextFunction) {
    const { prefix, maxKeys } = res.locals.input

    const { code, files } = await this.s3Service.listFiles(
      prefix as string,
      maxKeys
    )

    return next({
      code,
      data: files
    })
  }

  // Google Cloud Storage Specific Endpoints
  async getGCSUploadURL(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName, mediaType } = res.locals.input

    const { url, code } = await getSignedURL(mediaFileName, 'write')

    return next({
      code,
      data: {
        uploadUrl: url,
        mediaFileName,
        mediaType,
        storageProvider: 'GOOGLE_CLOUD'
      }
    })
  }

  async getGCSDownloadURL(req: Request, res: Response, next: NextFunction) {
    const { mediaFileName } = res.locals.input

    const { url, code } = await getSignedURL(mediaFileName, 'read')

    return next({
      code,
      data: {
        downloadUrl: url
      }
    })
  }

  async completeGCSUpload(req: Request, res: Response, next: NextFunction) {
    const { projectId, mediaFileName, mediaType } = res.locals.input

    const result = await this.mediaService.completeGCSUpload(projectId, mediaFileName, mediaType as MediaType)

    return next({
      code: result.code,
      data: result.data
    })
  }

  async deleteGCSFile(req: Request, res: Response, next: NextFunction) {
    const { mediaId } = res.locals.input

    const result = await this.mediaService.deleteGCSFile(mediaId)

    return next({ code: result.code })
  }

  // Generic getUploadURL endpoint (storage provider agnostic)
  async getUploadURL(req: Request, res: Response, next: NextFunction) {
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

    return next({
      code,
      data: {
        uploadUrl: url,
        mediaFileName,
        mediaType,
        storageProvider: provider
      }
    })
  }
}
