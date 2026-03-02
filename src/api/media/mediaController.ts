import { Request, Response, NextFunction } from 'express'
import { autoInjectable, singleton } from 'tsyringe'
import { MediaService } from './mediaService'
import { IMediaData } from './interface'
import { MediaType } from '@prisma/client'
import { ResponseCode } from '@common/response'

@singleton()
@autoInjectable()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params
      const { mediaFiles } = req.body

      const mediaData: IMediaData[] = mediaFiles.map((file: any) => ({
        mediaFileName: file.mediaFileName,
        mediaType: file.mediaType as MediaType
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

      const result = await this.mediaService.getDownloadUrl(mediaFileName)

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
}
