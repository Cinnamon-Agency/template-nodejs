import { autoInjectable } from 'tsyringe'
import { AppDataSource } from '../../services/typeorm'
import { Repository } from 'typeorm'
import { ICreateMediaEntries, IMediaService } from './interface'
import { Media } from './mediaModel'
import { getResponseMessage } from '../../services/utils'
import { logger } from '../../logger'
import { ResponseCode } from '../../interface'
import { getSignedURL } from '../../services/google_cloud'

@autoInjectable()
export class MediaService implements IMediaService {
  private readonly mediaRepository: Repository<Media>

  constructor() {
    this.mediaRepository = AppDataSource.manager.getRepository(Media)
  }

  createMediaEntries = async ({
    mediaFiles,
    projectId,
    queryRunner
  }: ICreateMediaEntries) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const mediaInfo = []

      for (const media of mediaFiles) {
        const { mediaFileName, mediaType } = media
        const insertResult = await this.mediaRepository
          .createQueryBuilder('media', queryRunner)
          .insert()
          .into(Media)
          .values([
            {
              mediaFileName,
              mediaType,
              projectId
            }
          ])
          .execute()

        if (insertResult.raw.affectedRows !== 1) {
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
          googleStorageCode
        })
      }

      return { code, mediaInfo }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }
}
