import { AsyncResponse } from '@common'
import { Prisma, MediaType } from '@prisma/client'

export enum StorageProvider {
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  AWS_S3 = 'AWS_S3'
}

export interface IMediaData {
  mediaType: MediaType
  mediaFileName: string
  storageProvider?: StorageProvider
}

export interface ICreateMediaEntries {
  mediaFiles: IMediaData[]
  projectId: string
  prisma?: Prisma.TransactionClient // Use the Prisma transaction client for transactional inserts
}

export interface MediaInfo {
  url: string | undefined
  mediaFileName: string
  googleStorageCode: number
  storageProvider: StorageProvider
}

export interface IMediaService {
  createMediaEntries(params: ICreateMediaEntries): AsyncResponse<MediaInfo[]>
  getMediaByProject(projectId: string, mediaType?: MediaType): AsyncResponse<any[]>
  getDownloadUrl(mediaFileName: string, storageProvider?: StorageProvider): AsyncResponse<string>
  deleteMedia(mediaId: string): AsyncResponse<void>
  updateMedia(mediaId: string, mediaFileName: string, mediaType: MediaType, storageProvider?: StorageProvider): AsyncResponse<any>
}
