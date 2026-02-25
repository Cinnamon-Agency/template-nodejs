import { NextFunction, Request, Response } from 'express'
import { ResponseCode } from '@common'
import { ServerState } from '@core/server/state'

export const shutdownHandler = (serverState: ServerState) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (serverState.shuttingDown) {
      return next({
        code: ResponseCode.APP_SHUTTING_DOWN,
      })
    }

    return next()
  }
}
