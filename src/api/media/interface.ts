import { AsyncResponse, IServiceMethod } from '../../interface'

export enum MediaType {
  PROJECT_COVER_IMAGE = 'Project cover image',
  PROJECT_TRACK_PREVIEW = 'Project track preview',
  PROJECT_OTHER = 'Project other'
}

export interface IMediaData {
  mediaType: MediaType
  mediaFileName: string
}

export interface ICreateMediaEntries extends IServiceMethod {
  mediaFiles: IMediaData[]
  projectId: string
}

export interface MediaInfo {
  url: string | undefined
  mediaFileName: string
  googleStorageCode: number
}

export interface IMediaService {
  createMediaEntries(params: ICreateMediaEntries): AsyncResponse<MediaInfo[]>
}
