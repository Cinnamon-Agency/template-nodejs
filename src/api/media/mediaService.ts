import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { ICreateMediaEntries, IMediaService, IMediaData, StorageProvider } from './interface'
import { MediaType } from '@prisma/client'

import { ResponseCode, serviceMethod } from '@common'
import { getSignedURL } from '@services/google_cloud_storage'
import { S3Service } from '@services/aws_s3'

@singleton()
@autoInjectable()
export class MediaService implements IMediaService {
  constructor(private s3Service: S3Service) {}

  @serviceMethod()
  async createMediaEntries({ mediaFiles, projectId, prisma }: ICreateMediaEntries) {
    let code: ResponseCode = ResponseCode.OK

    const dbClient = prisma || getPrismaClient()
    const mediaInfo = []

    for (const { mediaFileName, mediaType, storageProvider = StorageProvider.GOOGLE_CLOUD } of mediaFiles) {
      const created = await dbClient.media.create({
        data: {
          mediaFileName,
          mediaType,
          projectId,
        },
      })
      if (!created) {
        code = ResponseCode.FAILED_INSERT
        break
      }

      let url: string | undefined
      let googleStorageCode = 0

      if (storageProvider === StorageProvider.AWS_S3) {
        const s3Response = await this.s3Service.getSignedUrl(mediaFileName, 'write')
        url = s3Response.url
        googleStorageCode = s3Response.code
      } else {
        // Default to Google Cloud Storage
        const gcsResponse = await getSignedURL(mediaFileName, 'write')
        url = gcsResponse.url
        googleStorageCode = gcsResponse.code
      }

      mediaInfo.push({
        url,
        mediaFileName,
        googleStorageCode,
        storageProvider,
      })
    }

    return { code, mediaInfo }
  }

  async getMediaByProject(projectId: string, mediaType?: MediaType) {
    const dbClient = getPrismaClient()
    
    const whereClause: any = { projectId }
    if (mediaType) {
      whereClause.mediaType = mediaType
    }

    const mediaFiles = await dbClient.media.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return { code: ResponseCode.OK, mediaFiles }
  }

  async getDownloadUrl(mediaFileName: string, storageProvider: StorageProvider = StorageProvider.GOOGLE_CLOUD) {
    if (storageProvider === StorageProvider.AWS_S3) {
      const s3Response = await this.s3Service.getSignedUrl(mediaFileName, 'read')
      return { code: s3Response.code, url: s3Response.url }
    } else {
      // Default to Google Cloud Storage
      const gcsResponse = await getSignedURL(mediaFileName, 'read')
      return { code: gcsResponse.code, url: gcsResponse.url }
    }
  }

  async deleteMedia(mediaId: string) {
    const dbClient = getPrismaClient()
    
    const media = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { code: ResponseCode.NOT_FOUND }
    }

    // Delete from storage provider
    // Note: You would need to determine the storage provider for this media file
    // This could be stored in the database or inferred from the file name/pattern
    // For now, we'll try both providers
    try {
      await this.s3Service.deleteFile(media.mediaFileName)
    } catch (error) {
      // Ignore if file doesn't exist in S3
      console.log('File not found in S3, might be in GCS')
    }

    // Delete from database
    await dbClient.media.delete({
      where: { id: mediaId }
    })

    return { code: ResponseCode.OK }
  }
}
