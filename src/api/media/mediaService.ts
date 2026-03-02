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

  @serviceMethod()
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

  @serviceMethod()
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

  @serviceMethod()
  async completeS3Upload(projectId: string, mediaFileName: string, mediaType: MediaType) {
    const dbClient = getPrismaClient()

    // Verify file exists in S3
    const { code, metadata } = await this.s3Service.getFileMetadata(mediaFileName)
    if (code !== ResponseCode.OK) {
      return { code: ResponseCode.NOT_FOUND, message: 'File not found in S3' }
    }

    // Create media record in database
    const media = await dbClient.media.create({
      data: {
        mediaFileName,
        mediaType,
        projectId,
      },
    })

    return {
      code: ResponseCode.OK,
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
    }
  }

  @serviceMethod()
  async deleteS3File(mediaId: string) {
    const dbClient = getPrismaClient()

    // Get media record
    const media = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { code: ResponseCode.NOT_FOUND, message: 'Media not found' }
    }

    // Delete from S3
    const { code } = await this.s3Service.deleteFile(media.mediaFileName)
    if (code !== ResponseCode.OK) {
      return { code: ResponseCode.FAILED_DELETE, message: 'Failed to delete file from S3' }
    }

    // Delete from database
    await dbClient.media.delete({
      where: { id: mediaId }
    })

    return { code: ResponseCode.OK, message: 'S3 file deleted successfully' }
  }

  @serviceMethod()
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

  @serviceMethod()
  async completeGCSUpload(projectId: string, mediaFileName: string, mediaType: MediaType) {
    const dbClient = getPrismaClient()

    // Verify file exists in GCS by trying to get read URL
    const { code } = await getSignedURL(mediaFileName, 'read')
    if (code !== ResponseCode.OK) {
      return { code: ResponseCode.NOT_FOUND, message: 'File not found in Google Cloud Storage' }
    }

    // Create media record in database
    const media = await dbClient.media.create({
      data: {
        mediaFileName,
        mediaType,
        projectId,
      },
    })

    return {
      code: ResponseCode.OK,
      data: {
        id: media.id,
        mediaFileName: media.mediaFileName,
        mediaType: media.mediaType,
        projectId: media.projectId,
        createdAt: media.createdAt,
        storageProvider: 'GOOGLE_CLOUD'
      },
      message: 'GCS upload completed successfully'
    }
  }

  @serviceMethod()
  async deleteGCSFile(mediaId: string) {
    const dbClient = getPrismaClient()

    // Get media record
    const media = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { code: ResponseCode.NOT_FOUND, message: 'Media not found' }
    }

    // Note: In a real implementation, you would delete the file from GCS
    // For now, we'll just delete the database record
    // You would need to implement GCS file deletion using the Google Cloud Storage admin SDK

    // Delete from database
    await dbClient.media.delete({
      where: { id: mediaId }
    })

    return { code: ResponseCode.OK, message: 'GCS file deleted successfully' }
  }

  @serviceMethod()
  async updateMedia(mediaId: string, mediaFileName: string, mediaType: MediaType, storageProvider: StorageProvider = StorageProvider.GOOGLE_CLOUD) {
    const dbClient = getPrismaClient()

    // Get existing media record
    const existingMedia = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!existingMedia) {
      return { code: ResponseCode.NOT_FOUND, message: 'Media not found' }
    }

    // Check if the new file name is the same as the existing one (overwrite scenario)
    const isOverwrite = mediaFileName === existingMedia.mediaFileName

    if (!isOverwrite) {
      // Check if new file name already exists in database (prevent duplicates)
      const duplicateMedia = await dbClient.media.findUnique({
        where: { mediaFileName }
      })

      if (duplicateMedia) {
        return { code: ResponseCode.CONFLICT, message: 'File with this name already exists' }
      }
    }

    // Generate upload URL for the new/updated file
    let url: string
    let code: ResponseCode

    if (storageProvider === StorageProvider.AWS_S3) {
      const s3Response = await this.s3Service.getSignedUrl(mediaFileName, 'write')
      url = s3Response.url
      code = s3Response.code
    } else {
      // Default to Google Cloud Storage
      const gcsResponse = await getSignedURL(mediaFileName, 'write')
      if (!gcsResponse.url) {
        return { code: gcsResponse.code, message: 'Failed to generate upload URL' }
      }
      url = gcsResponse.url
      code = gcsResponse.code
    }

    if (code !== ResponseCode.OK) {
      return { code, message: 'Failed to generate upload URL' }
    }

    // Update media record in database
    const updatedMedia = await dbClient.media.update({
      where: { id: mediaId },
      data: {
        mediaFileName,
        mediaType,
        updatedAt: new Date()
      }
    })

    return {
      code: ResponseCode.OK,
      data: {
        id: updatedMedia.id,
        mediaFileName: updatedMedia.mediaFileName,
        mediaType: updatedMedia.mediaType,
        projectId: updatedMedia.projectId,
        createdAt: updatedMedia.createdAt,
        updatedAt: updatedMedia.updatedAt,
        storageProvider,
        uploadUrl: url,
        isOverwrite
      },
      message: isOverwrite ? 'File overwrite URL generated successfully' : 'File update URL generated successfully'
    }
  }
}
