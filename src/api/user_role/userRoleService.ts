import { Repository } from 'typeorm'

import {
  ICreateUserRole,
  IGetRolesForUser,
  IUserRoleService,
} from './interface'
import { AppDataSource } from '../../services/typeorm'
import { autoInjectable, container } from 'tsyringe'

import { UserRole } from './userRoleModel'
import { ResponseCode } from '../../interface'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import { RoleService } from '../role/roleService'
const roleService = container.resolve(RoleService)
@autoInjectable()
export class UserRoleService implements IUserRoleService {
  private readonly userRoleRepository: Repository<UserRole>

  constructor() {
    this.userRoleRepository = AppDataSource.manager.getRepository(UserRole)
  }

  createUserRole = async ({ userId, roleType }: ICreateUserRole) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { role, code } = await roleService.getRoleByRoleType({ roleType })
      if (!role) {
        return { code: ResponseCode.FAILED_INSERT }
      }

      const userRole = await this.userRoleRepository.save({
        userId,
        roleId: role.id,
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
      const userRoles = await this.userRoleRepository.find({
        where: { userId },
      })

      if (!userRoles) {
        return { code: ResponseCode.ROLE_NOT_FOUND }
      }

      const roles = userRoles.map(userRole => userRole.role)

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
