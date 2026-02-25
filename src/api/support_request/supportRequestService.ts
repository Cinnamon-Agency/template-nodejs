import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import {
  ICreateSupportRequest,
  ISupportRequestService,
  IUpdateSupportRequestStatus,
} from './interface'
import { ResponseCode, serviceMethod } from '@common'
import { sendEmail } from '@services/aws-ses'
import { EmailTemplate } from '@services/aws-ses/interface'
import config from '@core/config'

@singleton()
@autoInjectable()
export class SupportRequestService implements ISupportRequestService {
  @serviceMethod()
  async createSupportRequest({
    firstName,
    lastName,
    email,
    subject,
    message,
  }: ICreateSupportRequest) {
    // Persist the support request first to guarantee a DB record exists
    await getPrismaClient().supportRequest.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        message,
      },
    })

    // Send notification email to support team (best-effort)
    await sendEmail(
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

    // Send confirmation email to the user (best-effort)
    await sendEmail(
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

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async updateSupportRequestStatus({
    status,
    supportRequestId,
  }: IUpdateSupportRequestStatus) {
    const supportRequest = await getPrismaClient().supportRequest.findUnique({
      where: { id: supportRequestId },
    })
    if (!supportRequest) {
      return {
        code: ResponseCode.SUPPORT_REQUEST_NOT_FOUND,
      }
    }

    await getPrismaClient().supportRequest.update({
      where: { id: supportRequestId },
      data: { status },
    })

    return { code: ResponseCode.OK }
  }
}
