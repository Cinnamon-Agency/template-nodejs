import {
  ResponseCode,
  ResponseCodeRequired,
  ResponseError,
  getResponseMessage,
} from '@common'
import { logger } from '@core/logger'
import { isPrismaError, mapPrismaErrorToResponseCode } from '@services/prisma'

export interface ErrorContext {
  [key: string]: unknown
}

interface ErrorHandlerConfig<ReturnType> {
  onError?: (
    err: unknown,
    context: ErrorContext
  ) => Promise<(ResponseCodeRequired & Partial<ReturnType>) | undefined>
}

export function serviceMethod<T>(config?: ErrorHandlerConfig<T>) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const errorContext: ErrorContext = {}
      const params =
        args.length > 0 && args[0] && typeof args[0] === 'object'
          ? (args[0] as Record<string, unknown>)
          : null

      if (params && !params.errorContext) {
        params.errorContext = errorContext
      }

      try {
        const result = await originalMethod.apply(this, args)

        if (
          params?.throwOnError === true &&
          result &&
          typeof result === 'object' &&
          'code' in result &&
          result.code !== ResponseCode.OK
        ) {
          throw new ResponseError(result.code as ResponseCode)
        }

        return result
      } catch (err: unknown) {
        // ResponseError: Run custom handler first for cleanup/override opportunity
        // If handler returns a code, use it, otherwise use original ResponseError code
        if (err instanceof ResponseError) {
          if (config?.onError) {
            try {
              const errorResponse = await config.onError(err, errorContext)
              if (errorResponse?.code) {
                return errorResponse
              }
            } catch (handlerError) {
              logger.error({
                code: ResponseCode.SERVER_ERROR,
                message: 'Error handler threw an exception during cleanup',
                originalError: err.message,
                handlerError:
                  handlerError instanceof Error
                    ? handlerError.message
                    : String(handlerError),
                stack:
                  handlerError instanceof Error
                    ? handlerError.stack
                    : undefined,
              })
            }
          }
          return { code: err.code }
        }

        if (config?.onError) {
          try {
            const errorResponse = await config.onError(err, errorContext)
            if (errorResponse?.code) {
              return errorResponse
            }
          } catch (handlerError) {
            logger.error({
              code: ResponseCode.SERVER_ERROR,
              message: 'Error handler threw an exception',
              originalError: err instanceof Error ? err.message : String(err),
              handlerError:
                handlerError instanceof Error
                  ? handlerError.message
                  : String(handlerError),
              stack:
                handlerError instanceof Error ? handlerError.stack : undefined,
            })
            return { code: ResponseCode.SERVER_ERROR }
          }
        }

        if (isPrismaError(err)) {
          const code = mapPrismaErrorToResponseCode(err)
          logger.error({
            code,
            message: getResponseMessage(code),
            prismaCode: err.code,
            prismaMessage: err.message,
            meta: err.meta,
            originalError: err,
            stack: err.stack,
          })
          return { code }
        }

        logger.error({
          code: ResponseCode.SERVER_ERROR,
          message: getResponseMessage(ResponseCode.SERVER_ERROR),
          errorMessage: err instanceof Error ? err.message : String(err),
          originalError: err,
          stack: err instanceof Error ? err.stack : undefined,
        })
        return { code: ResponseCode.SERVER_ERROR }
      }
    }
    return descriptor
  }
}
