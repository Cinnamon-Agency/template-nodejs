import { AsyncResponse } from '@common'
import { IMediaData, MediaInfo } from '@api/media/interface'
import { Project } from './projectModel'

export enum ProjectStatus {
  ACTIVE = 'Active',
  FINISHED = 'Finished',
}

export interface ICreateProject {
  userId: string
  name: string
  description: string
  deadline: string
  mediaFiles: IMediaData[]
}

export interface IGetProjects {
  page: 1
  perPage: 10
}

export interface IGetProjectById {
  projectId: string
}

export interface IProjectService {
  createProject(params: ICreateProject): AsyncResponse<MediaInfo[]>
  getProjects(params: IGetProjects): AsyncResponse<Project[]>
  getProjectById(params: IGetProjectById): AsyncResponse<Project>
}
