import { AsyncResponse } from '@common'
import { Role, RoleType } from '@prisma/client'


export interface ICreateUserRole {
  userId: string
  roleType: RoleType
}

export interface IGetRolesForUser {
  userId: string
}

export interface IUserRoleService {
  createUserRole(params: ICreateUserRole): AsyncResponse<null>
  getRolesForUser(params: IGetRolesForUser): AsyncResponse<Role[]>
}
