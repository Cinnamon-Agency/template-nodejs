import { autoInjectable } from 'tsyringe'

import { ResponseCode } from '../../interface'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import { Role } from './roleModel'
import { IGetRoleByRoleType, IRoleService } from './interface'
@autoInjectable()
export class RoleService implements IRoleService {
  private readonly roleRepository: Repository<Role>

  constructor() {
    this.roleRepository = AppDataSource.manager.getRepository(Role)
  }

  getRoleByRoleType = async ({ roleType }: IGetRoleByRoleType) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const role = await this.roleRepository.findOne({
        where: {
          role: roleType,
        },
      })

      if (role === null) {
        return { code: ResponseCode.ROLE_NOT_FOUND }
      }

      return { role, code }
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
}
