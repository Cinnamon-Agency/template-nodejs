import { ResponseCode, ResponseCodeRequired, getResponseMessage } from '@common'
import { logger } from '@core/logger'
import { QueryFailedError } from 'typeorm'

export type MySQLError = QueryFailedError & { errno: number }

export function isMySQLError(error: unknown): error is MySQLError {
  return error instanceof QueryFailedError && 'errno' in error
}

interface ErrorHandlerConfig<ReturnType> {
  onError?: (
    err: unknown
  ) => Promise<
    (Partial<ResponseCodeRequired> & Partial<ReturnType>) | undefined
  >
}

export function serviceErrorHandler<T>(config?: ErrorHandlerConfig<T>) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (err: unknown) {
        if (config?.onError) {
          const errorResponse = await config.onError(err)

          if (!errorResponse?.code) {
            logger.error({
              code: ResponseCode.SERVER_ERROR,
              message: getResponseMessage(ResponseCode.SERVER_ERROR),
              stack: err instanceof Error ? err.stack : undefined,
            })

            return { code: ResponseCode.SERVER_ERROR }
          }

          return errorResponse
        }

        logger.error({
          code: ResponseCode.SERVER_ERROR,
          message: getResponseMessage(ResponseCode.SERVER_ERROR),
          stack: err instanceof Error ? err.stack : undefined,
        })
        return { code: ResponseCode.SERVER_ERROR }
      }
    }
    return descriptor
  }
}
