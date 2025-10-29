import { AsyncResponse, ResponseCode } from '@common'

export enum SupportRequestStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface ICreateSupportRequest {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

export interface IUpdateSupportRequestStatus {
  supportRequestId: number
  status: SupportRequestStatus
}

export interface ISupportRequestService {
  createSupportRequest(
    params: ICreateSupportRequest
  ): AsyncResponse<ResponseCode>
  updateSupportRequestStatus(
    params: IUpdateSupportRequestStatus
  ): AsyncResponse<ResponseCode>
}
