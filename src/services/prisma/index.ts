import { Prisma, PrismaClient } from '@prisma/client'
import { ResponseCode } from '@common'
import { container } from 'tsyringe'

export const PRISMA_TOKEN = 'PrismaClient'

container.register<PrismaClient>(PRISMA_TOKEN, {
  useValue: new PrismaClient(),
})

export function getPrismaClient(): PrismaClient {
  return container.resolve<PrismaClient>(PRISMA_TOKEN)
}

export function isPrismaError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError
}

const PRISMA_ERROR_MAP: Record<string, ResponseCode> = {
  P2002: ResponseCode.CONFLICT,
  P2003: ResponseCode.FAILED_INSERT,
  P2025: ResponseCode.NOT_FOUND,
  P2018: ResponseCode.NOT_FOUND,
  P2015: ResponseCode.NOT_FOUND,
  P2011: ResponseCode.INVALID_INPUT,
  P2012: ResponseCode.INVALID_INPUT,
  P2000: ResponseCode.INVALID_INPUT,
  P1001: ResponseCode.SERVICE_UNAVAILABLE,
  P1002: ResponseCode.SERVICE_UNAVAILABLE,
  P1008: ResponseCode.SERVICE_UNAVAILABLE,
  P2034: ResponseCode.CONFLICT,
  P2004: ResponseCode.INTEGRITY_CONSTRAINT_VIOLATION,
}

export function mapPrismaErrorToResponseCode(
  error: Prisma.PrismaClientKnownRequestError
): ResponseCode {
  return PRISMA_ERROR_MAP[error.code] || ResponseCode.SERVER_ERROR
}
