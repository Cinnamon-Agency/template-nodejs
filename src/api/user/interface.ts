import { AsyncResponse } from '@common'
import { AuthType, User } from '@prisma/client'

export interface ICreateUser {
  email: string
  password?: string
  authType: AuthType
}

export interface IGetUserById {
  userId: string
  allUsers?: boolean
}

export interface IGetUserByEmail {
  email: string
  allUsers?: boolean
}

export interface IGetUserByEmailAndAuthType {
  email: string
  authType: AuthType
}

export interface UserSkill {
  userId: string
  skillId: string
}

export interface IToggleNotifications {
  userId: string
}

export interface IUpdatePassword {
  userId: string
  password: string
}

export interface IUpdateUser {
  userId: string
  emailVerified?: boolean
  phoneNumber?: string
  phoneVerified?: boolean
}

export interface IUserService {
  createUser(params: ICreateUser): AsyncResponse<User>
  getUserById(params: IGetUserById): AsyncResponse<User>
  getUserByEmail(params: IGetUserByEmail): AsyncResponse<User>
  getUserByEmailAndAuthType(
    params: IGetUserByEmailAndAuthType
  ): AsyncResponse<User>
  toggleNotifications(params: IToggleNotifications): AsyncResponse<void>
  updatePassword(params: IUpdatePassword): AsyncResponse<void>
  updateUser(params: IUpdateUser): AsyncResponse<void>
}
