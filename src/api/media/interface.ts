import { AsyncResponse } from '@common'
import { Prisma, MediaType } from '@prisma/client'

export interface IMediaData {
  mediaType: MediaType
  mediaFileName: string
}

export interface ICreateMediaEntries {
  mediaFiles: IMediaData[]
  projectId: string
  prisma: Prisma.TransactionClient // Use the Prisma transaction client for transactional inserts
}

export interface MediaInfo {
  url: string | undefined
  mediaFileName: string
  googleStorageCode: number
}

export interface IMediaService {
  createMediaEntries(params: ICreateMediaEntries): AsyncResponse<MediaInfo[]>
}
