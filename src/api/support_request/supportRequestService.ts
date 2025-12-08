import { autoInjectable, singleton } from 'tsyringe'
import { prisma } from '@app'
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

    const newSupportRequest = await prisma.supportRequest.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        message,
      },
    })

    if (!newSupportRequest.id) {
      return { code: ResponseCode.FAILED_INSERT }
    }

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async updateSupportRequestStatus({
    status,
    supportRequestId,
  }: IUpdateSupportRequestStatus) {
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id: supportRequestId },
    })
    if (!supportRequest) {
      return {
        code: ResponseCode.SUPPORT_REQUEST_NOT_FOUND,
      }
    }

    const updatedRequest = await prisma.supportRequest.update({
      where: { id: supportRequestId },
      data: { status },
    })

    if (!updatedRequest) {
      return { code: ResponseCode.FAILED_EDIT }
    }

    return { code: ResponseCode.OK }
  }
}
