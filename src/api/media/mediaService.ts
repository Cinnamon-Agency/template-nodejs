import { autoInjectable, singleton } from 'tsyringe'
import { logEndpoint } from '@common/decorators/logEndpoint'
import prisma from '@core/prismaClient'
import { ICreateMediaEntries, IMediaService } from './interface'

import { ResponseCode, serviceErrorHandler } from '@common'
import { getSignedURL } from '@services/google_cloud_storage'

@singleton()
@autoInjectable()
export class MediaService implements IMediaService {
  @logEndpoint()
@serviceErrorHandler()
  async createMediaEntries({ mediaFiles, projectId }: ICreateMediaEntries) {
    let code: ResponseCode = ResponseCode.OK

    const mediaInfo = []

    for (const { mediaFileName, mediaType } of mediaFiles) {
      const created = await prisma.media.create({
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
}
