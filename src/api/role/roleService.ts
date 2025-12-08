import { autoInjectable, singleton } from 'tsyringe'
import { prisma } from '@app'
import { ResponseCode } from '@common'
import { IGetRoleByRoleType, IRoleService } from './interface'
import { serviceMethod } from '@common'

@singleton()
@autoInjectable()
export class RoleService implements IRoleService {
  constructor() {}

  @serviceMethod()
  async getRoleByRoleType({ roleType }: IGetRoleByRoleType) {
    const role = await prisma.role.findUnique({
      where: {
        name: roleType,
      },
    })

    if (role === null) {
      return { code: ResponseCode.ROLE_NOT_FOUND }
    }

    return { role, code: ResponseCode.OK }
  }
}
