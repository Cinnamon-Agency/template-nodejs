import { AsyncResponse } from '../../interfaces'

export enum DynamicMessageTypes {
  ERROR = 'Error',
  SUCCESS = 'Success',
  INFO = 'Info',
  _404 = '404'
}

export type DynamicMessage = {
  slug: string
  title: string
  message: string
  type: DynamicMessageTypes
  redirectURL?: string
}

export interface IGetDynamicMessage {
  slug: string
}

export interface IMessageService {
  getDynamicMessageBySlug(params: IGetDynamicMessage): AsyncResponse<DynamicMessage>
}
