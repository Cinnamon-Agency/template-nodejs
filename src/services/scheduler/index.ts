import schedule, { scheduleJob } from 'node-schedule'
import { getResponseMessage } from '../../services/utils'
import { ResponseCode } from '../../interfaces'
import { logger } from '../../logger'
import config from '../../config'

export enum UtilScheduleJobs {
  EXAMPLE_CHECK = 'ExampleCheck'
}

export const scheduleGenericJob = () => {
  try {
    scheduleJob(
      UtilScheduleJobs.EXAMPLE_CHECK,
      config.EXAMPLE_CHECK_SCHEDULE,
      async () => {
        /*
        Write your job logic here.
        Typically you would call a service in which the code is defined
        */
      }
    )
  } catch (err: any) {
    const code = ResponseCode.SERVER_ERROR
    logger.error({ code, message: getResponseMessage(code), stack: err.stack })
  }
}