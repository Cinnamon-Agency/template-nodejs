import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'
import config from '@core/config'
import { IEmailData, EmailTemplate } from './interface'
import { ResponseCode, ResponseMessage } from '@common'
import { logger } from '@core/logger'

const sesConfig =
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

const sesClient = new SESClient(sesConfig)

const loadHtmlFile = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8')
}

export const replacePlaceholders = (
  template: string,
  placeholders: IEmailData
): string => {
  return template.replace(/{{(\w+)}}/g, (_, key) => placeholders[key] || '')
}

const header = loadHtmlFile('emailTemplates/default/header.html')
const footer = loadHtmlFile('emailTemplates/default/footer.html')

export const sendEmail = async (
  template: EmailTemplate,
  toAddress: string,
  subject: string,
  dynamicData: IEmailData
) => {
  const dynamicContentTemplate = loadHtmlFile(`emailTemplates/${template}.html`)
  const htmlContent = `${header}${dynamicContentTemplate}${footer}`

  const dynamicContent = replacePlaceholders(htmlContent, dynamicData)

  const params = {
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: dynamicContent,
        },
        Text: {
          Charset: 'UTF-8',
          Data: 'This is the text version of the email.',
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: config.SES_VERIFIED_MAIL,
  }

  try {
    const emailResponse = await sesClient.send(new SendEmailCommand(params))

    if (
      emailResponse.$metadata.httpStatusCode &&
      emailResponse.$metadata.httpStatusCode !== 200
    ) {
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
