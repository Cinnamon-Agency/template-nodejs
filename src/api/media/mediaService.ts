import { autoInjectable, inject, singleton } from 'tsyringe'
import { DataSource, Repository } from 'typeorm'
import { ICreateMediaEntries, IMediaService } from './interface'
import { Media } from './mediaModel'
import { ResponseCode, serviceErrorHandler } from '@common'
import { getSignedURL } from '@services/google_cloud'

@singleton()
@autoInjectable()
export class MediaService implements IMediaService {
  private readonly mediaRepository: Repository<Media>

  constructor(@inject(DataSource) private readonly dataSource: DataSource) {
    this.mediaRepository = dataSource.manager.getRepository(Media)
  }

  @serviceErrorHandler()
  async createMediaEntries({
    mediaFiles,
    projectId,
    queryRunner,
  }: ICreateMediaEntries) {
    let code: ResponseCode = ResponseCode.OK

    const mediaInfo = []

    for (const { mediaFileName, mediaType } of mediaFiles) {
      const insertResult = await this.mediaRepository
        .createQueryBuilder('media', queryRunner)
        .insert()
        .into(Media)
        .values([
          {
            mediaFileName,
            mediaType,
            projectId,
          },
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
        googleStorageCode,
      })
    }

    return { code, mediaInfo }
  }
}
