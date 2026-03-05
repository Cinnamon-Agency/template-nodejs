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
  supportRequestId: string
  status: SupportRequestStatus
}

export interface IGetAllSupportRequests {
  page?: number
  limit?: number
  status?: SupportRequestStatus
}

export interface IGetSupportStats {
  totalRequests: number
  openRequests: number
  inProgressRequests: number
  resolvedRequests: number
  closedRequests: number
}

export interface ISupportRequestService {
  createSupportRequest(
    params: ICreateSupportRequest
  ): AsyncResponse<ResponseCode>
  updateSupportRequestStatus(
    params: IUpdateSupportRequestStatus
  ): AsyncResponse<ResponseCode>
  getAllSupportRequests(
    params: IGetAllSupportRequests
  ): AsyncResponse<ResponseCode>
  getSupportStats(): AsyncResponse<IGetSupportStats>
}
