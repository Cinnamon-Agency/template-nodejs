import { AsyncResponse, IServiceMethod } from '../../interface'
import { AuthType } from '../auth/interface'
import { User } from './userModel'

export interface ICreateUser extends IServiceMethod {
  email: string
  password?: string
  authType: AuthType
}

export interface IGetUserById extends IServiceMethod {
  userId: string
  allUsers?: boolean
}

export interface IGetUserByEmail extends IServiceMethod {
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

export interface IToogleNotifications {
  userId: string
}

export interface IUpdatePassword {
  userId: string
  password: string
}

export interface IUserService {
  createUser(params: ICreateUser): AsyncResponse<User>
  getUserById(params: IGetUserById): AsyncResponse<User>
  getUserByEmail(params: IGetUserByEmail): AsyncResponse<User>
  getUserByEmailAndAuthType(
    params: IGetUserByEmailAndAuthType
  ): AsyncResponse<User>
  toogleNotifications(params: IToogleNotifications): AsyncResponse<null>
  updatePassword(params: IUpdatePassword): AsyncResponse<null>
}
