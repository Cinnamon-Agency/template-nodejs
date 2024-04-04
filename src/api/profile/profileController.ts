import { NextFunction, Response, Request } from 'express'
import { UserService } from '../user/userService'
import { ResponseCode } from '../../interfaces'
import fileUpload from 'express-fileupload'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class ProfileController {
  private readonly userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    const { profile, code } = await this.userService.getProfile({ userId: user.id })
    if (!profile) {
      return next({ code })
    }

    return next({ profile, code: ResponseCode.OK })
  }

  getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = res.locals.input

    const { profile, code } = await this.userService.getProfile({ userId: id })
    if (!profile) {
      return next({ code })
    }

    return next({ profile, code: ResponseCode.OK })
  }

  editProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    const { firstName, lastName } = res.locals.input

    const { profile, code } = await this.userService.updateProfile({ userId: user.id, firstName, lastName })
    if (!profile) {
      return next({ code })
    }

    return next({ profile, code: ResponseCode.OK })
  }
}
