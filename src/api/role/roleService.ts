import { autoInjectable, singleton } from 'tsyringe'
import { getPrismaClient } from '@services/prisma'
import { ResponseCode, serviceMethod } from '@common'
import { IGetRoleByRoleType, IRoleService } from './interface'
import { cache, CacheKeys, CacheTTL } from '@services/cache'
import { Role } from '@prisma/client'

@singleton()
@autoInjectable()
export class RoleService implements IRoleService {
  constructor() {}

  @serviceMethod()
  async getRoleByRoleType({ roleType }: IGetRoleByRoleType) {
    const cached = await cache.get<Role>(CacheKeys.roleByType(roleType))
    if (cached) {
      return { role: cached, code: ResponseCode.OK }
    }

    const role = await getPrismaClient().role.findUnique({
      where: {
        name: roleType,
      },
    })

    if (role === null) {
      return { code: ResponseCode.ROLE_NOT_FOUND }
    }

    await cache.set(CacheKeys.roleByType(roleType), role, CacheTTL.ROLE)
    return { role, code: ResponseCode.OK }
  }
}
