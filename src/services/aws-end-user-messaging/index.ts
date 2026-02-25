import {
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
} from '@aws-sdk/client-pinpoint-sms-voice-v2'

import { logger } from '@core/logger'
import { ResponseCode, ResponseMessage } from '@common'
import config from '@core/config'

const smsUserMessagingClientConfig =
  config.NODE_ENV === 'development'
    ? {
        credentials: {
          secretAccessKey: config.AWS_SECRET,
          accessKeyId: config.AWS_ACCESS_KEY,
        },
        region: config.AWS_REGION,
      }
    : {
        region: config.AWS_REGION,
      }

const smsUserMessagingClient = new PinpointSMSVoiceV2Client(
  smsUserMessagingClientConfig
)

export async function sendSMS(destinationNumber: string, message: string) {
  try {
    const command = new SendTextMessageCommand({
      DestinationPhoneNumber: destinationNumber,
      MessageBody: message,
      OriginationIdentity: config.SMS_VERIFIED_PHONE_NUMBER,
      MessageType: 'TRANSACTIONAL',
    })
    const response = await smsUserMessagingClient.send(command)
    if (response.$metadata.httpStatusCode !== 200) {
      logger.error({
        code: ResponseCode.FAILED_DEPENDENCY,
        message: ResponseMessage.FAILED_DEPENDENCY,
        stack: response.$metadata.httpStatusCode,
      })
      return { code: ResponseCode.FAILED_DEPENDENCY }
    }
    return { code: ResponseCode.OK }
  } catch (error: unknown) {
    logger.error({
      code: ResponseCode.FAILED_DEPENDENCY,
      message: ResponseMessage.FAILED_DEPENDENCY,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { code: ResponseCode.FAILED_DEPENDENCY }
  }
}

export function formatPhoneNumberForSMS(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  if (phone.startsWith('+')) {
    return phone
  }
  return `+1${digits}`
}
