import config from '../../config'
import { AsyncResponse, ResponseCode, ResponseMessage } from '../../interfaces'
import { logger } from '../../logger'
import { query } from '../../services/mysql2'
import { getResponseMessage } from '../../services/utils'
import {
  FullUser,
  ICreateUser,
  IGetProfile,
  IGetUserByEmail,
  IGetUserById,
  ISaveProfileImage,
  IUserService,
  Profile,
  IEditProfile,
  IUpdateProfile,
  ISetUserStatus
} from './user.interface'
import { UserQueries } from './user.queries'

export class UserService implements IUserService {
  constructor() {}

  getUserByEmail = async ({ email }: IGetUserByEmail) => {
    let code = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(UserQueries.getUserByEmail, [
        email
      ])
      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  getUserById = async ({ userId }: IGetUserById) => {
    let code = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(UserQueries.getUserById, [userId])
      if (!user) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { user, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  setUserStatus = async ({ userId, status }: ISetUserStatus) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      await query(UserQueries.setUserStatus, [status, userId])

      return { code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  create = async ({
    firstName,
    lastName,
    email,
    password,
    profileImage
  }: ICreateUser) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [user] = await query<[FullUser]>(
        UserQueries.createUser,
        [firstName, lastName, email, password, profileImage],
        true
      )

      return { user, code }
    } catch (err: any) {
      switch (err.errno) {
        case 1062:
          code = ResponseCode.EMAIL_TAKEN
          break
        default:
          code = ResponseCode.SERVER_ERROR
          logger.error({
            code,
            message: getResponseMessage(code),
            stack: err.stack
          })
      }
    }

    return { code }
  }

  getProfile = async ({ userId }: IGetProfile) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [profile] = await query<[Profile]>(UserQueries.getProfile, [userId])
      if (!profile) {
        return { code: ResponseCode.USER_NOT_FOUND }
      }

      return { profile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  async editProfile({
    userId,
    firstName,
    lastName,
    email,
    profileImage
  }: IEditProfile) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const [profile] = await query<[Profile]>(UserQueries.editProfile, [
        userId,
        firstName,
        lastName,
        email,
        profileImage
      ])
      return { profile, code }
    } catch (e: any) {
      code = ResponseCode.SERVER_ERROR
    }
    return { code }
  }

  async updateProfile(params: IUpdateProfile) {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { profile, code } = (await this.getProfile({
        userId: params.userId
      })) as {
        profile: any
        code: ResponseCode
      }
      if (!profile) {
        return { code }
      }

      type ProfileKey = keyof IEditProfile
      const keys: ProfileKey[] = Object.keys(params) as ProfileKey[]
      for (const key of keys) {
        if (params[key] !== undefined) {
          profile[key] = params[key]
        }
      }

      const { profile: updatedProfile, code: profileCode } =
        await this.editProfile(profile)

      return { profile: updatedProfile, code: profileCode }
    } catch (e: any) {
      code = ResponseCode.SERVER_ERROR
    }
    return { code }
  }

  saveProfileImage = async ({ userId, image }: ISaveProfileImage) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const { user, code: userCode } = await this.getUserById({ userId })
      if (!user) {
        return { code: userCode }
      }

      if (image.size > config.FILE_UPLOAD_SIZE_LIMIT * 1024 * 1024) {
        return {
          code: ResponseCode.FILE_TOO_LARGE
        }
      }

      const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
      if (!ACCEPTED_IMAGE_TYPES.includes(image.mimetype)) {
        return {
          code: ResponseCode.WRONG_INPUT_PHOTO_TYPE
        }
      }

      const url = `${config.STORAGE_BASE_URL}${config.PROFILE_IMAGE_BASE_URL}${userId}`

      /*
        Upload related logic to specific service or location goes here
      */

      const { profile, code } = await this.updateProfile({
        userId,
        profileImage: url
      })

      return { profile, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }
}
