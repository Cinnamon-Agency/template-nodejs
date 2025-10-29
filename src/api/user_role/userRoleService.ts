import {
  ICreateUserRole,
  IGetRolesForUser,
  IUserRoleService,
} from './interface'
import { autoInjectable, container } from 'tsyringe'
import { prisma } from '@app'
import { ResponseCode } from '@common'
import { logger } from '@core/logger'
import { getResponseMessage } from '@common'
import { RoleService } from '../role/roleService'

const roleService = container.resolve(RoleService)

@autoInjectable()
export class UserRoleService implements IUserRoleService {
  constructor() {}

  createUserRole = async ({ userId, roleType }: ICreateUserRole) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { role, code: roleCode } = await roleService.getRoleByRoleType({
        roleType,
      })

      if ((!role || roleCode !== ResponseCode.OK)) {
        return { code: roleCode }
      }

      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId: role.id,
        },
      })

      if (!userRole) {
        return { code: ResponseCode.FAILED_INSERT }
      }

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  getRolesForUser = async ({ userId }: IGetRolesForUser) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      })

      if (!userRoles) {
        return { code: ResponseCode.ROLE_NOT_FOUND }
      }

      const roles = userRoles.map((userRole: { role: any }) => userRole.role)

      return { roles, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return {
      code,
    }
  }
}
