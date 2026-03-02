import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { ICreateMediaEntries, IMediaService, IMediaData } from './interface'
import { MediaType } from '@prisma/client'

import { ResponseCode, serviceMethod } from '@common'
import { getSignedURL } from '@services/google_cloud_storage'

@singleton()
@autoInjectable()
export class MediaService implements IMediaService {
  @serviceMethod()
  async createMediaEntries({ mediaFiles, projectId, prisma }: ICreateMediaEntries) {
    let code: ResponseCode = ResponseCode.OK

    const dbClient = prisma || getPrismaClient()
    const mediaInfo = []

    for (const { mediaFileName, mediaType } of mediaFiles) {
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

      const { url, code: googleStorageCode } = await getSignedURL(
        mediaFileName,
        'write'
      )

      mediaInfo.push({
        url,
        mediaFileName,
        googleStorageCode,
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

  async getDownloadUrl(mediaFileName: string) {
    const { url, code } = await getSignedURL(mediaFileName, 'read')
    return { code, url }
  }

  async deleteMedia(mediaId: string) {
    const dbClient = getPrismaClient()
    
    const media = await dbClient.media.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { code: ResponseCode.NOT_FOUND }
    }

    await dbClient.media.delete({
      where: { id: mediaId }
    })

    return { code: ResponseCode.OK }
  }
}
