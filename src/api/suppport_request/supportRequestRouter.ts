import express from 'express'
import { container } from 'tsyringe'
import {
  createSupportRequestSchemaStatus,
  updateSupportRequestStatusSchemaStatus,
} from './supportRequestInput'
import { validate } from '../../middleware/validation'
import { SupportRequestController } from './supportRequestController'
import { requireRole, requireToken } from '../../middleware/auth'
import { RoleType } from '../role/interface'

const supportRequestController = container.resolve(SupportRequestController)
export const supportRequestRouter = express.Router()

supportRequestRouter.post(
  '/',
  validate(createSupportRequestSchemaStatus),
  supportRequestController.createSupportRequest
)

supportRequestRouter.put(
  '/updateStatus/:supportRequestId',
  requireToken,
  requireRole([RoleType.ADMIN]),
  validate(updateSupportRequestStatusSchemaStatus),
  supportRequestController.updateSupportRequestStatus
)
