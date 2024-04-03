import { ResponseCode } from '../../interfaces'
import { query } from '../../services/typeorm'
import {
  DynamicMessage,
  IGetDynamicMessage,
  IMessageService
} from './interface'
import { MessageQueries } from './messageQueries'
import { getResponseMessage } from '../../services/utils'
import { logger } from '../../logger'

export class MessageService implements IMessageService {
  constructor() {}

  async getDynamicMessageBySlug({ slug }: IGetDynamicMessage) {
    let code = ResponseCode.OK

    try {
      const [message] = await query<[DynamicMessage]>(
        MessageQueries.getMessageBySlug,
        [slug]
      )
      if (!message) {
        return { code: ResponseCode.MESSAGE_NOT_FOUND }
      }

      return { message, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }
}
