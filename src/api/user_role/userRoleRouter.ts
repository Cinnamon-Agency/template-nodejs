import express from 'express'
import { container } from 'tsyringe'
import { requireToken } from '../../middleware/auth'
import { UserRoleController } from './userRoleController'

const userRoleController = container.resolve(UserRoleController)
export const userRoleRouter = express.Router()
userRoleRouter.put('/', requireToken, userRoleController.getRolesForUser)
