import { AsyncResponse } from '@common'
import { Prisma, MediaType } from '@prisma/client'

export enum StorageProvider {
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  AWS_S3 = 'AWS_S3'
}

export interface IMediaData {
  mediaType: MediaType
  storageProvider?: StorageProvider
}

export interface ICreateMediaEntries {
  mediaFiles: IMediaData[]
  projectId: string
  prisma?: Prisma.TransactionClient // Use the Prisma transaction client for transactional inserts
}

export interface MediaInfo {
  url: string | undefined
  mediaFileName: string // Generated UUID filename
  storagePath: string // Full storage path
  googleStorageCode: number
  storageProvider: StorageProvider
}

export interface IMediaService {
  createMediaEntries(params: ICreateMediaEntries): AsyncResponse<MediaInfo[]>
  getMediaByProject(projectId: string, mediaType?: MediaType): AsyncResponse<any[]>
  getDownloadUrl(mediaFileName: string, storageProvider?: StorageProvider): AsyncResponse<string>
  deleteMedia(mediaId: string): AsyncResponse<void>
  updateMedia(mediaId: string, mediaType: MediaType, storageProvider?: StorageProvider): AsyncResponse<any>
}
