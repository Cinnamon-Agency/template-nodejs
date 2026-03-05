import express from 'express'
import { container } from 'tsyringe'
import {
  createSupportRequestSchemaStatus,
  updateSupportRequestStatusSchemaStatus,
  getAllSupportRequestsSchema,
} from './supportRequestInput'
import { validate } from '../../middleware/validation'
import { SupportRequestController } from './supportRequestController'
import { requireToken } from '@middleware/auth'
import { RoleType } from '@prisma/client'

const supportRequestController = container.resolve(SupportRequestController)
export const supportRequestRouter = express.Router()

supportRequestRouter.post(
  '/',
  validate(createSupportRequestSchemaStatus),
  supportRequestController.createSupportRequest
)

supportRequestRouter.get(
  '/',
  requireToken([RoleType.ADMIN]),
  validate(getAllSupportRequestsSchema),
  supportRequestController.getAllSupportRequests
)

supportRequestRouter.put(
  '/updateStatus/:supportRequestId',
  requireToken([RoleType.ADMIN]),
  validate(updateSupportRequestStatusSchemaStatus),
  supportRequestController.updateSupportRequestStatus
)
