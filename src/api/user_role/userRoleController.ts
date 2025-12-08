import { Request, Response, NextFunction } from 'express'
import { autoInjectable } from 'tsyringe'
import { UserRoleService } from './userRoleService'

@autoInjectable()
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

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
