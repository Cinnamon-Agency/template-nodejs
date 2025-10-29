import { AsyncResponse } from '@common'
import { RoleType } from '../role/interface'
import { Role } from '@prisma/client'

export interface ICreateUserRole {
  userId: number
  roleType: RoleType
}

export interface IGetRolesForUser {
  userId: number
}

export interface IUserRoleService {
  createUserRole(params: ICreateUserRole): AsyncResponse<null>
  getRolesForUser(params: IGetRolesForUser): AsyncResponse<Role[]>
}
