import { autoInjectable } from 'tsyringe'
import { prisma } from '@app'
import { ResponseCode } from '@common'
import { logger } from '@core/logger'
import { getResponseMessage } from '@common/response'
import { IGetRoleByRoleType, IRoleService } from './interface'

@autoInjectable()
export class RoleService implements IRoleService {
  constructor() {}

  getRoleByRoleType = async ({ roleType }: IGetRoleByRoleType) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const role = await prisma.role.findUnique({
        where: {
          name: roleType,
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
