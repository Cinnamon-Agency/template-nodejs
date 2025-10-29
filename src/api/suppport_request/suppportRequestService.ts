import { autoInjectable, singleton } from 'tsyringe'

import {
  ICreateSupportRequest,
  ISupportRequestService,
  IUpdateSupportRequestStatus,
} from './interface'
import { ResponseCode } from '@common'
import { logger } from '@core/logger'
import { getResponseMessage } from '@common/response'
import { sendEmail } from '@services/aws-ses'
import { EmailTemplate } from '@services/aws-ses/interface'
import config from '@core/config'

@singleton()
@autoInjectable()
export class SupportRequestService implements ISupportRequestService {

  constructor() {
   
  }

  createSupportRequest = async ({
    firstName,
    lastName,
    email,
    subject,
    message,
  }: ICreateSupportRequest) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { code: emailCode } = await sendEmail(
        EmailTemplate.CONTACT_SUPPORT,
        config.SES_VERIFIED_MAIL,
        subject,
        {
          web_url: config.WEB_URL,
          contact_number: config.SMS_VERIFIED_PHONE_NUMBER,
          contact_email: email,
          full_name: `${firstName} ${lastName}`,
          message,
        }
      )

      if (emailCode !== ResponseCode.OK) {
        return { code: emailCode }
      }

      const { code: emailSuccessCode } = await sendEmail(
        EmailTemplate.CONTACT_SUPPORT_SUCCESS,
        email,
        'Thank you for your contact',
        {
          full_name: `${firstName} ${lastName}`,
          contact_email: email,
          message,
          web_url: config.WEB_URL,
          contact_number: config.SMS_VERIFIED_PHONE_NUMBER,
        }
      )

      if (emailSuccessCode !== ResponseCode.OK) {
        return { code: emailSuccessCode }
      }

      const newSupportRequest = await this.supportRequestRepository
        .createQueryBuilder('support_request')
        .insert()
        .values({
          firstName,
          lastName,
          email,
          subject,
          message,
        })
        .execute()

      if (!newSupportRequest.identifiers[0].id) {
        return { code: ResponseCode.FAILED_INSERT }
      }
      return { code }
    } catch (err: any) {
      switch (err.errno) {
        case 1062:
          code = ResponseCode.CONFLICT
          break
        default:
          code = ResponseCode.SERVER_ERROR
          logger.error({
            code,
            message: getResponseMessage(code),
            stack: err.stack,
          })
      }
    }

    return { code }
  }

  updateSupportRequestStatus = async ({
    status,
    supportRequestId,
  }: IUpdateSupportRequestStatus) => {
    let code: ResponseCode = ResponseCode.OK
    try {
      const supportRequest = await this.supportRequestRepository.findOneBy({
        id: supportRequestId,
      })
      if (!supportRequest) {
        return {
          code: ResponseCode.SUPPORT_REQUEST_NOT_FOUND,
        }
      }

      const affectedRow = await this.supportRequestRepository
        .createQueryBuilder('support_request')
        .update()
        .set({
          status,
        })
        .where('id = :id', { id: supportRequestId })
        .execute()

      if (affectedRow.affected === 0) {
        return { code: ResponseCode.FAILED_EDIT }
      }
      return { code }
    } catch (err: any) {
      switch (err.errno) {
        case 1062:
          code = ResponseCode.CONFLICT
          break
        default:
          code = ResponseCode.SERVER_ERROR
          logger.error({
            code,
            message: getResponseMessage(code),
            stack: err.stack,
          })
      }
    }
    return { code }
  }
}
