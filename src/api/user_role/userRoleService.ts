import {
  ICreateUserRole,
  IGetRolesForUser,
  IUserRoleService,
} from './interface'
import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { ResponseCode, serviceMethod } from '@common'
import { RoleService } from '../role/roleService'

@singleton()
@autoInjectable()
export class UserRoleService implements IUserRoleService {
  constructor(private readonly roleService: RoleService) {}

  @serviceMethod()
  async createUserRole({ userId, roleType }: ICreateUserRole) {
    const { role, code: roleCode } = await this.roleService.getRoleByRoleType({
      roleType,
    })

    if (!role || roleCode !== ResponseCode.OK) {
      return { code: roleCode }
    }

    const userRole = await getPrismaClient().userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    })

    if (!userRole) {
      return { code: ResponseCode.FAILED_INSERT }
    }

    return { code: ResponseCode.OK }
  }

  @serviceMethod()
  async getRolesForUser({ userId }: IGetRolesForUser) {
    const userRoles = await getPrismaClient().userRole.findMany({
      where: { userId },
      include: { role: true },
    })

    if (!userRoles) {
      return { code: ResponseCode.ROLE_NOT_FOUND }
    }

    const roles = userRoles.map(userRole => userRole.role)

    return { roles, code: ResponseCode.OK }
  }
}
