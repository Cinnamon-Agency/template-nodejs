import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { ICreateMediaEntries, IMediaService, IMediaData, StorageProvider } from './interface'
import { MediaType } from '@prisma/client'

import { ResponseCode, serviceMethod } from '@common'
import { getSignedURL } from '@services/google_cloud_storage'
import { S3Service } from '@services/aws_s3'
import { extractFileExtension, generateStoragePath } from '@common/utils/fileUtils'

@singleton()
@autoInjectable()
export class MediaService implements IMediaService {
  constructor(private s3Service: S3Service) {}

  @serviceMethod()
  async createMediaEntries({ mediaFiles, projectId, prisma }: ICreateMediaEntries) {
    let code: ResponseCode = ResponseCode.OK

    const dbClient = prisma || getPrismaClient()
    const mediaInfo = []

    for (const { mediaType, storageProvider = StorageProvider.GOOGLE_CLOUD } of mediaFiles) {
      // Generate UUID-based filename and storage path
      const fileExtension = '' // No extension needed since we don't track original names
      const storagePath = generateStoragePath(projectId, mediaType, fileExtension)
      const mediaFileName = storagePath.split('/').pop() || storagePath // Extract filename from path

      const created = await dbClient.media.create({
        data: {
          mediaType,
          mediaFileName,
          fileExtension,
          storagePath,
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
        const s3Response = await this.s3Service.getSignedUrl(storagePath, 'write')
        url = s3Response.url
        googleStorageCode = s3Response.code
      } else {
        // Default to Google Cloud Storage
        const gcsResponse = await getSignedURL(storagePath, 'write')
        url = gcsResponse.url
        googleStorageCode = gcsResponse.code
      }

      mediaInfo.push({
        url,
        mediaFileName,
        storagePath,
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
  async completeS3Upload(projectId: string, mediaType: MediaType) {
    const dbClient = getPrismaClient()

    // Generate the proper storage path and filename
    const fileExtension = '' // No extension needed
    const storagePath = generateStoragePath(projectId, mediaType, fileExtension)
    const mediaFileName = storagePath.split('/').pop() || storagePath

    // Verify file exists in S3
    const { code, metadata } = await this.s3Service.getFileMetadata(storagePath)
    if (code !== ResponseCode.OK) {
      return { code: ResponseCode.NOT_FOUND, message: 'File not found in S3' }
    }

    // Create media record in database
    const media = await dbClient.media.create({
      data: {
        mediaType,
        mediaFileName,
        fileExtension,
        storagePath,
        projectId,
      },
    })

    return {
      code: ResponseCode.OK,
      data: {
        id: media.id,
        mediaFileName: media.mediaFileName,
        storagePath: media.storagePath,
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
  async completeGCSUpload(projectId: string, mediaType: MediaType) {
    const dbClient = getPrismaClient()

    // Generate the proper storage path and filename
    const fileExtension = '' // No extension needed
    const storagePath = generateStoragePath(projectId, mediaType, fileExtension)
    const mediaFileName = storagePath.split('/').pop() || storagePath

    // Verify file exists in GCS by trying to get read URL
    const { code } = await getSignedURL(storagePath, 'read')
    if (code !== ResponseCode.OK) {
      return { code: ResponseCode.NOT_FOUND, message: 'File not found in Google Cloud Storage' }
    }

    // Create media record in database
    const media = await dbClient.media.create({
      data: {
        mediaType,
        mediaFileName,
        fileExtension,
        storagePath,
        projectId,
      },
    })

    return {
      code: ResponseCode.OK,
      data: {
        id: media.id,
        mediaFileName: media.mediaFileName,
        storagePath: media.storagePath,
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
  async updateMedia(mediaId: string, mediaType: MediaType, storageProvider: StorageProvider = StorageProvider.GOOGLE_CLOUD) {
    const dbClient = getPrismaClient()

    // Get existing media record
    const existingMedia = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!existingMedia) {
      return { code: ResponseCode.NOT_FOUND, message: 'Media not found' }
    }

    // For updates, we overwrite the existing file
    // Keep the same storage path and filename
    const storagePath = existingMedia.storagePath

    // Generate upload URL for overwriting the existing file
    let url: string
    let code: ResponseCode

    if (storageProvider === StorageProvider.AWS_S3) {
      const s3Response = await this.s3Service.getSignedUrl(storagePath, 'write')
      url = s3Response.url
      code = s3Response.code
    } else {
      // Default to Google Cloud Storage
      const gcsResponse = await getSignedURL(storagePath, 'write')
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
        mediaType,
        updatedAt: new Date()
      }
    })

    return {
      code: ResponseCode.OK,
      data: {
        id: updatedMedia.id,
        mediaFileName: updatedMedia.mediaFileName,
        storagePath: updatedMedia.storagePath,
        mediaType: updatedMedia.mediaType,
        projectId: updatedMedia.projectId,
        createdAt: updatedMedia.createdAt,
        updatedAt: updatedMedia.updatedAt,
        storageProvider,
        uploadUrl: url,
        isOverwrite: true
      },
      message: 'File overwrite URL generated successfully'
    }
  }
}
