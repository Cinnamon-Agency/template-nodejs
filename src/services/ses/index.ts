import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'
import config from '../../config'
import { EmailTemplate, IEmailData, SendEmailParams } from './interface'
import { ResponseCode, ResponseMessage } from '../../interface'
import { logger } from '../../logger'

const sesConfig =
  config.NODE_ENV === 'dev'
    ? {
        credentials: {
          secretAccessKey: config.AWS_SECRET,
          accessKeyId: config.AWS_ACCESS_KEY
        },
        region: config.AWS_REGION
      }
    : {
        region: config.AWS_REGION
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

export const sendEmail = async (params: SendEmailParams) => {
  let htmlContent = params.html || ''
  let textContent = params.text || 'This is the text version of the email.'

  if (params.template) {
    const dynamicContentTemplate = loadHtmlFile(`emailTemplates/${params.template}.html`)
    const htmlWithHeaderFooter = `${header}${dynamicContentTemplate}${footer}`
    htmlContent = replacePlaceholders(htmlWithHeaderFooter, params.dynamicData || {})
  }

  const sesParams = {
    Destination: {
      ToAddresses: [params.to]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlContent
        },
        Text: {
          Charset: 'UTF-8',
          Data: textContent
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: params.subject
      }
    },
    Source: config.SES_VERIFIED_MAIL
  }

  try {
    const emailResponse = await sesClient.send(new SendEmailCommand(sesParams))
    if (
      emailResponse.$metadata.httpStatusCode &&
      emailResponse.$metadata.httpStatusCode !== 200
    ) {
      return { code: ResponseCode.FAILED_DEPENDENCY }
    }
    return { code: ResponseCode.OK }
  } catch (error: any) {
    logger.error({
      code: ResponseCode.FAILED_DEPENDENCY,
      message: ResponseMessage.FAILED_DEPENDENCY,
      stack: error.stack
    })
    return { code: ResponseCode.FAILED_DEPENDENCY }
  }
}

