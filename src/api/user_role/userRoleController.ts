import { Request, Response, NextFunction } from 'express'
import { autoInjectable } from 'tsyringe'
import { UserRoleService } from './userRoleService'
import { logEndpoint } from '@common/decorators/logEndpoint'

@autoInjectable()
export class UserRoleController {
  private userRoleService: UserRoleService

  constructor(userRoleService: UserRoleService) {
    this.userRoleService = userRoleService
  }

  @logEndpoint()
  public async getRolesForUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { userId } = res.locals.input

    const { roles, code } = await this.userRoleService.getRolesForUser({
      userId,
    })

    return next({ roles, code })
  }
}
